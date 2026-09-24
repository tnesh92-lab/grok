import { createFileRoute } from "@tanstack/react-router";
import { openThumbnailResponse } from "@/lib/convert/jobs.server";

export const Route = createFileRoute("/api/jobs/$id/thumbnail")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        return openThumbnailResponse(params.id);
      },
    },
  },
});
