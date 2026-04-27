import { useState, useRef, useEffect } from "react";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_SENSITIVITY, ZOOM_STEP } from "@/constants";

/**
 * Custom hook to manage the canvas panning and zooming state.
 *
 * This hook maintains the current transform (x, y, scale) of the canvas,
 * handles mouse wheel events for smooth zooming, and pointer events for
 * clicking and dragging the canvas.
 *
 * @param containerRef - A React ref pointing to the canvas container element to attach wheel events.
 * @returns An object containing transform state, panning state, and event handlers.
 */
export const usePanZoom = (
  containerRef: React.RefObject<HTMLDivElement | null>,
) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  
  // Ref to store original position before pan starts without causing re-renders
  const panRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  // Attach a non-passive wheel event listener to handle smooth zooming.
  // We use useEffect instead of React's onWheel because React uses passive listeners by default,
  // which prevents us from calling e.preventDefault() to stop page scroll.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;

      setTransform((prev) => {
        let newScale = prev.scale * Math.exp(delta);
        newScale = Math.min(Math.max(newScale, ZOOM_MIN), ZOOM_MAX);

        // Calculate cursor position relative to the container to zoom into the cursor
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate the new X and Y transform to keep the point under the mouse stationary
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);

        return { x: newX, y: newY, scale: newScale };
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [containerRef]);

  /**
   * Zooms the canvas in or out programmatically, pivoting from the center of the container.
   *
   * @param direction - "in" to zoom in, "out" to zoom out.
   */
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

  /**
   * Resets the canvas transform back to its original position and scale.
   */
  const handleResetZoom = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  /**
   * Initiates panning when the user clicks down on the canvas.
   * Prevents panning if the user is clicking on a node or popup.
   *
   * @param e - React PointerEvent.
   */
  const onCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest(".node-circle") ||
      (e.target as HTMLElement).closest(".person-popup")
    ) {
      return;
    }
    // Only pan if it's a primary click (0) or middle click (1)
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

  /**
   * Updates the panning transform as the pointer moves.
   *
   * @param e - React PointerEvent.
   */
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

  /**
   * Stops the panning action when the pointer is released.
   *
   * @param e - React PointerEvent.
   */
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
