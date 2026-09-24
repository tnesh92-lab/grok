import { spawn, type ChildProcess } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, mkdir, rm, readdir, stat, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { zipSync } from "fflate";
import { env } from "@/lib/env.server";
import {
  buildFfmpegArgs,
  buildThumbnailArgs,
  clampHlsTime,
  extOf,
  FFMPEG_TIMEOUT_MS,
  isAllowedVideo,
  JOB_TTL_MS,
  MAX_UPLOAD_BYTES,
  parseFfmpegProgress,
  parseThumbnailSize,
  jpegDimensions,
  packLooksTruncated,
  parseSourceDuration,
  playlistMediaDuration,
  clampThumbSeek,
  sanitizeBaseName,
  THUMB_TIMEOUT_MS,
  zipContentDisposition,
  type JobPublicStatus,
  type ThumbnailSize,
} from "./shared";

type JobStatus = JobPublicStatus["status"];

type Job = {
  id: string;
  createdAt: number;
  status: JobStatus;
  progress: number;
  error: string | null;
  outputBase: string;
  playlistName: string;
  segmentCount: number;
  usedTranscode: boolean;
  note: string | null;
  removeAudio: boolean;
  hlsTime: number;
  thumbnail: ThumbnailSize;
  thumbnailName: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
  packedDurationSec: number | null;
  dir: string;
  inputPath: string;
  outputDir: string;
  zipPath: string;
  thumbPath: string;
  durationSec: number | null;
  sourceDurationSec: number | null;
  proc: ChildProcess | null;
  downloadedAt: number | null;
};

const jobs = new Map<string, Job>();
let sweep: ReturnType<typeof setInterval> | null = null;

function ffmpegBin(): string {
  return env("FFMPEG_PATH") || "ffmpeg";
}

function isServerless(): boolean {
  return Boolean(env("VERCEL") || env("VERCEL_ENV"));
}

export async function probeFfmpeg(): Promise<boolean> {
  if (isServerless()) return false;
  return await new Promise((resolve) => {
    const proc = spawn(ffmpegBin(), ["-version"], { stdio: "ignore" });
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      resolve(false);
    }, 4000);
    proc.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

function ensureSweep() {
  if (sweep) return;
  sweep = setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobs) {
      const expired = now - job.createdAt > JOB_TTL_MS;
      const afterDownload =
        job.downloadedAt !== null && now - job.downloadedAt > 60_000;
      if (expired || afterDownload) void destroyJob(id);
    }
  }, 30_000);
  sweep.unref?.();
}

function publicStatus(job: Job): JobPublicStatus {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    playlistName: job.playlistName,
    segmentCount: job.segmentCount,
    usedTranscode: job.usedTranscode,
    note: job.note,
    thumbnailName: job.thumbnailName,
    thumbnailWidth: job.thumbnailWidth,
    thumbnailHeight: job.thumbnailHeight,
    packedDurationSec: job.packedDurationSec,
  };
}

export async function destroyJob(id: string): Promise<void> {
  const job = jobs.get(id);
  if (!job) return;
  jobs.delete(id);
  try {
    job.proc?.kill("SIGKILL");
  } catch {
    /* already exited */
  }
  await rm(job.dir, { recursive: true, force: true }).catch(() => undefined);
}

export function getJob(id: string): JobPublicStatus | null {
  const job = jobs.get(id);
  return job ? publicStatus(job) : null;
}

export async function createJobFromForm(
  form: FormData,
): Promise<JobPublicStatus> {
  if (isServerless()) {
    throw Object.assign(
      new Error("Server conversion is not available on this host."),
      { status: 503 },
    );
  }
  ensureSweep();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw Object.assign(new Error("Choose a video file to convert."), {
      status: 400,
    });
  }
  const invalid = isAllowedVideo({
    name: file.name,
    type: file.type,
    size: file.size,
  });
  if (invalid) {
    throw Object.assign(new Error(invalid), { status: 400 });
  }

  const requestedBase = String(form.get("outputBase") ?? "");
  const outputBase = sanitizeBaseName(requestedBase || file.name);
  const hlsTime = clampHlsTime(form.get("hlsTime"));
  const removeAudio =
    String(form.get("removeAudio") ?? "").toLowerCase() === "true";
  const sourceDurationSec = parseSourceDuration(form.get("sourceDuration"));
  const thumbnail = parseThumbnailSize({
    original: form.get("thumbnailOriginal"),
    width: form.get("thumbnailWidth"),
    height: form.get("thumbnailHeight"),
  });
  thumbnail.seekSeconds = clampThumbSeek(
    form.get("thumbnailSeek"),
    sourceDurationSec,
  );

  const id = crypto.randomUUID();
  const dir = await mkdtemp(path.join(os.tmpdir(), "reelpack-"));
  const outputDir = path.join(dir, "out");
  await mkdir(outputDir, { recursive: true });

  const ext = extOf(file.name) || "mp4";
  const inputPath = path.join(dir, `input.${ext}`);
  const zipPath = path.join(dir, `${outputBase}-hls.zip`);
  const thumbPath = path.join(outputDir, `${outputBase}.jpg`);

  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(inputPath, bytes);

  const job: Job = {
    id,
    createdAt: Date.now(),
    status: "queued",
    progress: 0,
    error: null,
    outputBase,
    playlistName: `${outputBase}.m3u8`,
    segmentCount: 0,
    usedTranscode: false,
    note: null,
    removeAudio,
    hlsTime,
    thumbnail,
    thumbnailName: null,
    thumbnailWidth: thumbnail.original ? null : thumbnail.width,
    thumbnailHeight: thumbnail.original ? null : thumbnail.height,
    packedDurationSec: null,
    dir,
    inputPath,
    outputDir,
    zipPath,
    thumbPath,
    durationSec: sourceDurationSec,
    sourceDurationSec,
    proc: null,
    downloadedAt: null,
  };
  jobs.set(id, job);
  void convertJob(job);
  return publicStatus(job);
}

async function convertJob(job: Job): Promise<void> {
  try {
    job.status = "converting";
    job.progress = 0.02;
    try {
      await packHls(job, false);
    } catch (copyErr) {
      const copyMsg =
        copyErr instanceof Error ? copyErr.message : "Stream copy failed.";
      const truncated = /only packed|playlist is only/i.test(copyMsg);
      job.usedTranscode = true;
      job.note = truncated
        ? "Stream copy stopped early on this file, so it was transcoded to H.264/AAC to keep the full length."
        : "Stream copy was not possible for this file, so it was transcoded to H.264/AAC.";
      job.progress = 0.05;
      await clearOutputDir(job);
      try {
        await packHls(job, true);
      } catch (transcodeErr) {
        const transcodeMsg =
          transcodeErr instanceof Error
            ? transcodeErr.message
            : "Transcode failed.";
        throw new Error(
          `${transcodeMsg} (stream copy also failed: ${copyMsg})`,
        );
      }
    }

    job.progress = 0.9;
    await runThumbnail(job);
    try {
      const bytes = new Uint8Array(await readFile(job.thumbPath));
      const dim = jpegDimensions(bytes);
      if (dim) {
        job.thumbnailWidth = dim.width;
        job.thumbnailHeight = dim.height;
      }
    } catch {
      /* keep the requested size if the JPEG cannot be probed */
    }

    job.status = "packaging";
    job.progress = 0.94;
    await zipOutput(job);
    job.status = "done";
    job.progress = 1;
  } catch (err) {
    job.status = "error";
    job.error =
      err instanceof Error
        ? err.message
        : "Conversion failed. Check that the file is a valid video.";
    job.proc = null;
  }
}

async function clearOutputDir(job: Job): Promise<void> {
  const leftover = await readdir(job.outputDir).catch(() => [] as string[]);
  await Promise.all(
    leftover.map((name) =>
      rm(path.join(job.outputDir, name), { force: true }).catch(() => undefined),
    ),
  );
  job.packedDurationSec = null;
  job.segmentCount = 0;
}

function expectedDuration(job: Job): number | null {
  const vals = [job.durationSec, job.sourceDurationSec].filter(
    (n): n is number => n != null && n > 0,
  );
  return vals.length ? Math.max(...vals) : null;
}

async function readPackedDuration(job: Job): Promise<number> {
  const playlistPath = path.join(job.outputDir, job.playlistName);
  const text = await readFile(playlistPath, "utf8");
  return playlistMediaDuration(text);
}

async function packHls(job: Job, transcode: boolean): Promise<void> {
  await runHls(job, transcode);
  const packed = await readPackedDuration(job).catch(() => 0);
  job.packedDurationSec = packed;
  const expected = expectedDuration(job);
  if (packLooksTruncated(expected, packed)) {
    throw new Error(
      `HLS playlist is only ${packed.toFixed(1)}s of a ${expected?.toFixed(1)}s video.`,
    );
  }
}

function runHls(job: Job, transcode: boolean): Promise<void> {
  const outputM3u8 = path.join(job.outputDir, `${job.outputBase}.m3u8`);
  const args = buildFfmpegArgs({
    inputPath: job.inputPath,
    outputM3u8,
    hlsTime: job.hlsTime,
    removeAudio: job.removeAudio,
    transcode,
  });

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegBin(), args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    job.proc = proc;
    let errLog = "";

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("Conversion timed out. Try a shorter file."));
    }, FFMPEG_TIMEOUT_MS);

    proc.stderr?.on("data", (buf: Buffer) => {
      const chunk = buf.toString("utf8");
      errLog += chunk;
      if (errLog.length > 12_000) errLog = errLog.slice(-6_000);
      const parsed = parseFfmpegProgress(chunk);
      if (parsed.duration && parsed.duration > 0) {
        job.durationSec = Math.max(job.durationSec ?? 0, parsed.duration);
      }
      if (parsed.time != null && job.durationSec && job.durationSec > 0) {
        const ratio = Math.min(0.88, parsed.time / job.durationSec);
        job.progress = transcode ? 0.05 + ratio * 0.8 : Math.max(0.05, ratio);
      }
    });

    proc.on("error", (e) => {
      clearTimeout(timer);
      job.proc = null;
      reject(
        new Error(
          e.message.includes("ENOENT")
            ? "FFmpeg is not installed on the server."
            : e.message,
        ),
      );
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      job.proc = null;
      if (code === 0) {
        job.progress = Math.max(job.progress, 0.88);
        resolve();
      } else {
        reject(new Error(summarizeFfmpegError(errLog, code)));
      }
    });
  });
}

function runThumbnail(job: Job): Promise<void> {
  const args = buildThumbnailArgs({
    inputPath: job.inputPath,
    outputPath: job.thumbPath,
    seekSeconds: clampThumbSeek(
      job.thumbnail.seekSeconds,
      expectedDuration(job) ?? job.durationSec,
    ),
    thumbnail: job.thumbnail,
  });

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegBin(), args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    job.proc = proc;
    let errLog = "";

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("Thumbnail timed out. Try converting again."));
    }, THUMB_TIMEOUT_MS);

    proc.stderr?.on("data", (buf: Buffer) => {
      errLog += buf.toString("utf8");
      if (errLog.length > 8_000) errLog = errLog.slice(-4_000);
    });

    proc.on("error", (e) => {
      clearTimeout(timer);
      job.proc = null;
      reject(
        new Error(
          e.message.includes("ENOENT")
            ? "FFmpeg is not installed on the server."
            : e.message,
        ),
      );
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      job.proc = null;
      if (code === 0) {
        job.thumbnailName = `${job.outputBase}.jpg`;
        if (!job.thumbnail.original) {
          job.thumbnailWidth = job.thumbnail.width;
          job.thumbnailHeight = job.thumbnail.height;
        }
        job.progress = 0.93;
        resolve();
      } else {
        reject(
          new Error(
            `Could not generate a thumbnail. ${summarizeFfmpegError(errLog, code)}`,
          ),
        );
      }
    });
  });
}

function summarizeFfmpegError(log: string, code: number | null): string {
  const lines = log
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const useful = [...lines]
    .reverse()
    .find((l) => /error|invalid|failed|unsupported|does not contain/i.test(l));
  if (useful) {
    return useful.replace(/^\[.*?\]\s*/, "").slice(0, 280);
  }
  return `FFmpeg could not convert this file (exit ${code ?? "unknown"}).`;
}

async function zipOutput(job: Job): Promise<void> {
  const names = await readdir(job.outputDir);
  const media = names.filter(
    (n) =>
      n.endsWith(".m3u8") ||
      n.endsWith(".ts") ||
      n.endsWith(".m4s") ||
      n.endsWith(".jpg") ||
      n.endsWith(".jpeg") ||
      n.endsWith(".png"),
  );
  job.segmentCount = media.filter((n) => n.endsWith(".ts") || n.endsWith(".m4s")).length;
  if (!media.some((n) => n.endsWith(".m3u8"))) {
    throw new Error("FFmpeg finished but did not produce a playlist.");
  }
  if (!media.some((n) => n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png"))) {
    throw new Error("FFmpeg finished but did not produce a thumbnail.");
  }

  const playlistFile = media.find((n) => n.endsWith(".m3u8"));
  if (playlistFile) {
    const text = await readFile(path.join(job.outputDir, playlistFile), "utf8");
    job.packedDurationSec = playlistMediaDuration(text);
  }

  const entries: Record<string, Uint8Array> = {};
  for (const name of media) {
    entries[name] = new Uint8Array(await readFile(path.join(job.outputDir, name)));
  }
  const zipped = zipSync(entries, { level: 0 });
  await writeFile(job.zipPath, zipped);
}

export async function openZipResponse(id: string): Promise<Response> {
  const job = jobs.get(id);
  if (!job) {
    return Response.json({ error: "This conversion is no longer available." }, { status: 404 });
  }
  if (job.status !== "done") {
    return Response.json(
      { error: "Conversion is not finished yet." },
      { status: 409 },
    );
  }
  try {
    await stat(job.zipPath);
  } catch {
    return Response.json({ error: "The package is missing. Convert again." }, { status: 410 });
  }
  job.downloadedAt = Date.now();
  const nodeStream = createReadStream(job.zipPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": zipContentDisposition(job.outputBase),
      "Cache-Control": "no-store",
    },
  });
}

export async function openThumbnailResponse(id: string): Promise<Response> {
  const job = jobs.get(id);
  if (!job) {
    return Response.json({ error: "This conversion is no longer available." }, { status: 404 });
  }
  if (job.status !== "done") {
    return Response.json(
      { error: "Conversion is not finished yet." },
      { status: 409 },
    );
  }
  try {
    await stat(job.thumbPath);
  } catch {
    return Response.json({ error: "The thumbnail is missing. Convert again." }, { status: 410 });
  }
  const nodeStream = createReadStream(job.thumbPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  const fallback = `${job.outputBase}.jpg`.replace(/[^\w.-]+/g, "_");
  return new Response(webStream, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(`${job.outputBase}.jpg`)}`,
      "Cache-Control": "no-store",
    },
  });
}

export function jsonError(err: unknown): Response {
  const status =
    typeof err === "object" && err && "status" in err
      ? Number((err as { status: number }).status) || 500
      : 500;
  const message = err instanceof Error ? err.message : "Unexpected server error.";
  return Response.json({ error: message }, { status });
}

export function tooLargeResponse(): Response {
  return Response.json(
    {
      error: `File is too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
    },
    { status: 413 },
  );
}
