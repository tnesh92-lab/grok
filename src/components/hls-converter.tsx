import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AudioLines,
  Check,
  Clock3,
  Download,
  FileVideo,
  Film,
  Image,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  acceptAttr,
  clampHlsTime,
  clampThumbSeek,
  estimateSegments,
  formatBytes,
  formatDisplayCommand,
  formatDisplayThumbnailCommand,
  formatDuration,
  formatThumbTime,
  HLS_TIME_DEFAULT,
  HLS_TIME_MAX,
  HLS_TIME_MIN,
  isAllowedVideo,
  MAX_UPLOAD_MB,
  maxThumbSeek,
  sanitizeBaseName,
  stripExtension,
  thumbnailSizeOptions,
} from "@/lib/convert/shared";
import { runConversion, type RunConversionResult } from "@/lib/convert/run";
import { cn } from "@/lib/utils";

type Phase = "idle" | "ready" | "working" | "done" | "error";

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 items-end justify-center gap-0.5 rounded-md bg-elevated px-2 py-1.5"
    >
      <span className="h-3 w-1 rounded-full bg-primary" />
      <span className="h-5 w-1 rounded-full bg-accent" />
      <span className="h-2.5 w-1 rounded-full bg-primary" />
    </span>
  );
}

function readVideoMeta(file: File): Promise<{
  duration: number | null;
  width: number | null;
  height: number | null;
}> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const finish = (value: {
      duration: number | null;
      width: number | null;
      height: number | null;
    }) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () => {
      const d = video.duration;
      const w = video.videoWidth;
      const h = video.videoHeight;
      finish({
        duration: Number.isFinite(d) ? d : null,
        width: w > 0 ? w : null,
        height: h > 0 ? h : null,
      });
    };
    video.onerror = () => finish({ duration: null, width: null, height: null });
    video.src = url;
  });
}

export function HlsConverter() {
  const inputId = useId();
  const renameId = useId();
  const audioId = useId();
  const timeId = useId();
  const thumbId = useId();
  const thumbSeekId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [videoWidth, setVideoWidth] = useState<number | null>(null);
  const [videoHeight, setVideoHeight] = useState<number | null>(null);
  const [outputBase, setOutputBase] = useState("");
  const [renameTouched, setRenameTouched] = useState(false);
  const [removeAudio, setRemoveAudio] = useState(false);
  const [hlsTime, setHlsTime] = useState(HLS_TIME_DEFAULT);
  const [thumbSizeId, setThumbSizeId] = useState("original");
  const [thumbSeek, setThumbSeek] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState("Preparing");
  const [ratio, setRatio] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunConversionResult | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const thumbUrlRef = useRef<string | null>(null);

  const playlistName = `${outputBase || "video"}.m3u8`;
  const segmentsGuess = estimateSegments(duration, hlsTime);
  const thumbOptions = useMemo(
    () => thumbnailSizeOptions(videoWidth, videoHeight),
    [videoWidth, videoHeight],
  );
  const selectedThumb =
    thumbOptions.find((opt) => opt.id === thumbSizeId) ?? thumbOptions[0];
  const seekMax = maxThumbSeek(duration);
  const seekSeconds = clampThumbSeek(thumbSeek, duration);

  const command = useMemo(() => {
    const hls = formatDisplayCommand({
      inputName: file?.name ?? "input.mp4",
      outputBase: outputBase || "video",
      hlsTime,
      removeAudio,
    });
    const thumb = formatDisplayThumbnailCommand({
      inputName: file?.name ?? "input.mp4",
      outputBase: outputBase || "video",
      seekSeconds,
      thumbnail: {
        original: selectedThumb.original,
        width: selectedThumb.width,
        height: selectedThumb.height,
      },
    });
    return `${hls}\n${thumb}`;
  }, [file, outputBase, hlsTime, removeAudio, seekSeconds, selectedThumb]);

  useEffect(() => {
    return () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      if (thumbUrlRef.current) URL.revokeObjectURL(thumbUrlRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video || !previewUrl) return;
    const apply = () => {
      try {
        if (Number.isFinite(seekSeconds)) video.currentTime = seekSeconds;
      } catch {
        /* some browsers reject seeks before data */
      }
    };
    if (video.readyState >= 1) apply();
    else video.addEventListener("loadedmetadata", apply, { once: true });
  }, [seekSeconds, previewUrl]);

  const reset = useCallback(() => {
    setFile(null);
    setDuration(null);
    setVideoWidth(null);
    setVideoHeight(null);
    setOutputBase("");
    setRenameTouched(false);
    setRemoveAudio(false);
    setHlsTime(HLS_TIME_DEFAULT);
    setThumbSizeId("original");
    setThumbSeek(1);
    setPreviewUrl(null);
    setPhase("idle");
    setStage("Preparing");
    setRatio(0);
    setError(null);
    setResult(null);
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    if (thumbUrlRef.current) {
      URL.revokeObjectURL(thumbUrlRef.current);
      thumbUrlRef.current = null;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const applyFile = useCallback((next: File) => {
    const invalid = isAllowedVideo(next);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setError(null);
    setResult(null);
    setFile(next);
    setDuration(null);
    setVideoWidth(null);
    setVideoHeight(null);
    setThumbSizeId("original");
    setThumbSeek(1);
    if (!renameTouched) setOutputBase(sanitizeBaseName(stripExtension(next.name)));
    setPhase("ready");
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(next);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    void readVideoMeta(next).then((meta) => {
      setDuration(meta.duration);
      setVideoWidth(meta.width);
      setVideoHeight(meta.height);
      setThumbSeek(clampThumbSeek("", meta.duration));
    });
  }, [renameTouched]);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragging(false);
      const next = event.dataTransfer.files[0];
      if (next) applyFile(next);
    },
    [applyFile],
  );

  const onPick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.files?.[0];
      if (next) applyFile(next);
    },
    [applyFile],
  );

  async function onConvert() {
    if (!file) return;
    const base = sanitizeBaseName(outputBase || file.name);
    setOutputBase(base);
    setPhase("working");
    setError(null);
    setRatio(0.02);
    setStage("Starting");
    try {
      const next = await runConversion(
        file,
        {
          outputBase: base,
          hlsTime,
          removeAudio,
          sourceDurationSec: duration,
          thumbnail: {
            original: selectedThumb.original,
            width: selectedThumb.width,
            height: selectedThumb.height,
            seekSeconds,
          },
        },
        (update) => {
          setStage(update.stage);
          setRatio(update.ratio);
        },
      );
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      if (thumbUrlRef.current) URL.revokeObjectURL(thumbUrlRef.current);
      resultUrlRef.current = next.zipBlob.size > 0 ? URL.createObjectURL(next.zipBlob) : null;
      thumbUrlRef.current = next.thumbnailBlob
        ? URL.createObjectURL(next.thumbnailBlob)
        : null;
      setResult(next);
      setPhase("done");
      setRatio(1);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Conversion failed. Check that the file is a valid video.";
      setError(message);
      setPhase("error");
      toast.error(message);
    }
  }

  function downloadHref(href: string, filename: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function onDownload() {
    if (!result) return;
    const href = result.downloadUrl || resultUrlRef.current;
    if (!href) return;
    downloadHref(href, `${sanitizeBaseName(outputBase)}-hls.zip`);
  }

  function onDownloadThumb() {
    if (!result) return;
    const href = result.thumbnailUrl || thumbUrlRef.current;
    if (!href) return;
    downloadHref(href, result.thumbnailName || `${sanitizeBaseName(outputBase)}.jpg`);
  }

  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const busy = phase === "working";
  const locked = busy || phase === "done";
  const thumbPreview = result?.thumbnailUrl || thumbUrlRef.current;
  const thumbLabel =
    result?.thumbnailWidth && result?.thumbnailHeight
      ? `${result.thumbnailWidth}×${result.thumbnailHeight}`
      : videoWidth && videoHeight
        ? `${videoWidth}×${videoHeight}`
        : null;

  return (
    <div className="app-shell min-h-dvh">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-16 lg:px-8 lg:py-16">
        <div className="order-1 flex items-center gap-3 lg:col-span-2 lg:hidden">
          <LogoMark />
          <div>
            <p className="text-sm font-semibold tracking-tight">Reelpack</p>
            <p className="text-xs text-muted">HLS packer</p>
          </div>
        </div>

        <header className="order-3 flex flex-col gap-8 lg:order-1 lg:sticky lg:top-16">
          <div className="hidden items-center gap-3 lg:flex">
            <LogoMark />
            <div>
              <p className="text-sm font-semibold tracking-tight">Reelpack</p>
              <p className="text-xs text-muted">HLS packer</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Pack video into HLS.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Remux a video into an M3U8 playlist and MPEG-TS segments, plus a
              still thumbnail. Stream copy when possible, so quality stays intact.
            </p>
          </div>
          <ol className="flex flex-col gap-4 text-sm">
            {[
              { n: "01", t: "Drop a video", d: "MP4, MOV, MKV, WebM and other common formats." },
              { n: "02", t: "Tune the pack", d: "Audio, segment duration, thumbnail size, and frame time." },
              { n: "03", t: "Download the ZIP", d: "Playlist, .ts segments, and a JPEG thumbnail." },
            ].map((step) => (
              <li key={step.n} className="flex gap-3">
                <span className="font-mono text-xs tabular-nums text-accent">{step.n}</span>
                <span>
                  <span className="block font-medium">{step.t}</span>
                  <span className="text-xs leading-relaxed text-muted">{step.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </header>

        <section className="order-2 rounded-2xl border border-border bg-surface p-4 shadow-card lg:order-2">
          <input
            ref={fileInputRef}
            id={inputId}
            data-testid="video-input"
            type="file"
            accept={acceptAttr()}
            className="sr-only"
            onChange={onPick}
          />

          {phase === "working" ? (
            <div className="flex flex-col gap-4 rounded-lg bg-elevated px-4 py-8" aria-live="polite" aria-busy="true">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Loader2 className="size-4 animate-spin text-accent" />
                  {stage}
                </div>
                <span className="font-mono text-sm tabular-nums text-muted">
                  {percent}%
                </span>
              </div>
              <Progress value={percent} className={ratio < 0.08 ? "animate-pulse" : undefined} />
              <p className="text-xs text-subtle">
                {file?.name} · {playlistName}
              </p>
            </div>
          ) : phase === "done" && result ? (
            <div className="flex flex-col gap-5 rounded-lg bg-elevated px-4 py-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-success/15 text-success">
                  <Check className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">HLS package ready</p>
                  <p className="mt-1 truncate font-mono text-sm text-muted">
                    {result.playlistName}
                    {result.thumbnailName ? ` · ${result.thumbnailName}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-subtle" data-testid="pack-stats">
                    {result.packedDurationSec
                      ? `${formatDuration(result.packedDurationSec)} packed · `
                      : ""}
                    {result.segmentCount} segment
                    {result.segmentCount === 1 ? "" : "s"}
                    {thumbLabel ? ` · thumb ${thumbLabel}` : ""}
                    {result.engine === "browser" ? " · converted in your browser" : ""}
                  </p>
                  {result.note ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted">{result.note}</p>
                  ) : null}
                </div>
              </div>
              {thumbPreview ? (
                <img
                  src={thumbPreview}
                  alt="Video thumbnail"
                  data-testid="thumbnail-preview"
                  className="max-h-56 w-full rounded-md border border-border object-contain bg-bg"
                />
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="min-h-11 flex-1"
                  onClick={onDownload}
                  data-testid="download-btn"
                >
                  <Download />
                  Download ZIP
                </Button>
                {thumbPreview ? (
                  <Button
                    variant="secondary"
                    className="min-h-11"
                    onClick={onDownloadThumb}
                    data-testid="download-thumb-btn"
                  >
                    <Image />
                    Thumbnail
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  className="min-h-11"
                  onClick={reset}
                >
                  <RotateCcw />
                  Convert another
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center transition-colors duration-150",
                dragging
                  ? "border-primary bg-elevated"
                  : "border-border bg-elevated/50 hover:border-muted hover:bg-elevated",
              )}
              data-testid="dropzone"
            >
              <span className="flex size-11 items-center justify-center rounded-md bg-surface text-accent">
                {file ? <FileVideo className="size-5" /> : <Upload className="size-5" />}
              </span>
              {file ? (
                <>
                  <span className="max-w-full truncate text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted">
                    {formatBytes(file.size)}
                    {duration ? ` · ${formatDuration(duration)}` : ""}
                    {videoWidth && videoHeight ? ` · ${videoWidth}×${videoHeight}` : ""}
                    {" · "}click or drop to replace
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">Drop a video, or click to browse</span>
                  <span className="text-xs text-muted">
                    MP4, MOV, MKV, WebM and other common formats · up to {MAX_UPLOAD_MB} MB
                  </span>
                </>
              )}
            </button>
          )}

          {phase === "error" && error ? (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-3" role="alert">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
              <p className="text-sm leading-relaxed text-fg">{error}</p>
              <button
                type="button"
                className="ml-auto text-muted hover:text-fg"
                onClick={() => {
                  setError(null);
                  setPhase(file ? "ready" : "idle");
                }}
                aria-label="Dismiss error"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Input to output</p>
                <p className="text-xs text-muted">Hardcoded conversion path</p>
              </div>
              <span className="rounded-full border border-border bg-elevated px-3 py-1 font-mono text-xs text-fg">
                MP4 → M3U8 + JPG
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={audioId} className="flex cursor-pointer flex-col gap-1">
                <span className="flex items-center gap-2">
                  <AudioLines className="size-3.5 text-muted" />
                  Remove audio
                </span>
                <span className="text-xs font-normal text-muted">
                  Off keeps the soundtrack. On strips it with -an.
                </span>
              </Label>
              <Switch
                id={audioId}
                checked={removeAudio}
                onCheckedChange={setRemoveAudio}
                disabled={locked}
                data-testid="remove-audio"
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Label htmlFor={timeId} className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <Clock3 className="size-3.5 text-muted" />
                  HLS segment duration
                </span>
                <span className="text-xs font-normal text-muted">
                  Length of each .ts piece (FFmpeg -hls_time), not the whole video.
                  Default 5 seconds.
                  {segmentsGuess
                    ? ` A ${duration ? formatDuration(duration) : ""} clip typically becomes ~${segmentsGuess} segment${segmentsGuess === 1 ? "" : "s"}.`
                    : ""}
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="size-11"
                  disabled={locked || hlsTime <= HLS_TIME_MIN}
                  onClick={() => setHlsTime((t) => clampHlsTime(t - 1))}
                  aria-label="Decrease segment duration"
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  id={timeId}
                  data-testid="hls-time"
                  type="number"
                  inputMode="numeric"
                  min={HLS_TIME_MIN}
                  max={HLS_TIME_MAX}
                  value={hlsTime}
                  disabled={locked}
                  onChange={(e) => setHlsTime(clampHlsTime(e.target.value))}
                  className="h-11 w-16 text-center font-mono tabular-nums"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="size-11"
                  disabled={locked || hlsTime >= HLS_TIME_MAX}
                  onClick={() => setHlsTime((t) => clampHlsTime(t + 1))}
                  aria-label="Increase segment duration"
                >
                  <Plus className="size-4" />
                </Button>
                <span className="text-xs text-muted">sec</span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label htmlFor={thumbId} className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <Image className="size-3.5 text-muted" />
                  Thumbnail size
                </span>
                <span className="text-xs font-normal text-muted">
                  Default is the video resolution. Other sizes keep the same aspect ratio.
                </span>
              </Label>
              <Select
                id={thumbId}
                data-testid="thumbnail-size"
                value={selectedThumb.id}
                disabled={locked}
                onChange={(e) => setThumbSizeId(e.target.value)}
              >
                {thumbOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <Label htmlFor={thumbSeekId} className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <Film className="size-3.5 text-muted" />
                  Thumbnail time
                </span>
                <span className="text-xs font-normal text-muted">
                  Drag to pick the frame FFmpeg stills. Default is near the start.
                </span>
              </Label>
              {previewUrl ? (
                <video
                  ref={previewVideoRef}
                  src={previewUrl}
                  muted
                  playsInline
                  preload="metadata"
                  data-testid="thumbnail-frame"
                  className="max-h-44 w-full rounded-md border border-border bg-bg object-contain"
                />
              ) : (
                <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-elevated/50 text-xs text-subtle">
                  Drop a video to scrub the thumbnail frame
                </div>
              )}
              <div className="flex items-center gap-3">
                <Slider
                  id={thumbSeekId}
                  data-testid="thumbnail-seek"
                  min={0}
                  max={seekMax > 0 ? seekMax : 0.1}
                  step={0.1}
                  value={[seekSeconds]}
                  disabled={locked || !file || seekMax <= 0}
                  onValueChange={(value) => {
                    const next = value[0];
                    if (typeof next === "number") setThumbSeek(clampThumbSeek(next, duration));
                  }}
                  aria-label="Thumbnail time in seconds"
                />
                <span
                  className="w-16 shrink-0 text-right font-mono text-sm tabular-nums text-fg"
                  data-testid="thumbnail-seek-label"
                >
                  {formatThumbTime(seekSeconds)}
                </span>
              </div>
              <p className="text-xs text-subtle">
                {duration
                  ? `0s – ${formatDuration(duration)} · still at ${formatThumbTime(seekSeconds)}`
                  : "Available after a video is loaded"}
              </p>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label htmlFor={renameId}>Rename output</Label>
              <Input
                id={renameId}
                data-testid="rename-output"
                value={outputBase}
                disabled={locked}
                placeholder="Uses the original filename"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => {
                  setRenameTouched(true);
                  setOutputBase(e.target.value);
                }}
                onBlur={() => {
                  if (outputBase.trim()) setOutputBase(sanitizeBaseName(outputBase));
                }}
              />
              <p className="text-xs text-subtle">
                Playlist will be{" "}
                <span className="font-mono text-muted">{playlistName}</span>
                {", thumbnail "}
                <span className="font-mono text-muted">{`${outputBase || "video"}.jpg`}</span>
                {file && !renameTouched ? " — matching the uploaded file" : ""}
              </p>
            </div>

            <div className="rounded-lg bg-elevated px-3 py-3">
              <p className="mb-2 text-xs font-medium text-muted">FFmpeg command</p>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-accent">
                {command}
              </pre>
            </div>

            {phase !== "done" ? (
              <Button
                className="min-h-11 w-full"
                disabled={!file || busy}
                onClick={() => void onConvert()}
                data-testid="convert-btn"
              >
                {busy ? <Loader2 className="animate-spin" /> : <Upload />}
                {busy ? "Converting…" : file ? "Convert to HLS" : "Choose a video first"}
              </Button>
            ) : null}
          </div>
        </section>

        <footer className="order-4 flex flex-col gap-1 text-xs leading-relaxed text-subtle lg:col-span-2">
          <p>Temp files are deleted after download, or after 15 minutes.</p>
          <p>If stream copy cannot mux this codec into MPEG-TS, Reelpack transcodes to H.264/AAC.</p>
        </footer>
      </div>
    </div>
  );
}
