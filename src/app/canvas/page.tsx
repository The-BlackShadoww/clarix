"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/features/canvas/Sidebar";
import { PersonNode } from "@/components/features/canvas/PersonNode";
import { ConnectionLine } from "@/components/features/canvas/ConnectionLine";
import { PersonPopup } from "@/components/features/canvas/PersonPopup";

import { usePersons } from "@/hooks/usePersons";
import { usePanZoom } from "@/hooks/usePanZoom";
import { useGraphLayout } from "@/hooks/useGraphLayout";

/**
 * The main Canvas route (`/canvas`).
 * Orchestrates the overall graph application by composing state hooks
 * (usePersons, usePanZoom, useGraphLayout) and rendering the canvas elements.
 */
export default function CanvasPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { persons, addPerson, addRelation, removePerson, removeRelation } =
    usePersons([
      {
        id: 1,
        name: "John Doe",
        age: 30,
        relations: [
          { id: 2, relation: "son" },
          { id: 3, relation: "spouse" },
        ],
      },
      { id: 2, name: "Jimmy Doe", age: 5, relations: [] },
      { id: 3, name: "Jane Doe", age: 28, relations: [] },
    ]);

  const {
    transform,
    isPanning,
    handleZoom,
    handleResetZoom,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
  } = usePanZoom(containerRef);

  const { positions, zOrder, draggedId, centers, onNodeMouseDown } =
    useGraphLayout(persons, transform.scale, setSelectedPersonId);

  type Pair = { a: number; b: number; labelAB?: string; labelBA?: string };

  const relationPairs = useMemo(() => {
    const map = new Map<string, Pair>();
    for (const p of persons) {
      for (const r of p.relations) {
        const source = p.id;
        const target = r.id;
        if (source === target) continue;
        const key =
          source < target ? `${source}-${target}` : `${target}-${source}`;
        let pair = map.get(key);
        if (!pair) {
          const [a, b] = key.split("-").map(Number);
          pair = { a, b };
          map.set(key, pair);
        }
        if (source < target) pair.labelAB = r.relation;
        else pair.labelBA = r.relation;
      }
    }
    return Array.from(map.values());
  }, [persons]);

  return (
    <div className="relative h-screen w-full bg-white text-[#1c1c1e] overflow-hidden">
      <Button
        variant="outline"
        size="icon"
        className={`absolute top-6 z-30 transition-all duration-300 bg-white/90 backdrop-blur shadow-sm border-[#e0e2e8] text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white ${isSidebarOpen ? "left-[416px]" : "left-6"}`}
        onClick={() => setIsSidebarOpen((o) => !o)}
        title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="w-5 h-5" />
        ) : (
          <PanelLeftOpen className="w-5 h-5" />
        )}
      </Button>

      <Sidebar
        isOpen={isSidebarOpen}
        persons={persons}
        onAddPerson={addPerson}
        onAddRelation={addRelation}
      />

      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full overflow-hidden"
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerUp}
        style={{
          backgroundColor: "#ffffff",
          backgroundImage: "radial-gradient(#e0e2e8 1px, transparent 1px)",
          backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
          cursor: isPanning ? "grabbing" : "default",
        }}
      >
        <div
          className="absolute top-6 right-6 flex flex-col gap-2 z-50 zoom-controls"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-sm border-[#e0e2e8] text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white"
            onClick={() => handleZoom("in")}
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-sm border-[#e0e2e8] text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white"
            onClick={() => handleZoom("out")}
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-sm border-[#e0e2e8] text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white"
            onClick={handleResetZoom}
            title="Reset Zoom"
          >
            <Maximize className="w-4 h-4" />
          </Button>
          <div className="w-10 text-center py-1 bg-white/90 backdrop-blur rounded-lg border border-[#e0e2e8] shadow-sm mt-1">
            <span className="text-[11px] font-semibold text-[#555a6a]">
              {Math.round(transform.scale * 100)}%
            </span>
          </div>
        </div>

        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            className="absolute inset-0 overflow-visible"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              pointerEvents: "none",
            }}
          >
            {relationPairs.map((pair, idx) => {
              const aCenter = centers[pair.a];
              const bCenter = centers[pair.b];
              if (!aCenter || !bCenter) return null;
              return (
                <ConnectionLine
                  key={idx}
                  x1={aCenter.x}
                  y1={aCenter.y}
                  x2={bCenter.x}
                  y2={bCenter.y}
                  labelAB={pair.labelAB}
                  labelBA={pair.labelBA}
                />
              );
            })}
          </svg>

          {persons.map((p) => {
            const pos = positions[p.id];
            if (!pos) return null;
            return (
              <PersonNode
                key={p.id}
                person={p}
                position={pos}
                z={zOrder.indexOf(p.id)}
                isDragging={draggedId === p.id}
                isSelected={selectedPersonId === p.id && !draggedId}
                onMouseDown={onNodeMouseDown}
              />
            );
          })}

          {persons.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#a5a8b5] gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#f5f6f8] flex items-center justify-center ring-shadow">
                <Sparkles className="w-7 h-7 text-[#c7cad5]" />
              </div>
              <p className="text-[15px] font-medium">No nodes yet</p>
              <p className="text-[13px]">
                Add a person using the sidebar to get started.
              </p>
            </div>
          )}

          <div
            onClick={() => setSelectedPersonId(null)}
            className={`fixed inset-0 bg-white/40 backdrop-blur-sm z-40 transition-all duration-300 ${selectedPersonId && !draggedId ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"}`}
          />

          {selectedPersonId &&
            !draggedId &&
            (() => {
              const selectedPerson = persons.find(
                (p) => p.id === selectedPersonId,
              );
              const pos = positions[selectedPersonId];
              if (!selectedPerson || !pos) return null;

              return (
                <PersonPopup
                  person={selectedPerson}
                  position={pos}
                  allPersons={persons}
                  onClose={() => setSelectedPersonId(null)}
                  onRemovePerson={(id) => {
                    setSelectedPersonId(null);
                    removePerson(id);
                  }}
                  onRemoveRelation={removeRelation}
                />
              );
            })()}
        </div>
      </div>
    </div>
  );
}
