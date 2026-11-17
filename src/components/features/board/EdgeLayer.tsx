"use client";

import React, { memo } from "react";
import type { Point, RelationType } from "@/types";
import { RELATION_TYPES } from "@/constants";
import { type Edge, edgeGeometry, edgeKey, routeBend } from "@/lib/graph";
import { cn } from "@/lib/utils";

export type EdgeState = "normal" | "dimmed" | "highlight" | "path";

type Props = {
  edges: Edge[];
  positions: Record<number, Point>;
  edgeState: (e: Edge) => EdgeState;
  selectedKey: string | null;
  draft: { from: Point; to: Point } | null;
  onEdgePointerDown: (e: React.PointerEvent, edge: Edge) => void;
};

const types = Object.keys(RELATION_TYPES) as RelationType[];

/** All relationship connectors: curved arrows in SVG plus HTML label pills on top. */
export const EdgeLayer = memo(function EdgeLayer({
  edges,
  positions,
  edgeState,
  selectedKey,
  draft,
  onEdgePointerDown,
}: Props) {
  const drawn = edges
    .map((e) => {
      const a = positions[e.source];
      const b = positions[e.target];
      if (!a || !b) return null;
      return { edge: e, key: edgeKey(e.source, e.target), geo: edgeGeometry(a, b, routeBend(e, positions)), state: edgeState(e) };
    })
    .filter((x) => x !== null);

  return (
    <>
      <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1">
        <defs>
          {types.map((t) => (
            <marker
              key={t}
              id={`arrow-${t}`}
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0 0 L10 5 L0 10 L2.5 5 z" fill={RELATION_TYPES[t].color} />
            </marker>
          ))}
          <marker id="arrow-draft" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0 0 L10 5 L0 10 L2.5 5 z" fill="#4262ff" />
          </marker>
        </defs>

        {drawn.map(({ edge, key, geo, state }) => {
          const color = RELATION_TYPES[edge.type].color;
          const selected = key === selectedKey;
          const emphasised = selected || state === "path" || state === "highlight";
          return (
            <g key={key} className={cn("transition-opacity duration-200", state === "dimmed" && "opacity-15")}>
              {/* wide invisible stroke = comfortable hit target */}
              <path
                d={geo.path}
                stroke="transparent"
                strokeWidth={16}
                fill="none"
                className="cursor-pointer"
                style={{ pointerEvents: "stroke" }}
                onPointerDown={(ev) => onEdgePointerDown(ev, edge)}
              />
              {selected && <path d={geo.path} stroke={color} strokeOpacity={0.18} strokeWidth={10} fill="none" strokeLinecap="round" />}
              <path
                d={geo.path}
                stroke={color}
                strokeWidth={emphasised ? 2.75 : 1.75}
                strokeOpacity={emphasised ? 1 : 0.75}
                fill="none"
                strokeLinecap="round"
                markerEnd={`url(#arrow-${edge.type})`}
                className={cn(state === "path" && "edge-flow")}
                strokeDasharray={state === "path" ? "8 6" : undefined}
              />
            </g>
          );
        })}

        {draft && (
          <path
            d={`M ${draft.from.x} ${draft.from.y} L ${draft.to.x} ${draft.to.y}`}
            stroke="#4262ff"
            strokeWidth={2}
            strokeDasharray="6 5"
            fill="none"
            markerEnd="url(#arrow-draft)"
            className="edge-flow"
          />
        )}
      </svg>

      {drawn.map(({ edge, key, geo, state }) => {
        if (!edge.label) return null;
        const t = RELATION_TYPES[edge.type];
        const selected = key === selectedKey;
        return (
          <div
            key={`l-${key}`}
            onPointerDown={(ev) => onEdgePointerDown(ev, edge)}
            className={cn(
              "edge-label absolute z-[5] -translate-x-1/2 -translate-y-1/2 cursor-pointer whitespace-nowrap rounded-full border bg-white px-2.5 py-[3px] text-[11.5px] font-semibold leading-[1.3] transition-[opacity,box-shadow] duration-200",
              state === "dimmed" && "opacity-20",
              selected && "ring-[3px]",
            )}
            style={
              {
                left: geo.label.x,
                top: geo.label.y,
                color: t.color,
                borderColor: `${t.color}55`,
                "--tw-ring-color": `${t.color}33`,
              } as React.CSSProperties
            }
          >
            {edge.label}
          </div>
        );
      })}
    </>
  );
});
