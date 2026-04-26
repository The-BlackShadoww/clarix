# Architecture & Refactoring Audit

## 1. Project Overview

**Clarix** is an interactive, visual relation builder designed for mapping connections on an infinite canvas.

- **Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Zustand (future/optional), and Lucide Icons.

## 2. Structural Changes (Refactor Phase)

The project originally suffered from a monolithic structure where all logic (state, components, styles) resided in massive page files (e.g., `app/canvas/page.tsx` was 1000+ lines).
We executed a complete modularization into a standard `src/` based architecture:

```text
/src
  /app                  # Next.js App Router definitions
    /canvas/page.tsx    # Canvas layout and composition
    /page.tsx           # Landing page composition
    globals.css         # Global tailwind styles
  /components
    /features           # Domain-specific components
      /canvas           # Canvas components (PersonNode, ConnectionLine, Sidebar, PersonPopup)
      /forms            # Forms (AddPersonForm, AddRelationForm)
      /landing          # Landing page components (HeroGraphic)
    /ui                 # Reusable, generic UI components (shadcn/ui)
  /hooks                # Custom React hooks (usePersons, usePanZoom, useGraphLayout)
  /types                # Global TypeScript interfaces
  /utils                # Helper functions
  /constants            # Configuration and hardcoded values
```

## 3. Key Design Decisions

### 3.1. Separation of Concerns

The previous `app/canvas/page.tsx` file managed:

1. Form state for adding persons/relations.
2. Complex pointer event math for panning, zooming, and dragging.
3. SVG calculation for rendering connection bezier curves.
4. Component rendering for sidebars, nodes, popups, and the graph itself.

**Solution:**

- **State Management:** Extracted `usePersons` to handle the graph data (CRUD on nodes and relations).
- **Interaction Logic:** Extracted `usePanZoom` for handling canvas transforms, and `useGraphLayout` for handling node dragging and z-index ordering.
- **Component Decomposition:** Broken down into highly focused components (`PersonNode.tsx`, `ConnectionLine.tsx`, `Sidebar.tsx`, `HeroGraphic.tsx`, etc.).

### 3.2. Configuration & Types

- Extracted shared constants (`NODE_SIZE`, `MIRO_PASTELS`) into `src/constants/index.ts`.
- Extracted domain models (`Person`, `Relation`) into `src/types/index.ts`.
- Created pure utility functions (`getColorFromName`, `getSizeFromAge`) in `src/utils/index.ts`.

### 3.3. Routing & Path Aliasing

- Migrated global styles to `src/app/globals.css`.
- Updated `tsconfig.json` to map `@/*` to `./src/*`, effectively solving import hell and adhering to standard Next.js `src` patterns.
- Configured `components.json` to point UI components to `src/components/ui/` and use the new globals CSS path.

## 4. Next Steps & Future Enhancements

- **Global State:** If the app scales further, consider migrating `usePersons` state to a Zustand store to prevent prop-drilling.
- **Canvas Rendering Engine:** Currently relying on DOM nodes and SVG paths. If node count exceeds ~500, migration to an HTML5 Canvas or WebGL (e.g., PixiJS, React Flow) might be necessary for performance.
- **Persistence:** Connect the state to a backend database or LocalStorage for session persistence.
