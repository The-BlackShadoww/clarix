import type { BoardState, Person } from "@/types";
import { buildEdges, computeLayout, type LayoutKind } from "@/lib/graph";

export type Template = {
  id: string;
  name: string;
  description: string;
  accent: string;
  layout: LayoutKind;
  persons: Person[];
};

export const TEMPLATES: Template[] = [
  {
    id: "family",
    name: "Family tree",
    description: "Three generations with spouses, siblings and cousins.",
    accent: "#ffc6c6",
    layout: "tree",
    persons: [
      { id: 1, name: "Robert Hale", age: 72, role: "Grandfather", relations: [{ id: 2, relation: "spouse", type: "family" }, { id: 3, relation: "parent of", type: "family" }, { id: 4, relation: "parent of", type: "family" }] },
      { id: 2, name: "Margaret Hale", age: 70, role: "Grandmother", relations: [{ id: 3, relation: "parent of", type: "family" }, { id: 4, relation: "parent of", type: "family" }] },
      { id: 3, name: "David Hale", age: 45, role: "Architect", relations: [{ id: 5, relation: "spouse", type: "family" }, { id: 6, relation: "parent of", type: "family" }, { id: 7, relation: "parent of", type: "family" }] },
      { id: 4, name: "Sarah Quinn", age: 42, role: "Doctor", relations: [{ id: 8, relation: "parent of", type: "family" }] },
      { id: 5, name: "Emily Hale", age: 44, role: "Teacher", relations: [] },
      { id: 6, name: "Leo Hale", age: 16, role: "Student", relations: [{ id: 7, relation: "sibling", type: "family" }] },
      { id: 7, name: "Mia Hale", age: 12, role: "Student", relations: [{ id: 8, relation: "cousin", type: "family" }] },
      { id: 8, name: "Noah Quinn", age: 13, role: "Student", relations: [] },
    ],
  },
  {
    id: "startup",
    name: "Startup team",
    description: "Founders, reporting lines and cross-team friendships.",
    accent: "#d4e4ff",
    layout: "tree",
    persons: [
      { id: 1, name: "Ava Chen", age: 34, role: "CEO", relations: [{ id: 2, relation: "co-founder", type: "work" }, { id: 3, relation: "manages", type: "work" }, { id: 4, relation: "manages", type: "work" }] },
      { id: 2, name: "Marcus Reed", age: 36, role: "CTO", relations: [{ id: 5, relation: "manages", type: "work" }, { id: 6, relation: "manages", type: "work" }] },
      { id: 3, name: "Priya Nair", age: 31, role: "Head of Design", relations: [{ id: 7, relation: "manages", type: "work" }] },
      { id: 4, name: "Tom Becker", age: 38, role: "Head of Sales", relations: [] },
      { id: 5, name: "Lena Ortiz", age: 27, role: "Frontend Engineer", relations: [{ id: 7, relation: "best friend", type: "friend" }] },
      { id: 6, name: "Sam Okafor", age: 29, role: "Backend Engineer", relations: [{ id: 5, relation: "mentor", type: "work" }] },
      { id: 7, name: "Jules Martin", age: 25, role: "Product Designer", relations: [] },
    ],
  },
  {
    id: "friends",
    name: "Friend circle",
    description: "A social web of roommates, classmates and old friends.",
    accent: "#e0f5d0",
    layout: "force",
    persons: [
      { id: 1, name: "Zoe Park", age: 26, role: "Photographer", relations: [{ id: 2, relation: "roommate", type: "friend" }, { id: 3, relation: "best friend", type: "friend" }, { id: 6, relation: "classmate", type: "friend" }] },
      { id: 2, name: "Ethan Cole", age: 27, role: "Musician", relations: [{ id: 4, relation: "brother", type: "family" }, { id: 5, relation: "friend", type: "friend" }] },
      { id: 3, name: "Isla Moreno", age: 25, role: "Nurse", relations: [{ id: 5, relation: "colleague", type: "work" }] },
      { id: 4, name: "Owen Cole", age: 23, role: "Student", relations: [] },
      { id: 5, name: "Ruby Singh", age: 28, role: "Chef", relations: [{ id: 6, relation: "met at", type: "other" }] },
      { id: 6, name: "Kai Tanaka", age: 26, role: "Developer", relations: [{ id: 1, relation: "friend", type: "friend" }] },
    ],
  },
];

export const boardFromTemplate = (t: Template): BoardState => {
  const seed: Record<number, { x: number; y: number }> = {};
  t.persons.forEach((p, i) => (seed[p.id] = { x: i * 40, y: (i % 3) * 30 }));
  return {
    title: t.name,
    persons: t.persons,
    positions: computeLayout(t.layout, t.persons, buildEdges(t.persons), seed),
  };
};

export const DEFAULT_BOARD: BoardState = boardFromTemplate(TEMPLATES[0]);
DEFAULT_BOARD.title = "My relationship map";

export const EMPTY_BOARD: BoardState = { title: "Untitled board", persons: [], positions: {} };
