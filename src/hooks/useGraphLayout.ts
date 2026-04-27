import { useState, useRef, useEffect, useMemo } from "react";
import { Person } from "@/types";
import { getSizeFromAge } from "@/utils";
import { SPAWN_AREA_WIDTH, SPAWN_AREA_HEIGHT } from "@/constants";

/**
 * Custom hook to manage the layout, positioning, and dragging of nodes in the graph.
 *
 * This hook handles generating initial random positions for new nodes, 
 * maintaining the z-index order (bringing clicked nodes to the front), 
 * and executing the drag-and-drop logic for moving nodes around the canvas.
 *
 * @param persons - The array of current persons in the graph.
 * @param transformScale - The current scale of the canvas (used to adjust drag distance).
 * @param setSelectedPersonId - Callback to set the selected person when clicked (not dragged).
 * @returns Object containing positions, zOrder, draggedId, computed centers, and the mouse down handler.
 */
export const useGraphLayout = (
  persons: Person[],
  transformScale: number,
  setSelectedPersonId: (id: number | null) => void,
) => {
  const [positions, setPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const [zOrder, setZOrder] = useState<number[]>([]);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  // Ref to track dragging state across mouse events without re-rendering constantly
  const draggingRef = useRef<{
    id: number | null;
    startX?: number;
    startY?: number;
    originX?: number;
    originY?: number;
  }>({ id: null });

  // Effect to handle initialization of new nodes and cleanup of deleted nodes
  useEffect(() => {
    const newPositions: Record<number, { x: number; y: number }> = {
      ...positions,
    };

    // Assign random initial positions to any new persons without a position
    for (const p of persons) {
      if (!newPositions[p.id]) {
        newPositions[p.id] = {
          x: Math.random() * SPAWN_AREA_WIDTH,
          y: Math.random() * SPAWN_AREA_HEIGHT,
        };
      }
    }

    // Clean up positions for persons that no longer exist
    for (const idStr of Object.keys(newPositions)) {
      const id = Number(idStr);
      if (!persons.find((p) => p.id === id)) delete newPositions[id];
    }

    setPositions(newPositions);

    // Update the z-order array to include new persons and remove deleted ones
    setZOrder((prev) => {
      const existing = new Set(prev);
      const merged = [
        ...prev,
        ...persons.map((p) => p.id).filter((id) => !existing.has(id)),
      ];
      return merged.filter((id) => persons.some((p) => p.id === id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons]);

  /**
   * Event handler triggered when a user presses the mouse down on a node.
   * Initializes the drag process, updates z-index, and attaches document-level 
   * mouse move/up listeners.
   *
   * @param e - The React MouseEvent.
   * @param id - The ID of the node being clicked.
   */
  const onNodeMouseDown = (e: React.MouseEvent, id: number) => {
    // Ignore drag if clicking on a button inside the node (e.g., delete button)
    if ((e.target as HTMLElement).closest("button")) return;

    e.preventDefault();
    
    // Bring the clicked node to the front of the z-index stack
    setZOrder((prev) => [...prev.filter((i) => i !== id), id]);

    const pos = positions[id];
    if (!pos) return;
    
    // Store starting coordinates for the drag calculation
    draggingRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
    setDraggedId(id);

    // Document-level mouse move handler to update position
    const onMove = (ev: MouseEvent) => {
      const state = draggingRef.current;
      if (!state || state.id === null) return;
      if (state.id !== id) return;

      // Adjust the drag distance by the current canvas scale so movement feels 1:1
      const dx = (ev.clientX - (state.startX ?? ev.clientX)) / transformScale;
      const dy = (ev.clientY - (state.startY ?? ev.clientY)) / transformScale;

      const newX = (state.originX ?? 0) + dx;
      const newY = (state.originY ?? 0) + dy;

      setPositions((prev) => ({ ...prev, [id]: { x: newX, y: newY } }));
    };

    // Document-level mouse up handler to end drag and register clicks
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      const state = draggingRef.current;
      if (state && state.id !== null) {
        const dx = ev.clientX - (state.startX ?? ev.clientX);
        const dy = ev.clientY - (state.startY ?? ev.clientY);
        const dist = Math.hypot(dx, dy);

        // If the mouse barely moved, treat it as a click rather than a drag
        if (dist < 5) {
          setSelectedPersonId(state.id);
        }
      }

      draggingRef.current = { id: null };
      setDraggedId(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /**
   * Computes the exact center coordinate for every node based on its position and size.
   * This is heavily used by the connection lines to anchor correctly.
   */
  const centers = useMemo(() => {
    const c: Record<number, { x: number; y: number; size: number }> = {};
    for (const p of persons) {
      const pos = positions[p.id] ?? { x: 0, y: 0 };
      const size = getSizeFromAge(p.age);
      c[p.id] = { x: pos.x + size / 2, y: pos.y + size / 2, size };
    }
    return c;
  }, [persons, positions]);

  return {
    positions,
    zOrder,
    draggedId,
    centers,
    onNodeMouseDown,
  };
};
