import { createFileRoute } from "@tanstack/react-router";
import { MAX_UPLOAD_BYTES } from "@/lib/convert/shared";
import {
  createJobFromForm,
  jsonError,
  tooLargeResponse,
} from "@/lib/convert/jobs.server";

export const Route = createFileRoute("/api/jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const length = Number(request.headers.get("content-length") || 0);
        if (length > MAX_UPLOAD_BYTES + 2 * 1024 * 1024) {
          return tooLargeResponse();
        }
        try {
          const form = await request.formData();
          const job = await createJobFromForm(form);
          return Response.json(job, { status: 201 });
        } catch (err) {
          return jsonError(err);
        }
      },
    },
  },
});
