"use client";
import { useState } from "react";
import { useReveal } from "@/lib/useReveal";
export default function LandingMotion({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useReveal();
  return <div ref={ref}>{children}</div>;
}
export function MotionPauseButton() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="motion-control">
      <button
        type="button"
        aria-pressed={paused}
        onClick={(event) => {
          const next = !paused;
          setPaused(next);
          const root =
            event.currentTarget.closest<HTMLElement>("[data-motion]");
          if (root) {
            root.dataset.paused = String(next);
            root.dispatchEvent(new Event("motion-pause"));
          }
        }}
      >
        {paused ? "Reia demonstrația" : "Pune demonstrația pe pauză"}
      </button>
    </div>
  );
}
