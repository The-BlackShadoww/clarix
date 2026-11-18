"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleDot, FileImage, GitFork, LayoutTemplate, Maximize, Orbit, UserPlus } from "lucide-react";

import type { Person, Point, RelationType, Selection, Tool } from "@/types";
import { GRID_SIZE, ZOOM_MAX, ZOOM_MIN } from "@/constants";
import { clamp } from "@/utils";
import { useBoard, parseBoard } from "@/hooks/useBoard";
import { useCamera } from "@/hooks/useCamera";
import { buildEdges, computeLayout, edgeKey, findPath, getBounds, type Edge, type LayoutKind } from "@/lib/graph";
import { boardFromTemplate, EMPTY_BOARD, type Template } from "@/lib/templates";
import { exportJson, exportPng, exportSvg } from "@/lib/exporters";
import { cn } from "@/lib/utils";

import { PersonCard, type CardState } from "./PersonCard";
import { EdgeLayer, type EdgeState } from "./EdgeLayer";
import { Toolbar, ToolHint } from "./Toolbar";
import { TopBar } from "./TopBar";
import { Legend, NavigationControls } from "./BottomBar";
import { EdgeInspector, PersonInspector } from "./Inspector";
import {
  CommandPalette,
  EmptyState,
  PathBanner,
  PersonDot,
  RelationComposer,
  ShortcutsDialog,
  TemplatesDialog,
  Toast,
  type Command,
} from "./Overlays";

type Composer = { from: number; to: number; at: Point };

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The Clarix board: an infinite canvas of people and relationships with
 * Miro-style tools, auto-layout, path finding, search, minimap and export.
 */
export default function Board() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const store = useBoard();
  const { board } = store;
  const cam = useCamera(containerRef);
  const { camera } = cam;

  const [tool, setTool] = useState<Tool>("select");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [newPersonId, setNewPersonId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [draft, setDraft] = useState<{ from: number; to: Point; target: number | null } | null>(null);
  const [composer, setComposer] = useState<Composer | null>(null);
  const [pathQuery, setPathQuery] = useState<{ from: number; to: number } | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<RelationType>>(new Set());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const lastLayout = useRef<LayoutKind>("tree");
  /** rAF id of the running auto-layout animation, so a new layout/undo can cancel it. */
  const layoutAnim = useRef<number | null>(null);
  /** Active two-finger pinch gesture (touch); while set, single-pointer gestures pause. */
  const pinchRef = useRef<{ dist: number; mid: Point; cam: { x: number; y: number; scale: number } } | null>(null);

  /* ----------------------------- derived ----------------------------- */

  const allEdges = useMemo(() => buildEdges(board.persons), [board.persons]);
  const edges = useMemo(() => allEdges.filter((e) => !hiddenTypes.has(e.type)), [allEdges, hiddenTypes]);
  const personById = useMemo(() => new Map(board.persons.map((p) => [p.id, p])), [board.persons]);

  const degree = useMemo(() => {
    const d = new Map<number, number>();
    for (const e of allEdges) {
      d.set(e.source, (d.get(e.source) ?? 0) + 1);
      d.set(e.target, (d.get(e.target) ?? 0) + 1);
    }
    return d;
  }, [allEdges]);

  const typeCounts = useMemo(() => {
    const c = { family: 0, work: 0, friend: 0, other: 0 } as Record<RelationType, number>;
    allEdges.forEach((e) => c[e.type]++);
    return c;
  }, [allEdges]);

  const path = useMemo(
    () => (pathQuery ? findPath(edges, pathQuery.from, pathQuery.to) : null),
    [edges, pathQuery],
  );

  const selectedPerson = selection?.kind === "person" ? personById.get(selection.id) : undefined;
  const selectedEdge =
    selection?.kind === "edge"
      ? allEdges.find((e) => e.source === selection.source && e.target === selection.target)
      : undefined;
  const selectedEdgeKey = selectedEdge ? edgeKey(selectedEdge.source, selectedEdge.target) : null;

  // Focus mode: highlight the selected person's neighbourhood or the found path.
  const focus = useMemo(() => {
    if (pathQuery && path) {
      return {
        nodes: new Set(path.nodes),
        edges: new Set(path.edges.map((e) => edgeKey(e.source, e.target))),
        mode: "path" as const,
      };
    }
    if (selection?.kind === "person" && draggingId === null) {
      const nodes = new Set([selection.id]);
      const es = new Set<string>();
      for (const e of edges) {
        if (e.source === selection.id || e.target === selection.id) {
          nodes.add(e.source);
          nodes.add(e.target);
          es.add(edgeKey(e.source, e.target));
        }
      }
      return { nodes, edges: es, mode: "neighbours" as const };
    }
    return null;
  }, [pathQuery, path, selection, edges, draggingId]);

  const cardState = (id: number): CardState => {
    if (!focus) return "normal";
    if (!focus.nodes.has(id)) return "dimmed";
    if (focus.mode === "path") return "path";
    return selection?.kind === "person" && selection.id === id ? "normal" : "highlight";
  };

  const edgeState = useCallback(
    (e: Edge): EdgeState => {
      if (!focus) return "normal";
      const k = edgeKey(e.source, e.target);
      if (!focus.edges.has(k)) return "dimmed";
      return focus.mode === "path" ? "path" : "highlight";
    },
    [focus],
  );

  /* ----------------------------- helpers ----------------------------- */

  const notify = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const fitAll = useCallback(
    (animate = true) => cam.fitBounds(getBounds(board.positions), { animate }),
    [cam, board.positions],
  );

  const focusPerson = useCallback(
    (id: number) => {
      const pos = board.positions[id];
      // Shift left a little so the card isn't hidden behind the inspector panel.
      const offset = cam.viewport().w > 900 ? -170 : 0;
      if (pos) cam.centerOn(pos, Math.max(cam.cameraRef.current.scale, 1.1), offset);
    },
    [board.positions, cam],
  );

  const selectPerson = useCallback((id: number) => {
    setSelection({ kind: "person", id });
    setPathQuery(null);
  }, []);

  /** Stops a running layout animation, committing whatever frame it reached as one undo step. */
  const stopLayoutAnimation = useCallback(() => {
    if (layoutAnim.current === null) return;
    cancelAnimationFrame(layoutAnim.current);
    layoutAnim.current = null;
    store.endTransient();
  }, [store]);

  /** Animate every card from its current spot to the computed layout (one undo step). */
  const runLayout = useCallback(
    (kind: LayoutKind) => {
      if (board.persons.length === 0) return;
      stopLayoutAnimation();
      lastLayout.current = kind;
      const from = board.positions;
      const to = computeLayout(kind, board.persons, allEdges, from);
      store.beginTransient();
      const start = performance.now();
      const duration = 650;
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const k = easeInOut(t);
        const frame: Record<number, Point> = {};
        for (const id of Object.keys(to).map(Number)) {
          const a = from[id] ?? to[id];
          frame[id] = { x: a.x + (to[id].x - a.x) * k, y: a.y + (to[id].y - a.y) * k };
        }
        store.setPositions(frame, "transient");
        if (t < 1) {
          layoutAnim.current = requestAnimationFrame(tick);
        } else {
          layoutAnim.current = null;
          store.endTransient();
        }
      };
      layoutAnim.current = requestAnimationFrame(tick);
      cam.fitBounds(getBounds(to));
      const names = { tree: "Hierarchy", force: "Organic", circle: "Circle" };
      notify(`${names[kind]} layout applied`);
    },
    [board.persons, board.positions, allEdges, store, cam, notify, stopLayoutAnimation],
  );

  useEffect(() => () => {
    if (layoutAnim.current !== null) cancelAnimationFrame(layoutAnim.current);
  }, []);

  const addPersonAt = useCallback(
    (world: Point) => {
      const n = board.persons.length + 1;
      const id = store.addPerson({ name: `Person ${n}`, age: 0 }, world);
      setSelection({ kind: "person", id });
      setNewPersonId(id);
      setTool("select");
      return id;
    },
    [board.persons.length, store],
  );

  const addPersonAtCenter = useCallback(() => {
    const { w, h } = cam.viewport();
    const c = cam.cameraRef.current;
    const jitter = (board.persons.length % 5) * 18;
    addPersonAt({ x: (w / 2 - c.x) / c.scale + jitter, y: (h / 2 - c.y) / c.scale + jitter });
  }, [addPersonAt, board.persons.length, cam]);

  const undo = useCallback(() => {
    stopLayoutAnimation();
    store.undo();
  }, [stopLayoutAnimation, store]);

  const redo = useCallback(() => {
    stopLayoutAnimation();
    store.redo();
  }, [stopLayoutAnimation, store]);

  const deleteSelection = useCallback(() => {
    stopLayoutAnimation();
    if (selection?.kind === "person") {
      const name = personById.get(selection.id)?.name;
      store.removePerson(selection.id);
      notify(`Deleted ${name ?? "person"}`);
    } else if (selection?.kind === "edge") {
      store.removeRelation(selection.source, selection.target);
      notify("Relationship deleted");
    }
    setSelection(null);
    setPathQuery(null);
  }, [selection, personById, store, notify, stopLayoutAnimation]);

  const duplicateSelection = useCallback(() => {
    if (selection?.kind !== "person") return;
    const p = personById.get(selection.id);
    const pos = board.positions[selection.id];
    if (!p || !pos) return;
    const id = store.addPerson(
      { name: `${p.name} (copy)`, age: p.age, role: p.role, avatar: p.avatar, color: p.color },
      { x: pos.x + 40, y: pos.y + 90 },
    );
    setSelection({ kind: "person", id });
  }, [selection, personById, board.positions, store]);

  const loadBoard = useCallback(
    (next: typeof board) => {
      stopLayoutAnimation();
      store.replaceBoard(next);
      setSelection(null);
      setPathQuery(null);
      setComposer(null);
      cam.fitBounds(getBounds(next.positions));
    },
    [store, cam, stopLayoutAnimation],
  );

  const pickTemplate = (t: Template | null) => {
    setTemplatesOpen(false);
    loadBoard(t ? boardFromTemplate(t) : EMPTY_BOARD);
    notify(t ? `Loaded “${t.name}” template` : "New blank board");
  };

  const handleExport = useCallback(
    async (kind: "png" | "svg" | "json") => {
      if (kind !== "json" && board.persons.length === 0) return notify("Nothing to export yet");
      try {
        if (kind === "png") await exportPng(board);
        else if (kind === "svg") exportSvg(board);
        else exportJson(board);
        notify(`Exported ${kind.toUpperCase()}`);
      } catch {
        notify("Export failed");
      }
    },
    [board, notify],
  );

  const handleImport = async (file: File) => {
    try {
      const parsed = parseBoard(JSON.parse(await file.text()));
      if (!parsed) throw new Error("invalid");
      loadBoard(parsed);
      notify(`Imported ${parsed.persons.length} people`);
    } catch {
      notify("That file isn’t a valid Clarix board");
    }
  };

  /* ---------------------------- lifecycle ---------------------------- */

  // Frame the content on first load and keep track of the viewport size for the minimap.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewport({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    cam.fitBounds(getBounds(store.board.positions), { animate: false });
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------ gestures ------------------------------ */

  /** Subscribes window move/up/cancel listeners for a single pointer; returns the unsubscribe. */
  const trackPointer = (
    pointerId: number,
    onMove: (ev: PointerEvent) => void,
    onEnd: (ev: PointerEvent, cancelled: boolean) => void,
  ) => {
    const move = (ev: PointerEvent) => ev.pointerId === pointerId && onMove(ev);
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      off();
      onEnd(ev, ev.type === "pointercancel");
    };
    const off = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const startPan = (e: React.PointerEvent) => {
    cam.stopAnimation();
    let start = { x: e.clientX, y: e.clientY, cx: cam.cameraRef.current.x, cy: cam.cameraRef.current.y };
    let moved = false;
    let paused = false;
    setIsPanning(true);
    trackPointer(
      e.pointerId,
      (ev) => {
        // A pinch takes over the camera; resume panning from wherever it left things.
        if (pinchRef.current) {
          paused = moved = true;
          return;
        }
        if (paused) {
          paused = false;
          start = { x: ev.clientX, y: ev.clientY, cx: cam.cameraRef.current.x, cy: cam.cameraRef.current.y };
        }
        const dx = ev.clientX - start.x;
        const dy = ev.clientY - start.y;
        if (Math.hypot(dx, dy) > 3) moved = true;
        cam.setCamera((c) => ({ ...c, x: start.cx + dx, y: start.cy + dy }));
      },
      (_ev, cancelled) => {
        setIsPanning(false);
        if (!moved && !cancelled) {
          setSelection(null);
          setPathQuery(null);
        }
      },
    );
  };

  // Two-finger pinch to zoom (and pan) on touch screens.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { cameraRef, setCamera, stopAnimation } = cam;
    const touches = new Map<number, Point>();
    const measure = () => {
      const [a, b] = [...touches.values()];
      return { dist: Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) {
        stopAnimation();
        pinchRef.current = { ...measure(), cam: { ...cameraRef.current } };
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const p = pinchRef.current;
      if (!p || touches.size < 2) return;
      const { dist, mid } = measure();
      const rect = el.getBoundingClientRect();
      const scale = clamp(p.cam.scale * (dist / p.dist), ZOOM_MIN, ZOOM_MAX);
      // Keep the world point under the initial midpoint under the fingers' current midpoint.
      const wx = (p.mid.x - rect.left - p.cam.x) / p.cam.scale;
      const wy = (p.mid.y - rect.top - p.cam.y) / p.cam.scale;
      setCamera({ scale, x: mid.x - rect.left - wx * scale, y: mid.y - rect.top - wy * scale });
    };
    const onUp = (e: PointerEvent) => {
      if (!touches.delete(e.pointerId)) return;
      if (touches.size < 2) pinchRef.current = null;
    };
    // Capture phase so the pinch is registered before React's card / canvas handlers run.
    el.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // cam's members used here are stable refs / callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startConnect = (e: React.PointerEvent, fromId: number) => {
    e.stopPropagation();
    e.preventDefault();
    const fromPos = board.positions[fromId];
    if (!fromPos) return;
    setDraft({ from: fromId, to: fromPos, target: null });
    const targetAt = (ev: PointerEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-person-id]");
      const id = el ? Number(el.getAttribute("data-person-id")) : null;
      return id !== null && id !== fromId && board.positions[id] ? id : null;
    };
    trackPointer(
      e.pointerId,
      (ev) => {
        const valid = targetAt(ev);
        const to = valid !== null ? board.positions[valid] : cam.screenToWorld(ev.clientX, ev.clientY);
        setDraft({ from: fromId, to, target: valid });
      },
      (ev, cancelled) => {
        setDraft(null);
        const target = cancelled || pinchRef.current ? null : targetAt(ev);
        if (target !== null) setComposer({ from: fromId, to: target, at: { x: ev.clientX, y: ev.clientY } });
      },
    );
  };

  const onCardPointerDown = (e: React.PointerEvent, id: number) => {
    if (e.button !== 0) return;
    if (pinchRef.current) return e.stopPropagation(); // second finger of a pinch
    if (tool === "hand" || spaceHeld) return; // let the canvas pan
    if (tool === "connect") return startConnect(e, id);
    e.stopPropagation();
    cam.stopAnimation();
    stopLayoutAnimation();
    setComposer(null);
    const origin = board.positions[id];
    if (!origin) return;
    const start = { x: e.clientX, y: e.clientY };
    const scale = cam.cameraRef.current.scale;
    let dragging = false;

    let pinched = false;
    let last = { x: e.clientX, y: e.clientY };

    trackPointer(
      e.pointerId,
      (ev) => {
        // Freeze the card while a pinch is zooming the board.
        if (pinchRef.current) {
          pinched = true;
          return;
        }
        last = { x: ev.clientX, y: ev.clientY };
        if (!dragging) {
          if (pinched || Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 4) return;
          dragging = true;
          store.beginTransient();
          setDraggingId(id);
        }
        const dx = (ev.clientX - start.x) / scale;
        const dy = (ev.clientY - start.y) / scale;
        store.setPositions({ [id]: { x: origin.x + dx, y: origin.y + dy } }, "transient");
      },
      (ev, cancelled) => {
        if (dragging) {
          // Snap to the dot grid on release (hold Alt to place freely).
          if (!ev.altKey) {
            const dx = (last.x - start.x) / scale;
            const dy = (last.y - start.y) / scale;
            const snap = (v: number) => Math.round(v / (GRID_SIZE / 2)) * (GRID_SIZE / 2);
            store.setPositions({ [id]: { x: snap(origin.x + dx), y: snap(origin.y + dy) } }, "transient");
          }
          store.endTransient();
          setDraggingId(null);
        }
        if (!cancelled && !pinched) selectPerson(id);
      },
    );
  };

  const onEdgePointerDown = (e: React.PointerEvent, edge: Edge) => {
    if (e.button !== 0 || tool === "hand" || spaceHeld) return;
    e.stopPropagation();
    setSelection({ kind: "edge", source: edge.source, target: edge.target });
    setPathQuery(null);
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (pinchRef.current) return; // second finger of a pinch — the pinch handler owns it
    if (e.button === 1 || tool === "hand" || spaceHeld) {
      e.preventDefault();
      return startPan(e);
    }
    if (e.button !== 0) return;
    setComposer(null);
    if (tool === "person") {
      e.preventDefault();
      addPersonAt(cam.screenToWorld(e.clientX, e.clientY));
      return;
    }
    startPan(e);
  };

  /* ------------------------------ keyboard ------------------------------ */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (isTyping(e.target) || paletteOpen || templatesOpen || shortcutsOpen) return;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelection();
        return;
      }
      if (mod) return;

      if (e.code === "Space") {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if (e.shiftKey && (e.code === "Digit1" || e.key === "!")) return fitAll();
      switch (e.key) {
        case "v": case "V": setTool("select"); break;
        case "h": case "H": setTool("hand"); break;
        case "p": case "P": setTool("person"); break;
        case "c": case "C": setTool("connect"); break;
        case "l": case "L": runLayout(lastLayout.current); break;
        case "m": case "M": setShowMinimap((s) => !s); break;
        case "?": setShortcutsOpen(true); break;
        case "+": case "=": cam.zoomIn(); break;
        case "-": case "_": cam.zoomOut(); break;
        case "Delete": case "Backspace": deleteSelection(); break;
        case "Escape":
          setComposer(null);
          setPathQuery(null);
          setSelection(null);
          setTool("select");
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => e.code === "Space" && setSpaceHeld(false);
    const onBlur = () => setSpaceHeld(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [paletteOpen, templatesOpen, shortcutsOpen, undo, redo, duplicateSelection, fitAll, runLayout, cam, deleteSelection]);

  /* ------------------------------ commands ------------------------------ */

  const commands: Command[] = useMemo(
    () => [
      ...board.persons.map<Command>((p: Person) => ({
        id: `p${p.id}`,
        label: p.name,
        hint: [p.role, `${degree.get(p.id) ?? 0} links`].filter(Boolean).join(" · "),
        keywords: p.role,
        group: "People",
        icon: <PersonDot person={p} size={24} />,
        run: () => {
          selectPerson(p.id);
          focusPerson(p.id);
        },
      })),
      { id: "add", label: "Add person", group: "Actions", icon: <UserPlus />, hint: "P", run: addPersonAtCenter },
      { id: "tree", label: "Auto-layout: Hierarchy", group: "Actions", icon: <GitFork className="rotate-180" />, keywords: "arrange tree", run: () => runLayout("tree") },
      { id: "force", label: "Auto-layout: Organic", group: "Actions", icon: <Orbit />, keywords: "arrange force", run: () => runLayout("force") },
      { id: "circle", label: "Auto-layout: Circle", group: "Actions", icon: <CircleDot />, keywords: "arrange ring", run: () => runLayout("circle") },
      { id: "fit", label: "Fit board to screen", group: "Actions", icon: <Maximize />, hint: "Shift 1", run: () => fitAll() },
      { id: "png", label: "Export as PNG", group: "Actions", icon: <FileImage />, keywords: "download image", run: () => handleExport("png") },
      { id: "tpl", label: "Browse templates", group: "Actions", icon: <LayoutTemplate />, run: () => setTemplatesOpen(true) },
    ],
    [board.persons, degree, selectPerson, focusPerson, addPersonAtCenter, runLayout, fitAll, handleExport],
  );

  /* ------------------------------- render ------------------------------- */

  const panning = tool === "hand" || spaceHeld;
  // Dot grid doubles its spacing when zoomed far out so it never turns into noise.
  let gridPx = GRID_SIZE * camera.scale;
  while (gridPx < 14) gridPx *= 2;
  const cursor = isPanning ? "grabbing" : panning ? "grab" : tool === "person" || tool === "connect" ? "crosshair" : "default";
  const draftFrom = draft ? board.positions[draft.from] : null;
  const pathFrom = pathQuery ? personById.get(pathQuery.from) : undefined;
  const pathTo = pathQuery ? personById.get(pathQuery.to) : undefined;
  const composerFrom = composer ? personById.get(composer.from) : undefined;
  const composerTo = composer ? personById.get(composer.to) : undefined;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#f6f7f9] text-[#1c1c1e]">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 touch-none overflow-hidden"
        onPointerDown={onCanvasPointerDown}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          cursor,
          backgroundImage: "radial-gradient(circle, #d3d6df 1.1px, transparent 1.2px)",
          backgroundSize: `${gridPx}px ${gridPx}px`,
          backgroundPosition: `${camera.x}px ${camera.y}px`,
        }}
      >
        <div
          className={cn("absolute left-0 top-0 origin-top-left", panning && "[&_*]:!cursor-[inherit]")}
          style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}
        >
          <EdgeLayer
            edges={edges}
            positions={board.positions}
            edgeState={edgeState}
            selectedKey={selectedEdgeKey}
            draft={draft && draftFrom ? { from: draftFrom, to: draft.to } : null}
            onEdgePointerDown={onEdgePointerDown}
          />
          {board.persons.map((p) => {
            const pos = board.positions[p.id];
            if (!pos) return null;
            return (
              <PersonCard
                key={p.id}
                person={p}
                position={pos}
                selected={selection?.kind === "person" && selection.id === p.id}
                dragging={draggingId === p.id}
                connectTarget={draft?.target === p.id}
                state={cardState(p.id)}
                degree={degree.get(p.id) ?? 0}
                showHandles={!panning && draggingId === null && (tool === "select" || tool === "connect")}
                onPointerDown={onCardPointerDown}
                onHandlePointerDown={startConnect}
                onDoubleClick={(id) => {
                  selectPerson(id);
                  setNewPersonId(id);
                }}
              />
            );
          })}
        </div>
      </div>

      {board.persons.length === 0 && (
        <EmptyState onAdd={() => setTool("person")} onTemplates={() => setTemplatesOpen(true)} />
      )}

      {/* Chrome */}
      <TopBar
        title={board.title}
        onTitle={store.setTitle}
        isSaved={store.isSaved}
        stats={{ people: board.persons.length, links: allEdges.length }}
        onSearch={() => setPaletteOpen(true)}
        onExport={handleExport}
        onImport={() => fileRef.current?.click()}
        onNewBoard={() => pickTemplate(null)}
        onTemplates={() => setTemplatesOpen(true)}
        onShortcuts={() => setShortcutsOpen(true)}
      />
      <Toolbar
        tool={tool}
        setTool={setTool}
        onLayout={runLayout}
        onTemplates={() => setTemplatesOpen(true)}
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        onUndo={undo}
        onRedo={redo}
        layoutDisabled={board.persons.length < 2}
      />
      <Legend
        counts={typeCounts}
        hidden={hiddenTypes}
        onToggle={(t) =>
          setHiddenTypes((prev) => {
            const next = new Set(prev);
            if (next.has(t)) next.delete(t);
            else next.add(t);
            return next;
          })
        }
      />
      <NavigationControls
        persons={board.persons}
        positions={board.positions}
        edges={edges}
        camera={camera}
        viewport={viewport}
        onNavigate={(p) => {
          const c = cam.cameraRef.current;
          cam.setCamera({ ...c, x: viewport.w / 2 - p.x * c.scale, y: viewport.h / 2 - p.y * c.scale });
        }}
        showMinimap={showMinimap && !selectedPerson && !selectedEdge}
        onToggleMinimap={() => setShowMinimap((s) => !s)}
        onZoomIn={cam.zoomIn}
        onZoomOut={cam.zoomOut}
        onResetZoom={cam.resetZoom}
        onFit={() => fitAll()}
      />
      <ToolHint tool={spaceHeld ? "hand" : tool} />

      {pathQuery && pathFrom && pathTo && (
        <PathBanner from={pathFrom} to={pathTo} path={path} persons={board.persons} onClose={() => setPathQuery(null)} />
      )}

      {selectedPerson && (
        <PersonInspector
          key={selectedPerson.id}
          person={selectedPerson}
          persons={board.persons}
          edges={allEdges}
          autoFocusName={newPersonId === selectedPerson.id}
          onClose={() => setSelection(null)}
          onUpdate={(patch) => {
            store.updatePerson(selectedPerson.id, patch);
            setNewPersonId(null);
          }}
          onDelete={deleteSelection}
          onFocus={() => focusPerson(selectedPerson.id)}
          onSelectEdge={(e) => setSelection({ kind: "edge", source: e.source, target: e.target })}
          onRemoveEdge={(e) => store.removeRelation(e.source, e.target)}
          onFindPath={(target) => {
            const found = findPath(edges, selectedPerson.id, target);
            setPathQuery({ from: selectedPerson.id, to: target });
            setSelection(null);
            if (found) {
              const pts: Record<number, Point> = {};
              found.nodes.forEach((id) => (pts[id] = board.positions[id]));
              cam.fitBounds(getBounds(pts), { maxScale: 1.1, padding: 160 });
            }
          }}
        />
      )}

      {selectedEdge && (
        <EdgeInspector
          key={selectedEdgeKey}
          edge={selectedEdge}
          persons={board.persons}
          onClose={() => setSelection(null)}
          onUpdate={(patch) => store.updateRelation(selectedEdge.source, selectedEdge.target, patch)}
          onReverse={() => {
            store.reverseRelation(selectedEdge.source, selectedEdge.target);
            setSelection({ kind: "edge", source: selectedEdge.target, target: selectedEdge.source });
          }}
          onDelete={deleteSelection}
          onSelectPerson={selectPerson}
        />
      )}

      {composer && composerFrom && composerTo && (
        <RelationComposer
          from={composerFrom}
          to={composerTo}
          at={composer.at}
          onCancel={() => setComposer(null)}
          onCreate={(label, type) => {
            store.addRelation(composer.from, composer.to, label, type);
            if (hiddenTypes.has(type)) {
              setHiddenTypes((prev) => {
                const next = new Set(prev);
                next.delete(type);
                return next;
              });
            }
            setSelection({ kind: "edge", source: composer.from, target: composer.to });
            setComposer(null);
            setTool("select");
          }}
        />
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <TemplatesDialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} onPick={pickTemplate} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <Toast message={toast} />

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImport(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
