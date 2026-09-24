import { createFileRoute } from "@tanstack/react-router";
import { destroyJob, getJob } from "@/lib/convert/jobs.server";

export const Route = createFileRoute("/api/jobs/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const job = getJob(params.id);
        if (!job) {
          return Response.json(
            { error: "This conversion is no longer available." },
            { status: 404 },
          );
        }
        return Response.json(job);
      },
      DELETE: async ({ params }) => {
        await destroyJob(params.id);
        return new Response(null, { status: 204 });
      },
    },
  },
});
