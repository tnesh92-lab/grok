export const MAX_UPLOAD_MB = 200;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const MAX_CLIENT_UPLOAD_MB = 80;
export const MAX_CLIENT_UPLOAD_BYTES = MAX_CLIENT_UPLOAD_MB * 1024 * 1024;
export const HLS_TIME_MIN = 1;
export const HLS_TIME_MAX = 30;
export const HLS_TIME_DEFAULT = 5;
export const JOB_TTL_MS = 15 * 60 * 1000;
export const FFMPEG_TIMEOUT_MS = 8 * 60 * 1000;
export const THUMB_TIMEOUT_MS = 60 * 1000;
export const THUMB_DIM_MIN = 16;
export const THUMB_DIM_MAX = 4096;

export const ALLOWED_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "m4v",
  "mkv",
  "webm",
  "avi",
  "mpeg",
  "mpg",
  "wmv",
  "flv",
  "3gp",
  "ts",
  "mts",
  "m2ts",
]);

const ALLOWED_MIME_PREFIX = "video/";
const ALLOWED_MIME_EXACT = new Set([
  "application/octet-stream",
  "application/mp4",
  "application/mxf",
]);

export type ThumbnailSize = {
  original: boolean;
  width: number;
  height: number;
  seekSeconds?: number;
};

export type ConvertOptions = {
  outputBase: string;
  hlsTime: number;
  removeAudio: boolean;
  thumbnail: ThumbnailSize;
  sourceDurationSec?: number | null;
};

export type ThumbSizeOption = {
  id: string;
  label: string;
  width: number;
  height: number;
  original: boolean;
};

export type JobPublicStatus = {
  id: string;
  status: "queued" | "converting" | "packaging" | "done" | "error";
  progress: number;
  error: string | null;
  playlistName: string;
  segmentCount: number;
  usedTranscode: boolean;
  note: string | null;
  thumbnailName: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
  packedDurationSec: number | null;
};

export function extOf(filename: string): string {
  const base = filename.replace(/\\/g, "/").split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

export function stripExtension(filename: string): string {
  const base = filename.replace(/\\/g, "/").split("/").pop() ?? filename;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return base;
  return base.slice(0, dot);
}

/** Keep the original name as much as possible, but strip path/control/illegal chars. */
export function sanitizeBaseName(name: string): string {
  const stripped = stripExtension(name.replace(/\\/g, "/").split("/").pop() ?? name);
  const cleaned = stripped
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|#%]/g, "")
    .replace(/^\.+/g, "")
    .replace(/\.+$/g, "")
    .trim()
    .slice(0, 80);
  return cleaned || "video";
}

export function clampHlsTime(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return HLS_TIME_DEFAULT;
  return Math.min(HLS_TIME_MAX, Math.max(HLS_TIME_MIN, Math.round(n)));
}

export function evenDim(n: number): number {
  if (!Number.isFinite(n) || n < 2) return 2;
  const r = Math.round(n);
  return r % 2 === 0 ? r : r - 1;
}

export function clampThumbDim(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(THUMB_DIM_MAX, Math.max(THUMB_DIM_MIN, Math.round(n)));
}

/** Read width/height from a JPEG SOF marker so original-size thumbs can report real pixels. */
export function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 10 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 8 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker === 0x00 || marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker >= 0xc0 && marker <= 0xc3) {
      const height = (bytes[i + 5] << 8) | bytes[i + 6];
      const width = (bytes[i + 7] << 8) | bytes[i + 8];
      if (width > 0 && height > 0) return { width, height };
      return null;
    }
    if (len < 2) break;
    i += 2 + len;
  }
  return null;
}

export function parseThumbnailSize(input: {
  original?: unknown;
  width?: unknown;
  height?: unknown;
}): ThumbnailSize {
  const originalFlag =
    String(input.original ?? "").toLowerCase() === "true" ||
    input.original === true;
  const width = clampThumbDim(input.width);
  const height = clampThumbDim(input.height);
  if (originalFlag || !width || !height) {
    return { original: true, width: 0, height: 0 };
  }
  return { original: false, width: evenDim(width), height: evenDim(height) };
}

function namedResolution(width: number, height: number): string | null {
  const a = `${width}x${height}`;
  const b = `${height}x${width}`;
  const map: Record<string, string> = {
    "1920x1080": "1080p",
    "1280x720": "720p",
    "854x480": "480p",
    "640x360": "360p",
    "426x240": "240p",
    "1080x1920": "1080p",
    "720x1280": "720p",
    "480x854": "480p",
    "360x640": "360p",
    "1080x1080": "1:1",
    "720x720": "1:1",
  };
  return map[a] || map[b] || null;
}

const LONG_EDGE_TARGETS = [
  1920, 1600, 1280, 1080, 960, 854, 720, 640, 480, 360, 240,
];

/** Size choices that keep the source aspect ratio. Original is always first. */
export function thumbnailSizeOptions(
  width: number | null,
  height: number | null,
): ThumbSizeOption[] {
  if (!width || !height || width < 2 || height < 2) {
    return [
      {
        id: "original",
        label: "Original (video size)",
        width: 0,
        height: 0,
        original: true,
      },
    ];
  }
  const srcW = Math.round(width);
  const srcH = Math.round(height);
  const options: ThumbSizeOption[] = [
    {
      id: "original",
      label: `Original · ${srcW}×${srcH}`,
      width: srcW,
      height: srcH,
      original: true,
    },
  ];
  const long = Math.max(srcW, srcH);
  const targets = new Set<number>([
    ...LONG_EDGE_TARGETS,
    evenDim(long * 0.75),
    evenDim(long * 0.5),
    evenDim(long * 0.25),
  ]);
  const seen = new Set<string>([`${srcW}x${srcH}`]);
  const extras: ThumbSizeOption[] = [];
  for (const target of [...targets].sort((a, b) => b - a)) {
    if (target >= long) continue;
    if (target < 64) continue;
    const scale = target / long;
    const w = evenDim(srcW * scale);
    const h = evenDim(srcH * scale);
    const key = `${w}x${h}`;
    if (seen.has(key)) continue;
    if (w < THUMB_DIM_MIN || h < THUMB_DIM_MIN) continue;
    seen.add(key);
    const named = namedResolution(w, h);
    const pct = Math.max(1, Math.round((Math.max(w, h) / long) * 100));
    extras.push({
      id: key,
      label: named ? `${w}×${h} · ${named}` : `${w}×${h} · ${pct}%`,
      width: w,
      height: h,
      original: false,
    });
  }
  return [...options, ...extras.slice(0, 6)];
}

export function thumbnailSeekSeconds(durationSec: number | null): number {
  if (durationSec == null) return 1;
  if (!(durationSec > 0.35)) return 0;
  return Math.min(1, Math.max(0.05, durationSec * 0.1));
}

export function maxThumbSeek(durationSec: number | null): number {
  if (durationSec == null || !(durationSec > 0)) return 0;
  return Math.max(0, Math.round((durationSec - 0.05) * 10) / 10);
}

export function clampThumbSeek(
  value: unknown,
  durationSec: number | null,
): number {
  const max = maxThumbSeek(durationSec);
  if (value == null || value === "") {
    return Math.min(thumbnailSeekSeconds(durationSec), max);
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return Math.min(thumbnailSeekSeconds(durationSec), max);
  }
  const rounded = Math.round(n * 10) / 10;
  if (max <= 0) return 0;
  return Math.min(max, Math.max(0, rounded));
}

export function formatThumbTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0.0s";
  const s = Math.round(seconds * 10) / 10;
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  if (m <= 0) return `${r.toFixed(1)}s`;
  const [whole, tenth] = r.toFixed(1).split(".");
  return `${m}:${(whole ?? "0").padStart(2, "0")}.${tenth ?? "0"}`;
}

export function isAllowedVideo(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (!file.size || file.size <= 0) return "The file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File is too large. Maximum size is ${MAX_UPLOAD_MB} MB.`;
  }
  const ext = extOf(file.name);
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return `Unsupported format${ext ? ` .${ext}` : ""}. Use MP4, MOV, MKV, WebM, or another common video file.`;
  }
  const mime = (file.type || "").toLowerCase();
  if (
    mime &&
    !mime.startsWith(ALLOWED_MIME_PREFIX) &&
    !ALLOWED_MIME_EXACT.has(mime)
  ) {
    return `This does not look like a video file (${mime}).`;
  }
  return null;
}

export function playlistMediaDuration(playlist: string): number {
  let sum = 0;
  const re = /#EXTINF:([0-9.]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(playlist))) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > 0) sum += n;
  }
  return sum;
}

/** True when the HLS playlist is missing a meaningful amount of the source clip. */
export function packLooksTruncated(
  sourceSec: number | null | undefined,
  packedSec: number | null | undefined,
): boolean {
  if (sourceSec == null || packedSec == null) return false;
  if (!(sourceSec > 0.75) || packedSec < 0) return false;
  const missing = sourceSec - packedSec;
  return missing > Math.max(0.75, sourceSec * 0.08);
}

export function parseSourceDuration(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function hlsSegmentPattern(outputM3u8: string): string {
  return outputM3u8.replace(/\.m3u8$/i, "%d.ts");
}

export function buildFfmpegArgs(opts: {
  inputPath: string;
  outputM3u8: string;
  hlsTime: number;
  removeAudio: boolean;
  transcode: boolean;
}): string[] {
  const hlsTime = clampHlsTime(opts.hlsTime);
  const args = [
    "-nostdin",
    "-y",
    "-fflags",
    "+genpts",
    "-i",
    opts.inputPath,
    "-map",
    "0:v:0",
    "-sn",
    "-dn",
    "-ignore_unknown",
  ];
  if (opts.removeAudio) args.push("-an");
  else args.push("-map", "0:a:0?");

  if (opts.transcode) {
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-sc_threshold",
      "0",
      "-force_key_frames",
      `expr:gte(t,n_forced*${hlsTime})`,
    );
    if (!opts.removeAudio) args.push("-c:a", "aac", "-b:a", "128k");
  } else if (opts.removeAudio) {
    args.push("-c:v", "copy");
  } else {
    args.push("-c", "copy");
  }

  args.push(
    "-avoid_negative_ts",
    "make_zero",
    "-max_muxing_queue_size",
    "9999",
    "-start_number",
    "0",
    "-hls_time",
    String(hlsTime),
    "-hls_list_size",
    "0",
    "-hls_playlist_type",
    "vod",
    "-hls_flags",
    "independent_segments",
    "-hls_segment_filename",
    hlsSegmentPattern(opts.outputM3u8),
    "-f",
    "hls",
    opts.outputM3u8,
  );
  return args;
}

export function buildThumbnailArgs(opts: {
  inputPath: string;
  outputPath: string;
  seekSeconds: number;
  thumbnail: ThumbnailSize;
}): string[] {
  const args = ["-nostdin", "-y"];
  if (opts.seekSeconds > 0) {
    args.push("-ss", String(Number(opts.seekSeconds.toFixed(3))));
  }
  args.push("-i", opts.inputPath, "-frames:v", "1", "-an");
  if (!opts.thumbnail.original && opts.thumbnail.width && opts.thumbnail.height) {
    args.push(
      "-vf",
      `scale=${opts.thumbnail.width}:${opts.thumbnail.height}:flags=lanczos`,
    );
  }
  args.push("-q:v", "2", opts.outputPath);
  return args;
}

/** Human-facing command, matching the documented FFmpeg behavior. */
export function formatDisplayCommand(opts: {
  inputName: string;
  outputBase: string;
  hlsTime: number;
  removeAudio: boolean;
}): string {
  const input = opts.inputName || "input.mp4";
  const out = `${opts.outputBase || "video"}.m3u8`;
  const codec = opts.removeAudio ? "-c copy -an" : "-c copy";
  return `ffmpeg -i ${input} ${codec} -start_number 0 -hls_time ${opts.hlsTime} -hls_list_size 0 -f hls ${out}`;
}

export function formatDisplayThumbnailCommand(opts: {
  inputName: string;
  outputBase: string;
  seekSeconds: number;
  thumbnail: ThumbnailSize;
}): string {
  const input = opts.inputName || "input.mp4";
  const out = `${opts.outputBase || "video"}.jpg`;
  const seek =
    opts.seekSeconds > 0 ? `-ss ${Number(opts.seekSeconds.toFixed(3))} ` : "";
  const scale =
    !opts.thumbnail.original && opts.thumbnail.width && opts.thumbnail.height
      ? `-vf scale=${opts.thumbnail.width}:${opts.thumbnail.height} `
      : "";
  return `ffmpeg ${seek}-i ${input} -frames:v 1 ${scale}-q:v 2 ${out}`.replace(
    /\s+/g,
    " ",
  );
}

export function parseTimestamp(value: string): number | null {
  const m = value.match(/(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export function parseFfmpegProgress(chunk: string): {
  duration?: number;
  time?: number;
} {
  const durM = chunk.match(/Duration:\s*(\d+:\d+:\d+(?:\.\d+)?)/);
  const timeM = chunk.match(/time=\s*(\d+:\d+:\d+(?:\.\d+)?)/);
  return {
    duration: durM?.[1] ? (parseTimestamp(durM[1]) ?? undefined) : undefined,
    time: timeM?.[1] ? (parseTimestamp(timeM[1]) ?? undefined) : undefined,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function estimateSegments(
  durationSec: number | null,
  hlsTime: number,
): number | null {
  if (durationSec == null || !(durationSec > 0) || !(hlsTime > 0)) return null;
  return Math.max(1, Math.ceil(durationSec / hlsTime));
}

export function zipContentDisposition(base: string): string {
  const zipName = `${base}-hls.zip`;
  const fallback = zipName.replace(/[^\w.-]+/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(zipName)}`;
}

export function acceptAttr(): string {
  return [
    "video/*",
    ...[...ALLOWED_EXTENSIONS].map((ext) => `.${ext}`),
  ].join(",");
}
