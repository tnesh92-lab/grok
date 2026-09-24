import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as useRouter, f as createRouter, g as createRootRoute, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as zipSync } from "../_libs/fflate.mjs";
import { r as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { Readable } from "node:stream";
import { createReadStream } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DLIC8ZH1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var MAX_UPLOAD_BYTES = 209715200;
var JOB_TTL_MS = 9e5;
var FFMPEG_TIMEOUT_MS = 48e4;
var THUMB_TIMEOUT_MS = 6e4;
var THUMB_DIM_MAX = 4096;
var ALLOWED_EXTENSIONS = /* @__PURE__ */ new Set([
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
	"m2ts"
]);
var ALLOWED_MIME_PREFIX = "video/";
var ALLOWED_MIME_EXACT = /* @__PURE__ */ new Set([
	"application/octet-stream",
	"application/mp4",
	"application/mxf"
]);
function extOf(filename) {
	const base = filename.replace(/\\/g, "/").split("/").pop() ?? "";
	const dot = base.lastIndexOf(".");
	if (dot <= 0) return "";
	return base.slice(dot + 1).toLowerCase();
}
function stripExtension(filename) {
	const base = filename.replace(/\\/g, "/").split("/").pop() ?? filename;
	const dot = base.lastIndexOf(".");
	if (dot <= 0) return base;
	return base.slice(0, dot);
}
/** Keep the original name as much as possible, but strip path/control/illegal chars. */
function sanitizeBaseName(name) {
	return stripExtension(name.replace(/\\/g, "/").split("/").pop() ?? name).replace(/[\u0000-\u001f\u007f]/g, "").replace(/[\\/:*?"<>|#%]/g, "").replace(/^\.+/g, "").replace(/\.+$/g, "").trim().slice(0, 80) || "video";
}
function clampHlsTime(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return 5;
	return Math.min(30, Math.max(1, Math.round(n)));
}
function evenDim(n) {
	if (!Number.isFinite(n) || n < 2) return 2;
	const r = Math.round(n);
	return r % 2 === 0 ? r : r - 1;
}
function clampThumbDim(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n) || n <= 0) return 0;
	return Math.min(THUMB_DIM_MAX, Math.max(16, Math.round(n)));
}
/** Read width/height from a JPEG SOF marker so original-size thumbs can report real pixels. */
function jpegDimensions(bytes) {
	if (bytes.length < 10 || bytes[0] !== 255 || bytes[1] !== 216) return null;
	let i = 2;
	while (i + 8 < bytes.length) {
		if (bytes[i] !== 255) {
			i += 1;
			continue;
		}
		const marker = bytes[i + 1];
		if (marker === 0 || marker === 255) {
			i += 1;
			continue;
		}
		if (marker === 216 || marker === 217 || marker >= 208 && marker <= 215) {
			i += 2;
			continue;
		}
		const len = bytes[i + 2] << 8 | bytes[i + 3];
		if (marker >= 192 && marker <= 195) {
			const height = bytes[i + 5] << 8 | bytes[i + 6];
			const width = bytes[i + 7] << 8 | bytes[i + 8];
			if (width > 0 && height > 0) return {
				width,
				height
			};
			return null;
		}
		if (len < 2) break;
		i += 2 + len;
	}
	return null;
}
function parseThumbnailSize(input) {
	const originalFlag = String(input.original ?? "").toLowerCase() === "true" || input.original === true;
	const width = clampThumbDim(input.width);
	const height = clampThumbDim(input.height);
	if (originalFlag || !width || !height) return {
		original: true,
		width: 0,
		height: 0
	};
	return {
		original: false,
		width: evenDim(width),
		height: evenDim(height)
	};
}
function namedResolution(width, height) {
	const a = `${width}x${height}`;
	const b = `${height}x${width}`;
	const map = {
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
		"720x720": "1:1"
	};
	return map[a] || map[b] || null;
}
var LONG_EDGE_TARGETS = [
	1920,
	1600,
	1280,
	1080,
	960,
	854,
	720,
	640,
	480,
	360,
	240
];
/** Size choices that keep the source aspect ratio. Original is always first. */
function thumbnailSizeOptions(width, height) {
	if (!width || !height || width < 2 || height < 2) return [{
		id: "original",
		label: "Original (video size)",
		width: 0,
		height: 0,
		original: true
	}];
	const srcW = Math.round(width);
	const srcH = Math.round(height);
	const options = [{
		id: "original",
		label: `Original · ${srcW}×${srcH}`,
		width: srcW,
		height: srcH,
		original: true
	}];
	const long = Math.max(srcW, srcH);
	const targets = /* @__PURE__ */ new Set([
		...LONG_EDGE_TARGETS,
		evenDim(long * .75),
		evenDim(long * .5),
		evenDim(long * .25)
	]);
	const seen = /* @__PURE__ */ new Set([`${srcW}x${srcH}`]);
	const extras = [];
	for (const target of [...targets].sort((a, b) => b - a)) {
		if (target >= long) continue;
		if (target < 64) continue;
		const scale = target / long;
		const w = evenDim(srcW * scale);
		const h = evenDim(srcH * scale);
		const key = `${w}x${h}`;
		if (seen.has(key)) continue;
		if (w < 16 || h < 16) continue;
		seen.add(key);
		const named = namedResolution(w, h);
		const pct = Math.max(1, Math.round(Math.max(w, h) / long * 100));
		extras.push({
			id: key,
			label: named ? `${w}×${h} · ${named}` : `${w}×${h} · ${pct}%`,
			width: w,
			height: h,
			original: false
		});
	}
	return [...options, ...extras.slice(0, 6)];
}
function thumbnailSeekSeconds(durationSec) {
	if (durationSec == null) return 1;
	if (!(durationSec > .35)) return 0;
	return Math.min(1, Math.max(.05, durationSec * .1));
}
function maxThumbSeek(durationSec) {
	if (durationSec == null || !(durationSec > 0)) return 0;
	return Math.max(0, Math.round((durationSec - .05) * 10) / 10);
}
function clampThumbSeek(value, durationSec) {
	const max = maxThumbSeek(durationSec);
	if (value == null || value === "") return Math.min(thumbnailSeekSeconds(durationSec), max);
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n) || n < 0) return Math.min(thumbnailSeekSeconds(durationSec), max);
	const rounded = Math.round(n * 10) / 10;
	if (max <= 0) return 0;
	return Math.min(max, Math.max(0, rounded));
}
function formatThumbTime(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0.0s";
	const s = Math.round(seconds * 10) / 10;
	const m = Math.floor(s / 60);
	const r = s - m * 60;
	if (m <= 0) return `${r.toFixed(1)}s`;
	const [whole, tenth] = r.toFixed(1).split(".");
	return `${m}:${(whole ?? "0").padStart(2, "0")}.${tenth ?? "0"}`;
}
function isAllowedVideo(file) {
	if (!file.size || file.size <= 0) return "The file is empty.";
	if (file.size > 209715200) return `File is too large. Maximum size is 200 MB.`;
	const ext = extOf(file.name);
	if (!ext || !ALLOWED_EXTENSIONS.has(ext)) return `Unsupported format${ext ? ` .${ext}` : ""}. Use MP4, MOV, MKV, WebM, or another common video file.`;
	const mime = (file.type || "").toLowerCase();
	if (mime && !mime.startsWith(ALLOWED_MIME_PREFIX) && !ALLOWED_MIME_EXACT.has(mime)) return `This does not look like a video file (${mime}).`;
	return null;
}
function playlistMediaDuration(playlist) {
	let sum = 0;
	const re = /#EXTINF:([0-9.]+)/g;
	let match;
	while (match = re.exec(playlist)) {
		const n = Number(match[1]);
		if (Number.isFinite(n) && n > 0) sum += n;
	}
	return sum;
}
/** True when the HLS playlist is missing a meaningful amount of the source clip. */
function packLooksTruncated(sourceSec, packedSec) {
	if (sourceSec == null || packedSec == null) return false;
	if (!(sourceSec > .75) || packedSec < 0) return false;
	return sourceSec - packedSec > Math.max(.75, sourceSec * .08);
}
function parseSourceDuration(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n) || n <= 0) return null;
	return n;
}
function hlsSegmentPattern(outputM3u8) {
	return outputM3u8.replace(/\.m3u8$/i, "%d.ts");
}
function buildFfmpegArgs(opts) {
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
		"-ignore_unknown"
	];
	if (opts.removeAudio) args.push("-an");
	else args.push("-map", "0:a:0?");
	if (opts.transcode) {
		args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-sc_threshold", "0", "-force_key_frames", `expr:gte(t,n_forced*${hlsTime})`);
		if (!opts.removeAudio) args.push("-c:a", "aac", "-b:a", "128k");
	} else if (opts.removeAudio) args.push("-c:v", "copy");
	else args.push("-c", "copy");
	args.push("-avoid_negative_ts", "make_zero", "-max_muxing_queue_size", "9999", "-start_number", "0", "-hls_time", String(hlsTime), "-hls_list_size", "0", "-hls_playlist_type", "vod", "-hls_flags", "independent_segments", "-hls_segment_filename", hlsSegmentPattern(opts.outputM3u8), "-f", "hls", opts.outputM3u8);
	return args;
}
function buildThumbnailArgs(opts) {
	const args = ["-nostdin", "-y"];
	if (opts.seekSeconds > 0) args.push("-ss", String(Number(opts.seekSeconds.toFixed(3))));
	args.push("-i", opts.inputPath, "-frames:v", "1", "-an");
	if (!opts.thumbnail.original && opts.thumbnail.width && opts.thumbnail.height) args.push("-vf", `scale=${opts.thumbnail.width}:${opts.thumbnail.height}:flags=lanczos`);
	args.push("-q:v", "2", opts.outputPath);
	return args;
}
/** Human-facing command, matching the documented FFmpeg behavior. */
function formatDisplayCommand(opts) {
	const input = opts.inputName || "input.mp4";
	const out = `${opts.outputBase || "video"}.m3u8`;
	return `ffmpeg -i ${input} ${opts.removeAudio ? "-c copy -an" : "-c copy"} -start_number 0 -hls_time ${opts.hlsTime} -hls_list_size 0 -f hls ${out}`;
}
function formatDisplayThumbnailCommand(opts) {
	const input = opts.inputName || "input.mp4";
	const out = `${opts.outputBase || "video"}.jpg`;
	return `ffmpeg ${opts.seekSeconds > 0 ? `-ss ${Number(opts.seekSeconds.toFixed(3))} ` : ""}-i ${input} -frames:v 1 ${!opts.thumbnail.original && opts.thumbnail.width && opts.thumbnail.height ? `-vf scale=${opts.thumbnail.width}:${opts.thumbnail.height} ` : ""}-q:v 2 ${out}`.replace(/\s+/g, " ");
}
function parseTimestamp(value) {
	const m = value.match(/(\d+):(\d+):(\d+(?:\.\d+)?)/);
	if (!m) return null;
	return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}
function parseFfmpegProgress(chunk) {
	const durM = chunk.match(/Duration:\s*(\d+:\d+:\d+(?:\.\d+)?)/);
	const timeM = chunk.match(/time=\s*(\d+:\d+:\d+(?:\.\d+)?)/);
	return {
		duration: durM?.[1] ? parseTimestamp(durM[1]) ?? void 0 : void 0,
		time: timeM?.[1] ? parseTimestamp(timeM[1]) ?? void 0 : void 0
	};
}
function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1048576).toFixed(1)} MB`;
}
function formatDuration(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "";
	const s = Math.round(seconds);
	const m = Math.floor(s / 60);
	const r = s % 60;
	if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
	return `${m}:${String(r).padStart(2, "0")}`;
}
function estimateSegments(durationSec, hlsTime) {
	if (durationSec == null || !(durationSec > 0) || !(hlsTime > 0)) return null;
	return Math.max(1, Math.ceil(durationSec / hlsTime));
}
function zipContentDisposition(base) {
	const zipName = `${base}-hls.zip`;
	return `attachment; filename="${zipName.replace(/[^\w.-]+/g, "_")}"; filename*=UTF-8''${encodeURIComponent(zipName)}`;
}
function acceptAttr() {
	return ["video/*", ...[...ALLOWED_EXTENSIONS].map((ext) => `.${ext}`)].join(",");
}
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-danger",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-BdkFOASJ.css";
var APP_NAME = "Reelpack";
var Route$6 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#0c0d10"
			},
			{
				name: "description",
				content: "Convert video files to HLS. Remux to an M3U8 playlist and MPEG-TS segments, then download a ZIP."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "dark antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "min-h-dvh bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "dark",
					position: "bottom-center",
					toastOptions: { className: "!bg-elevated !text-fg !border-border !font-[inherit]" }
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter = () => import("./routes-CyBRQdKJ.mjs");
var Route$5 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
function env(key) {
	return process.env[key]?.trim() || void 0;
}
var jobs = /* @__PURE__ */ new Map();
var sweep = null;
function ffmpegBin() {
	return env("FFMPEG_PATH") || "ffmpeg";
}
function isServerless() {
	return Boolean(env("VERCEL") || env("VERCEL_ENV"));
}
async function probeFfmpeg() {
	if (isServerless()) return false;
	return await new Promise((resolve) => {
		const proc = spawn(ffmpegBin(), ["-version"], { stdio: "ignore" });
		const timer = setTimeout(() => {
			proc.kill("SIGKILL");
			resolve(false);
		}, 4e3);
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
			const afterDownload = job.downloadedAt !== null && now - job.downloadedAt > 6e4;
			if (expired || afterDownload) destroyJob(id);
		}
	}, 3e4);
	sweep.unref?.();
}
function publicStatus(job) {
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
		packedDurationSec: job.packedDurationSec
	};
}
async function destroyJob(id) {
	const job = jobs.get(id);
	if (!job) return;
	jobs.delete(id);
	try {
		job.proc?.kill("SIGKILL");
	} catch {}
	await rm(job.dir, {
		recursive: true,
		force: true
	}).catch(() => void 0);
}
function getJob(id) {
	const job = jobs.get(id);
	return job ? publicStatus(job) : null;
}
async function createJobFromForm(form) {
	if (isServerless()) throw Object.assign(/* @__PURE__ */ new Error("Server conversion is not available on this host."), { status: 503 });
	ensureSweep();
	const file = form.get("file");
	if (!(file instanceof File)) throw Object.assign(/* @__PURE__ */ new Error("Choose a video file to convert."), { status: 400 });
	const invalid = isAllowedVideo({
		name: file.name,
		type: file.type,
		size: file.size
	});
	if (invalid) throw Object.assign(new Error(invalid), { status: 400 });
	const outputBase = sanitizeBaseName(String(form.get("outputBase") ?? "") || file.name);
	const hlsTime = clampHlsTime(form.get("hlsTime"));
	const removeAudio = String(form.get("removeAudio") ?? "").toLowerCase() === "true";
	const sourceDurationSec = parseSourceDuration(form.get("sourceDuration"));
	const thumbnail = parseThumbnailSize({
		original: form.get("thumbnailOriginal"),
		width: form.get("thumbnailWidth"),
		height: form.get("thumbnailHeight")
	});
	thumbnail.seekSeconds = clampThumbSeek(form.get("thumbnailSeek"), sourceDurationSec);
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
	const job = {
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
		downloadedAt: null
	};
	jobs.set(id, job);
	convertJob(job);
	return publicStatus(job);
}
async function convertJob(job) {
	try {
		job.status = "converting";
		job.progress = .02;
		try {
			await packHls(job, false);
		} catch (copyErr) {
			const copyMsg = copyErr instanceof Error ? copyErr.message : "Stream copy failed.";
			const truncated = /only packed|playlist is only/i.test(copyMsg);
			job.usedTranscode = true;
			job.note = truncated ? "Stream copy stopped early on this file, so it was transcoded to H.264/AAC to keep the full length." : "Stream copy was not possible for this file, so it was transcoded to H.264/AAC.";
			job.progress = .05;
			await clearOutputDir(job);
			try {
				await packHls(job, true);
			} catch (transcodeErr) {
				const transcodeMsg = transcodeErr instanceof Error ? transcodeErr.message : "Transcode failed.";
				throw new Error(`${transcodeMsg} (stream copy also failed: ${copyMsg})`);
			}
		}
		job.progress = .9;
		await runThumbnail(job);
		try {
			const dim = jpegDimensions(new Uint8Array(await readFile(job.thumbPath)));
			if (dim) {
				job.thumbnailWidth = dim.width;
				job.thumbnailHeight = dim.height;
			}
		} catch {}
		job.status = "packaging";
		job.progress = .94;
		await zipOutput(job);
		job.status = "done";
		job.progress = 1;
	} catch (err) {
		job.status = "error";
		job.error = err instanceof Error ? err.message : "Conversion failed. Check that the file is a valid video.";
		job.proc = null;
	}
}
async function clearOutputDir(job) {
	const leftover = await readdir(job.outputDir).catch(() => []);
	await Promise.all(leftover.map((name) => rm(path.join(job.outputDir, name), { force: true }).catch(() => void 0)));
	job.packedDurationSec = null;
	job.segmentCount = 0;
}
function expectedDuration(job) {
	const vals = [job.durationSec, job.sourceDurationSec].filter((n) => n != null && n > 0);
	return vals.length ? Math.max(...vals) : null;
}
async function readPackedDuration(job) {
	const playlistPath = path.join(job.outputDir, job.playlistName);
	return playlistMediaDuration(await readFile(playlistPath, "utf8"));
}
async function packHls(job, transcode) {
	await runHls(job, transcode);
	const packed = await readPackedDuration(job).catch(() => 0);
	job.packedDurationSec = packed;
	const expected = expectedDuration(job);
	if (packLooksTruncated(expected, packed)) throw new Error(`HLS playlist is only ${packed.toFixed(1)}s of a ${expected?.toFixed(1)}s video.`);
}
function runHls(job, transcode) {
	const outputM3u8 = path.join(job.outputDir, `${job.outputBase}.m3u8`);
	const args = buildFfmpegArgs({
		inputPath: job.inputPath,
		outputM3u8,
		hlsTime: job.hlsTime,
		removeAudio: job.removeAudio,
		transcode
	});
	return new Promise((resolve, reject) => {
		const proc = spawn(ffmpegBin(), args, { stdio: [
			"ignore",
			"ignore",
			"pipe"
		] });
		job.proc = proc;
		let errLog = "";
		const timer = setTimeout(() => {
			proc.kill("SIGKILL");
			reject(/* @__PURE__ */ new Error("Conversion timed out. Try a shorter file."));
		}, FFMPEG_TIMEOUT_MS);
		proc.stderr?.on("data", (buf) => {
			const chunk = buf.toString("utf8");
			errLog += chunk;
			if (errLog.length > 12e3) errLog = errLog.slice(-6e3);
			const parsed = parseFfmpegProgress(chunk);
			if (parsed.duration && parsed.duration > 0) job.durationSec = Math.max(job.durationSec ?? 0, parsed.duration);
			if (parsed.time != null && job.durationSec && job.durationSec > 0) {
				const ratio = Math.min(.88, parsed.time / job.durationSec);
				job.progress = transcode ? .05 + ratio * .8 : Math.max(.05, ratio);
			}
		});
		proc.on("error", (e) => {
			clearTimeout(timer);
			job.proc = null;
			reject(new Error(e.message.includes("ENOENT") ? "FFmpeg is not installed on the server." : e.message));
		});
		proc.on("close", (code) => {
			clearTimeout(timer);
			job.proc = null;
			if (code === 0) {
				job.progress = Math.max(job.progress, .88);
				resolve();
			} else reject(new Error(summarizeFfmpegError(errLog, code)));
		});
	});
}
function runThumbnail(job) {
	const args = buildThumbnailArgs({
		inputPath: job.inputPath,
		outputPath: job.thumbPath,
		seekSeconds: clampThumbSeek(job.thumbnail.seekSeconds, expectedDuration(job) ?? job.durationSec),
		thumbnail: job.thumbnail
	});
	return new Promise((resolve, reject) => {
		const proc = spawn(ffmpegBin(), args, { stdio: [
			"ignore",
			"ignore",
			"pipe"
		] });
		job.proc = proc;
		let errLog = "";
		const timer = setTimeout(() => {
			proc.kill("SIGKILL");
			reject(/* @__PURE__ */ new Error("Thumbnail timed out. Try converting again."));
		}, THUMB_TIMEOUT_MS);
		proc.stderr?.on("data", (buf) => {
			errLog += buf.toString("utf8");
			if (errLog.length > 8e3) errLog = errLog.slice(-4e3);
		});
		proc.on("error", (e) => {
			clearTimeout(timer);
			job.proc = null;
			reject(new Error(e.message.includes("ENOENT") ? "FFmpeg is not installed on the server." : e.message));
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
				job.progress = .93;
				resolve();
			} else reject(/* @__PURE__ */ new Error(`Could not generate a thumbnail. ${summarizeFfmpegError(errLog, code)}`));
		});
	});
}
function summarizeFfmpegError(log, code) {
	const useful = [...log.split("\n").map((l) => l.trim()).filter(Boolean)].reverse().find((l) => /error|invalid|failed|unsupported|does not contain/i.test(l));
	if (useful) return useful.replace(/^\[.*?\]\s*/, "").slice(0, 280);
	return `FFmpeg could not convert this file (exit ${code ?? "unknown"}).`;
}
async function zipOutput(job) {
	const media = (await readdir(job.outputDir)).filter((n) => n.endsWith(".m3u8") || n.endsWith(".ts") || n.endsWith(".m4s") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png"));
	job.segmentCount = media.filter((n) => n.endsWith(".ts") || n.endsWith(".m4s")).length;
	if (!media.some((n) => n.endsWith(".m3u8"))) throw new Error("FFmpeg finished but did not produce a playlist.");
	if (!media.some((n) => n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png"))) throw new Error("FFmpeg finished but did not produce a thumbnail.");
	const playlistFile = media.find((n) => n.endsWith(".m3u8"));
	if (playlistFile) job.packedDurationSec = playlistMediaDuration(await readFile(path.join(job.outputDir, playlistFile), "utf8"));
	const entries = {};
	for (const name of media) entries[name] = new Uint8Array(await readFile(path.join(job.outputDir, name)));
	const zipped = zipSync(entries, { level: 0 });
	await writeFile(job.zipPath, zipped);
}
async function openZipResponse(id) {
	const job = jobs.get(id);
	if (!job) return Response.json({ error: "This conversion is no longer available." }, { status: 404 });
	if (job.status !== "done") return Response.json({ error: "Conversion is not finished yet." }, { status: 409 });
	try {
		await stat(job.zipPath);
	} catch {
		return Response.json({ error: "The package is missing. Convert again." }, { status: 410 });
	}
	job.downloadedAt = Date.now();
	const nodeStream = createReadStream(job.zipPath);
	const webStream = Readable.toWeb(nodeStream);
	return new Response(webStream, { headers: {
		"Content-Type": "application/zip",
		"Content-Disposition": zipContentDisposition(job.outputBase),
		"Cache-Control": "no-store"
	} });
}
async function openThumbnailResponse(id) {
	const job = jobs.get(id);
	if (!job) return Response.json({ error: "This conversion is no longer available." }, { status: 404 });
	if (job.status !== "done") return Response.json({ error: "Conversion is not finished yet." }, { status: 409 });
	try {
		await stat(job.thumbPath);
	} catch {
		return Response.json({ error: "The thumbnail is missing. Convert again." }, { status: 410 });
	}
	const nodeStream = createReadStream(job.thumbPath);
	const webStream = Readable.toWeb(nodeStream);
	const fallback = `${job.outputBase}.jpg`.replace(/[^\w.-]+/g, "_");
	return new Response(webStream, { headers: {
		"Content-Type": "image/jpeg",
		"Content-Disposition": `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(`${job.outputBase}.jpg`)}`,
		"Cache-Control": "no-store"
	} });
}
function jsonError(err) {
	const status = typeof err === "object" && err && "status" in err ? Number(err.status) || 500 : 500;
	const message = err instanceof Error ? err.message : "Unexpected server error.";
	return Response.json({ error: message }, { status });
}
function tooLargeResponse() {
	return Response.json({ error: `File is too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / 1048576)} MB.` }, { status: 413 });
}
var Route$4 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => {
	const ffmpeg = await probeFfmpeg();
	return Response.json({
		ffmpeg,
		maxUploadBytes: MAX_UPLOAD_BYTES
	});
} } } });
var Route$3 = createFileRoute("/api/jobs")({ server: { handlers: { POST: async ({ request }) => {
	if (Number(request.headers.get("content-length") || 0) > 211812352) return tooLargeResponse();
	try {
		const job = await createJobFromForm(await request.formData());
		return Response.json(job, { status: 201 });
	} catch (err) {
		return jsonError(err);
	}
} } } });
var Route$2 = createFileRoute("/api/jobs/$id")({ server: { handlers: {
	GET: async ({ params }) => {
		const job = getJob(params.id);
		if (!job) return Response.json({ error: "This conversion is no longer available." }, { status: 404 });
		return Response.json(job);
	},
	DELETE: async ({ params }) => {
		await destroyJob(params.id);
		return new Response(null, { status: 204 });
	}
} } });
var Route$1 = createFileRoute("/api/jobs/$id/download")({ server: { handlers: { GET: async ({ params }) => {
	return openZipResponse(params.id);
} } } });
var Route = createFileRoute("/api/jobs/$id/thumbnail")({ server: { handlers: { GET: async ({ params }) => {
	return openThumbnailResponse(params.id);
} } } });
var IndexRoute = Route$5.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$6
});
var ApiHealthRoute = Route$4.update({
	id: "/api/health",
	path: "/api/health",
	getParentRoute: () => Route$6
});
var ApiJobsRoute = Route$3.update({
	id: "/api/jobs",
	path: "/api/jobs",
	getParentRoute: () => Route$6
});
var ApiJobsIdRoute = Route$2.update({
	id: "/$id",
	path: "/$id",
	getParentRoute: () => ApiJobsRoute
});
var ApiJobsIdRouteChildren = {
	ApiJobsIdDownloadRoute: Route$1.update({
		id: "/download",
		path: "/download",
		getParentRoute: () => ApiJobsIdRoute
	}),
	ApiJobsIdThumbnailRoute: Route.update({
		id: "/thumbnail",
		path: "/thumbnail",
		getParentRoute: () => ApiJobsIdRoute
	})
};
var ApiJobsRouteChildren = { ApiJobsIdRoute: ApiJobsIdRoute._addFileChildren(ApiJobsIdRouteChildren) };
var rootRouteChildren = {
	IndexRoute,
	ApiHealthRoute,
	ApiJobsRoute: ApiJobsRoute._addFileChildren(ApiJobsRouteChildren)
};
var routeTree = Route$6._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { stripExtension as C, sanitizeBaseName as S, thumbnailSizeOptions as T, jpegDimensions as _, buildFfmpegArgs as a, parseFfmpegProgress as b, clampThumbSeek as c, formatBytes as d, formatDisplayCommand as f, isAllowedVideo as g, formatThumbTime as h, acceptAttr as i, estimateSegments as l, formatDuration as m, buildThumbnailArgs as o, formatDisplayThumbnailCommand as p, clampHlsTime as s, router_exports as t, extOf as u, maxThumbSeek as v, thumbnailSeekSeconds as w, playlistMediaDuration as x, packLooksTruncated as y };
