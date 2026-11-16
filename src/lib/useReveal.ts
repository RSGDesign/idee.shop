"use client";
import { useEffect, useRef } from "react";

/** Progressive enhancement: SSR/no JS and reduced motion always show final content. */
export function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const targets = [
      ...root.querySelectorAll<HTMLElement>("[data-reveal], [data-demo]"),
    ];
    let observer: IntersectionObserver | undefined;
    const sync = () => {
      const reduced = media.matches || !("IntersectionObserver" in window);
      root.dataset.motion = reduced ? "reduced" : "enabled";
      for (const target of targets)
        target.dataset.running = String(
          !reduced &&
            !document.hidden &&
            target.dataset.visible === "true" &&
            root.dataset.paused !== "true",
        );
    };
    const setup = () => {
      observer?.disconnect();
      if (!media.matches && "IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const node = entry.target as HTMLElement;
              node.dataset.visible = String(entry.isIntersecting);
              if (entry.isIntersecting) node.dataset.entered = "true";
            }
            sync();
          },
          { threshold: 0.05 },
        );
        targets.forEach((node) => observer!.observe(node));
        sync();
      } else {
        root.dataset.motion = "reduced";
        targets.forEach((node) => {
          node.dataset.running = "false";
        });
      }
    };
    const onVisibility = () => sync();
    const onPause = () => sync();
    setup();
    media.addEventListener("change", setup);
    document.addEventListener("visibilitychange", onVisibility);
    root.addEventListener("motion-pause", onPause);
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", setup);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("motion-pause", onPause);
      delete root.dataset.motion;
    };
  }, []);
  return ref;
}
