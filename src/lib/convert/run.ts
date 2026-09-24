import {
  MAX_CLIENT_UPLOAD_BYTES,
  MAX_CLIENT_UPLOAD_MB,
  MAX_UPLOAD_BYTES,
  sanitizeBaseName,
  type ConvertOptions,
  type JobPublicStatus,
} from "./shared";
import type { ConvertResult } from "./client-engine";

export type EngineKind = "server" | "browser";

export type RunConversionResult = ConvertResult & {
  engine: EngineKind;
  downloadUrl?: string;
  thumbnailUrl?: string;
  jobId?: string;
};

type ProgressFn = (update: { stage: string; ratio: number }) => void;

type Health = {
  ffmpeg: boolean;
  maxUploadBytes: number;
};

async function fetchHealth(): Promise<Health> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return { ffmpeg: false, maxUploadBytes: 0 };
    const data = (await res.json()) as Health;
    return {
      ffmpeg: Boolean(data.ffmpeg),
      maxUploadBytes: Number(data.maxUploadBytes) || 0,
    };
  } catch {
    return { ffmpeg: false, maxUploadBytes: 0 };
  }
}

function xhrPost(
  url: string,
  form: FormData,
  onUpload: (ratio: number) => void,
): Promise<JobPublicStatus> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onUpload(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      const body = xhr.response as JobPublicStatus & { error?: string };
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
        return;
      }
      reject(new Error(body?.error || `Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.onabort = () => reject(new Error("Upload was cancelled."));
    xhr.send(form);
  });
}

async function pollJob(id: string, onProgress: ProgressFn): Promise<JobPublicStatus> {
  const started = Date.now();
  while (Date.now() - started < 10 * 60 * 1000) {
    const res = await fetch(`/api/jobs/${id}`);
    const body = (await res.json()) as JobPublicStatus & { error?: string };
    if (!res.ok) {
      throw new Error(body.error || "Lost track of the conversion job.");
    }
    if (body.status === "error") {
      throw new Error(body.error || "Conversion failed.");
    }
    const stage =
      body.status === "packaging"
        ? "Building ZIP"
        : body.status === "queued"
          ? "Waiting to convert"
          : body.progress >= 0.9
            ? "Grabbing thumbnail"
            : "Packing HLS segments";
    onProgress({
      stage: body.usedTranscode && body.progress < 0.9 ? "Transcoding to HLS" : stage,
      ratio: Math.min(0.99, body.progress || 0),
    });
    if (body.status === "done") {
      onProgress({ stage: "Done", ratio: 1 });
      return body;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("Conversion timed out. Try a shorter file.");
}

async function runServer(
  file: File,
  options: ConvertOptions,
  onProgress: ProgressFn,
): Promise<RunConversionResult> {
  const form = new FormData();
  form.set("file", file, file.name);
  form.set("outputBase", options.outputBase);
  form.set("hlsTime", String(options.hlsTime));
  form.set("removeAudio", options.removeAudio ? "true" : "false");
  form.set("thumbnailOriginal", options.thumbnail.original ? "true" : "false");
  form.set("thumbnailWidth", String(options.thumbnail.width || 0));
  form.set("thumbnailHeight", String(options.thumbnail.height || 0));
  form.set("thumbnailSeek", String(options.thumbnail.seekSeconds ?? ""));
  form.set("sourceDuration", String(options.sourceDurationSec ?? ""));

  onProgress({ stage: "Uploading video", ratio: 0.02 });
  const created = await xhrPost("/api/jobs", form, (ratio) => {
    onProgress({ stage: "Uploading video", ratio: ratio * 0.2 });
  });
  const done = await pollJob(created.id, (update) => {
    onProgress({
      stage: update.stage,
      ratio: 0.2 + update.ratio * 0.8,
    });
  });
  return {
    engine: "server",
    zipBlob: new Blob(),
    playlistName: done.playlistName,
    segmentCount: done.segmentCount,
    usedTranscode: done.usedTranscode,
    note: done.note,
    thumbnailName: done.thumbnailName,
    thumbnailWidth: done.thumbnailWidth,
    thumbnailHeight: done.thumbnailHeight,
    thumbnailBlob: null,
    packedDurationSec: done.packedDurationSec,
    downloadUrl: `/api/jobs/${done.id}/download`,
    thumbnailUrl: done.thumbnailName ? `/api/jobs/${done.id}/thumbnail` : undefined,
    jobId: done.id,
  };
}

export async function runConversion(
  file: File,
  options: ConvertOptions,
  onProgress: ProgressFn,
): Promise<RunConversionResult> {
  const outputBase = sanitizeBaseName(options.outputBase || file.name);
  const nextOptions = { ...options, outputBase };
  const health = await fetchHealth();
  const useServer =
    health.ffmpeg &&
    file.size <= (health.maxUploadBytes || MAX_UPLOAD_BYTES) &&
    file.size <= MAX_UPLOAD_BYTES;

  if (useServer) {
    try {
      return await runServer(file, nextOptions, onProgress);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      // Fall through to in-browser conversion when the host cannot accept the upload.
      if (!/413|too large|not installed|Failed to fetch|Network error|not available/i.test(message)) {
        throw err;
      }
    }
  }

  if (file.size > MAX_CLIENT_UPLOAD_BYTES) {
    throw new Error(
      `This file is too large to convert in the browser. Maximum is ${MAX_CLIENT_UPLOAD_MB} MB.`,
    );
  }

  const { runClientConversion } = await import("./client-engine");
  const result = await runClientConversion(file, nextOptions, onProgress);
  return { ...result, engine: "browser" };
}
