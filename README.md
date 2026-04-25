# Clarix

**Clarix** is an intuitive, visual relation builder designed for structuring networks, family trees, and complex organizational webs on a seamless infinite canvas. Inspired by modern workspace tools like Miro and Figma, Clarix provides a dynamic and highly interactive environment to map out connections and ideas.

## Features

- **Live Infinite Canvas**: Pan, zoom, and expand without limits. The visual workspace adapts and expands dynamically as your network grows. Features mouse-wheel zoom and UI zoom controls.
- **Dynamic Entities**: Create nodes representing people or entities with custom names, ages, and optional avatars. Nodes are automatically styled with a beautiful pastel color palette based on their name.
- **Real-time Layout Engine**: Link nodes together with descriptive labels (e.g., "manages", "sibling"). The interactive SVG lines curve and bend automatically as you drag nodes around the canvas.
- **Interactive UI**: 
  - Draggable nodes with smooth animations and depth effects.
  - Collapsible sidebar for node and relation management.
  - Built-in JSON viewer to inspect or export the raw network data with a one-click copy feature.
- **Modern Landing Page**: A beautiful, animated hero section built with Framer Motion that showcases the core functionality right out of the box.

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

1. **Add a Node**: Open the sidebar (if closed) and use the **Add Person** form. Provide a name, age, and an optional avatar URL.
2. **Create a Relation**: Use the **Add Relation** form. Select a Source Person, a Target Person, and define the relationship label (e.g., "Reports to").
3. **Interact**: 
   - Drag nodes around the canvas.
   - Click a node to view its details or delete it.
   - Use the mouse wheel or the top-right controls to zoom in and out.
   - Pan around the canvas by middle-clicking or clicking on an empty area and dragging.
4. **Export**: Click the "Show Raw JSON" button in the sidebar to view the structured data of your graph. Use the copy button to export it.

## License

This project is licensed under the MIT License.
