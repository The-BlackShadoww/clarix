import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardState, Person, Point, Relation, RelationType } from "@/types";
import { STORAGE_KEY } from "@/constants";
import { DEFAULT_BOARD } from "@/lib/templates";
import { inferRelationType } from "@/utils";

type History = { past: BoardState[]; present: BoardState; future: BoardState[] };

const HISTORY_LIMIT = 100;

/** Validates and normalises anything that claims to be a board (localStorage or an imported file). */
export const parseBoard = (raw: unknown): BoardState | null => {
  if (!raw || typeof raw !== "object") return null;
  // Legacy format: a bare array of persons (the old "Raw JSON" export).
  const obj: Partial<BoardState> = Array.isArray(raw) ? { persons: raw } : (raw as Partial<BoardState>);
  if (!Array.isArray(obj.persons)) return null;
  const persons: Person[] = [];
  for (const p of obj.persons as Person[]) {
    if (typeof p?.id !== "number" || typeof p?.name !== "string") return null;
    persons.push({
      id: p.id,
      name: p.name,
      age: Number(p.age) || 0,
      avatar: typeof p.avatar === "string" && p.avatar ? p.avatar : undefined,
      role: typeof p.role === "string" ? p.role : undefined,
      color: typeof p.color === "string" ? p.color : undefined,
      relations: (Array.isArray(p.relations) ? p.relations : [])
        .filter((r: Relation) => typeof r?.id === "number")
        .map((r: Relation) => ({
          id: r.id,
          relation: String(r.relation ?? ""),
          type: r.type ?? inferRelationType(String(r.relation ?? "")),
        })),
    });
  }
  const positions: Record<number, Point> = {};
  const rawPos = (obj.positions ?? {}) as Record<string, Point>;
  persons.forEach((p, i) => {
    const pos = rawPos[p.id];
    positions[p.id] =
      pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)
        ? { x: pos.x, y: pos.y }
        : { x: (i % 4) * 240, y: Math.floor(i / 4) * 160 };
  });
  return {
    title: typeof obj.title === "string" && obj.title ? obj.title : "Imported board",
    persons,
    positions,
  };
};

const loadInitial = (): BoardState => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return parseBoard(JSON.parse(stored)) ?? DEFAULT_BOARD;
  } catch {
    /* storage unavailable or corrupt — fall back to the demo board */
  }
  return DEFAULT_BOARD;
};

/**
 * Single source of truth for the board: people, relations, card positions and title.
 * Provides undo/redo (with "transient" updates for drags and animations that collapse
 * into a single history entry) and debounced autosave to localStorage.
 *
 * Must run client-side only (the canvas route is loaded with `ssr: false`).
 */
export const useBoard = () => {
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: loadInitial(),
    future: [],
  }));
  const [savedState, setSavedState] = useState<BoardState | null>(null);
  const presentRef = useRef(history.present);
  const checkpoint = useRef<BoardState | null>(null);

  const board = history.present;

  useEffect(() => {
    presentRef.current = board;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
      } catch {
        /* quota or privacy mode — keep working in memory */
      }
      setSavedState(board);
    }, 500);
    return () => window.clearTimeout(t);
  }, [board]);

  /** Applies a change as a new undoable step. */
  const commit = useCallback((fn: (s: BoardState) => BoardState) => {
    setHistory((h) => {
      const next = fn(h.present);
      if (next === h.present) return h;
      return {
        past: [...h.past.slice(-HISTORY_LIMIT + 1), h.present],
        present: next,
        future: [],
      };
    });
  }, []);

  /** Starts a gesture whose intermediate frames should not each be an undo step. */
  const beginTransient = useCallback(() => {
    checkpoint.current = presentRef.current;
  }, []);

  const transient = useCallback((fn: (s: BoardState) => BoardState) => {
    setHistory((h) => ({ ...h, present: fn(h.present) }));
  }, []);

  const endTransient = useCallback(() => {
    const cp = checkpoint.current;
    checkpoint.current = null;
    if (!cp) return;
    setHistory((h) =>
      h.present === cp
        ? h
        : { past: [...h.past.slice(-HISTORY_LIMIT + 1), cp], present: h.present, future: [] },
    );
  }, []);

  const undo = useCallback(() => {
    setHistory((h) =>
      h.past.length === 0
        ? h
        : {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future],
          },
    );
  }, []);

  const redo = useCallback(() => {
    setHistory((h) =>
      h.future.length === 0
        ? h
        : { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) },
    );
  }, []);

  /* ---------------------------- people ---------------------------- */

  const addPerson = useCallback(
    (data: Omit<Person, "id" | "relations">, at: Point): number => {
      const cur = presentRef.current.persons;
      const id = cur.length ? Math.max(...cur.map((p) => p.id)) + 1 : 1;
      commit((s) => ({
        ...s,
        persons: [...s.persons, { ...data, id, relations: [] }],
        positions: { ...s.positions, [id]: at },
      }));
      return id;
    },
    [commit],
  );

  const updatePerson = useCallback(
    (id: number, patch: Partial<Omit<Person, "id" | "relations">>) => {
      commit((s) => ({
        ...s,
        persons: s.persons.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    },
    [commit],
  );

  const removePerson = useCallback(
    (id: number) => {
      commit((s) => {
        const positions = { ...s.positions };
        delete positions[id];
        return {
          ...s,
          positions,
          persons: s.persons
            .filter((p) => p.id !== id)
            .map((p) => ({ ...p, relations: p.relations.filter((r) => r.id !== id) })),
        };
      });
    },
    [commit],
  );

  /* --------------------------- relations --------------------------- */

  const addRelation = useCallback(
    (source: number, target: number, relation: string, type: RelationType) => {
      if (source === target) return;
      commit((s) => ({
        ...s,
        persons: s.persons.map((p) => {
          if (p.id !== source) return p;
          const others = p.relations.filter((r) => r.id !== target);
          return { ...p, relations: [...others, { id: target, relation, type }] };
        }),
      }));
    },
    [commit],
  );

  const updateRelation = useCallback(
    (source: number, target: number, patch: Partial<Omit<Relation, "id">>) => {
      commit((s) => ({
        ...s,
        persons: s.persons.map((p) =>
          p.id !== source
            ? p
            : { ...p, relations: p.relations.map((r) => (r.id === target ? { ...r, ...patch } : r)) },
        ),
      }));
    },
    [commit],
  );

  const removeRelation = useCallback(
    (source: number, target: number) => {
      commit((s) => ({
        ...s,
        persons: s.persons.map((p) =>
          p.id !== source ? p : { ...p, relations: p.relations.filter((r) => r.id !== target) },
        ),
      }));
    },
    [commit],
  );

  /* ---------------------------- layout ---------------------------- */

  const setPositions = useCallback(
    (positions: Record<number, Point>, mode: "commit" | "transient" = "commit") => {
      const fn = (s: BoardState) => ({ ...s, positions: { ...s.positions, ...positions } });
      if (mode === "commit") commit(fn);
      else transient(fn);
    },
    [commit, transient],
  );

  const setTitle = useCallback(
    (title: string) => commit((s) => (s.title === title ? s : { ...s, title })),
    [commit],
  );

  const replaceBoard = useCallback((next: BoardState) => commit(() => next), [commit]);

  return {
    board,
    isSaved: savedState === board,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    beginTransient,
    endTransient,
    addPerson,
    updatePerson,
    removePerson,
    addRelation,
    updateRelation,
    removeRelation,
    setPositions,
    setTitle,
    replaceBoard,
  };
};
