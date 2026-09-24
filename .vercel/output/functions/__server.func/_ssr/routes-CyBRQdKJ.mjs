import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, r as Slot, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as Plus, c as Image, d as Download, f as Clock3, g as AudioLines, h as Check, i as RotateCcw, l as Film, m as ChevronDown, n as Upload, o as Minus, p as CircleAlert, s as LoaderCircle, t as X, u as FileVideo } from "../_libs/lucide-react.mjs";
import { t as Root } from "../_libs/@radix-ui/react-label+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as stripExtension, S as sanitizeBaseName, T as thumbnailSizeOptions, c as clampThumbSeek, d as formatBytes, f as formatDisplayCommand, g as isAllowedVideo, h as formatThumbTime, i as acceptAttr, l as estimateSegments, m as formatDuration, p as formatDisplayThumbnailCommand, s as clampHlsTime, v as maxThumbSeek } from "./router-DLIC8ZH1.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as Root$1, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
import { t as Root$2 } from "../_libs/radix-ui__react-separator.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CyBRQdKJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[opacity,transform,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			primary: "bg-primary text-primary-fg hover:opacity-90 active:opacity-80",
			secondary: "border border-border bg-elevated text-fg hover:bg-surface active:opacity-90",
			ghost: "text-muted hover:bg-elevated hover:text-fg"
		},
		size: {
			default: "h-11 px-5 text-sm",
			sm: "h-9 px-3 text-sm",
			lg: "h-12 px-6 text-sm",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Input({ className, type, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg", "placeholder:text-subtle", "transition-colors duration-150", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70", "disabled:cursor-not-allowed disabled:opacity-40", "file:border-0 file:bg-transparent file:text-sm file:font-medium", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
		className: cn("text-sm font-medium text-fg", className),
		...props
	});
}
function Progress({ className, value = 0, ...props }) {
	const clamped = Math.min(100, Math.max(0, value ?? 0));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root$1, {
		className: cn("relative h-1.5 w-full overflow-hidden rounded-full bg-elevated", className),
		value: clamped,
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
			className: "h-full w-full rounded-full bg-primary transition-transform duration-150 ease-out",
			style: { transform: `translateX(-${100 - clamped}%)` }
		})
	});
}
function Select({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
			className: cn("h-11 w-full appearance-none rounded-md border border-border bg-elevated py-0 pl-3 pr-10 text-sm text-fg", "transition-colors duration-150", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70", "disabled:cursor-not-allowed disabled:opacity-40", className),
			...props,
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
			"aria-hidden": "true",
			className: "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
		})]
	});
}
function Slider({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
		className: cn("relative flex h-11 w-full touch-none select-none items-center", "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
			className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-elevated",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full rounded-full bg-primary" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: cn("block size-5 rounded-full border border-border bg-fg shadow-sm", "transition-colors duration-150", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70") })]
	});
}
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border", "bg-elevated transition-colors duration-150", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70", "disabled:cursor-not-allowed disabled:opacity-40", "data-[state=checked]:border-primary data-[state=checked]:bg-primary", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block size-5 rounded-full bg-muted shadow-sm", "transition-transform duration-150 ease-out", "data-[state=checked]:translate-x-6 data-[state=checked]:bg-primary-fg", "data-[state=unchecked]:translate-x-1") })
	});
}
function Separator({ className, orientation = "horizontal", decorative = true, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root$2, {
		decorative,
		orientation,
		className: cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className),
		...props
	});
}
async function fetchHealth() {
	try {
		const res = await fetch("/api/health");
		if (!res.ok) return {
			ffmpeg: false,
			maxUploadBytes: 0
		};
		const data = await res.json();
		return {
			ffmpeg: Boolean(data.ffmpeg),
			maxUploadBytes: Number(data.maxUploadBytes) || 0
		};
	} catch {
		return {
			ffmpeg: false,
			maxUploadBytes: 0
		};
	}
}
function xhrPost(url, form, onUpload) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", url);
		xhr.responseType = "json";
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable && event.total > 0) onUpload(event.loaded / event.total);
		};
		xhr.onload = () => {
			const body = xhr.response;
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(body);
				return;
			}
			reject(new Error(body?.error || `Upload failed (${xhr.status}).`));
		};
		xhr.onerror = () => reject(/* @__PURE__ */ new Error("Network error while uploading."));
		xhr.onabort = () => reject(/* @__PURE__ */ new Error("Upload was cancelled."));
		xhr.send(form);
	});
}
async function pollJob(id, onProgress) {
	const started = Date.now();
	while (Date.now() - started < 6e5) {
		const res = await fetch(`/api/jobs/${id}`);
		const body = await res.json();
		if (!res.ok) throw new Error(body.error || "Lost track of the conversion job.");
		if (body.status === "error") throw new Error(body.error || "Conversion failed.");
		const stage = body.status === "packaging" ? "Building ZIP" : body.status === "queued" ? "Waiting to convert" : body.progress >= .9 ? "Grabbing thumbnail" : "Packing HLS segments";
		onProgress({
			stage: body.usedTranscode && body.progress < .9 ? "Transcoding to HLS" : stage,
			ratio: Math.min(.99, body.progress || 0)
		});
		if (body.status === "done") {
			onProgress({
				stage: "Done",
				ratio: 1
			});
			return body;
		}
		await new Promise((r) => setTimeout(r, 400));
	}
	throw new Error("Conversion timed out. Try a shorter file.");
}
async function runServer(file, options, onProgress) {
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
	onProgress({
		stage: "Uploading video",
		ratio: .02
	});
	const done = await pollJob((await xhrPost("/api/jobs", form, (ratio) => {
		onProgress({
			stage: "Uploading video",
			ratio: ratio * .2
		});
	})).id, (update) => {
		onProgress({
			stage: update.stage,
			ratio: .2 + update.ratio * .8
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
		thumbnailUrl: done.thumbnailName ? `/api/jobs/${done.id}/thumbnail` : void 0,
		jobId: done.id
	};
}
async function runConversion(file, options, onProgress) {
	const outputBase = sanitizeBaseName(options.outputBase || file.name);
	const nextOptions = {
		...options,
		outputBase
	};
	const health = await fetchHealth();
	if (health.ffmpeg && file.size <= (health.maxUploadBytes || 209715200) && file.size <= 209715200) try {
		return await runServer(file, nextOptions, onProgress);
	} catch (err) {
		const message = err instanceof Error ? err.message : "";
		if (!/413|too large|not installed|Failed to fetch|Network error|not available/i.test(message)) throw err;
	}
	if (file.size > 83886080) throw new Error(`This file is too large to convert in the browser. Maximum is 80 MB.`);
	const { runClientConversion } = await import("./client-engine-BVBooeEg.mjs");
	return {
		...await runClientConversion(file, nextOptions, onProgress),
		engine: "browser"
	};
}
function LogoMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		"aria-hidden": "true",
		className: "flex size-9 items-end justify-center gap-0.5 rounded-md bg-elevated px-2 py-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-3 w-1 rounded-full bg-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-5 w-1 rounded-full bg-accent" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-1 rounded-full bg-primary" })
		]
	});
}
function readVideoMeta(file) {
	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const video = document.createElement("video");
		video.preload = "metadata";
		const finish = (value) => {
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
				height: h > 0 ? h : null
			});
		};
		video.onerror = () => finish({
			duration: null,
			width: null,
			height: null
		});
		video.src = url;
	});
}
function HlsConverter() {
	const inputId = (0, import_react.useId)();
	const renameId = (0, import_react.useId)();
	const audioId = (0, import_react.useId)();
	const timeId = (0, import_react.useId)();
	const thumbId = (0, import_react.useId)();
	const thumbSeekId = (0, import_react.useId)();
	const fileInputRef = (0, import_react.useRef)(null);
	const previewVideoRef = (0, import_react.useRef)(null);
	const previewUrlRef = (0, import_react.useRef)(null);
	const [file, setFile] = (0, import_react.useState)(null);
	const [duration, setDuration] = (0, import_react.useState)(null);
	const [videoWidth, setVideoWidth] = (0, import_react.useState)(null);
	const [videoHeight, setVideoHeight] = (0, import_react.useState)(null);
	const [outputBase, setOutputBase] = (0, import_react.useState)("");
	const [renameTouched, setRenameTouched] = (0, import_react.useState)(false);
	const [removeAudio, setRemoveAudio] = (0, import_react.useState)(false);
	const [hlsTime, setHlsTime] = (0, import_react.useState)(5);
	const [thumbSizeId, setThumbSizeId] = (0, import_react.useState)("original");
	const [thumbSeek, setThumbSeek] = (0, import_react.useState)(1);
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)(null);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [stage, setStage] = (0, import_react.useState)("Preparing");
	const [ratio, setRatio] = (0, import_react.useState)(0);
	const [error, setError] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const resultUrlRef = (0, import_react.useRef)(null);
	const thumbUrlRef = (0, import_react.useRef)(null);
	const playlistName = `${outputBase || "video"}.m3u8`;
	const segmentsGuess = estimateSegments(duration, hlsTime);
	const thumbOptions = (0, import_react.useMemo)(() => thumbnailSizeOptions(videoWidth, videoHeight), [videoWidth, videoHeight]);
	const selectedThumb = thumbOptions.find((opt) => opt.id === thumbSizeId) ?? thumbOptions[0];
	const seekMax = maxThumbSeek(duration);
	const seekSeconds = clampThumbSeek(thumbSeek, duration);
	const command = (0, import_react.useMemo)(() => {
		return `${formatDisplayCommand({
			inputName: file?.name ?? "input.mp4",
			outputBase: outputBase || "video",
			hlsTime,
			removeAudio
		})}\n${formatDisplayThumbnailCommand({
			inputName: file?.name ?? "input.mp4",
			outputBase: outputBase || "video",
			seekSeconds,
			thumbnail: {
				original: selectedThumb.original,
				width: selectedThumb.width,
				height: selectedThumb.height
			}
		})}`;
	}, [
		file,
		outputBase,
		hlsTime,
		removeAudio,
		seekSeconds,
		selectedThumb
	]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
			if (thumbUrlRef.current) URL.revokeObjectURL(thumbUrlRef.current);
			if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const video = previewVideoRef.current;
		if (!video || !previewUrl) return;
		const apply = () => {
			try {
				if (Number.isFinite(seekSeconds)) video.currentTime = seekSeconds;
			} catch {}
		};
		if (video.readyState >= 1) apply();
		else video.addEventListener("loadedmetadata", apply, { once: true });
	}, [seekSeconds, previewUrl]);
	const reset = (0, import_react.useCallback)(() => {
		setFile(null);
		setDuration(null);
		setVideoWidth(null);
		setVideoHeight(null);
		setOutputBase("");
		setRenameTouched(false);
		setRemoveAudio(false);
		setHlsTime(5);
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
	const applyFile = (0, import_react.useCallback)((next) => {
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
		readVideoMeta(next).then((meta) => {
			setDuration(meta.duration);
			setVideoWidth(meta.width);
			setVideoHeight(meta.height);
			setThumbSeek(clampThumbSeek("", meta.duration));
		});
	}, [renameTouched]);
	const onDrop = (0, import_react.useCallback)((event) => {
		event.preventDefault();
		setDragging(false);
		const next = event.dataTransfer.files[0];
		if (next) applyFile(next);
	}, [applyFile]);
	const onPick = (0, import_react.useCallback)((event) => {
		const next = event.target.files?.[0];
		if (next) applyFile(next);
	}, [applyFile]);
	async function onConvert() {
		if (!file) return;
		const base = sanitizeBaseName(outputBase || file.name);
		setOutputBase(base);
		setPhase("working");
		setError(null);
		setRatio(.02);
		setStage("Starting");
		try {
			const next = await runConversion(file, {
				outputBase: base,
				hlsTime,
				removeAudio,
				sourceDurationSec: duration,
				thumbnail: {
					original: selectedThumb.original,
					width: selectedThumb.width,
					height: selectedThumb.height,
					seekSeconds
				}
			}, (update) => {
				setStage(update.stage);
				setRatio(update.ratio);
			});
			if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
			if (thumbUrlRef.current) URL.revokeObjectURL(thumbUrlRef.current);
			resultUrlRef.current = next.zipBlob.size > 0 ? URL.createObjectURL(next.zipBlob) : null;
			thumbUrlRef.current = next.thumbnailBlob ? URL.createObjectURL(next.thumbnailBlob) : null;
			setResult(next);
			setPhase("done");
			setRatio(1);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Conversion failed. Check that the file is a valid video.";
			setError(message);
			setPhase("error");
			toast.error(message);
		}
	}
	function downloadHref(href, filename) {
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
	const thumbLabel = result?.thumbnailWidth && result?.thumbnailHeight ? `${result.thumbnailWidth}×${result.thumbnailHeight}` : videoWidth && videoHeight ? `${videoWidth}×${videoHeight}` : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "app-shell min-h-dvh",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-16 lg:px-8 lg:py-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "order-1 flex items-center gap-3 lg:col-span-2 lg:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold tracking-tight",
						children: "Reelpack"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "HLS packer"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "order-3 flex flex-col gap-8 lg:order-1 lg:sticky lg:top-16",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden items-center gap-3 lg:flex",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold tracking-tight",
								children: "Reelpack"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "HLS packer"
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl",
								children: "Pack video into HLS."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-md text-sm leading-relaxed text-muted",
								children: "Remux a video into an M3U8 playlist and MPEG-TS segments, plus a still thumbnail. Stream copy when possible, so quality stays intact."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "flex flex-col gap-4 text-sm",
							children: [
								{
									n: "01",
									t: "Drop a video",
									d: "MP4, MOV, MKV, WebM and other common formats."
								},
								{
									n: "02",
									t: "Tune the pack",
									d: "Audio, segment duration, thumbnail size, and frame time."
								},
								{
									n: "03",
									t: "Download the ZIP",
									d: "Playlist, .ts segments, and a JPEG thumbnail."
								}
							].map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs tabular-nums text-accent",
									children: step.n
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block font-medium",
									children: step.t
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs leading-relaxed text-muted",
									children: step.d
								})] })]
							}, step.n))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "order-2 rounded-2xl border border-border bg-surface p-4 shadow-card lg:order-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileInputRef,
							id: inputId,
							"data-testid": "video-input",
							type: "file",
							accept: acceptAttr(),
							className: "sr-only",
							onChange: onPick
						}),
						phase === "working" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-4 rounded-lg bg-elevated px-4 py-8",
							"aria-live": "polite",
							"aria-busy": "true",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-sm font-medium",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin text-accent" }), stage]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-sm tabular-nums text-muted",
										children: [percent, "%"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
									value: percent,
									className: ratio < .08 ? "animate-pulse" : void 0
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-subtle",
									children: [
										file?.name,
										" · ",
										playlistName
									]
								})
							]
						}) : phase === "done" && result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-5 rounded-lg bg-elevated px-4 py-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-0.5 flex size-8 items-center justify-center rounded-md bg-success/15 text-success",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: "HLS package ready"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 truncate font-mono text-sm text-muted",
												children: [result.playlistName, result.thumbnailName ? ` · ${result.thumbnailName}` : ""]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 text-xs text-subtle",
												"data-testid": "pack-stats",
												children: [
													result.packedDurationSec ? `${formatDuration(result.packedDurationSec)} packed · ` : "",
													result.segmentCount,
													" segment",
													result.segmentCount === 1 ? "" : "s",
													thumbLabel ? ` · thumb ${thumbLabel}` : "",
													result.engine === "browser" ? " · converted in your browser" : ""
												]
											}),
											result.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-xs leading-relaxed text-muted",
												children: result.note
											}) : null
										]
									})]
								}),
								thumbPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: thumbPreview,
									alt: "Video thumbnail",
									"data-testid": "thumbnail-preview",
									className: "max-h-56 w-full rounded-md border border-border object-contain bg-bg"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2 sm:flex-row",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											className: "min-h-11 flex-1",
											onClick: onDownload,
											"data-testid": "download-btn",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Download ZIP"]
										}),
										thumbPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "secondary",
											className: "min-h-11",
											onClick: onDownloadThumb,
											"data-testid": "download-thumb-btn",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {}), "Thumbnail"]
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "secondary",
											className: "min-h-11",
											onClick: reset,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}), "Convert another"]
										})
									]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => fileInputRef.current?.click(),
							onDragEnter: (e) => {
								e.preventDefault();
								setDragging(true);
							},
							onDragOver: (e) => {
								e.preventDefault();
								setDragging(true);
							},
							onDragLeave: () => setDragging(false),
							onDrop,
							className: cn("flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center transition-colors duration-150", dragging ? "border-primary bg-elevated" : "border-border bg-elevated/50 hover:border-muted hover:bg-elevated"),
							"data-testid": "dropzone",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-11 items-center justify-center rounded-md bg-surface text-accent",
								children: file ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileVideo, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-5" })
							}), file ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "max-w-full truncate text-sm font-medium",
								children: file.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted",
								children: [
									formatBytes(file.size),
									duration ? ` · ${formatDuration(duration)}` : "",
									videoWidth && videoHeight ? ` · ${videoWidth}×${videoHeight}` : "",
									" · ",
									"click or drop to replace"
								]
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium",
								children: "Drop a video, or click to browse"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted",
								children: [
									"MP4, MOV, MKV, WebM and other common formats · up to ",
									200,
									" MB"
								]
							})] })]
						}),
						phase === "error" && error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-3",
							role: "alert",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "mt-0.5 size-4 shrink-0 text-danger" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm leading-relaxed text-fg",
									children: error
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ml-auto text-muted hover:text-fg",
									onClick: () => {
										setError(null);
										setPhase(file ? "ready" : "idle");
									},
									"aria-label": "Dismiss error",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
								})
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex flex-col gap-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium",
										children: "Input to output"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted",
										children: "Hardcoded conversion path"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full border border-border bg-elevated px-3 py-1 font-mono text-xs text-fg",
										children: "MP4 → M3U8 + JPG"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
										htmlFor: audioId,
										className: "flex cursor-pointer flex-col gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, { className: "size-3.5 text-muted" }), "Remove audio"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-normal text-muted",
											children: "Off keeps the soundtrack. On strips it with -an."
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										id: audioId,
										checked: removeAudio,
										onCheckedChange: setRemoveAudio,
										disabled: locked,
										"data-testid": "remove-audio"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
										htmlFor: timeId,
										className: "flex flex-col gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-3.5 text-muted" }), "HLS segment duration"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs font-normal text-muted",
											children: ["Length of each .ts piece (FFmpeg -hls_time), not the whole video. Default 5 seconds.", segmentsGuess ? ` A ${duration ? formatDuration(duration) : ""} clip typically becomes ~${segmentsGuess} segment${segmentsGuess === 1 ? "" : "s"}.` : ""]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: "secondary",
												size: "icon",
												className: "size-11",
												disabled: locked || hlsTime <= 1,
												onClick: () => setHlsTime((t) => clampHlsTime(t - 1)),
												"aria-label": "Decrease segment duration",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: timeId,
												"data-testid": "hls-time",
												type: "number",
												inputMode: "numeric",
												min: 1,
												max: 30,
												value: hlsTime,
												disabled: locked,
												onChange: (e) => setHlsTime(clampHlsTime(e.target.value)),
												className: "h-11 w-16 text-center font-mono tabular-nums"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: "secondary",
												size: "icon",
												className: "size-11",
												disabled: locked || hlsTime >= 30,
												onClick: () => setHlsTime((t) => clampHlsTime(t + 1)),
												"aria-label": "Increase segment duration",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted",
												children: "sec"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
										htmlFor: thumbId,
										className: "flex flex-col gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-3.5 text-muted" }), "Thumbnail size"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-normal text-muted",
											children: "Default is the video resolution. Other sizes keep the same aspect ratio."
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
										id: thumbId,
										"data-testid": "thumbnail-size",
										value: selectedThumb.id,
										disabled: locked,
										onChange: (e) => setThumbSizeId(e.target.value),
										children: thumbOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: opt.id,
											children: opt.label
										}, opt.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
											htmlFor: thumbSeekId,
											className: "flex flex-col gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, { className: "size-3.5 text-muted" }), "Thumbnail time"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-normal text-muted",
												children: "Drag to pick the frame FFmpeg stills. Default is near the start."
											})]
										}),
										previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
											ref: previewVideoRef,
											src: previewUrl,
											muted: true,
											playsInline: true,
											preload: "metadata",
											"data-testid": "thumbnail-frame",
											className: "max-h-44 w-full rounded-md border border-border bg-bg object-contain"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-elevated/50 text-xs text-subtle",
											children: "Drop a video to scrub the thumbnail frame"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
												id: thumbSeekId,
												"data-testid": "thumbnail-seek",
												min: 0,
												max: seekMax > 0 ? seekMax : .1,
												step: .1,
												value: [seekSeconds],
												disabled: locked || !file || seekMax <= 0,
												onValueChange: (value) => {
													const next = value[0];
													if (typeof next === "number") setThumbSeek(clampThumbSeek(next, duration));
												},
												"aria-label": "Thumbnail time in seconds"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-16 shrink-0 text-right font-mono text-sm tabular-nums text-fg",
												"data-testid": "thumbnail-seek-label",
												children: formatThumbTime(seekSeconds)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-subtle",
											children: duration ? `0s – ${formatDuration(duration)} · still at ${formatThumbTime(seekSeconds)}` : "Available after a video is loaded"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: renameId,
											children: "Rename output"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: renameId,
											"data-testid": "rename-output",
											value: outputBase,
											disabled: locked,
											placeholder: "Uses the original filename",
											autoComplete: "off",
											spellCheck: false,
											onChange: (e) => {
												setRenameTouched(true);
												setOutputBase(e.target.value);
											},
											onBlur: () => {
												if (outputBase.trim()) setOutputBase(sanitizeBaseName(outputBase));
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-subtle",
											children: [
												"Playlist will be",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-muted",
													children: playlistName
												}),
												", thumbnail ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-muted",
													children: `${outputBase || "video"}.jpg`
												}),
												file && !renameTouched ? " — matching the uploaded file" : ""
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-elevated px-3 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mb-2 text-xs font-medium text-muted",
										children: "FFmpeg command"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-accent",
										children: command
									})]
								}),
								phase !== "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "min-h-11 w-full",
									disabled: !file || busy,
									onClick: () => void onConvert(),
									"data-testid": "convert-btn",
									children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {}), busy ? "Converting…" : file ? "Convert to HLS" : "Choose a video first"]
								}) : null
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "order-4 flex flex-col gap-1 text-xs leading-relaxed text-subtle lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Temp files are deleted after download, or after 15 minutes." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "If stream copy cannot mux this codec into MPEG-TS, Reelpack transcodes to H.264/AAC." })]
				})
			]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HlsConverter, {});
}
//#endregion
export { Home as component };
