"use client";

import React, { useRef } from "react";
import { Map as MapIcon, Maximize, Minus, Plus } from "lucide-react";
import type { Camera, Person, Point, RelationType } from "@/types";
import { CARD_H, CARD_W, RELATION_TYPES, RELATION_TYPE_ORDER } from "@/constants";
import { type Edge, getBounds } from "@/lib/graph";
import { personColor } from "@/utils";
import { cn } from "@/lib/utils";
import { IconButton, Panel } from "./primitives";

/* ------------------------------------------------------------------ */
/* Minimap                                                             */
/* ------------------------------------------------------------------ */

const MINI_W = 216;
const MINI_H = 136;

type MinimapProps = {
  persons: Person[];
  positions: Record<number, Point>;
  edges: Edge[];
  camera: Camera;
  viewport: { w: number; h: number };
  onNavigate: (world: Point) => void;
};

export const Minimap: React.FC<MinimapProps> = ({ persons, positions, edges, camera, viewport, onNavigate }) => {
  const ref = useRef<SVGSVGElement>(null);

  // World rectangle currently visible on screen.
  const view = {
    minX: -camera.x / camera.scale,
    minY: -camera.y / camera.scale,
    maxX: (viewport.w - camera.x) / camera.scale,
    maxY: (viewport.h - camera.y) / camera.scale,
  };
  const content = getBounds(positions);
  const b = content
    ? {
        minX: Math.min(content.minX, view.minX),
        minY: Math.min(content.minY, view.minY),
        maxX: Math.max(content.maxX, view.maxX),
        maxY: Math.max(content.maxY, view.maxY),
      }
    : view;
  const pad = 40;
  const bw = b.maxX - b.minX + pad * 2;
  const bh = b.maxY - b.minY + pad * 2;
  const s = Math.min(MINI_W / bw, MINI_H / bh);
  const ox = (MINI_W - bw * s) / 2 - (b.minX - pad) * s;
  const oy = (MINI_H - bh * s) / 2 - (b.minY - pad) * s;
  const tx = (x: number) => x * s + ox;
  const ty = (y: number) => y * s + oy;

  const navigate = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    onNavigate({ x: (e.clientX - r.left - ox) / s, y: (e.clientY - r.top - oy) / s });
  };

  return (
    <svg
      ref={ref}
      width={MINI_W}
      height={MINI_H}
      className="block cursor-pointer touch-none rounded-[10px] bg-[#f7f8fa]"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        navigate(e);
      }}
      onPointerMove={(e) => e.buttons === 1 && navigate(e)}
      aria-label="Minimap — click to navigate"
    >
      {edges.map((e) => {
        const a = positions[e.source];
        const c = positions[e.target];
        if (!a || !c) return null;
        return (
          <line
            key={`${e.source}-${e.target}`}
            x1={tx(a.x)}
            y1={ty(a.y)}
            x2={tx(c.x)}
            y2={ty(c.y)}
            stroke={RELATION_TYPES[e.type].color}
            strokeOpacity={0.45}
            strokeWidth={1}
          />
        );
      })}
      {persons.map((p) => {
        const pos = positions[p.id];
        if (!pos) return null;
        return (
          <rect
            key={p.id}
            x={tx(pos.x - CARD_W / 2)}
            y={ty(pos.y - CARD_H / 2)}
            width={Math.max(CARD_W * s, 3)}
            height={Math.max(CARD_H * s, 2)}
            rx={2}
            fill={personColor(p)}
            stroke="#1c1c1e"
            strokeOpacity={0.15}
            strokeWidth={0.5}
          />
        );
      })}
      <rect
        x={tx(view.minX)}
        y={ty(view.minY)}
        width={(view.maxX - view.minX) * s}
        height={(view.maxY - view.minY) * s}
        rx={3}
        fill="#4262ff"
        fillOpacity={0.06}
        stroke="#4262ff"
        strokeWidth={1.5}
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Zoom controls + minimap container                                   */
/* ------------------------------------------------------------------ */

type ZoomProps = MinimapProps & {
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFit: () => void;
};

export const NavigationControls: React.FC<ZoomProps> = ({
  showMinimap,
  onToggleMinimap,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFit,
  ...mini
}) => (
  <div className="pointer-events-none absolute bottom-3 right-3 z-40 flex flex-col items-end gap-2 sm:bottom-4 sm:right-4">
    {showMinimap && (
      <Panel className="animate-in fade-in slide-in-from-bottom-1 pointer-events-auto hidden p-1.5 duration-200 sm:block">
        <Minimap {...mini} />
      </Panel>
    )}
    <Panel className="pointer-events-auto flex items-center gap-0.5 p-1">
      <span className="hidden sm:block">
        <IconButton label={showMinimap ? "Hide minimap" : "Show minimap"} shortcut="M" side="top" active={showMinimap} onClick={onToggleMinimap} className="size-9">
          <MapIcon className="size-[17px]" />
        </IconButton>
      </span>
      <IconButton label="Fit to screen" shortcut="Shift 1" side="top" onClick={onFit} className="size-9">
        <Maximize className="size-[16px]" />
      </IconButton>
      <div className="mx-0.5 h-5 w-px bg-[#eceef2]" />
      <IconButton label="Zoom out" shortcut="−" side="top" onClick={onZoomOut} className="size-9">
        <Minus className="size-[17px]" />
      </IconButton>
      <button
        type="button"
        onClick={onResetZoom}
        title="Reset to 100%"
        className="h-9 w-[52px] rounded-[10px] text-[12.5px] font-semibold tabular-nums text-[#3a3d4a] hover:bg-[#f0f2f7]"
      >
        {Math.round(mini.camera.scale * 100)}%
      </button>
      <IconButton label="Zoom in" shortcut="+" side="top" onClick={onZoomIn} className="size-9">
        <Plus className="size-[17px]" />
      </IconButton>
    </Panel>
  </div>
);

/* ------------------------------------------------------------------ */
/* Legend / relation-type filter                                       */
/* ------------------------------------------------------------------ */

export const Legend: React.FC<{
  counts: Record<RelationType, number>;
  hidden: Set<RelationType>;
  onToggle: (t: RelationType) => void;
}> = ({ counts, hidden, onToggle }) => (
  <Panel className="pointer-events-auto absolute bottom-3 left-3 z-40 hidden items-center gap-1 p-1 sm:bottom-4 sm:left-4 md:flex">
    <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a5a8b5]">Show</span>
    {RELATION_TYPE_ORDER.map((t) => {
      const cfg = RELATION_TYPES[t];
      const off = hidden.has(t);
      return (
        <button
          key={t}
          type="button"
          onClick={() => onToggle(t)}
          aria-pressed={!off}
          title={off ? `Show ${cfg.label.toLowerCase()} links` : `Hide ${cfg.label.toLowerCase()} links`}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold transition-all",
            off ? "text-[#a5a8b5] hover:bg-[#f3f4f8]" : "hover:brightness-95",
          )}
          style={off ? undefined : { background: cfg.soft, color: cfg.color }}
        >
          <span
            className="size-2 rounded-full transition-colors"
            style={{ background: off ? "#d4d6de" : cfg.color }}
          />
          {cfg.label}
          <span className="tabular-nums opacity-60">{counts[t]}</span>
        </button>
      );
    })}
  </Panel>
);
