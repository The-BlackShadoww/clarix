export type RelationType = "family" | "work" | "friend" | "other";

export type Relation = {
  /** Target person id. */
  id: number;
  /** Free-text label, e.g. "spouse", "manages". */
  relation: string;
  /** Category used for colour-coding and filtering. */
  type?: RelationType;
};

export type Person = {
  id: number;
  name: string;
  age: number;
  avatar?: string;
  /** Optional short role / note shown on the card. */
  role?: string;
  /** Card accent colour (one of the pastel palette). Derived from the name when absent. */
  color?: string;
  relations: Relation[];
};

export type Point = { x: number; y: number };

/** Everything that is persisted and covered by undo/redo. */
export type BoardState = {
  title: string;
  persons: Person[];
  /** Centre position of each person card, keyed by person id. */
  positions: Record<number, Point>;
};

export type Tool = "select" | "hand" | "person" | "connect";

export type Selection =
  | { kind: "person"; id: number }
  | { kind: "edge"; source: number; target: number }
  | null;

export type Camera = { x: number; y: number; scale: number };
