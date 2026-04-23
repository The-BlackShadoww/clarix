"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Link as LinkIcon, Trash2, Sparkles, Code2, X, User, ArrowRight, ZoomIn, ZoomOut, Maximize, PanelLeftClose, PanelLeftOpen, Copy, Check } from "lucide-react";

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
const NODE_SIZE = 72;

const getSizeFromAge = (_age: number) => {
  return NODE_SIZE;
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
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const panRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

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
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(persons, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
        const maxX = 800; // default spawn area width
        const maxY = 800; // default spawn area height
        newPositions[p.id] = {
          x: Math.random() * maxX,
          y: Math.random() * maxY,
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
      
      // Calculate scaled delta for dragging
      const dx = (ev.clientX - (state.startX ?? ev.clientX)) / transform.scale;
      const dy = (ev.clientY - (state.startY ?? ev.clientY)) / transform.scale;
      
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

  /* ------ Pan & Zoom Logic ------ */
  const onCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.node-circle') || (e.target as HTMLElement).closest('.person-popup')) {
      return;
    }
    // Only start pan if middle click, or primary click on background
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      panRef.current = { startX: e.clientX, startY: e.clientY, startPanX: transform.x, startPanY: transform.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setTransform(prev => ({ ...prev, x: panRef.current.startPanX + dx, y: panRef.current.startPanY + dy }));
    }
  };

  const onCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // We add wheel listener natively in useEffect because React passive synthetic events can't e.preventDefault() to stop page zoom if ctrl is pressed
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.0015;
      const delta = -e.deltaY * zoomSensitivity;
      
      setTransform(prev => {
        let newScale = prev.scale * Math.exp(delta);
        newScale = Math.min(Math.max(newScale, 0.1), 5); // limit scale
        
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
        
        return { x: newX, y: newY, scale: newScale };
      });
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleZoom = (direction: 'in' | 'out') => {
    setTransform(prev => {
      const scaleFactor = direction === 'in' ? 1.2 : 1 / 1.2;
      let newScale = prev.scale * scaleFactor;
      newScale = Math.min(Math.max(newScale, 0.1), 5); // limit scale
      
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

  return (
    <div className="relative h-screen w-full bg-white text-[#1c1c1e] overflow-hidden">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className={`absolute top-6 z-30 transition-all duration-300 bg-white/90 backdrop-blur shadow-sm border-[#e0e2e8] text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white ${isSidebarOpen ? "left-[416px]" : "left-6"}`}
        onClick={() => setIsSidebarOpen(o => !o)}
        title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? <PanelLeftClose className="w-5 h-5"/> : <PanelLeftOpen className="w-5 h-5" />}
      </Button>

      {/* Left Sidebar */}
      <div 
        className={`absolute top-0 left-0 h-full w-full sm:w-[400px] bg-white z-20 flex flex-col ring-shadow transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
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
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-[#555a6a] hover:text-[#1c1c1e] transition-colors duration-200"
                onClick={() => setShowJson(!showJson)}
              >
                <Code2 className="w-4 h-4" />
                {showJson ? "Hide" : "Show"} Raw JSON
              </Button>
              {showJson && (
                <div className="relative group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleCopyJson}
                      className="h-7 w-7 bg-[#282c34] border-[#3e4451] hover:bg-[#3e4451] text-[#a5a8b5] hover:text-white"
                      title="Copy JSON"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-[#00b473]" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <pre className="ring-shadow rounded-xl p-4 text-[12px] font-mono overflow-x-auto whitespace-pre bg-[#1c1c1e] text-[#a5a8b5]">
                    <code>{JSON.stringify(persons, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Canvas Area */}
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
        {/* Zoom Controls */}
        <div 
          className="absolute top-6 right-6 flex flex-col gap-2 z-50 zoom-controls"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button 
            variant="outline" 
            size="icon" 
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-sm border-[#e0e2e8] text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white"
            onClick={() => handleZoom('in')}
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-sm border-[#e0e2e8] text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white"
            onClick={() => handleZoom('out')}
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
            <span className="text-[11px] font-semibold text-[#555a6a]">{Math.round(transform.scale * 100)}%</span>
          </div>
        </div>

        <div 
          className="absolute inset-0"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0"
          }}
        >
          <svg
            className="absolute inset-0 overflow-visible"
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
          const isSelected = selectedPersonId === p.id && !draggedId;
          const z = zOrder.indexOf(p.id);
          const nodeColor = getColorFromName(p.name);
          const relationCount = p.relations.length;
          
          return (
            <div
              key={p.id}
              className="absolute flex flex-col items-center group"
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                zIndex: isSelected ? 45 : z + 1,
              }}
            >
              {/* Relative wrapper for node and badges */}
              <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
                {/* The circle node */}
                <div
                  onMouseDown={(e) => onMouseDown(e, p.id)}
                  className={`node-circle rounded-full w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 ease-out`}
                  style={{
                    boxShadow: isDragging 
                      ? "0 16px 40px rgba(91, 118, 254, 0.22), 0 0 0 3px rgba(91, 118, 254, 0.4)" 
                      : isSelected
                      ? "0 8px 24px rgba(91, 118, 254, 0.15), 0 0 0 2.5px #5b76fe"
                      : "0 2px 8px rgba(0,0,0,0.06), rgb(224,226,232) 0px 0px 0px 1.5px",
                    userSelect: "none",
                    backgroundColor: p.avatar ? "transparent" : nodeColor,
                    transform: isDragging ? "scale(1.1)" : isSelected ? "scale(1.06)" : "scale(1)",
                  }}
                >
                  {p.avatar ? (
                    <div 
                      className="absolute inset-0 w-full h-full bg-cover bg-center" 
                      style={{ backgroundImage: `url(${p.avatar})` }}
                    />
                  ) : (
                    <span 
                      className="font-semibold text-[#1c1c1e] pointer-events-none select-none" 
                      style={{ fontSize: size * 0.38 }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                  
                {/* Delete button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removePerson(p.id);
                  }}
                  className="absolute top-0 right-0 bg-white text-[#e53e3e] rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#fbd4d4] z-20 translate-x-1/4 -translate-y-1/4"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1), rgb(224,226,232) 0px 0px 0px 1px" }}
                  title="Remove person"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Relation count badge */}
                {relationCount > 0 && (
                  <div 
                    className="absolute -bottom-1 -right-1 bg-[#5b76fe] text-white rounded-full flex items-center justify-center font-semibold z-20"
                    style={{ width: 20, height: 20, fontSize: 10, boxShadow: "0 2px 6px rgba(91, 118, 254, 0.3)" }}
                  >
                    {relationCount}
                  </div>
                )}
              </div>
              
              {/* Name label below circle */}
              <div 
                className="mt-1.5 text-center pointer-events-none select-none transition-opacity duration-200"
                style={{ 
                  maxWidth: size + 30,
                  opacity: isDragging ? 0.5 : 1,
                }}
              >
                <span className="text-[11px] font-medium text-[#1c1c1e] leading-tight block truncate">
                  {p.name}
                </span>
              </div>
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
          className={`fixed inset-0 bg-white/40 backdrop-blur-sm z-40 transition-all duration-300 ${selectedPersonId && !draggedId ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"}`} 
        />

        {/* Person Detail Popup */}
        {selectedPersonId && !draggedId && (() => {
          const selectedPerson = persons.find(p => p.id === selectedPersonId);
          const pos = positions[selectedPersonId];
          if (!selectedPerson || !pos) return null;

          const size = getSizeFromAge(selectedPerson.age);
          const nodeColor = getColorFromName(selectedPerson.name);

          const inboundRelations = persons.flatMap(p => 
            p.relations.filter(r => r.id === selectedPerson.id).map(r => ({ ...r, sourceName: p.name, sourceId: p.id }))
          );

          const totalRelations = selectedPerson.relations.length + inboundRelations.length;

          // Position popup centered below or above the node
          const isNearBottom = pos.y > 400;
          const popupTop = isNearBottom ? pos.y - 16 : pos.y + size + 16;
          const popupTransform = isNearBottom ? "translate(-50%, -100%)" : "translateX(-50%)";

          return (
            <div 
              className="absolute z-50 pointer-events-auto cursor-auto person-popup"
              style={{
                left: pos.x + size / 2,
                top: popupTop,
                transform: popupTransform,
                width: 340,
              }}
            >
              <div 
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(20px) saturate(1.4)",
                  WebkitBackdropFilter: "blur(20px) saturate(1.4)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(224,226,232,0.8)",
                }}
              >
                {/* Gradient accent header */}
                <div 
                  className="relative px-6 pt-6 pb-5"
                  style={{
                    background: `linear-gradient(135deg, ${nodeColor}44 0%, ${nodeColor}18 100%)`,
                  }}
                >
                  {/* Close button */}
                  <button 
                    onClick={() => setSelectedPersonId(null)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-all duration-200"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                  >
                    <X className="w-3.5 h-3.5 text-[#555a6a]" />
                  </button>

                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {selectedPerson.avatar ? (
                      <div 
                        className="w-14 h-14 rounded-full bg-cover bg-center shrink-0" 
                        style={{ 
                          backgroundImage: `url(${selectedPerson.avatar})`,
                          boxShadow: `0 4px 14px rgba(0,0,0,0.12), 0 0 0 2.5px white`,
                        }}
                      />
                    ) : (
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold text-[#1c1c1e] shrink-0" 
                        style={{ 
                          backgroundColor: nodeColor,
                          boxShadow: `0 4px 14px ${nodeColor}66, 0 0 0 2.5px white`,
                        }}
                      >
                        {selectedPerson.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-[20px] font-semibold tracking-[-0.4px] text-[#1c1c1e] truncate">
                        {selectedPerson.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[13px] text-[#555a6a] font-medium">
                          Age {selectedPerson.age}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#c7cad5]"></span>
                        <span className="text-[13px] text-[#555a6a] font-medium">
                          {totalRelations} {totalRelations === 1 ? 'link' : 'links'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content body */}
                <div className="px-6 py-5 space-y-4 max-h-[320px] overflow-y-auto popup-scroll">
                  {/* Outbound Relations */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5b76fe]"></div>
                      <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#a5a8b5]">
                        Outgoing Links
                      </h4>
                    </div>
                    {selectedPerson.relations.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedPerson.relations.map((r, i) => {
                          const target = persons.find(p => p.id === r.id);
                          const targetColor = target ? getColorFromName(target.name) : '#e0e2e8';
                          return (
                            <div 
                              key={i} 
                              className="flex items-center gap-2.5 p-2.5 rounded-xl group/rel transition-colors duration-150 hover:bg-[#f5f6f8]"
                            >
                              <div 
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                                style={{ backgroundColor: targetColor }}
                              >
                                {target?.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[13px] text-[#1c1c1e] font-medium truncate block">
                                  {target?.name}
                                </span>
                                <span className="text-[11px] text-[#5b76fe] font-medium italic">
                                  {r.relation}
                                </span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-[#c7cad5]" />
                              <button
                                onClick={(e) => { e.stopPropagation(); removeRelation(selectedPerson.id, r.id); }}
                                className="text-[#c7cad5] hover:text-[#e53e3e] hover:bg-[#fbd4d4] p-1 rounded-md transition-all duration-200 opacity-0 group-hover/rel:opacity-100"
                                title="Delete relation"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#a5a8b5] italic pl-3.5">No outgoing links.</p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#e0e2e8]/60"></div>

                  {/* Inbound Relations */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00b473]"></div>
                      <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#a5a8b5]">
                        Incoming Links
                      </h4>
                    </div>
                    {inboundRelations.length > 0 ? (
                      <div className="space-y-1.5">
                        {inboundRelations.map((r, i) => {
                          const sourceColor = getColorFromName(r.sourceName);
                          return (
                            <div 
                              key={i} 
                              className="flex items-center gap-2.5 p-2.5 rounded-xl group/rel transition-colors duration-150 hover:bg-[#f5f6f8]"
                            >
                              <div 
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                                style={{ backgroundColor: sourceColor }}
                              >
                                {r.sourceName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[13px] text-[#1c1c1e] font-medium truncate block">
                                  {r.sourceName}
                                </span>
                                <span className="text-[11px] text-[#00b473] font-medium italic">
                                  {r.relation}
                                </span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-[#c7cad5] rotate-180" />
                              <button
                                onClick={(e) => { e.stopPropagation(); removeRelation(r.sourceId, selectedPerson.id); }}
                                className="text-[#c7cad5] hover:text-[#e53e3e] hover:bg-[#fbd4d4] p-1 rounded-md transition-all duration-200 opacity-0 group-hover/rel:opacity-100"
                                title="Delete relation"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#a5a8b5] italic pl-3.5">No incoming links.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
