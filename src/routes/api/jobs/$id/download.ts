import { createFileRoute } from "@tanstack/react-router";
import { openZipResponse } from "@/lib/convert/jobs.server";

export const Route = createFileRoute("/api/jobs/$id/download")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        return openZipResponse(params.id);
      },
    },
  },
});
