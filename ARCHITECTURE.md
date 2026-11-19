# Architecture

## 1. Project Overview

**Clarix** is an interactive, visual relation builder for mapping people and the connections between them on an infinite, Miro-style board.

- **Tech stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, shadcn/ui (Base UI), Lucide icons.
- **Persistence:** browser `localStorage` (key `clarix:board:v2`) with JSON import/export. There is no backend.
- **Rendering:** DOM person cards plus an SVG connector layer, both inside a single CSS-transformed "world" element driven by a camera.

## 2. Directory Layout

```text
/src
  /app
    layout.tsx            # Root layout, fonts, smooth anchor scrolling
    page.tsx              # Landing page (hero, bento features, how-it-works, use cases, FAQ, CTA, footer)
    /canvas/page.tsx      # Board route — loads <Board/> client-only (ssr: false)
    globals.css           # Tailwind v4 theme + board/landing styles
  /components
    /features
      /board              # The relation builder
        Board.tsx         # Orchestrator: pointer/touch gestures, tools, shortcuts, auto-layout animation
        TopBar.tsx        # Board title, menu (new/import/templates), undo/redo, export
        Toolbar.tsx       # Floating left tool rail (select, hand, person, connect, layouts)
        BottomBar.tsx     # Zoom controls, minimap, relation-type legend / filters
        Inspector.tsx     # Right panel for editing a person or relationship, path finder
        PersonCard.tsx    # A person card with connect handles
        EdgeLayer.tsx     # SVG connectors, labels, path highlighting
        Overlays.tsx      # Command palette, relation composer, shortcuts dialog, toast
        primitives.tsx    # Small shared UI bits (icon buttons, kbd hints, avatars, …)
      /landing
        ProductMockup.tsx # Static board mockup used in the hero
        FeatureVisuals.tsx# Illustrations for the bento feature grid
        Reveal.tsx        # Scroll-reveal animation wrapper
    /ui                   # Generic shadcn/ui components
  /hooks
    useBoard.ts           # Board state, history (undo/redo), autosave, import parsing
    useCamera.ts          # Pan/zoom camera, animated fit/centre, screen↔world conversion
  /lib
    graph.ts              # Edges, connector geometry/routing, bounds, shortest path, layouts
    exporters.ts          # SVG / PNG / JSON export
    templates.ts          # Starter boards (family tree, startup team, friend circle)
    utils.ts              # `cn` class-name helper
  /types/index.ts         # Person, Relation, BoardState, Tool, Selection, Camera
  /constants/index.ts     # Card size, zoom limits, palette, relation types, storage key
  /utils/index.ts         # Colour from name, initials, relation-type inference, clamp
```

## 3. Data Model

```ts
type BoardState = {
  title: string;
  persons: Person[];                  // each person owns its outgoing relations
  positions: Record<number, Point>;   // card centre per person id
};

type Relation = { id: number /* target */; relation: string; type?: "family" | "work" | "friend" | "other" };
```

- Relations are stored on the source person; `buildEdges` (lib/graph.ts) flattens them into `Edge` objects for rendering, hit-testing and path finding.
- `type` is optional; when missing or unknown it is inferred from the label (`inferRelationType`) so colour lookups never fail.

## 4. State & History — `useBoard`

- `commit(fn)` applies a change and pushes the previous state onto the undo stack. Undo and redo stacks are both capped (`HISTORY_LIMIT = 100`).
- `beginTransient` / `transient` / `endTransient` group continuous interactions (dragging cards, animated layouts) into a **single** history entry.
- Compound operations such as `reverseRelation` are one commit, so they undo in one step and keep their label and type.
- Saves are debounced to `localStorage`.
- `parseBoard` validates anything that claims to be a board — saved state or an imported file. It skips duplicate person ids, drops self-links and normalises relation types.
- New person ids come from a ref-backed counter (`lastId`), so adding twice before a re-render cannot produce duplicate ids.

## 5. Interaction — `Board` and `useCamera`

- **Camera:** `{ x, y, scale }` applied as a CSS transform. `useCamera` handles wheel/trackpad zoom around the cursor, animated `fitBounds` / `centerOn`, and `screenToWorld`.
- **Pointer gestures:** pan, card drag, marquee and drag-to-connect each record the `pointerId` that started them. They ignore other pointers and clean up on `pointercancel`, so a second finger cannot cause jumps or stuck drags.
- **Touch:** two active touch pointers switch into pinch-to-zoom (zoom and pan around the midpoint). While a pinch is active, single-pointer gestures pause, and panning resumes from wherever the pinch left the camera.
- **Auto-layout:** `computeLayout` (hierarchy / force-directed / circle) returns target positions, which are tweened with `requestAnimationFrame`. Undo/redo, delete, dragging or loading a board cancel the animation, so stale frames can't overwrite newer state.
- **Connectors:** `edgeGeometry` draws curved paths clipped to card edges; `routeBend` bends a connector away from cards that sit in its way.
- **Path finder:** `findPath` runs a BFS over undirected edges and returns the shortest chain, which is highlighted along with the degrees of separation.

## 6. Export

- `boardToSvg` builds a standalone SVG of the board (long names are truncated with an ellipsis).
- `exportPng` rasterises that SVG on a canvas. Very large boards are scaled down to stay under browser canvas size limits.
- `exportJson` writes the raw `BoardState`; importing it goes through `parseBoard`.

## 7. Key Design Decisions

- **DOM + SVG instead of canvas/WebGL** keeps cards accessible, styleable with Tailwind and easy to hit-test. Fine for hundreds of nodes. Beyond ~500 nodes, consider a canvas/WebGL renderer or virtualisation.
- **One state hook instead of a global store.** `useBoard` is owned by `Board` and passed down. Move to Zustand (or similar) only if other routes need the board.
- **Client-only board route.** The board reads `localStorage` on first render, so `/canvas` uses `next/dynamic` with `ssr: false` to avoid hydration mismatches.
- **Path alias** `@/*` → `./src/*` (tsconfig). `components.json` points shadcn output to `src/components/ui`.

## 8. Next Steps

- Real-time collaboration and cloud persistence (accounts, shared boards).
- Automated tests for `lib/graph.ts` (layouts, routing, path finding) and `parseBoard`.
- Split `Board.tsx` further — e.g. extract the gesture handling into a `useBoardGestures` hook.
