import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readdir, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildFfmpegArgs, buildThumbnailArgs, playlistMediaDuration } from "./shared.ts";

function run(cmd: string, args: string[], timeoutMs = 60_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("timed out"));
    }, timeoutMs);
    proc.stderr?.on("data", (buf: Buffer) => {
      err += buf.toString("utf8");
    });
    proc.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(err.slice(-500) || `exit ${code}`));
    });
  });
}

async function makeSource(input: string, size = "256x144", duration = 2): Promise<void> {
  await run("ffmpeg", [
    "-f",
    "lavfi",
    "-i",
    `testsrc=duration=${duration}:size=${size}:rate=15`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=440:duration=${duration}`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-g",
    "15",
    "-c:a",
    "aac",
    "-shortest",
    "-y",
    input,
  ]);
}

describe("real ffmpeg HLS pack", { timeout: 90_000 }, () => {
  it("writes MyVideo.m3u8 plus .ts segments from MyVideo.mp4", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "reelpack-ff-"));
    try {
      const input = path.join(dir, "source.mp4");
      const outputDir = path.join(dir, "out");
      await mkdir(outputDir, { recursive: true });
      await makeSource(input);

      const outputM3u8 = path.join(outputDir, "MyVideo.m3u8");
      const args = buildFfmpegArgs({
        inputPath: input,
        outputM3u8,
        hlsTime: 1,
        removeAudio: false,
        transcode: false,
      });
      await run("ffmpeg", args);

      const names = await readdir(outputDir);
      assert.ok(names.includes("MyVideo.m3u8"), `playlist missing, got ${names.join(",")}`);
      const segments = names.filter((n) => n.endsWith(".ts"));
      assert.ok(segments.length >= 1, "expected at least one .ts segment");
      assert.ok(
        segments.every((n) => n.startsWith("MyVideo")),
        `segments should use original base name, got ${segments.join(",")}`,
      );
      const playlist = await readFile(outputM3u8, "utf8");
      assert.match(playlist, /#EXTM3U/);
      assert.match(playlist, /MyVideo\d+\.ts/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("strips audio when -an is set", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "reelpack-an-"));
    try {
      const input = path.join(dir, "source.mp4");
      const outputDir = path.join(dir, "out");
      await mkdir(outputDir, { recursive: true });
      await makeSource(input);

      const outputM3u8 = path.join(outputDir, "Silent.m3u8");
      const args = buildFfmpegArgs({
        inputPath: input,
        outputM3u8,
        hlsTime: 5,
        removeAudio: true,
        transcode: false,
      });
      assert.ok(args.includes("-an"));
      await run("ffmpeg", args);

      const playlist = await readFile(outputM3u8, "utf8");
      assert.match(playlist, /#EXTM3U/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("keeps the full length of a 15s clip at hls_time 5", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "reelpack-dur-"));
    try {
      const input = path.join(dir, "source.mp4");
      const outputDir = path.join(dir, "out");
      await mkdir(outputDir, { recursive: true });
      await makeSource(input, "256x144", 15);

      const outputM3u8 = path.join(outputDir, "FullClip.m3u8");
      const args = buildFfmpegArgs({
        inputPath: input,
        outputM3u8,
        hlsTime: 5,
        removeAudio: false,
        transcode: false,
      });
      await run("ffmpeg", args);

      const playlist = await readFile(outputM3u8, "utf8");
      const packed = playlistMediaDuration(playlist);
      assert.ok(packed >= 14.5, `expected ~15s, got ${packed}s\n${playlist}`);
      const segments = (await readdir(outputDir)).filter((n) => n.endsWith(".ts"));
      assert.ok(segments.length >= 3, `expected 3+ segments, got ${segments.join(",")}`);
      assert.match(playlist, /#EXT-X-PLAYLIST-TYPE:VOD/);
      assert.match(playlist, /#EXT-X-ENDLIST/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("writes a jpeg thumbnail at original and scaled sizes", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "reelpack-thumb-"));
    try {
      const input = path.join(dir, "source.mp4");
      await makeSource(input, "320x180");

      const original = path.join(dir, "MyVideo.jpg");
      await run(
        "ffmpeg",
        buildThumbnailArgs({
          inputPath: input,
          outputPath: original,
          seekSeconds: 0.2,
          thumbnail: { original: true, width: 0, height: 0 },
        }),
      );
      const origBytes = await readFile(original);
      assert.equal(origBytes[0], 0xff);
      assert.equal(origBytes[1], 0xd8);

      const scaled = path.join(dir, "Small.jpg");
      await run(
        "ffmpeg",
        buildThumbnailArgs({
          inputPath: input,
          outputPath: scaled,
          seekSeconds: 0.2,
          thumbnail: { original: false, width: 160, height: 90 },
        }),
      );
      const scaledBytes = await readFile(scaled);
      assert.equal(scaledBytes[0], 0xff);
      assert.equal(scaledBytes[1], 0xd8);
      assert.ok(scaledBytes.length > 32);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
