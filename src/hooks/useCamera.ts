import { useCallback, useEffect, useRef, useState } from "react";
import type { Camera, Point } from "@/types";
import type { Bounds } from "@/lib/graph";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_SENSITIVITY, ZOOM_STEP } from "@/constants";
import { clamp } from "@/utils";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Infinite-canvas camera: pan / zoom state, wheel + trackpad handling,
 * and smooth animated moves (fit to content, focus on a node).
 */
export const useCamera = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [camera, setCameraState] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const cameraRef = useRef(camera);
  const animRef = useRef<number | null>(null);

  const setCamera = useCallback((next: Camera | ((c: Camera) => Camera)) => {
    setCameraState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      cameraRef.current = value;
      return value;
    });
  }, []);

  const stopAnimation = useCallback(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  }, []);

  const animateTo = useCallback(
    (target: Camera, duration = 450) => {
      stopAnimation();
      const from = cameraRef.current;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const k = easeOutCubic(t);
        setCamera({
          x: from.x + (target.x - from.x) * k,
          y: from.y + (target.y - from.y) * k,
          scale: from.scale + (target.scale - from.scale) * k,
        });
        animRef.current = t < 1 ? requestAnimationFrame(step) : null;
      };
      animRef.current = requestAnimationFrame(step);
    },
    [setCamera, stopAnimation],
  );

  const viewport = useCallback(() => {
    const el = containerRef.current;
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 1200, h: 800 };
  }, [containerRef]);

  /** Zoom by `factor`, keeping the screen point `at` fixed (defaults to viewport centre). */
  const zoomBy = useCallback(
    (factor: number, at?: Point, animate = false) => {
      const { w, h } = viewport();
      const p = at ?? { x: w / 2, y: h / 2 };
      const c = cameraRef.current;
      const scale = clamp(c.scale * factor, ZOOM_MIN, ZOOM_MAX);
      const next = {
        scale,
        x: p.x - (p.x - c.x) * (scale / c.scale),
        y: p.y - (p.y - c.y) * (scale / c.scale),
      };
      if (animate) animateTo(next, 220);
      else setCamera(next);
    },
    [animateTo, setCamera, viewport],
  );

  const zoomIn = useCallback(() => zoomBy(ZOOM_STEP, undefined, true), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / ZOOM_STEP, undefined, true), [zoomBy]);
  const resetZoom = useCallback(() => zoomBy(1 / cameraRef.current.scale, undefined, true), [zoomBy]);

  /** Frame the given world-space bounds, leaving room for the floating UI. */
  const fitBounds = useCallback(
    (b: Bounds | null, opts: { animate?: boolean; maxScale?: number; padding?: number } = {}) => {
      const { w, h } = viewport();
      if (!b) {
        const next = { x: w / 2, y: h / 2, scale: 1 };
        if (opts.animate === false) setCamera(next);
        else animateTo(next);
        return;
      }
      // Scale padding down on small screens so content stays legible on phones.
      const pad = Math.min(opts.padding ?? 120, w * 0.08, h * 0.12);
      const bw = Math.max(b.maxX - b.minX, 1);
      const bh = Math.max(b.maxY - b.minY, 1);
      const rail = 64; // left tool rail
      const scale = clamp(
        Math.min((w - rail - pad * 2) / bw, (h - pad * 2) / bh),
        ZOOM_MIN,
        opts.maxScale ?? 1.25,
      );
      const next = {
        scale,
        x: (w + rail) / 2 - ((b.minX + b.maxX) / 2) * scale,
        y: h / 2 - ((b.minY + b.maxY) / 2) * scale,
      };
      if (opts.animate === false) setCamera(next);
      else animateTo(next, 600);
    },
    [animateTo, setCamera, viewport],
  );

  /** Centre the camera on a world point. */
  const centerOn = useCallback(
    (p: Point, scale?: number, offsetX = 0) => {
      const { w, h } = viewport();
      const s = scale ?? Math.max(cameraRef.current.scale, 1);
      animateTo({ scale: s, x: w / 2 + offsetX - p.x * s, y: h / 2 - p.y * s }, 550);
    },
    [animateTo, viewport],
  );

  const screenToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = containerRef.current?.getBoundingClientRect();
      const c = cameraRef.current;
      const x = clientX - (rect?.left ?? 0);
      const y = clientY - (rect?.top ?? 0);
      return { x: (x - c.x) / c.scale, y: (y - c.y) / c.scale };
    },
    [containerRef],
  );

  // Wheel: pinch / ctrl+wheel / mouse wheel zooms at the cursor; two-finger trackpad scroll pans.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAnimation();
      const rect = el.getBoundingClientRect();
      const isTrackpadPan = !e.ctrlKey && !e.metaKey && (Math.abs(e.deltaX) > 0 || e.deltaMode === 0 && Math.abs(e.deltaY) < 40 && !Number.isInteger(e.deltaY));
      if (isTrackpadPan || e.shiftKey) {
        const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
        const dy = e.shiftKey && e.deltaX === 0 ? 0 : e.deltaY;
        setCamera((c) => ({ ...c, x: c.x - dx, y: c.y - dy }));
        return;
      }
      const speed = e.ctrlKey ? ZOOM_SENSITIVITY * 6 : ZOOM_SENSITIVITY;
      zoomBy(Math.exp(-e.deltaY * speed), { x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef, setCamera, stopAnimation, zoomBy]);

  useEffect(() => stopAnimation, [stopAnimation]);

  return {
    camera,
    cameraRef,
    setCamera,
    stopAnimation,
    zoomIn,
    zoomOut,
    zoomBy,
    resetZoom,
    fitBounds,
    centerOn,
    screenToWorld,
    viewport,
  };
};
