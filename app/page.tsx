"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Link as LinkIcon, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const getColorFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 85%)`;
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
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-full lg:w-96 flex flex-col border-r border-gray-200 bg-white z-10 shadow-sm shrink-0">
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Relation Builder</h2>
              <p className="text-sm text-gray-500">Create nodes and link them below.</p>
            </div>
            
            <Separator />
            
            {/* Add Person Form */}
            <form onSubmit={personForm.handleSubmit(onAddPerson)}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Add Person
                  </CardTitle>
                  <CardDescription>Create a new node in the graph.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="e.g. Alice" {...personForm.register("name")} />
                    {personForm.formState.errors.name && (
                      <p className="text-xs text-red-500">{personForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" placeholder="e.g. 28" {...personForm.register("age")} />
                    {personForm.formState.errors.age && (
                      <p className="text-xs text-red-500">{personForm.formState.errors.age.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL (Optional)</Label>
                    <Input id="avatar" type="url" placeholder="https://..." {...personForm.register("avatar")} />
                    {personForm.formState.errors.avatar && (
                      <p className="text-xs text-red-500">{personForm.formState.errors.avatar.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">Create Person</Button>
                </CardContent>
              </Card>
            </form>

            <Separator />

            {/* Add Relation Form */}
            <form onSubmit={relationForm.handleSubmit(onAddRelation)}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Add Relation
                  </CardTitle>
                  <CardDescription>Link two existing people together.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Source Person</Label>
                    <Controller
                      name="sourceId"
                      control={relationForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <SelectTrigger>
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
                      <p className="text-xs text-red-500">{relationForm.formState.errors.sourceId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Target Person</Label>
                    <Controller
                      name="targetId"
                      control={relationForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <SelectTrigger>
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
                      <p className="text-xs text-red-500">{relationForm.formState.errors.targetId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationLabel">Relation Label</Label>
                    <Input id="relationLabel" placeholder="e.g. friend, sibling" {...relationForm.register("relationLabel")} />
                    {relationForm.formState.errors.relationLabel && (
                      <p className="text-xs text-red-500">{relationForm.formState.errors.relationLabel.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" variant="secondary" className="w-full">Create Link</Button>
                </CardContent>
              </Card>
            </form>

            <Separator />
            
            {/* JSON Output block to fulfill "user's data will be converted into json data" */}
            <div className="space-y-2 pb-4">
              <Label>Raw JSON Output</Label>
              <div className="bg-gray-900 rounded-md p-4 text-xs text-gray-100 font-mono overflow-x-auto whitespace-pre">
                {JSON.stringify(persons, null, 2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Canvas Area */}
      <div 
        ref={containerRef}
        className="relative flex-1 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] overflow-hidden"
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
                <path stroke="#9CA3AF" strokeWidth={2} fill="none" strokeLinecap="round">
                  <animate 
                    attributeName="d" 
                    values={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}; M ${x1} ${y1} Q ${cx2} ${cy2} ${x2} ${y2}; M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`} 
                    dur={`${dur}s`} 
                    repeatCount="indefinite" 
                  />
                </path>
                {showAB && (
                  <text
                    x={tX1 + (showBA ? nx * offset : 0)}
                    y={tY1 + (showBA ? ny * offset : 0)}
                    fontSize={12}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#111827"
                    style={{ background: "white", pointerEvents: "none", fontWeight: 600 }}
                  >
                    <animate attributeName="x" values={`${tX1 + (showBA ? nx * offset : 0)}; ${tX2 + (showBA ? nx * offset : 0)}; ${tX1 + (showBA ? nx * offset : 0)}`} dur={`${dur}s`} repeatCount="indefinite" />
                    <animate attributeName="y" values={`${tY1 + (showBA ? ny * offset : 0)}; ${tY2 + (showBA ? ny * offset : 0)}; ${tY1 + (showBA ? ny * offset : 0)}`} dur={`${dur}s`} repeatCount="indefinite" />
                    {pair.labelAB}
                  </text>
                )}
                {showBA && (
                  <text
                    x={tX1 - (showAB ? nx * offset : 0)}
                    y={tY1 - (showAB ? ny * offset : 0)}
                    fontSize={12}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#111827"
                    style={{ background: "white", pointerEvents: "none", fontWeight: 600 }}
                  >
                    <animate attributeName="x" values={`${tX1 - (showAB ? nx * offset : 0)}; ${tX2 - (showAB ? nx * offset : 0)}; ${tX1 - (showAB ? nx * offset : 0)}`} dur={`${dur}s`} repeatCount="indefinite" />
                    <animate attributeName="y" values={`${tY1 - (showAB ? ny * offset : 0)}; ${tY2 - (showAB ? ny * offset : 0)}; ${tY1 - (showAB ? ny * offset : 0)}`} dur={`${dur}s`} repeatCount="indefinite" />
                    {pair.labelBA}
                  </text>
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
          
          return (
              <div
              key={p.id}
              onMouseDown={(e) => onMouseDown(e, p.id)}
              className={`absolute rounded-full border flex flex-col items-center justify-center text-center font-semibold shadow-md cursor-grab active:cursor-grabbing hover:border-gray-500 transition-colors group overflow-hidden ${p.avatar ? 'text-white border-transparent' : 'text-gray-900 border-gray-300'}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                zIndex: selectedPersonId === p.id && !draggedId ? 45 : z + 1,
                boxShadow: isDragging ? "0 8px 20px rgba(0,0,0,0.15)" : undefined,
                userSelect: "none",
                backgroundColor: p.avatar ? "transparent" : getColorFromName(p.name),
              }}
            >
              {p.avatar ? (
                <>
                  <div 
                    className="absolute inset-0 w-full h-full bg-cover bg-center" 
                    style={{ backgroundImage: `url(${p.avatar})` }}
                  />
                  {/* Subtle dark gradient to ensure text readability */}
                  <div className="absolute inset-0 w-full h-full bg-black/40 group-hover:bg-black/50 transition-colors" />
                </>
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-10">
                  <span className="font-black text-black pointer-events-none" style={{ fontSize: size * 0.7 }}>
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="relative z-10" style={{ fontSize: Math.max(12, Math.round(size / 7)) }}>{p.name}</div>
              <div className={`relative z-10 font-medium ${p.avatar ? 'text-gray-200' : 'text-gray-700'}`} style={{ fontSize: Math.max(10, Math.round(size / 10)) }}>
                {`Age: ${p.age}`}
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removePerson(p.id);
                }}
                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-20"
                title="Remove person"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {persons.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            No nodes found. Add a person using the sidebar!
          </div>
        )}

        {/* Canvas Backdrop Blur */}
        <div 
          onClick={() => setSelectedPersonId(null)}
          className={`absolute inset-0 bg-gray-50/10 backdrop-blur-sm z-40 transition-all duration-300 ${selectedPersonId && !draggedId ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"}`} 
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
              className="absolute w-80 bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200 rounded-2xl z-50 p-5 pointer-events-auto transition-all duration-200 animate-in fade-in zoom-in-95 cursor-auto"
              style={{
                left: pos.x + size / 2,
                top: isNearTop ? pos.y + size + 20 : pos.y - 20,
                transform: isNearTop ? "translateX(-50%)" : "translate(-50%, -100%)",
              }}
            >
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 pb-2 border-b">Node Details</h2>
              <div className="space-y-5">
                <div className="flex items-center space-x-4">
                  {selectedPerson.avatar ? (
                    <div className="w-14 h-14 rounded-full bg-cover bg-center shadow-sm border border-gray-200" style={{ backgroundImage: `url(${selectedPerson.avatar})` }} />
                  ) : (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-sm border border-gray-200" style={{ backgroundColor: getColorFromName(selectedPerson.name) }}>
                      {selectedPerson.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{selectedPerson.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">Age: {selectedPerson.age}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <h4 className="font-semibold mb-2 text-gray-800 text-xs uppercase tracking-wide">Relations From Them</h4>
                  {selectedPerson.relations.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
                      {selectedPerson.relations.map((r, i) => {
                         const target = persons.find(p => p.id === r.id);
                         return (
                           <li key={i} className="flex items-start justify-between group">
                             <span className="flex-1 pr-2"><span className="font-medium text-gray-900">{selectedPerson.name}</span> is <span className="italic font-medium">{r.relation}</span> of <span className="font-medium text-gray-900">{target?.name}</span></span>
                             <button
                               onClick={(e) => { e.stopPropagation(); removeRelation(selectedPerson.id, r.id); }}
                               className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                               title="Delete relation"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </li>
                         );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No relations mapped from this person.</p>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <h4 className="font-semibold mb-2 text-gray-800 text-xs uppercase tracking-wide">Relations To Them</h4>
                  {inboundRelations.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
                      {inboundRelations.map((r, i) => (
                         <li key={i} className="flex items-start justify-between group">
                           <span className="flex-1 pr-2"><span className="font-medium text-gray-900">{r.sourceName}</span> is <span className="italic font-medium">{r.relation}</span> of <span className="font-medium text-gray-900">{selectedPerson.name}</span></span>
                           <button
                               onClick={(e) => { e.stopPropagation(); removeRelation(r.sourceId, selectedPerson.id); }}
                               className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                               title="Delete relation"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                         </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No relations mapped to this person.</p>
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
