import { createFileRoute } from "@tanstack/react-router";
import { HlsConverter } from "@/components/hls-converter";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <HlsConverter />;
}
