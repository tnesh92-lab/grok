import { t as zipSync } from "../_libs/fflate.mjs";
import { _ as jpegDimensions, a as buildFfmpegArgs, b as parseFfmpegProgress, o as buildThumbnailArgs, u as extOf, w as thumbnailSeekSeconds, x as playlistMediaDuration, y as packLooksTruncated } from "./router-DLIC8ZH1.mjs";
import { t as FFmpeg } from "../_libs/ffmpeg__ffmpeg.mjs";
import { n as toBlobURL, t as fetchFile } from "../_libs/ffmpeg__util.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-engine-BVBooeEg.js
var worker_default = "/assets/worker-BzdDEeh7.js";
var ffmpegInstance = null;
var loadPromise = null;
var CORE_BASE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
async function getFfmpeg(onProgress) {
	if (ffmpegInstance?.loaded) return ffmpegInstance;
	if (loadPromise) return loadPromise;
	onProgress({
		stage: "Loading FFmpeg in your browser",
		ratio: .02
	});
	loadPromise = (async () => {
		const ff = new FFmpeg();
		await ff.load({
			classWorkerURL: worker_default,
			coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
			wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm")
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
		throw new Error(`Could not load FFmpeg in the browser (${message}). Check your connection and try again.`);
	}
}
function stripFfmpegPrefix(args) {
	const next = [...args];
	while (next[0] === "-nostdin" || next[0] === "-y") next.shift();
	return next;
}
async function execWithLogs(ffmpeg, args, onLog) {
	let lastLog = "";
	const handler = ({ message }) => {
		lastLog = message;
		onLog?.(message);
	};
	ffmpeg.on("log", handler);
	try {
		if (await ffmpeg.exec(args) !== 0) throw new Error(lastLog ? `FFmpeg could not convert this file in the browser: ${lastLog.slice(0, 180)}` : "FFmpeg could not convert this file in the browser.");
	} finally {
		ffmpeg.off("log", handler);
	}
}
async function execHls(ffmpeg, opts) {
	const args = stripFfmpegPrefix(buildFfmpegArgs({
		inputPath: opts.inputName,
		outputM3u8: opts.outputM3u8,
		hlsTime: opts.hlsTime,
		removeAudio: opts.removeAudio,
		transcode: opts.transcode
	}));
	let duration = null;
	await execWithLogs(ffmpeg, args, (message) => {
		const parsed = parseFfmpegProgress(message);
		if (parsed.duration) duration = parsed.duration;
		if (parsed.time != null && duration && duration > 0) {
			const ratio = Math.min(.86, parsed.time / duration);
			opts.onProgress({
				stage: opts.transcode ? "Transcoding to HLS" : "Packing HLS segments",
				ratio: opts.transcode ? .08 + ratio * .74 : Math.max(.1, ratio)
			});
		}
	});
}
function isSegmentFor(name, outputBase) {
	if (!name.startsWith(outputBase) || !name.endsWith(".ts")) return false;
	const mid = name.slice(outputBase.length, -3);
	return /^\d+$/.test(mid);
}
async function readZip(ffmpeg, outputBase) {
	const names = (await ffmpeg.listDir("/")).map((entry) => "name" in entry ? String(entry.name) : "").filter(Boolean);
	const playlistName = `${outputBase}.m3u8`;
	const thumbnailName = `${outputBase}.jpg`;
	if (!names.includes(playlistName)) throw new Error("FFmpeg finished but did not produce a playlist.");
	if (!names.includes(thumbnailName)) throw new Error("FFmpeg finished but did not produce a thumbnail.");
	const playlistRaw = await ffmpeg.readFile(playlistName);
	const thumbRaw = await ffmpeg.readFile(thumbnailName);
	if (typeof playlistRaw === "string" || typeof thumbRaw === "string") throw new Error("FFmpeg finished but an output file was unreadable.");
	const playlistText = new TextDecoder().decode(playlistRaw);
	const packedDurationSec = playlistMediaDuration(playlistText);
	const entries = {
		[playlistName]: playlistRaw,
		[thumbnailName]: thumbRaw
	};
	let segmentCount = 0;
	for (const name of names) {
		if (!isSegmentFor(name, outputBase)) continue;
		const data = await ffmpeg.readFile(name);
		if (typeof data === "string") continue;
		entries[name] = data;
		segmentCount += 1;
	}
	if (segmentCount === 0) throw new Error("FFmpeg finished but did not produce HLS segments.");
	const zipped = zipSync(entries, { level: 0 });
	return {
		blob: new Blob([zipped], { type: "application/zip" }),
		segmentCount,
		playlistName,
		thumbnailName,
		thumbnailBlob: new Blob([Uint8Array.from(thumbRaw)], { type: "image/jpeg" }),
		packedDurationSec
	};
}
async function deleteMatching(ffmpeg, predicate) {
	try {
		const listing = await ffmpeg.listDir("/");
		for (const entry of listing) {
			const name = "name" in entry ? String(entry.name) : "";
			if (!name || !predicate(name)) continue;
			try {
				await ffmpeg.deleteFile(name);
			} catch {}
		}
	} catch {}
}
async function cleanupMemfs(ffmpeg) {
	await deleteMatching(ffmpeg, (name) => name !== "." && name !== "..");
}
async function readMemfsPlaylistDuration(ffmpeg, playlistName) {
	const raw = await ffmpeg.readFile(playlistName);
	const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
	return playlistMediaDuration(text);
}
async function packClientHls(ffmpeg, opts) {
	await execHls(ffmpeg, opts);
	const packedSec = await readMemfsPlaylistDuration(ffmpeg, opts.outputM3u8).catch(() => 0);
	if (packLooksTruncated(opts.sourceDurationSec, packedSec)) throw new Error(`HLS playlist is only ${packedSec.toFixed(1)}s of a ${Number(opts.sourceDurationSec).toFixed(1)}s video.`);
	return packedSec;
}
async function runClientConversion(file, options, onProgress) {
	const ffmpeg = await getFfmpeg(onProgress);
	const inputName = `__src.${extOf(file.name) || "mp4"}`;
	const outputM3u8 = `${options.outputBase}.m3u8`;
	const thumbName = `${options.outputBase}.jpg`;
	onProgress({
		stage: "Reading video",
		ratio: .06
	});
	await cleanupMemfs(ffmpeg);
	await ffmpeg.writeFile(inputName, await fetchFile(file));
	let usedTranscode = false;
	let note = null;
	try {
		onProgress({
			stage: "Packing HLS segments",
			ratio: .1
		});
		await packClientHls(ffmpeg, {
			...options,
			transcode: false,
			onProgress,
			inputName,
			outputM3u8
		});
	} catch (copyErr) {
		const copyMsg = copyErr instanceof Error ? copyErr.message : "";
		const truncated = /only packed|playlist is only/i.test(copyMsg);
		usedTranscode = true;
		note = truncated ? "Stream copy stopped early on this file, so it was transcoded to H.264/AAC to keep the full length." : "Stream copy was not possible for this file, so it was transcoded to H.264/AAC.";
		await deleteMatching(ffmpeg, (name) => name === outputM3u8 || isSegmentFor(name, options.outputBase));
		onProgress({
			stage: "Transcoding to HLS",
			ratio: .08
		});
		await packClientHls(ffmpeg, {
			...options,
			transcode: true,
			onProgress,
			inputName,
			outputM3u8
		});
	}
	onProgress({
		stage: "Grabbing thumbnail",
		ratio: .9
	});
	await execWithLogs(ffmpeg, stripFfmpegPrefix(buildThumbnailArgs({
		inputPath: inputName,
		outputPath: thumbName,
		seekSeconds: options.thumbnail.seekSeconds ?? thumbnailSeekSeconds(null),
		thumbnail: options.thumbnail
	})));
	onProgress({
		stage: "Building ZIP",
		ratio: .94
	});
	const packed = await readZip(ffmpeg, options.outputBase);
	await cleanupMemfs(ffmpeg);
	onProgress({
		stage: "Done",
		ratio: 1
	});
	const dim = jpegDimensions(new Uint8Array(await packed.thumbnailBlob.arrayBuffer()));
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
		packedDurationSec: packed.packedDurationSec
	};
}
//#endregion
export { runClientConversion };
