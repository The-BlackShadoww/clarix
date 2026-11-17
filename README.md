# Clarix

**Clarix** is an intuitive, visual relation builder designed for structuring networks, family trees, and complex organizational webs on a seamless infinite canvas. Inspired by modern workspace tools like Miro and Figma, Clarix provides a dynamic and highly interactive environment to map out connections and ideas.

## Features

- **Miro-style infinite canvas** — floating tool rail, dot grid, smooth pan/zoom (mouse wheel, trackpad pinch, Space-drag), minimap and fit-to-screen.
- **Drag-to-connect relationships** — hover a person card and drag a handle onto someone else. Choose a type (Family, Work, Friend, Other) and a label; connectors are colour-coded, curve around cards in their way, and can be filtered from the legend.
- **One-click auto-layout** — Hierarchy (family trees / org charts, spouses kept side by side), Organic (force-directed) and Circle, with animated transitions.
- **“How are they connected?” path finder** — pick two people to highlight the shortest chain of relationships and the degrees of separation between them.
- **Command palette (Ctrl/⌘ K)** — jump to any person or run layouts, exports and templates from the keyboard.
- **Workspace essentials** — inspector panel for editing people and relationships, autosave to localStorage, full undo/redo, templates (family tree, startup team, friend circle), and export to PNG, SVG or JSON (plus JSON import).

### Keyboard shortcuts

| Action | Keys |
| --- | --- |
| Select / Hand / Add person / Connect | V / H / P / C |
| Search & commands | Ctrl K |
| Undo / Redo | Ctrl Z / Ctrl Y |
| Auto-layout (last used) | L |
| Fit to screen | Shift 1 |
| Delete / Duplicate | Del / Ctrl D |
| Toggle minimap | M |
| All shortcuts | ? |

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Form Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

Follow these steps to run the application locally:

### 1. Clone the repository

```bash
git clone <repository-url>
cd clarix
```

### 2. Install dependencies

Make sure you have Node.js installed, then run:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the landing page.
Navigate to `/canvas` (or click "Get Started Free") to open the Relation Builder.

## Usage Guide

1. **Add people** — press `P` (or use the person tool) and click anywhere on the board; edit name, role, age, colour and photo in the inspector.
2. **Connect them** — drag from a card’s blue handle onto another person, then pick a type and label.
3. **Arrange** — open the auto-layout menu in the tool rail (or press `L`).
4. **Explore** — select a person to spotlight their connections, or use “Find path to…” in the inspector.
5. **Export** — use the Export button for PNG/SVG/JSON; import JSON from the board menu.

## License

This project is licensed under the MIT License.
