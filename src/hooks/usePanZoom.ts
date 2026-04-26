import { useState, useRef, useEffect } from "react";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_SENSITIVITY, ZOOM_STEP } from "@/constants";

export const usePanZoom = (
  containerRef: React.RefObject<HTMLDivElement | null>,
) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;

      setTransform((prev) => {
        let newScale = prev.scale * Math.exp(delta);
        newScale = Math.min(Math.max(newScale, ZOOM_MIN), ZOOM_MAX);

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);

        return { x: newX, y: newY, scale: newScale };
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [containerRef]);

  const handleZoom = (direction: "in" | "out") => {
    setTransform((prev) => {
      const scaleFactor = direction === "in" ? ZOOM_STEP : 1 / ZOOM_STEP;
      let newScale = prev.scale * scaleFactor;
      newScale = Math.min(Math.max(newScale, ZOOM_MIN), ZOOM_MAX);

      const container = containerRef.current;
      if (!container) return { ...prev, scale: newScale };

      const rect = container.getBoundingClientRect();
      const originX = rect.width / 2;
      const originY = rect.height / 2;

      const newX = originX - (originX - prev.x) * (newScale / prev.scale);
      const newY = originY - (originY - prev.y) * (newScale / prev.scale);

      return { x: newX, y: newY, scale: newScale };
    });
  };

  const handleResetZoom = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest(".node-circle") ||
      (e.target as HTMLElement).closest(".person-popup")
    ) {
      return;
    }
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: transform.x,
        startPanY: transform.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setTransform((prev) => ({
        ...prev,
        x: panRef.current.startPanX + dx,
        y: panRef.current.startPanY + dy,
      }));
    }
  };

  const onCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return {
    transform,
    isPanning,
    handleZoom,
    handleResetZoom,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
  };
};
