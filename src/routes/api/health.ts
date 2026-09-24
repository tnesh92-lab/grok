import { createFileRoute } from "@tanstack/react-router";
import { MAX_UPLOAD_BYTES } from "@/lib/convert/shared";
import { probeFfmpeg } from "@/lib/convert/jobs.server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const ffmpeg = await probeFfmpeg();
        return Response.json({
          ffmpeg,
          maxUploadBytes: MAX_UPLOAD_BYTES,
        });
      },
    },
  },
});
