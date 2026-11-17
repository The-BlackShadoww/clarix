"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CornerDownLeft, Route, Search, UserPlus, X } from "lucide-react";
import type { Person, Point, RelationType } from "@/types";
import { RELATION_TYPES } from "@/constants";
import type { Edge } from "@/lib/graph";
import { TEMPLATES, type Template } from "@/lib/templates";
import { initials, personColor } from "@/utils";
import { cn } from "@/lib/utils";
import { Dialog, Kbd, Panel } from "./primitives";
import { TypePicker } from "./Inspector";

/* ------------------------------------------------------------------ */
/* Command palette (Ctrl/⌘ K)                                          */
/* ------------------------------------------------------------------ */

export type Command = {
  id: string;
  label: string;
  group: "People" | "Actions";
  icon: React.ReactNode;
  hint?: string;
  keywords?: string;
  run: () => void;
};

export const CommandPalette: React.FC<{ open: boolean; onClose: () => void; commands: Command[] }> = ({ open, onClose, commands }) => (
  <Dialog open={open} onClose={onClose}>
    {open && <PaletteBody onClose={onClose} commands={commands} />}
  </Dialog>
);

const PaletteBody = ({ onClose, commands }: { onClose: () => void; commands: Command[] }) => {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = s
      ? commands.filter((c) => `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(s))
      : commands;
    return filtered.slice(0, 40);
  }, [q, commands]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    c.run();
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-[#eef0f4] px-4">
        <Search className="size-[18px] text-[#8a8fa3]" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              run(results[active]);
            }
          }}
          placeholder="Search people or type a command…"
          className="h-14 flex-1 bg-transparent text-[15px] text-[#1c1c1e] outline-none placeholder:text-[#a5a8b5]"
        />
        <Kbd>Esc</Kbd>
      </div>
      <div ref={listRef} className="popup-scroll max-h-[min(400px,55vh)] overflow-y-auto p-1.5">
        {results.length === 0 && (
          <div className="px-3 py-10 text-center text-[13.5px] text-[#8a8fa3]">No matches for “{q}”.</div>
        )}
        {results.map((c, i) => {
          const header = i === 0 || results[i - 1].group !== c.group ? c.group : null;
          return (
            <React.Fragment key={c.id}>
              {header && (
                <div className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#a5a8b5]">{header}</div>
              )}
              <button
                type="button"
                data-idx={i}
                onMouseMove={() => setActive(i)}
                onClick={() => run(c)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[14px] text-[#1c1c1e]",
                  i === active && "bg-[#eef1ff]",
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center text-[#6b7083] [&_svg]:size-4">{c.icon}</span>
                <span className="flex-1 truncate font-medium">{c.label}</span>
                {c.hint && <span className="truncate text-[12.5px] text-[#8a8fa3]">{c.hint}</span>}
                {i === active && <CornerDownLeft className="size-3.5 text-[#8a8fa3]" />}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};

export const PersonDot = ({ person, size = 26 }: { person: Person; size?: number }) => (
  <span
    className="flex shrink-0 items-center justify-center rounded-full font-bold text-[#1c1c1e]"
    style={{ width: size, height: size, background: personColor(person), fontSize: size * 0.4 }}
  >
    {initials(person.name)}
  </span>
);

/* ------------------------------------------------------------------ */
/* Relation composer — appears after dragging a connection             */
/* ------------------------------------------------------------------ */

export const RelationComposer: React.FC<{
  from: Person;
  to: Person;
  at: Point;
  onCreate: (label: string, type: RelationType) => void;
  onCancel: () => void;
}> = ({ from, to, at, onCreate, onCancel }) => {
  const [type, setType] = useState<RelationType>("family");
  const [label, setLabel] = useState("");
  const cfg = RELATION_TYPES[type];
  const submit = (l = label) => onCreate(l.trim() || cfg.suggestions[0], type);

  return (
    <div
      className="fixed z-[90]"
      style={{
        left: Math.min(Math.max(at.x, 180), (typeof window !== "undefined" ? window.innerWidth : 1200) - 180),
        top: Math.min(at.y + 14, (typeof window !== "undefined" ? window.innerHeight : 800) - 280),
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Panel className="animate-in fade-in zoom-in-95 w-[340px] -translate-x-1/2 p-3 duration-150">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#1c1c1e]">
          <PersonDot person={from} size={22} />
          <span className="max-w-[100px] truncate">{from.name}</span>
          <ArrowRight className="size-4 shrink-0" style={{ color: cfg.color }} />
          <PersonDot person={to} size={22} />
          <span className="max-w-[100px] truncate">{to.name}</span>
          <button type="button" aria-label="Cancel" onClick={onCancel} className="ml-auto flex size-7 items-center justify-center rounded-md text-[#8a8fa3] hover:bg-[#f3f4f8]">
            <X className="size-4" />
          </button>
        </div>
        <TypePicker value={type} onChange={setType} />
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={`Label, e.g. “${cfg.suggestions[0]}”`}
          className="mt-2.5 h-9 w-full rounded-lg border border-[#e3e5eb] px-3 text-[13.5px] outline-none placeholder:text-[#b5b8c4] focus:border-[#4262ff] focus:ring-[3px] focus:ring-[#4262ff]/15"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cfg.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="rounded-full border border-[#e3e5eb] px-2.5 py-1 text-[12px] font-medium text-[#555a6a] transition-colors hover:border-transparent hover:text-white"
              onMouseEnter={(e) => (e.currentTarget.style.background = cfg.color)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11.5px] text-[#a5a8b5]">
            <Kbd>Enter</Kbd> to link
          </span>
          <button
            type="button"
            onClick={() => submit()}
            className="h-8 rounded-lg px-3.5 text-[13px] font-semibold text-white"
            style={{ background: cfg.color }}
          >
            Create link
          </button>
        </div>
      </Panel>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Path banner — result of "How are they connected?"                   */
/* ------------------------------------------------------------------ */

export const PathBanner: React.FC<{
  from: Person;
  to: Person;
  path: { nodes: number[]; edges: Edge[] } | null;
  persons: Person[];
  onClose: () => void;
}> = ({ from, to, path, persons, onClose }) => {
  const byId = new Map(persons.map((p) => [p.id, p]));
  return (
    <div className="pointer-events-none absolute inset-x-3 top-[72px] z-40 flex justify-center sm:top-[80px]">
      <Panel className="animate-in fade-in slide-in-from-top-2 pointer-events-auto flex max-w-[min(860px,100%)] items-center gap-3 py-2 pl-3 pr-2 duration-200">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef1ff] text-[#4262ff]">
          <Route className="size-4" />
        </span>
        {path ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8fa3]">
              {path.edges.length} degree{path.edges.length === 1 ? "" : "s"} of separation
            </span>
            <div className="popup-scroll flex items-center gap-1 overflow-x-auto whitespace-nowrap py-0.5 text-[13px] font-semibold text-[#1c1c1e]">
              {path.nodes.map((id, i) => {
                const p = byId.get(id);
                const e = path.edges[i];
                const next = path.nodes[i + 1];
                const forward = e && e.source === id;
                return (
                  <React.Fragment key={id}>
                    <span className="flex items-center gap-1.5">
                      {p && <PersonDot person={p} size={20} />}
                      {p?.name}
                    </span>
                    {e && next !== undefined && (
                      <span
                        className="mx-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px]"
                        style={{ background: RELATION_TYPES[e.type].soft, color: RELATION_TYPES[e.type].color }}
                      >
                        {!forward && <ArrowRight className="size-3 rotate-180" />}
                        {e.label}
                        {forward && <ArrowRight className="size-3" />}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <span className="flex-1 text-[13.5px] text-[#555a6a]">
            <b className="text-[#1c1c1e]">{from.name}</b> and <b className="text-[#1c1c1e]">{to.name}</b> aren’t connected yet.
          </span>
        )}
        <button type="button" aria-label="Clear path" onClick={onClose} className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#6b7083] hover:bg-[#f3f4f8]">
          <X className="size-4" />
        </button>
      </Panel>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

const TemplatePreview = ({ t }: { t: Template }) => (
  <div className="flex h-[88px] items-center justify-center gap-1.5 rounded-lg" style={{ background: `${t.accent}88` }}>
    {t.persons.slice(0, 5).map((p, i) => (
      <span
        key={p.id}
        className="flex size-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-sm"
        style={{ background: personColor(p), transform: `translateY(${[-10, 8, -4, 10, -8][i]}px)` }}
      >
        {initials(p.name)}
      </span>
    ))}
  </div>
);

export const TemplatesDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onPick: (t: Template | null) => void;
}> = ({ open, onClose, onPick }) => (
  <Dialog open={open} onClose={onClose} className="max-w-[720px]">
    <div className="flex items-start justify-between px-5 pb-2 pt-5">
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.5px] text-[#1c1c1e]">Start from a template</h2>
        <p className="mt-0.5 text-[13.5px] text-[#6b7083]">Replaces the current board — you can undo with Ctrl Z.</p>
      </div>
      <button type="button" aria-label="Close" onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-[#6b7083] hover:bg-[#f3f4f8]">
        <X className="size-4" />
      </button>
    </div>
    <div className="grid gap-3 p-5 pt-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onPick(null)}
        className="group flex flex-col rounded-xl border border-dashed border-[#c7cad5] p-2 text-left transition-colors hover:border-[#4262ff] hover:bg-[#f7f8ff]"
      >
        <div className="flex h-[88px] items-center justify-center rounded-lg bg-[#f7f8fa] text-[#8a8fa3] group-hover:text-[#4262ff]">
          <UserPlus className="size-6" />
        </div>
        <div className="px-1.5 pb-1 pt-2.5">
          <div className="text-[14px] font-semibold text-[#1c1c1e]">Blank board</div>
          <div className="text-[12.5px] text-[#6b7083]">Start fresh with an empty canvas.</div>
        </div>
      </button>
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onPick(t)}
          className="flex flex-col rounded-xl border border-[#e6e8ee] p-2 text-left transition-all hover:-translate-y-0.5 hover:border-[#c7cad5] hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]"
        >
          <TemplatePreview t={t} />
          <div className="px-1.5 pb-1 pt-2.5">
            <div className="text-[14px] font-semibold text-[#1c1c1e]">{t.name}</div>
            <div className="text-[12.5px] text-[#6b7083]">{t.description}</div>
          </div>
        </button>
      ))}
    </div>
  </Dialog>
);

/* ------------------------------------------------------------------ */
/* Keyboard shortcuts                                                  */
/* ------------------------------------------------------------------ */

const SHORTCUTS: [string, string[]][] = [
  ["Select tool", ["V"]],
  ["Hand tool", ["H"]],
  ["Add person", ["P"]],
  ["Connect people", ["C"]],
  ["Pan temporarily", ["Space", "drag"]],
  ["Search & commands", ["Ctrl", "K"]],
  ["Undo / Redo", ["Ctrl", "Z / Y"]],
  ["Delete selection", ["Del"]],
  ["Duplicate person", ["Ctrl", "D"]],
  ["Auto-layout", ["L"]],
  ["Fit to screen", ["Shift", "1"]],
  ["Zoom in / out", ["+", "−"]],
  ["Toggle minimap", ["M"]],
  ["Edit person", ["Double-click"]],
];

export const ShortcutsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} className="max-w-[520px]">
    <div className="flex items-center justify-between px-5 pb-1 pt-4">
      <h2 className="text-[17px] font-semibold tracking-[-0.3px]">Keyboard shortcuts</h2>
      <button type="button" aria-label="Close" onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-[#6b7083] hover:bg-[#f3f4f8]">
        <X className="size-4" />
      </button>
    </div>
    <div className="grid gap-x-6 px-5 pb-5 pt-2 sm:grid-cols-2">
      {SHORTCUTS.map(([label, keys]) => (
        <div key={label} className="flex items-center justify-between border-b border-[#f1f2f5] py-2 text-[13px] text-[#3a3d4a]">
          {label}
          <span className="flex gap-1">
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </span>
        </div>
      ))}
    </div>
  </Dialog>
);

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

export const Toast: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div className="animate-in fade-in slide-in-from-bottom-2 pointer-events-none fixed bottom-20 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-[#1c1c1e] px-4 py-2 text-[13px] font-medium text-white shadow-lg duration-200">
      {message}
    </div>
  ) : null;

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export const EmptyState: React.FC<{ onAdd: () => void; onTemplates: () => void }> = ({ onAdd, onTemplates }) => (
  <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
    <div className="animate-in fade-in zoom-in-95 pointer-events-auto flex max-w-[380px] flex-col items-center px-6 text-center duration-300">
      <div className="mb-5 flex -space-x-3">
        {["#ffc6c6", "#c3faf5", "#ffe6cd"].map((c, i) => (
          <span key={c} className="size-12 rounded-full border-[3px] border-white shadow-sm" style={{ background: c, transform: `translateY(${i === 1 ? -8 : 0}px)` }} />
        ))}
      </div>
      <h2 className="text-[22px] font-semibold tracking-[-0.6px] text-[#1c1c1e]">Map your first relationship</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6b7083]">
        Press <Kbd>P</Kbd> and click the board to add a person, then drag between people to connect them.
      </p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onAdd} className="flex h-10 items-center gap-2 rounded-[10px] bg-[#4262ff] px-4 text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(66,98,255,0.35)] hover:bg-[#3451e8]">
          <UserPlus className="size-4" /> Add person
        </button>
        <button type="button" onClick={onTemplates} className="h-10 rounded-[10px] border border-[#e0e2e8] bg-white px-4 text-[14px] font-semibold text-[#1c1c1e] hover:bg-[#f5f6f9]">
          Use a template
        </button>
      </div>
    </div>
  </div>
);
