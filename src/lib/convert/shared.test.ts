import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildFfmpegArgs,
  buildThumbnailArgs,
  clampHlsTime,
  estimateSegments,
  formatDisplayCommand,
  formatDisplayThumbnailCommand,
  HLS_TIME_DEFAULT,
  hlsSegmentPattern,
  isAllowedVideo,
  parseThumbnailSize,
  jpegDimensions,
  packLooksTruncated,
  playlistMediaDuration,
  clampThumbSeek,
  formatThumbTime,
  sanitizeBaseName,
  stripExtension,
  thumbnailSizeOptions,
  zipContentDisposition,
} from "./shared.ts";

describe("sanitizeBaseName", () => {
  it("keeps the original filename without extension", () => {
    assert.equal(sanitizeBaseName("MyVideo.mp4"), "MyVideo");
  });

  it("strips path segments and illegal characters", () => {
    assert.equal(sanitizeBaseName("../../etc/passwd.mp4"), "passwd");
    assert.equal(sanitizeBaseName("folder/My Video.mp4"), "My Video");
    assert.equal(sanitizeBaseName("c:d*e?.mov"), "cde");
  });

  it("falls back when the name is empty after cleaning", () => {
    assert.equal(sanitizeBaseName("..."), "video");
    assert.equal(sanitizeBaseName(""), "video");
  });
});

describe("stripExtension", () => {
  it("removes the last extension", () => {
    assert.equal(stripExtension("clip.final.mp4"), "clip.final");
  });
});

describe("clampHlsTime", () => {
  it("defaults, clamps, and rounds", () => {
    assert.equal(clampHlsTime("nope"), HLS_TIME_DEFAULT);
    assert.equal(clampHlsTime(0), 1);
    assert.equal(clampHlsTime(99), 30);
    assert.equal(clampHlsTime(5.4), 5);
  });
});

describe("isAllowedVideo", () => {
  it("rejects empty, oversized, and non-video types", () => {
    assert.equal(
      isAllowedVideo({ name: "a.mp4", type: "video/mp4", size: 0 }),
      "The file is empty.",
    );
    assert.match(
      isAllowedVideo({ name: "a.mp4", type: "video/mp4", size: 300 * 1024 * 1024 }) ?? "",
      /too large/i,
    );
    assert.match(
      isAllowedVideo({ name: "notes.pdf", type: "application/pdf", size: 12 }) ?? "",
      /Unsupported format/,
    );
  });

  it("accepts a typical mp4", () => {
    assert.equal(
      isAllowedVideo({ name: "MyVideo.mp4", type: "video/mp4", size: 1024 }),
      null,
    );
  });
});

describe("buildFfmpegArgs", () => {
  it("stream-copies and keeps audio by default", () => {
    const args = buildFfmpegArgs({
      inputPath: "in.mp4",
      outputM3u8: "MyVideo.m3u8",
      hlsTime: 5,
      removeAudio: false,
      transcode: false,
    });
    assert.equal(args[args.indexOf("-i") + 1], "in.mp4");
    assert.equal(args[args.indexOf("-c") + 1], "copy");
    assert.equal(args[args.indexOf("-hls_time") + 1], "5");
    assert.equal(args[args.indexOf("-hls_list_size") + 1], "0");
    assert.equal(args[args.indexOf("-hls_playlist_type") + 1], "vod");
    assert.equal(args[args.indexOf("-start_number") + 1], "0");
    assert.ok(args.includes("0:v:0"));
    assert.equal(args.at(-2), "hls");
    assert.equal(args.at(-1), "MyVideo.m3u8");
    assert.equal(args[args.indexOf("-hls_segment_filename") + 1], "MyVideo%d.ts");
  });

  it("adds -an when removing audio", () => {
    const args = buildFfmpegArgs({
      inputPath: "in.mp4",
      outputM3u8: "out.m3u8",
      hlsTime: 5,
      removeAudio: true,
      transcode: false,
    });
    assert.ok(args.includes("-an"));
    assert.ok(args.includes("-c:v"));
  });

  it("forces keyframes at hls_time when transcoding", () => {
    const args = buildFfmpegArgs({
      inputPath: "in.mp4",
      outputM3u8: "out.m3u8",
      hlsTime: 5,
      removeAudio: false,
      transcode: true,
    });
    assert.equal(
      args[args.indexOf("-force_key_frames") + 1],
      "expr:gte(t,n_forced*5)",
    );
  });
});

describe("playlist duration", () => {
  it("sums EXTINF entries", () => {
    const playlist = `#EXTM3U
#EXTINF:5.000000,
a0.ts
#EXTINF:5.000000,
a1.ts
#EXTINF:5.000000,
a2.ts
#EXT-X-ENDLIST
`;
    assert.equal(playlistMediaDuration(playlist), 15);
    assert.equal(packLooksTruncated(15, 5), true);
    assert.equal(packLooksTruncated(15, 15), false);
    assert.equal(packLooksTruncated(15, 14.5), false);
  });
});

describe("formatDisplayCommand", () => {
  it("matches the documented ffmpeg command", () => {
    assert.equal(
      formatDisplayCommand({
        inputName: "MyVideo.mp4",
        outputBase: "MyVideo",
        hlsTime: 5,
        removeAudio: false,
      }),
      "ffmpeg -i MyVideo.mp4 -c copy -start_number 0 -hls_time 5 -hls_list_size 0 -f hls MyVideo.m3u8",
    );
    assert.match(
      formatDisplayCommand({
        inputName: "MyVideo.mp4",
        outputBase: "MyVideo",
        hlsTime: 5,
        removeAudio: true,
      }),
      /-c copy -an/,
    );
  });
});

describe("thumbnail sizes", () => {
  it("defaults to original video size", () => {
    const opts = thumbnailSizeOptions(1920, 1080);
    assert.equal(opts[0]?.original, true);
    assert.equal(opts[0]?.width, 1920);
    assert.equal(opts[0]?.height, 1080);
    assert.match(opts[0]?.label ?? "", /Original/);
  });

  it("offers smaller sizes that keep the source ratio", () => {
    const opts = thumbnailSizeOptions(1920, 1080);
    const scaled = opts.filter((o) => !o.original);
    assert.ok(scaled.length >= 1);
    for (const opt of scaled) {
      assert.ok(opt.width < 1920);
      assert.equal(opt.width % 2, 0);
      assert.equal(opt.height % 2, 0);
      const src = 1920 / 1080;
      const got = opt.width / opt.height;
      assert.ok(Math.abs(src - got) < 0.05, `ratio drifted for ${opt.width}x${opt.height}`);
    }
    assert.ok(scaled.some((o) => o.width === 1280 && o.height === 720));
  });

  it("keeps portrait orientation", () => {
    const opts = thumbnailSizeOptions(1080, 1920);
    assert.equal(opts[0]?.width, 1080);
    assert.equal(opts[0]?.height, 1920);
    for (const opt of opts) {
      if (opt.original || !opt.width) continue;
      assert.ok(opt.height > opt.width);
    }
  });

  it("parses original vs scaled form values", () => {
    assert.deepEqual(parseThumbnailSize({ original: "true", width: 1280, height: 720 }), {
      original: true,
      width: 0,
      height: 0,
    });
    assert.deepEqual(parseThumbnailSize({ original: "false", width: 1280, height: 720 }), {
      original: false,
      width: 1280,
      height: 720,
    });
  });

  it("reads width and height from a jpeg SOF marker", () => {
    const jpeg = Uint8Array.from([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x01, 0x68, 0x02, 0x80, 0x03, 0x01, 0x22, 0x00,
    ]);
    assert.deepEqual(jpegDimensions(jpeg), { width: 640, height: 360 });
    assert.equal(jpegDimensions(new Uint8Array([0x00, 0x01])), null);
  });
});

describe("thumbnail seek", () => {
  it("defaults near the start and stays inside the clip", () => {
    assert.equal(clampThumbSeek("", 15), 1);
    assert.equal(clampThumbSeek(3.27, 15), 3.3);
    assert.equal(clampThumbSeek(99, 15), 15);
    assert.equal(clampThumbSeek(-4, 15), 1);
    assert.equal(clampThumbSeek(0, 15), 0);
  });

  it("formats the chosen second", () => {
    assert.equal(formatThumbTime(3.5), "3.5s");
    assert.equal(formatThumbTime(75.2), "1:15.2");
  });
});

describe("buildThumbnailArgs", () => {
  it("grabs a jpeg at original size by default", () => {
    const args = buildThumbnailArgs({
      inputPath: "in.mp4",
      outputPath: "MyVideo.jpg",
      seekSeconds: 1,
      thumbnail: { original: true, width: 0, height: 0 },
    });
    assert.ok(args.includes("-ss"));
    assert.ok(args.includes("-frames:v"));
    assert.ok(!args.includes("-vf"));
    assert.equal(args.at(-1), "MyVideo.jpg");
  });

  it("scales when a size is selected", () => {
    const args = buildThumbnailArgs({
      inputPath: "in.mp4",
      outputPath: "MyVideo.jpg",
      seekSeconds: 0,
      thumbnail: { original: false, width: 1280, height: 720 },
    });
    assert.ok(!args.includes("-ss"));
    assert.equal(args[args.indexOf("-vf") + 1], "scale=1280:720:flags=lanczos");
  });
});

describe("formatDisplayThumbnailCommand", () => {
  it("shows the thumbnail ffmpeg command", () => {
    assert.match(
      formatDisplayThumbnailCommand({
        inputName: "MyVideo.mp4",
        outputBase: "MyVideo",
        seekSeconds: 1,
        thumbnail: { original: true, width: 0, height: 0 },
      }),
      /ffmpeg -ss 1 -i MyVideo\.mp4 -frames:v 1 -q:v 2 MyVideo\.jpg/,
    );
  });
});

describe("helpers", () => {
  it("builds segment patterns and zip names", () => {
    assert.equal(hlsSegmentPattern("/tmp/out/Show.m3u8"), "/tmp/out/Show%d.ts");
    assert.match(zipContentDisposition("My Video"), /My%20Video-hls\.zip/);
  });

  it("estimates segment counts", () => {
    assert.equal(estimateSegments(12, 5), 3);
    assert.equal(estimateSegments(null, 5), null);
  });
});
