"use client";

import dynamic from "next/dynamic";

/**
 * The board route (`/canvas`).
 * The board reads its saved state from localStorage on first render, so it is
 * rendered on the client only to avoid hydration mismatches.
 */
const Board = dynamic(() => import("@/components/features/board/Board"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-[#f6f7f9]">
      <div className="size-8 animate-spin rounded-full border-[3px] border-[#dfe3ff] border-t-[#4262ff]" />
    </div>
  ),
});

export default function CanvasPage() {
  return <Board />;
}
