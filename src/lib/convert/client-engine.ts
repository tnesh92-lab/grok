import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import ffmpegWorkerUrl from "@ffmpeg/ffmpeg/worker?worker&url";
import { zipSync } from "fflate";
import {
  buildFfmpegArgs,
  buildThumbnailArgs,
  extOf,
  parseFfmpegProgress,
  thumbnailSeekSeconds,
  jpegDimensions,
  packLooksTruncated,
  playlistMediaDuration,
  type ConvertOptions,
} from "./shared";

export type ConvertResult = {
  zipBlob: Blob;
  playlistName: string;
  segmentCount: number;
  usedTranscode: boolean;
  note: string | null;
  thumbnailName: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
  thumbnailBlob: Blob | null;
  packedDurationSec: number | null;
};

type ProgressFn = (update: { stage: string; ratio: number }) => void;

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

const CORE_BASE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

async function getFfmpeg(onProgress: ProgressFn): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (loadPromise) return loadPromise;
  onProgress({ stage: "Loading FFmpeg in your browser", ratio: 0.02 });
  loadPromise = (async () => {
    const ff = new FFmpeg();
    await ff.load({
      classWorkerURL: ffmpegWorkerUrl,
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ff;
    return ff;
  })();
  try {
    return await loadPromise;
  } catch (err) {
    loadPromise = null;
    ffmpegInstance = null;
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new Error(
      `Could not load FFmpeg in the browser (${message}). Check your connection and try again.`,
    );
  }
}

function stripFfmpegPrefix(args: string[]): string[] {
  const next = [...args];
  while (next[0] === "-nostdin" || next[0] === "-y") next.shift();
  return next;
}

async function execWithLogs(
  ffmpeg: FFmpeg,
  args: string[],
  onLog?: (message: string) => void,
): Promise<void> {
  let lastLog = "";
  const handler = ({ message }: { message: string }) => {
    lastLog = message;
    onLog?.(message);
  };
  ffmpeg.on("log", handler);
  try {
    const code = await ffmpeg.exec(args);
    if (code !== 0) {
      throw new Error(
        lastLog
          ? `FFmpeg could not convert this file in the browser: ${lastLog.slice(0, 180)}`
          : "FFmpeg could not convert this file in the browser.",
      );
    }
  } finally {
    ffmpeg.off("log", handler);
  }
}

async function execHls(
  ffmpeg: FFmpeg,
  opts: ConvertOptions & {
    transcode: boolean;
    onProgress: ProgressFn;
    inputName: string;
    outputM3u8: string;
  },
): Promise<void> {
  const args = stripFfmpegPrefix(
    buildFfmpegArgs({
      inputPath: opts.inputName,
      outputM3u8: opts.outputM3u8,
      hlsTime: opts.hlsTime,
      removeAudio: opts.removeAudio,
      transcode: opts.transcode,
    }),
  );
  let duration: number | null = null;
  await execWithLogs(ffmpeg, args, (message) => {
    const parsed = parseFfmpegProgress(message);
    if (parsed.duration) duration = parsed.duration;
    if (parsed.time != null && duration && duration > 0) {
      const ratio = Math.min(0.86, parsed.time / duration);
      opts.onProgress({
        stage: opts.transcode ? "Transcoding to HLS" : "Packing HLS segments",
        ratio: opts.transcode ? 0.08 + ratio * 0.74 : Math.max(0.1, ratio),
      });
    }
  });
}

function isSegmentFor(name: string, outputBase: string): boolean {
  if (!name.startsWith(outputBase) || !name.endsWith(".ts")) return false;
  const mid = name.slice(outputBase.length, -3);
  return /^\d+$/.test(mid);
}

async function readZip(
  ffmpeg: FFmpeg,
  outputBase: string,
): Promise<{
  blob: Blob;
  segmentCount: number;
  playlistName: string;
  thumbnailName: string;
  thumbnailBlob: Blob;
  packedDurationSec: number;
}> {
  const listing = await ffmpeg.listDir("/");
  const names = listing
    .map((entry) => ("name" in entry ? String(entry.name) : ""))
    .filter(Boolean);

  const playlistName = `${outputBase}.m3u8`;
  const thumbnailName = `${outputBase}.jpg`;
  if (!names.includes(playlistName)) {
    throw new Error("FFmpeg finished but did not produce a playlist.");
  }
  if (!names.includes(thumbnailName)) {
    throw new Error("FFmpeg finished but did not produce a thumbnail.");
  }

  const playlistRaw = await ffmpeg.readFile(playlistName);
  const thumbRaw = await ffmpeg.readFile(thumbnailName);
  if (typeof playlistRaw === "string" || typeof thumbRaw === "string") {
    throw new Error("FFmpeg finished but an output file was unreadable.");
  }

  const playlistText = new TextDecoder().decode(playlistRaw);
  const packedDurationSec = playlistMediaDuration(playlistText);

  const entries: Record<string, Uint8Array> = {
    [playlistName]: playlistRaw,
    [thumbnailName]: thumbRaw,
  };

  let segmentCount = 0;
  for (const name of names) {
    if (!isSegmentFor(name, outputBase)) continue;
    const data = await ffmpeg.readFile(name);
    if (typeof data === "string") continue;
    entries[name] = data;
    segmentCount += 1;
  }

  if (segmentCount === 0) {
    throw new Error("FFmpeg finished but did not produce HLS segments.");
  }

  const zipped = zipSync(entries, { level: 0 });
  return {
    blob: new Blob([zipped], { type: "application/zip" }),
    segmentCount,
    playlistName,
    thumbnailName,
    thumbnailBlob: new Blob([Uint8Array.from(thumbRaw)], { type: "image/jpeg" }),
    packedDurationSec,
  };
}

async function deleteMatching(ffmpeg: FFmpeg, predicate: (name: string) => boolean): Promise<void> {
  try {
    const listing = await ffmpeg.listDir("/");
    for (const entry of listing) {
      const name = "name" in entry ? String(entry.name) : "";
      if (!name || !predicate(name)) continue;
      try {
        await ffmpeg.deleteFile(name);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

async function cleanupMemfs(ffmpeg: FFmpeg): Promise<void> {
  await deleteMatching(ffmpeg, (name) => name !== "." && name !== "..");
}

async function readMemfsPlaylistDuration(
  ffmpeg: FFmpeg,
  playlistName: string,
): Promise<number> {
  const raw = await ffmpeg.readFile(playlistName);
  const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
  return playlistMediaDuration(text);
}

async function packClientHls(
  ffmpeg: FFmpeg,
  opts: ConvertOptions & {
    transcode: boolean;
    onProgress: ProgressFn;
    inputName: string;
    outputM3u8: string;
  },
): Promise<number> {
  await execHls(ffmpeg, opts);
  const packedSec = await readMemfsPlaylistDuration(ffmpeg, opts.outputM3u8).catch(
    () => 0,
  );
  if (packLooksTruncated(opts.sourceDurationSec, packedSec)) {
    throw new Error(
      `HLS playlist is only ${packedSec.toFixed(1)}s of a ${Number(opts.sourceDurationSec).toFixed(1)}s video.`,
    );
  }
  return packedSec;
}

export async function runClientConversion(
  file: File,
  options: ConvertOptions,
  onProgress: ProgressFn,
): Promise<ConvertResult> {
  const ffmpeg = await getFfmpeg(onProgress);
  const ext = extOf(file.name) || "mp4";
  const inputName = `__src.${ext}`;
  const outputM3u8 = `${options.outputBase}.m3u8`;
  const thumbName = `${options.outputBase}.jpg`;

  onProgress({ stage: "Reading video", ratio: 0.06 });
  await cleanupMemfs(ffmpeg);
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  let usedTranscode = false;
  let note: string | null = null;
  try {
    onProgress({ stage: "Packing HLS segments", ratio: 0.1 });
    await packClientHls(ffmpeg, {
      ...options,
      transcode: false,
      onProgress,
      inputName,
      outputM3u8,
    });
  } catch (copyErr) {
    const copyMsg = copyErr instanceof Error ? copyErr.message : "";
    const truncated = /only packed|playlist is only/i.test(copyMsg);
    usedTranscode = true;
    note = truncated
      ? "Stream copy stopped early on this file, so it was transcoded to H.264/AAC to keep the full length."
      : "Stream copy was not possible for this file, so it was transcoded to H.264/AAC.";
    await deleteMatching(
      ffmpeg,
      (name) => name === outputM3u8 || isSegmentFor(name, options.outputBase),
    );
    onProgress({ stage: "Transcoding to HLS", ratio: 0.08 });
    await packClientHls(ffmpeg, {
      ...options,
      transcode: true,
      onProgress,
      inputName,
      outputM3u8,
    });
  }

  onProgress({ stage: "Grabbing thumbnail", ratio: 0.9 });
  const thumbArgs = stripFfmpegPrefix(
    buildThumbnailArgs({
      inputPath: inputName,
      outputPath: thumbName,
      seekSeconds: options.thumbnail.seekSeconds ?? thumbnailSeekSeconds(null),
      thumbnail: options.thumbnail,
    }),
  );
  await execWithLogs(ffmpeg, thumbArgs);

  onProgress({ stage: "Building ZIP", ratio: 0.94 });
  const packed = await readZip(ffmpeg, options.outputBase);
  await cleanupMemfs(ffmpeg);
  onProgress({ stage: "Done", ratio: 1 });

  const dim = jpegDimensions(
    new Uint8Array(await packed.thumbnailBlob.arrayBuffer()),
  );

  return {
    zipBlob: packed.blob,
    playlistName: packed.playlistName,
    segmentCount: packed.segmentCount,
    usedTranscode,
    note,
    thumbnailName: packed.thumbnailName,
    thumbnailWidth: dim?.width ?? (options.thumbnail.original ? null : options.thumbnail.width),
    thumbnailHeight: dim?.height ?? (options.thumbnail.original ? null : options.thumbnail.height),
    thumbnailBlob: packed.thumbnailBlob,
    packedDurationSec: packed.packedDurationSec,
  };
}
