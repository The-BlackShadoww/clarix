"use client";

import React, { useEffect, useRef, useState } from "react";

type Relation = {
  id: number;
  relation: string;
};

type Person = {
  id: number;
  name: string;
  age: number;
  relations: Relation[];
};

/* -------------------- Parsing utilities -------------------- */

function extractTopLevelObjects(text: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let stringChar = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = text[i - 1];

    if (!inString && (ch === `"` || ch === `'`)) {
      inString = true;
      stringChar = ch;
    } else if (inString && ch === stringChar && prev !== "\\") {
      inString = false;
      stringChar = "";
    }

    if (!inString) {
      if (ch === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && start !== -1) {
          results.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
  }
  return results;
}

function objectLiteralToJsonString(literal: string): string {
  let s = literal;
  s = s.replace(/\r\n|\n/g, " ");
  s = s.replace(/([{\[,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
  s = s.replace(/'([^']*)'/g, (_, inner) => `"${inner.replace(/"/g, '\\"')}"`);
  s = s.replace(/,(\s*[}\]])/g, "$1");
  return s;
}

function parseObjectLiteral(
  literal: string,
  allowEvalFallback = false,
): any | undefined {
  const jsonLike = objectLiteralToJsonString(literal);
  try {
    return JSON.parse(jsonLike);
  } catch (jsonErr) {
    if (!allowEvalFallback) return undefined;
    try {
      const fn = new Function(`"use strict"; return (${literal});`);
      return fn();
    } catch {
      return undefined;
    }
  }
}

function isPersonShape(obj: any): obj is Person {
  if (
    obj == null ||
    typeof obj !== "object" ||
    typeof obj.id !== "number" ||
    typeof obj.name !== "string" ||
    typeof obj.age !== "number" ||
    !Array.isArray(obj.relations)
  ) {
    return false;
  }

  for (const r of obj.relations) {
    if (
      r == null ||
      typeof r !== "object" ||
      typeof r.id !== "number" ||
      typeof r.relation !== "string"
    ) {
      return false;
    }
  }
  return true;
}

function extractPersonsFromText(
  text: string,
  options?: { allowEvalFallback?: boolean },
): Person[] {
  const allowEvalFallback = options?.allowEvalFallback ?? false;
  const literalStrings = extractTopLevelObjects(text);
  const persons: Person[] = [];

  for (const lit of literalStrings) {
    const parsed = parseObjectLiteral(lit, allowEvalFallback);
    if (parsed && isPersonShape(parsed)) persons.push(parsed as Person);
  }
  return persons;
}

/* -------------------- Visual / Layout helpers -------------------- */

const MIN_SIZE = 60;
const MAX_SIZE = 180;
const MAX_AGE_FOR_SCALE = 100;

const getSizeFromAge = (age: number) => {
  const capped = Math.max(0, Math.min(MAX_AGE_FOR_SCALE, age));
  return MIN_SIZE + (capped / MAX_AGE_FOR_SCALE) * (MAX_SIZE - MIN_SIZE);
};

/* -------------------- Main Component -------------------- */

const Home: React.FC = () => {
  const [text, setText] = useState<string>(`
  {
    id: 1,
    name: "John Doe",
    age: 30,
    relations: [
      { id: 2, relation: "son" },
      { id: 3, relation: "spouse" }
    ]
  }
  `);

  const [persons, setPersons] = useState<Person[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [positions, setPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});

  const [zOrder, setZOrder] = useState<number[]>([]);

  const draggingRef = useRef<{
    id: number | null;
    startX?: number;
    startY?: number;
    originX?: number;
    originY?: number;
  }>({ id: null });
  const [draggedId, setDraggedId] = useState<number | null>(null);

  useEffect(() => {
    const extracted = extractPersonsFromText(text);
    setPersons(extracted);
  }, [text]);

  useEffect(() => {
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const newPositions: Record<number, { x: number; y: number }> = {
      ...positions,
    };

    for (const p of persons) {
      if (!newPositions[p.id]) {
        const size = getSizeFromAge(p.age);
        const maxX = rect ? Math.max(0, rect.width - size) : 200;
        const maxY = rect ? Math.max(0, rect.height - size) : 200;
        newPositions[p.id] = {
          x: Math.random() * maxX,
          y: Math.random() * maxY,
        };
      } else {
        if (rect) {
          const size = getSizeFromAge(p.age);
          newPositions[p.id].x = Math.max(
            0,
            Math.min(newPositions[p.id].x, Math.max(0, rect.width - size)),
          );
          newPositions[p.id].y = Math.max(
            0,
            Math.min(newPositions[p.id].y, Math.max(0, rect.height - size)),
          );
        }
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
  }, [persons]);

  const onMouseDown = (e: React.MouseEvent, id: number) => {
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
      const dx = ev.clientX - (state.startX ?? ev.clientX);
      const dy = ev.clientY - (state.startY ?? ev.clientY);
      const container = containerRef.current;
      const p = persons.find((ps) => ps.id === id);
      const size = p ? getSizeFromAge(p.age) : MIN_SIZE;
      if (!container) {
        setPositions((prev) => ({
          ...prev,
          [id]: { x: (state.originX ?? 0) + dx, y: (state.originY ?? 0) + dy },
        }));
        return;
      }
      const rect = container.getBoundingClientRect();
      const maxX = Math.max(0, rect.width - size);
      const maxY = Math.max(0, rect.height - size);
      const newX = Math.max(0, Math.min((state.originX ?? 0) + dx, maxX));
      const newY = Math.max(0, Math.min((state.originY ?? 0) + dy, maxY));

      setPositions((prev) => ({ ...prev, [id]: { x: newX, y: newY } }));
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      draggingRef.current = { id: null };
      setDraggedId(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const centers = React.useMemo(() => {
    const c: Record<number, { x: number; y: number; size: number }> = {};
    for (const p of persons) {
      const pos = positions[p.id] ?? { x: 0, y: 0 };
      const size = getSizeFromAge(p.age);
      c[p.id] = { x: pos.x + size / 2, y: pos.y + size / 2, size };
    }
    return c;
  }, [persons, positions]);

  type Pair = {
    a: number;
    b: number;
    labelAB?: string;
    labelBA?: string;
  };

  const relationPairs = React.useMemo(() => {
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
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Left: Text Area */}
      <div className="w-1/3 h-full border-r border-gray-200">
        <div className="h-full p-4 flex flex-col">
          <textarea
            className="flex-1 p-4 font-mono text-sm border rounded-lg bg-white text-gray-900"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your objects here..."
          />
        </div>
      </div>

      {/* Right: Visualization */}
      <div
        ref={containerRef}
        className="relative w-2/3 h-full border rounded-lg p-4 overflow-hidden bg-white"
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            pointerEvents: "none",
          }}
        >
          {/* Lines and labels for each pair */}
          {relationPairs.map((pair, idx) => {
            const aCenter = centers[pair.a];
            const bCenter = centers[pair.b];
            if (!aCenter || !bCenter) return null;

            const x1 = aCenter.x;
            const y1 = aCenter.y;
            const x2 = bCenter.x;
            const y2 = bCenter.y;

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;

            const nx = -dy / len;
            const ny = dx / len;
            const offset = 12;

            const showAB = !!pair.labelAB;
            const showBA = !!pair.labelBA;

            return (
              <g key={idx}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#9CA3AF"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                {showAB && (
                  <text
                    x={showBA ? mx + nx * offset : mx}
                    y={showBA ? my + ny * offset : my}
                    fontSize={12}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#111827"
                    style={{
                      background: "white",
                      pointerEvents: "none",
                      fontWeight: 600,
                    }}
                  >
                    {pair.labelAB}
                  </text>
                )}
                {showBA && (
                  <text
                    x={showAB ? mx - nx * offset : mx}
                    y={showAB ? my - ny * offset : my}
                    fontSize={12}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#111827"
                    style={{
                      background: "white",
                      pointerEvents: "none",
                      fontWeight: 600,
                    }}
                  >
                    {pair.labelBA}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Person nodes */}
        {persons.map((p) => {
          const pos = positions[p.id];
          if (!pos) return null;
          const size = getSizeFromAge(p.age);
          const isDragging = draggedId === p.id;
          const z = zOrder.indexOf(p.id);
          return (
            <div
              key={p.id}
              onMouseDown={(e) => onMouseDown(e, p.id)}
              className="absolute rounded-full border border-gray-400 flex flex-col items-center justify-center text-center font-semibold bg-gray-100 text-gray-900 shadow-sm cursor-grab select-none"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                zIndex: z + 1,
                boxShadow: isDragging
                  ? "0 8px 20px rgba(0,0,0,0.25)"
                  : undefined,
                userSelect: "none",
              }}
            >
              <div style={{ fontSize: Math.max(12, Math.round(size / 7)) }}>
                {p.name}
              </div>
              <div
                style={{
                  fontSize: Math.max(10, Math.round(size / 10)),
                  opacity: 0.85,
                }}
              >{`Age: ${p.age}`}</div>
            </div>
          );
        })}

        {/* placeholder */}
        {persons.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            No person parsed
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
