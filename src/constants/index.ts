import type { RelationType } from "@/types";

/** Person card dimensions (canvas units). Positions are card centres. */
export const CARD_W = 216;
export const CARD_H = 64;

/** Zoom sensitivity and limits. */
export const ZOOM_SENSITIVITY = 0.0015;
export const ZOOM_MIN = 0.15;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 1.2;

export const GRID_SIZE = 24;

/** Miro-like pastel palette for person cards. */
export const MIRO_PASTELS = [
  "#ffc6c6", // coral
  "#ffd8f4", // rose
  "#c3faf5", // teal
  "#ffe6cd", // orange
  "#d4e4ff", // light blue
  "#e0f5d0", // light green
  "#fff3c6", // light yellow
  "#e6dcff", // lavender
];

export const RELATION_TYPES: Record<
  RelationType,
  { label: string; color: string; soft: string; suggestions: string[] }
> = {
  family: {
    label: "Family",
    color: "#e5484d",
    soft: "#ffe5e5",
    suggestions: ["parent of", "child of", "spouse", "sibling", "cousin"],
  },
  work: {
    label: "Work",
    color: "#5b76fe",
    soft: "#e3e8ff",
    suggestions: ["manages", "reports to", "colleague", "mentor", "co-founder"],
  },
  friend: {
    label: "Friend",
    color: "#00a46a",
    soft: "#d9f6e9",
    suggestions: ["friend", "best friend", "roommate", "neighbour"],
  },
  other: {
    label: "Other",
    color: "#8a8fa3",
    soft: "#eef0f4",
    suggestions: ["knows", "met at", "related to"],
  },
};

export const RELATION_TYPE_ORDER: RelationType[] = [
  "family",
  "work",
  "friend",
  "other",
];

export const STORAGE_KEY = "clarix:board:v2";
