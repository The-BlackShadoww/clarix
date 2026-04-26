import { useState, useRef, useEffect, useMemo } from "react";
import { Person } from "@/types";
import { getSizeFromAge } from "@/utils";
import { SPAWN_AREA_WIDTH, SPAWN_AREA_HEIGHT } from "@/constants";

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

  const draggingRef = useRef<{
    id: number | null;
    startX?: number;
    startY?: number;
    originX?: number;
    originY?: number;
  }>({ id: null });

  useEffect(() => {
    const newPositions: Record<number, { x: number; y: number }> = {
      ...positions,
    };

    for (const p of persons) {
      if (!newPositions[p.id]) {
        newPositions[p.id] = {
          x: Math.random() * SPAWN_AREA_WIDTH,
          y: Math.random() * SPAWN_AREA_HEIGHT,
        };
      }
    }

    for (const idStr of Object.keys(newPositions)) {
      const id = Number(idStr);
      if (!persons.find((p) => p.id === id)) delete newPositions[id];
    }

    setPositions(newPositions);

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

  const onNodeMouseDown = (e: React.MouseEvent, id: number) => {
    if ((e.target as HTMLElement).closest("button")) return;

    e.preventDefault();
    setZOrder((prev) => [...prev.filter((i) => i !== id), id]);

    const pos = positions[id];
    if (!pos) return;
    draggingRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
    setDraggedId(id);

    const onMove = (ev: MouseEvent) => {
      const state = draggingRef.current;
      if (!state || state.id === null) return;
      if (state.id !== id) return;

      const dx = (ev.clientX - (state.startX ?? ev.clientX)) / transformScale;
      const dy = (ev.clientY - (state.startY ?? ev.clientY)) / transformScale;

      const newX = (state.originX ?? 0) + dx;
      const newY = (state.originY ?? 0) + dy;

      setPositions((prev) => ({ ...prev, [id]: { x: newX, y: newY } }));
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      const state = draggingRef.current;
      if (state && state.id !== null) {
        const dx = ev.clientX - (state.startX ?? ev.clientX);
        const dy = ev.clientY - (state.startY ?? ev.clientY);
        const dist = Math.hypot(dx, dy);

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
