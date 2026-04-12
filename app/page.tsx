"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Link as LinkIcon, Trash2, Sparkles, Code2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Relation = {
  id: number;
  relation: string;
};

type Person = {
  id: number;
  name: string;
  age: number;
  avatar?: string;
  relations: Relation[];
};

// Zod schemas
const personSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.string().min(1, "Age is required"),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const relationSchema = z.object({
  sourceId: z.string().min(1, "Please select a source person"),
  targetId: z.string().min(1, "Please select a target person"),
  relationLabel: z.string().min(1, "Relation label is required"),
});

/* -------------------- Visual / Layout helpers -------------------- */
const MIN_SIZE = 60;
const MAX_SIZE = 180;
const MAX_AGE_FOR_SCALE = 100;

const getSizeFromAge = (age: number) => {
  const capped = Math.max(0, Math.min(MAX_AGE_FOR_SCALE, age));
  return MIN_SIZE + (capped / MAX_AGE_FOR_SCALE) * (MAX_SIZE - MIN_SIZE);
};

/* Miro pastel palette for node colors */
const MIRO_PASTELS = [
  "#ffc6c6", // coral
  "#ffd8f4", // rose
  "#c3faf5", // teal
  "#ffe6cd", // orange
  "#fde0f0", // pink
  "#d4e4ff", // light blue
  "#e0f5d0", // light green
  "#fff3c6", // light yellow
];

const getColorFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MIRO_PASTELS[Math.abs(hash) % MIRO_PASTELS.length];
};

/* -------------------- Main Component -------------------- */
export default function Home() {
  const [persons, setPersons] = useState<Person[]>([
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

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
  const [zOrder, setZOrder] = useState<number[]>([]);
  const draggingRef = useRef<{
    id: number | null;
    startX?: number;
    startY?: number;
    originX?: number;
    originY?: number;
  }>({ id: null });
  const [draggedId, setDraggedId] = useState<number | null>(null);
  
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [showJson, setShowJson] = useState(true);

  /* ------ Form Logic ------ */
  const personForm = useForm<z.infer<typeof personSchema>>({
    resolver: zodResolver(personSchema),
    defaultValues: { name: "", age: "", avatar: "" },
  });

  const relationForm = useForm<z.infer<typeof relationSchema>>({
    resolver: zodResolver(relationSchema),
    defaultValues: { relationLabel: "", sourceId: "", targetId: "" },
  });

  const onAddPerson = (values: z.infer<typeof personSchema>) => {
    const newId = persons.length > 0 ? Math.max(...persons.map((p) => p.id)) + 1 : 1;
    setPersons((prev) => [
      ...prev,
      { id: newId, name: values.name, age: Number(values.age), avatar: values.avatar || undefined, relations: [] },
    ]);
    personForm.reset({ name: "", age: "", avatar: "" });
  };

  const onAddRelation = (values: z.infer<typeof relationSchema>) => {
    const sId = Number(values.sourceId);
    const tId = Number(values.targetId);
    if (sId === tId) {
      relationForm.setError("targetId", { message: "Cannot relate to same person" });
      return;
    }
    setPersons((prev) =>
      prev.map((person) => {
        if (person.id === sId) {
          // Check if relation already exists
          const exists = person.relations.some((r) => r.id === tId);
          if (exists) return person;
          return {
            ...person,
            relations: [...person.relations, { id: tId, relation: values.relationLabel }],
          };
        }
        return person;
      })
    );
    relationForm.reset({ relationLabel: "", sourceId: "", targetId: "" });
  };

  const removePerson = (id: number) => {
    setPersons((prev) => prev.filter((p) => p.id !== id).map(p => ({
        ...p,
        relations: p.relations.filter(r => r.id !== id)
    })));
  };

  const removeRelation = (sourceId: number, targetId: number) => {
    setPersons((prev) => prev.map((p) => {
      if (p.id === sourceId) {
        return {
          ...p,
          relations: p.relations.filter(r => r.id !== targetId)
        };
      }
      return p;
    }));
  };

  /* ------ Graph Layout Logic ------ */
  useEffect(() => {
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const newPositions: Record<number, { x: number; y: number }> = { ...positions };

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
            Math.min(newPositions[p.id].x, Math.max(0, rect.width - size))
          );
          newPositions[p.id].y = Math.max(
            0,
            Math.min(newPositions[p.id].y, Math.max(0, rect.height - size))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons]);

  const onMouseDown = (e: React.MouseEvent, id: number) => {
    // Only drag if left click and not clicking on a button inside
    if ((e.target as HTMLElement).closest('button')) return;
    
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

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      
      const state = draggingRef.current;
      if (state && state.id !== null) {
        const dx = ev.clientX - (state.startX ?? ev.clientX);
        const dy = ev.clientY - (state.startY ?? ev.clientY);
        const dist = Math.hypot(dx, dy);
        
        // If movement is negligible, treat as a click
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

  type Pair = { a: number; b: number; labelAB?: string; labelBA?: string; };

  const relationPairs = useMemo(() => {
    const map = new Map<string, Pair>();
    for (const p of persons) {
      for (const r of p.relations) {
        const source = p.id;
        const target = r.id;
        if (source === target) continue;
        const key = source < target ? `${source}-${target}` : `${target}-${source}`;
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
    <div className="flex flex-col lg:flex-row h-screen bg-white text-[#1c1c1e] overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white z-10 shrink-0 ring-shadow">
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-[#5b76fe] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-[24px] font-semibold tracking-[-0.72px] leading-[1.15] text-[#1c1c1e]">
                  Relation Builder
                </h1>
              </div>
              <p className="text-[14px] text-[#555a6a] leading-relaxed ml-[42px]">
                Create nodes and link them on the canvas.
              </p>
            </div>
            
            <Separator className="bg-[#e0e2e8]" />
            
            {/* Add Person Form */}
            <form onSubmit={personForm.handleSubmit(onAddPerson)}>
              <Card className="bg-[#fff8f6] border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[16px] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#ffc6c6] flex items-center justify-center">
                      <PlusCircle className="w-3.5 h-3.5 text-[#600000]" />
                    </div>
                    Add Person
                  </CardTitle>
                  <CardDescription>Create a new node in the graph.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[13px] font-medium text-[#555a6a]">Name</Label>
                    <Input id="name" placeholder="e.g. Alice" {...personForm.register("name")} />
                    {personForm.formState.errors.name && (
                      <p className="text-xs text-[#e53e3e]">{personForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="age" className="text-[13px] font-medium text-[#555a6a]">Age</Label>
                    <Input id="age" type="number" placeholder="e.g. 28" {...personForm.register("age")} />
                    {personForm.formState.errors.age && (
                      <p className="text-xs text-[#e53e3e]">{personForm.formState.errors.age.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="avatar" className="text-[13px] font-medium text-[#555a6a]">Avatar URL <span className="text-[#a5a8b5]">(Optional)</span></Label>
                    <Input id="avatar" type="url" placeholder="https://..." {...personForm.register("avatar")} />
                    {personForm.formState.errors.avatar && (
                      <p className="text-xs text-[#e53e3e]">{personForm.formState.errors.avatar.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full mt-1">Create Person</Button>
                </CardContent>
              </Card>
            </form>

            <Separator className="bg-[#e0e2e8]" />

            {/* Add Relation Form */}
            <form onSubmit={relationForm.handleSubmit(onAddRelation)}>
              <Card className="bg-[#f5fffe] border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[16px] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#c3faf5] flex items-center justify-center">
                      <LinkIcon className="w-3.5 h-3.5 text-[#187574]" />
                    </div>
                    Add Relation
                  </CardTitle>
                  <CardDescription>Link two existing people together.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-[#555a6a]">Source Person</Label>
                    <Controller
                      name="sourceId"
                      control={relationForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select origin..." />
                          </SelectTrigger>
                          <SelectContent>
                            {persons.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {relationForm.formState.errors.sourceId && (
                      <p className="text-xs text-[#e53e3e]">{relationForm.formState.errors.sourceId.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-[#555a6a]">Target Person</Label>
                    <Controller
                      name="targetId"
                      control={relationForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select destination..." />
                          </SelectTrigger>
                          <SelectContent>
                            {persons.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {relationForm.formState.errors.targetId && (
                      <p className="text-xs text-[#e53e3e]">{relationForm.formState.errors.targetId.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="relationLabel" className="text-[13px] font-medium text-[#555a6a]">Relation Label</Label>
                    <Input id="relationLabel" placeholder="e.g. friend, sibling" {...relationForm.register("relationLabel")} />
                    {relationForm.formState.errors.relationLabel && (
                      <p className="text-xs text-[#e53e3e]">{relationForm.formState.errors.relationLabel.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" variant="outline" className="w-full mt-1">Create Link</Button>
                </CardContent>
              </Card>
            </form>

            <Separator className="bg-[#e0e2e8]" />
            
            {/* JSON Output toggle */}
            <div className="space-y-2.5 pb-4">
              <button
                onClick={() => setShowJson(!showJson)}
                className="flex items-center gap-2 text-[13px] font-medium text-[#555a6a] hover:text-[#1c1c1e] transition-colors duration-200"
              >
                <Code2 className="w-4 h-4" />
                {showJson ? "Hide" : "Show"} Raw JSON
              </button>
              {showJson && (
                <div className="ring-shadow rounded-xl p-4 text-[12px] text-[#555a6a] font-mono overflow-x-auto whitespace-pre bg-[#f9fafb]">
                  {JSON.stringify(persons, null, 2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Canvas Area */}
      <div 
        ref={containerRef}
        className="relative flex-1 h-full w-full overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage: "radial-gradient(#e0e2e8 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        >
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
            const dist = Math.hypot(dx, dy) || 1;
            
            const drop = Math.min(dist * 0.4, 150);
            const isAttachedToDragged = pair.a === draggedId || pair.b === draggedId;
            const sway = isAttachedToDragged ? Math.min(dist * 0.15, 60) : 0;
            const dur = 3 + (idx % 3) * 0.5;

            const cx1 = mx + sway;
            const cy1 = my + drop;
            const cx2 = mx - sway;
            const cy2 = my + drop;
            
            const tX1 = 0.25 * x1 + 0.5 * cx1 + 0.25 * x2;
            const tY1 = 0.25 * y1 + 0.5 * cy1 + 0.25 * y2;
            const tX2 = 0.25 * x1 + 0.5 * cx2 + 0.25 * x2;
            const tY2 = 0.25 * y1 + 0.5 * cy2 + 0.25 * y2;

            const nx = -dy / dist;
            const ny = dx / dist;
            const offset = 14;

            const showAB = !!pair.labelAB;
            const showBA = !!pair.labelBA;

            return (
              <g key={idx}>
                <path stroke="#c7cad5" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="6 4">
                  <animate 
                    attributeName="d" 
                    values={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}; M ${x1} ${y1} Q ${cx2} ${cy2} ${x2} ${y2}; M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`} 
                    dur={`${dur}s`} 
                    repeatCount="indefinite" 
                  />
                </path>
                {showAB && (
                  <g>
                    <rect
                      rx="4"
                      ry="4"
                      fill="white"
                      stroke="#e0e2e8"
                      strokeWidth="1"
                      x={tX1 + (showBA ? nx * offset : 0) - 24}
                      y={tY1 + (showBA ? ny * offset : 0) - 10}
                      width="48"
                      height="20"
                    >
                      <animate attributeName="x" values={`${tX1 + (showBA ? nx * offset : 0) - 24}; ${tX2 + (showBA ? nx * offset : 0) - 24}; ${tX1 + (showBA ? nx * offset : 0) - 24}`} dur={`${dur}s`} repeatCount="indefinite" />
                      <animate attributeName="y" values={`${tY1 + (showBA ? ny * offset : 0) - 10}; ${tY2 + (showBA ? ny * offset : 0) - 10}; ${tY1 + (showBA ? ny * offset : 0) - 10}`} dur={`${dur}s`} repeatCount="indefinite" />
                    </rect>
                    <text
                      x={tX1 + (showBA ? nx * offset : 0)}
                      y={tY1 + (showBA ? ny * offset : 0)}
                      fontSize={11}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill="#555a6a"
                      style={{ pointerEvents: "none", fontWeight: 500, fontFamily: "var(--font-sans)" }}
                    >
                      <animate attributeName="x" values={`${tX1 + (showBA ? nx * offset : 0)}; ${tX2 + (showBA ? nx * offset : 0)}; ${tX1 + (showBA ? nx * offset : 0)}`} dur={`${dur}s`} repeatCount="indefinite" />
                      <animate attributeName="y" values={`${tY1 + (showBA ? ny * offset : 0)}; ${tY2 + (showBA ? ny * offset : 0)}; ${tY1 + (showBA ? ny * offset : 0)}`} dur={`${dur}s`} repeatCount="indefinite" />
                      {pair.labelAB}
                    </text>
                  </g>
                )}
                {showBA && (
                  <g>
                    <rect
                      rx="4"
                      ry="4"
                      fill="white"
                      stroke="#e0e2e8"
                      strokeWidth="1"
                      x={tX1 - (showAB ? nx * offset : 0) - 24}
                      y={tY1 - (showAB ? ny * offset : 0) - 10}
                      width="48"
                      height="20"
                    >
                      <animate attributeName="x" values={`${tX1 - (showAB ? nx * offset : 0) - 24}; ${tX2 - (showAB ? nx * offset : 0) - 24}; ${tX1 - (showAB ? nx * offset : 0) - 24}`} dur={`${dur}s`} repeatCount="indefinite" />
                      <animate attributeName="y" values={`${tY1 - (showAB ? ny * offset : 0) - 10}; ${tY2 - (showAB ? ny * offset : 0) - 10}; ${tY1 - (showAB ? ny * offset : 0) - 10}`} dur={`${dur}s`} repeatCount="indefinite" />
                    </rect>
                    <text
                      x={tX1 - (showAB ? nx * offset : 0)}
                      y={tY1 - (showAB ? ny * offset : 0)}
                      fontSize={11}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill="#555a6a"
                      style={{ pointerEvents: "none", fontWeight: 500, fontFamily: "var(--font-sans)" }}
                    >
                      <animate attributeName="x" values={`${tX1 - (showAB ? nx * offset : 0)}; ${tX2 - (showAB ? nx * offset : 0)}; ${tX1 - (showAB ? nx * offset : 0)}`} dur={`${dur}s`} repeatCount="indefinite" />
                      <animate attributeName="y" values={`${tY1 - (showAB ? ny * offset : 0)}; ${tY2 - (showAB ? ny * offset : 0)}; ${tY1 - (showAB ? ny * offset : 0)}`} dur={`${dur}s`} repeatCount="indefinite" />
                      {pair.labelBA}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {persons.map((p) => {
          const pos = positions[p.id];
          if (!pos) return null;
          const size = getSizeFromAge(p.age);
          const isDragging = draggedId === p.id;
          const z = zOrder.indexOf(p.id);
          const nodeColor = getColorFromName(p.name);
          
          return (
              <div
              key={p.id}
              onMouseDown={(e) => onMouseDown(e, p.id)}
              className={`absolute rounded-full flex flex-col items-center justify-center text-center font-medium cursor-grab active:cursor-grabbing group overflow-hidden ${p.avatar ? 'text-white' : 'text-[#1c1c1e]'}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                zIndex: selectedPersonId === p.id && !draggedId ? 45 : z + 1,
                boxShadow: isDragging 
                  ? "0 12px 28px rgba(91, 118, 254, 0.18), rgb(224,226,232) 0px 0px 0px 2px" 
                  : "rgb(224,226,232) 0px 0px 0px 1.5px",
                userSelect: "none",
                backgroundColor: p.avatar ? "transparent" : nodeColor,
                transform: isDragging ? "scale(1.05)" : "scale(1)",
              }}
            >
              {p.avatar ? (
                <>
                  <div 
                    className="absolute inset-0 w-full h-full bg-cover bg-center" 
                    style={{ backgroundImage: `url(${p.avatar})` }}
                  />
                  {/* Subtle dark gradient to ensure text readability */}
                  <div className="absolute inset-0 w-full h-full bg-black/35 group-hover:bg-black/45 transition-colors duration-200" />
                </>
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-[0.08]">
                  <span className="font-bold text-[#1c1c1e] pointer-events-none" style={{ fontSize: size * 0.65 }}>
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="relative z-10 font-semibold" style={{ fontSize: Math.max(12, Math.round(size / 7)) }}>{p.name}</div>
              <div className={`relative z-10 font-normal ${p.avatar ? 'text-white/80' : 'text-[#555a6a]'}`} style={{ fontSize: Math.max(10, Math.round(size / 10)) }}>
                {`Age: ${p.age}`}
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removePerson(p.id);
                }}
                className="absolute -top-1.5 -right-1.5 bg-[#fbd4d4] text-[#e53e3e] rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#ffc6c6] z-20 ring-shadow"
                title="Remove person"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {persons.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#a5a8b5] gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f6f8] flex items-center justify-center ring-shadow">
              <Sparkles className="w-7 h-7 text-[#c7cad5]" />
            </div>
            <p className="text-[15px] font-medium">No nodes yet</p>
            <p className="text-[13px]">Add a person using the sidebar to get started.</p>
          </div>
        )}

        {/* Canvas Backdrop Blur */}
        <div 
          onClick={() => setSelectedPersonId(null)}
          className={`absolute inset-0 bg-white/40 backdrop-blur-sm z-40 transition-all duration-300 ${selectedPersonId && !draggedId ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"}`} 
        />

        {/* Hover Information Panel */}
        {selectedPersonId && !draggedId && (() => {
          const selectedPerson = persons.find(p => p.id === selectedPersonId);
          const pos = positions[selectedPersonId];
          if (!selectedPerson || !pos) return null;

          const size = getSizeFromAge(selectedPerson.age);
          const isNearTop = pos.y < 350;

          const inboundRelations = persons.flatMap(p => 
            p.relations.filter(r => r.id === selectedPerson.id).map(r => ({ ...r, sourceName: p.name, sourceId: p.id }))
          );

          return (
            <div 
              className="absolute w-[320px] bg-white/98 backdrop-blur-md z-50 p-6 pointer-events-auto transition-all duration-200 animate-in fade-in zoom-in-95 cursor-auto rounded-2xl"
              style={{
                left: pos.x + size / 2,
                top: isNearTop ? pos.y + size + 20 : pos.y - 20,
                transform: isNearTop ? "translateX(-50%)" : "translate(-50%, -100%)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.08), rgb(224,226,232) 0px 0px 0px 1px",
              }}
            >
              <h2 className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#a5a8b5] mb-4 pb-2.5 border-b border-[#e0e2e8]">Node Details</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {selectedPerson.avatar ? (
                    <div className="w-12 h-12 rounded-full bg-cover bg-center ring-shadow" style={{ backgroundImage: `url(${selectedPerson.avatar})` }} />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ring-shadow" style={{ backgroundColor: getColorFromName(selectedPerson.name) }}>
                      {selectedPerson.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-[-0.36px] text-[#1c1c1e]">{selectedPerson.name}</h3>
                    <p className="text-[13px] text-[#555a6a] font-medium">Age: {selectedPerson.age}</p>
                  </div>
                </div>
                
                <div className="bg-[#f9fafb] rounded-xl p-3.5 ring-shadow">
                  <h4 className="font-semibold mb-2 text-[#1c1c1e] text-[10.5px] uppercase tracking-[0.06em]">Relations From Them</h4>
                  {selectedPerson.relations.length > 0 ? (
                    <ul className="space-y-1.5 text-[13px] text-[#555a6a]">
                      {selectedPerson.relations.map((r, i) => {
                         const target = persons.find(p => p.id === r.id);
                         return (
                           <li key={i} className="flex items-start justify-between group/rel">
                             <span className="flex-1 pr-2 leading-relaxed"><span className="font-medium text-[#1c1c1e]">{selectedPerson.name}</span> is <span className="italic font-medium text-[#5b76fe]">{r.relation}</span> of <span className="font-medium text-[#1c1c1e]">{target?.name}</span></span>
                             <button
                               onClick={(e) => { e.stopPropagation(); removeRelation(selectedPerson.id, r.id); }}
                               className="text-[#c7cad5] hover:text-[#e53e3e] hover:bg-[#fbd4d4] p-1 rounded-md transition-all duration-200 opacity-0 group-hover/rel:opacity-100"
                               title="Delete relation"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                           </li>
                         );
                      })}
                    </ul>
                  ) : (
                    <p className="text-[12px] text-[#a5a8b5] italic">No relations mapped from this person.</p>
                  )}
                </div>
                
                <div className="bg-[#f9fafb] rounded-xl p-3.5 ring-shadow">
                  <h4 className="font-semibold mb-2 text-[#1c1c1e] text-[10.5px] uppercase tracking-[0.06em]">Relations To Them</h4>
                  {inboundRelations.length > 0 ? (
                    <ul className="space-y-1.5 text-[13px] text-[#555a6a]">
                      {inboundRelations.map((r, i) => (
                         <li key={i} className="flex items-start justify-between group/rel">
                           <span className="flex-1 pr-2 leading-relaxed"><span className="font-medium text-[#1c1c1e]">{r.sourceName}</span> is <span className="italic font-medium text-[#5b76fe]">{r.relation}</span> of <span className="font-medium text-[#1c1c1e]">{selectedPerson.name}</span></span>
                           <button
                               onClick={(e) => { e.stopPropagation(); removeRelation(r.sourceId, selectedPerson.id); }}
                               className="text-[#c7cad5] hover:text-[#e53e3e] hover:bg-[#fbd4d4] p-1 rounded-md transition-all duration-200 opacity-0 group-hover/rel:opacity-100"
                               title="Delete relation"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                         </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12px] text-[#a5a8b5] italic">No relations mapped to this person.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
