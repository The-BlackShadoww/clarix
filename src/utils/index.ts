import { MIRO_PASTELS } from "@/constants";
import type { Person, RelationType } from "@/types";

/**
 * Deterministic pastel colour from a string, so a name always maps to the same colour.
 */
export const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MIRO_PASTELS[Math.abs(hash) % MIRO_PASTELS.length];
};

export const personColor = (p: Pick<Person, "name" | "color">) =>
  p.color ?? getColorFromName(p.name);

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const KEYWORDS: Record<Exclude<RelationType, "other">, string[]> = {
  family: [
    "parent", "child", "son", "daughter", "mother", "father", "mom", "dad",
    "spouse", "wife", "husband", "sibling", "brother", "sister", "cousin",
    "uncle", "aunt", "grand", "niece", "nephew", "family",
  ],
  work: [
    "manage", "report", "colleague", "boss", "employee", "mentor", "founder",
    "cto", "ceo", "work", "team", "lead", "client", "intern",
  ],
  friend: ["friend", "buddy", "roommate", "neighbo", "partner", "classmate"],
};

/** Best-guess relation category from a free-text label (used for legacy data). */
export const inferRelationType = (label: string): RelationType => {
  const l = label.toLowerCase();
  for (const t of ["family", "work", "friend"] as const) {
    if (KEYWORDS[t].some((k) => l.includes(k))) return t;
  }
  return "other";
};

export const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);
