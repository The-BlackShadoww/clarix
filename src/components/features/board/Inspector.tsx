"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, ArrowRight, LocateFixed, Route, Trash2, X } from "lucide-react";
import type { Person, Relation, RelationType } from "@/types";
import { MIRO_PASTELS, RELATION_TYPES, RELATION_TYPE_ORDER } from "@/constants";
import type { Edge } from "@/lib/graph";
import { initials, personColor } from "@/utils";
import { cn } from "@/lib/utils";
import { Panel } from "./primitives";

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

/** Text input that only commits on blur / Enter, so typing isn't one undo step per key. */
const Field = ({
  label,
  value,
  onCommit,
  placeholder,
  type = "text",
  autoFocus,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "url";
  autoFocus?: boolean;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Focus after the click that created the person has finished moving focus around.
  useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [autoFocus]);
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-semibold text-[#6b7083]">{label}</span>
      <input
        type={type}
        value={draft ?? value}
        placeholder={placeholder}
        ref={inputRef}
        onFocus={(e) => {
          setDraft(value);
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null && draft !== value) onCommit(draft);
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        className="h-9 w-full rounded-lg border border-[#e3e5eb] bg-white px-3 text-[13.5px] text-[#1c1c1e] outline-none transition-[border,box-shadow] placeholder:text-[#b5b8c4] hover:border-[#c7cad5] focus:border-[#4262ff] focus:ring-[3px] focus:ring-[#4262ff]/15"
      />
    </label>
  );
};

const SectionTitle = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="mb-2 flex items-center justify-between">
    <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a8fa3]">{children}</h4>
    {right}
  </div>
);

const Avatar = ({ person, size = 28 }: { person: Person; size?: number }) => (
  <span
    className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-[#1c1c1e]"
    style={{ width: size, height: size, background: personColor(person), fontSize: size * 0.38 }}
  >
    {initials(person.name)}
    {person.avatar && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={person.avatar} alt="" className="absolute inset-0 size-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
    )}
  </span>
);

export const TypePicker = ({ value, onChange }: { value: RelationType; onChange: (t: RelationType) => void }) => (
  <div className="grid grid-cols-4 gap-1 rounded-[10px] bg-[#f3f4f8] p-1">
    {RELATION_TYPE_ORDER.map((t) => {
      const cfg = RELATION_TYPES[t];
      const on = value === t;
      return (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "flex h-8 items-center justify-center gap-1.5 rounded-[7px] text-[12.5px] font-semibold transition-all",
            on ? "bg-white shadow-[0_1px_3px_rgba(16,24,40,0.12)]" : "text-[#6b7083] hover:text-[#1c1c1e]",
          )}
          style={on ? { color: cfg.color } : undefined}
        >
          <span className="size-2 rounded-full" style={{ background: cfg.color }} />
          {cfg.label}
        </button>
      );
    })}
  </div>
);

const Shell = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <Panel className="animate-in fade-in slide-in-from-right-4 pointer-events-auto absolute right-3 top-[72px] z-40 flex max-h-[calc(100dvh-144px)] w-[min(340px,calc(100vw-24px))] flex-col overflow-hidden duration-200 sm:right-4 sm:top-[80px] sm:max-h-[calc(100dvh-152px)]">
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#eef0f4] pl-4 pr-2">
      <span className="text-[13px] font-semibold text-[#1c1c1e]">{title}</span>
      <button type="button" onClick={onClose} aria-label="Close panel" className="flex size-8 items-center justify-center rounded-md text-[#6b7083] hover:bg-[#f3f4f8]">
        <X className="size-4" />
      </button>
    </div>
    <div className="popup-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
  </Panel>
);

/* ------------------------------------------------------------------ */
/* Person inspector                                                    */
/* ------------------------------------------------------------------ */

type PersonInspectorProps = {
  person: Person;
  persons: Person[];
  edges: Edge[];
  onClose: () => void;
  onUpdate: (patch: Partial<Omit<Person, "id" | "relations">>) => void;
  onDelete: () => void;
  onFocus: () => void;
  onSelectEdge: (e: Edge) => void;
  onRemoveEdge: (e: Edge) => void;
  onFindPath: (targetId: number) => void;
  /** Focus the name field (freshly created / double-clicked person). */
  autoFocusName?: boolean;
};

export const PersonInspector: React.FC<PersonInspectorProps> = ({
  person,
  persons,
  edges,
  onClose,
  onUpdate,
  onDelete,
  onFocus,
  onSelectEdge,
  onRemoveEdge,
  onFindPath,
  autoFocusName,
}) => {
  const byId = new Map(persons.map((p) => [p.id, p]));
  const mine = edges.filter((e) => e.source === person.id || e.target === person.id);
  const color = personColor(person);

  return (
    <Shell title="Person" onClose={onClose}>
      <div className="px-4 pb-4 pt-4" style={{ background: `linear-gradient(180deg, ${color}55, transparent)` }}>
        <div className="flex items-center gap-3">
          <Avatar person={person} size={52} />
          <div className="min-w-0">
            <div className="truncate text-[18px] font-semibold tracking-[-0.4px] text-[#1c1c1e]">{person.name}</div>
            <div className="text-[12.5px] text-[#6b7083]">
              {mine.length} relationship{mine.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 pb-5">
        <div className="space-y-3">
          <Field key={`n${person.id}`} label="Name" autoFocus={autoFocusName} value={person.name} onCommit={(v) => v.trim() && onUpdate({ name: v.trim() })} />
          <div className="grid grid-cols-[1fr_84px] gap-2">
            <Field key={`r${person.id}`} label="Role" value={person.role ?? ""} placeholder="e.g. Designer" onCommit={(v) => onUpdate({ role: v.trim() || undefined })} />
            <Field key={`a${person.id}`} label="Age" type="number" value={String(person.age || "")} onCommit={(v) => onUpdate({ age: Math.max(0, Math.min(150, Number(v) || 0)) })} />
          </div>
          <Field key={`i${person.id}`} label="Photo URL" type="url" value={person.avatar ?? ""} placeholder="https://…" onCommit={(v) => onUpdate({ avatar: v.trim() || undefined })} />
          <div>
            <span className="mb-1.5 block text-[11.5px] font-semibold text-[#6b7083]">Colour</span>
            <div className="flex flex-wrap gap-1.5">
              {MIRO_PASTELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Colour ${c}`}
                  onClick={() => onUpdate({ color: c })}
                  className={cn(
                    "size-7 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110",
                    color === c && "ring-2 ring-[#4262ff] ring-offset-2",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <SectionTitle>Relationships</SectionTitle>
          {mine.length === 0 ? (
            <p className="rounded-lg bg-[#f7f8fa] px-3 py-3 text-[12.5px] leading-relaxed text-[#8a8fa3]">
              No links yet. Hover the card and drag one of its blue handles onto another person.
            </p>
          ) : (
            <div className="-mx-1.5 space-y-0.5">
              {mine.map((e) => {
                const outgoing = e.source === person.id;
                const other = byId.get(outgoing ? e.target : e.source);
                if (!other) return null;
                const cfg = RELATION_TYPES[e.type];
                return (
                  <div
                    key={`${e.source}-${e.target}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectEdge(e)}
                    onKeyDown={(ev) => ev.key === "Enter" && onSelectEdge(e)}
                    className="group/rel flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-[#f5f6f9]"
                  >
                    <Avatar person={other} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-[#1c1c1e]">{other.name}</div>
                      <div className="flex items-center gap-1 text-[11.5px] font-medium" style={{ color: cfg.color }}>
                        {outgoing ? (
                          <>
                            {e.label || cfg.label} <ArrowRight className="size-3" />
                          </>
                        ) : (
                          <>
                            <ArrowRight className="size-3 rotate-180" /> {e.label || cfg.label}
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove relationship"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onRemoveEdge(e);
                      }}
                      className="flex size-7 items-center justify-center rounded-md text-[#a5a8b5] opacity-0 transition-opacity hover:bg-[#fff0f0] hover:text-[#d93636] focus-visible:opacity-100 group-hover/rel:opacity-100 group-focus-within/rel:opacity-100 [@media(hover:none)]:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {persons.length > 1 && (
          <div>
            <SectionTitle>How are they connected?</SectionTitle>
            <div className="relative">
              <Route className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8fa3]" />
              <select
                value=""
                onChange={(e) => e.target.value && onFindPath(Number(e.target.value))}
                className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-[#e3e5eb] bg-white pl-9 pr-3 text-[13.5px] text-[#1c1c1e] outline-none hover:border-[#c7cad5] focus:border-[#4262ff]"
              >
                <option value="">Find path to…</option>
                {persons
                  .filter((p) => p.id !== person.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-[#eef0f4] bg-white px-4 py-3">
        <button type="button" onClick={onFocus} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#e3e5eb] text-[13px] font-semibold text-[#1c1c1e] hover:bg-[#f5f6f9]">
          <LocateFixed className="size-4" /> Focus
        </button>
        <button type="button" onClick={onDelete} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#fff0f0] text-[13px] font-semibold text-[#d93636] hover:bg-[#ffe1e1]">
          <Trash2 className="size-4" /> Delete
        </button>
      </div>
    </Shell>
  );
};

/* ------------------------------------------------------------------ */
/* Relationship (edge) inspector                                       */
/* ------------------------------------------------------------------ */

type EdgeInspectorProps = {
  edge: Edge;
  persons: Person[];
  onClose: () => void;
  onUpdate: (patch: Partial<Omit<Relation, "id">>) => void;
  onReverse: () => void;
  onDelete: () => void;
  onSelectPerson: (id: number) => void;
};

export const EdgeInspector: React.FC<EdgeInspectorProps> = ({ edge, persons, onClose, onUpdate, onReverse, onDelete, onSelectPerson }) => {
  const from = persons.find((p) => p.id === edge.source);
  const to = persons.find((p) => p.id === edge.target);
  if (!from || !to) return null;
  const cfg = RELATION_TYPES[edge.type];

  return (
    <Shell title="Relationship" onClose={onClose}>
      <div className="space-y-5 p-4">
        <div className="flex items-center gap-2 rounded-xl bg-[#f7f8fa] p-3">
          <button type="button" onClick={() => onSelectPerson(from.id)} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg p-1 hover:bg-white">
            <Avatar person={from} size={36} />
            <span className="w-full truncate text-center text-[12.5px] font-semibold">{from.name}</span>
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="rounded-full border bg-white px-2 py-0.5 text-[11px] font-semibold" style={{ color: cfg.color, borderColor: `${cfg.color}55` }}>
              {edge.label || cfg.label}
            </span>
            <ArrowRight className="size-4" style={{ color: cfg.color }} />
          </div>
          <button type="button" onClick={() => onSelectPerson(to.id)} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg p-1 hover:bg-white">
            <Avatar person={to} size={36} />
            <span className="w-full truncate text-center text-[12.5px] font-semibold">{to.name}</span>
          </button>
        </div>

        <div>
          <SectionTitle>Type</SectionTitle>
          <TypePicker value={edge.type} onChange={(type) => onUpdate({ type })} />
        </div>

        <div className="space-y-2">
          <Field key={`${edge.source}-${edge.target}`} label="Label" value={edge.label} placeholder="e.g. mentor" onCommit={(v) => onUpdate({ relation: v.trim() })} />
          <div className="flex flex-wrap gap-1.5">
            {cfg.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onUpdate({ relation: s })}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                  edge.label === s ? "border-transparent text-white" : "border-[#e3e5eb] text-[#555a6a] hover:border-[#c7cad5]",
                )}
                style={edge.label === s ? { background: cfg.color } : undefined}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-[#eef0f4] bg-white px-4 py-3">
        <button type="button" onClick={onReverse} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#e3e5eb] text-[13px] font-semibold text-[#1c1c1e] hover:bg-[#f5f6f9]">
          <ArrowLeftRight className="size-4" /> Reverse
        </button>
        <button type="button" onClick={onDelete} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#fff0f0] text-[13px] font-semibold text-[#d93636] hover:bg-[#ffe1e1]">
          <Trash2 className="size-4" /> Delete
        </button>
      </div>
    </Shell>
  );
};
