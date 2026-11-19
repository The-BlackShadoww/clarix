# Changelog

All notable changes to Clarix, newest first.

## 2026-11-18 — Board fixes and UI polish

### Fixed

- **Touch pinch-to-zoom.** Two-finger pinch now zooms and pans on touch screens. It was advertised before but never implemented.
- **Multi-touch gestures.** Pan, drag and connect now follow only the pointer that started them and handle `pointercancel`. A second finger no longer causes jumps or leaves a drag stuck.
- **Reverse relationship.** Now a single undo step, and it keeps the relationship's label and type.
- **Auto-layout animation.** Undo/redo, delete, dragging or loading a board while a layout is animating now cancels it. Old animation frames no longer overwrite the newer state.
- **Duplicate person ids.** Adding two people before a re-render no longer gives them the same id.
- **Redo history.** Now capped at the same limit as undo (100 entries).
- **JSON import.** Skips duplicate person ids, drops relationships from a person to themself, and re-infers unknown relationship types instead of crashing the colour lookup.
- **Command palette.** Pressing the arrow keys when there are no results no longer leaves the selection index at `-1`.
- **Relation composer.** Stays on screen on narrow or short viewports, and ignores Enter during IME composition.
- **PNG export.** Very large boards are scaled down so they stay under the browser's canvas size limits.

### Changed

- Dialogs scroll on small screens instead of overflowing.
- Shortcut hints show the platform modifier (⌘ on macOS, Ctrl elsewhere).
- The remove-relationship button is visible on touch devices and when focused.
- Exported SVG and PNG files truncate long names with an ellipsis.
- The toast is announced to screen readers and has a refined style.
- In-page links on the landing page scroll smoothly (respects `prefers-reduced-motion`).

## 2026-11-17 — Landing page redesign

- New centred hero with a full product mockup of the board (`ProductMockup`).
- Bento feature grid with illustrations (`FeatureVisuals`), plus how-it-works, use cases, FAQ, CTA and footer sections.
- Scroll-reveal animations (`Reveal`).
- Removed the old `HeroGraphic`.

## 2026-11-17 — Miro-style board redesign

Replaced the sidebar/popup canvas with a floating-panel board: a tool rail, top bar, inspector panel, minimap, zoom controls and a relation-type legend.

### Added

- Drag-to-connect relationships with Family / Work / Friend / Other types. Connectors are colour-coded and route around cards in their way.
- Animated auto-layout: hierarchy, organic (force-directed) and circle.
- A "How are they connected?" shortest-path finder that shows degrees of separation.
- A Ctrl/⌘ K command palette, localStorage autosave, undo/redo, templates, PNG/SVG/JSON export and JSON import.

### Removed

- The old `canvas/*` and `forms/*` components and the `usePersons`, `usePanZoom` and `useGraphLayout` hooks, replaced by `board/*`, `useBoard` and `useCamera`.

## 2026-04-28 — Initial canvas

- Interactive canvas for visualising and managing person relations, with drag and drop.
- Initial tree structure definition (`tree-maker/`).
