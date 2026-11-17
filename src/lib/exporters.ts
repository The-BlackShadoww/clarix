import { CARD_H, CARD_W, RELATION_TYPES } from "@/constants";
import type { BoardState } from "@/types";
import { buildEdges, edgeGeometry, getBounds, routeBend } from "@/lib/graph";
import { initials, personColor } from "@/utils";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "clarix-board";

const download = (href: string, filename: string) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/** Renders the board as a standalone SVG document (no external assets, so it rasterises cleanly). */
export const boardToSvg = (board: BoardState) => {
  const pad = 60;
  const b = getBounds(board.positions) ?? { minX: 0, minY: 0, maxX: 400, maxY: 200 };
  const w = b.maxX - b.minX + pad * 2;
  const h = b.maxY - b.minY + pad * 2;
  const ox = -b.minX + pad;
  const oy = -b.minY + pad;
  const font = `font-family="-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"`;

  const markers = Object.entries(RELATION_TYPES)
    .map(
      ([k, v]) =>
        `<marker id="a-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${v.color}"/></marker>`,
    )
    .join("");

  const edges = buildEdges(board.persons)
    .map((e) => {
      const a = board.positions[e.source];
      const c = board.positions[e.target];
      if (!a || !c) return "";
      const g = edgeGeometry(a, c, routeBend(e, board.positions));
      const col = RELATION_TYPES[e.type].color;
      const lw = Math.max(e.label.length * 6.4 + 18, 36);
      return `<path d="${g.path}" stroke="${col}" stroke-width="2" fill="none" marker-end="url(#a-${e.type})"/>
<rect x="${g.label.x - lw / 2}" y="${g.label.y - 11}" width="${lw}" height="22" rx="11" fill="#fff" stroke="${col}" stroke-opacity=".35"/>
<text x="${g.label.x}" y="${g.label.y + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${col}" ${font}>${esc(e.label)}</text>`;
    })
    .join("\n");

  const cards = board.persons
    .map((p) => {
      const pos = board.positions[p.id];
      if (!pos) return "";
      const x = pos.x - CARD_W / 2;
      const y = pos.y - CARD_H / 2;
      const col = personColor(p);
      const sub = [p.role, p.age ? `${p.age} yrs` : ""].filter(Boolean).join(" · ");
      return `<g>
<rect x="${x}" y="${y + 2}" width="${CARD_W}" height="${CARD_H}" rx="14" fill="#1c1c1e" opacity=".06"/>
<rect x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" rx="14" fill="#fff" stroke="#e0e2e8"/>
<circle cx="${x + 32}" cy="${pos.y}" r="18" fill="${col}"/>
<text x="${x + 32}" y="${pos.y + 4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="#1c1c1e" ${font}>${esc(initials(p.name))}</text>
<text x="${x + 60}" y="${pos.y - (sub ? 3 : -5)}" font-size="14" font-weight="600" fill="#1c1c1e" ${font}>${esc(p.name.slice(0, 20))}</text>
${sub ? `<text x="${x + 60}" y="${pos.y + 14}" font-size="11.5" fill="#555a6a" ${font}>${esc(sub.slice(0, 26))}</text>` : ""}
</g>`;
    })
    .join("\n");

  return {
    width: w,
    height: h,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>${markers}<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dfe1e8"/></pattern></defs>
<rect width="100%" height="100%" fill="#fafbfc"/><rect width="100%" height="100%" fill="url(#dots)"/>
<g transform="translate(${ox} ${oy})">${edges}${cards}</g>
</svg>`,
  };
};

export const exportSvg = (board: BoardState) => {
  const { svg } = boardToSvg(board);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  download(url, `${slug(board.title)}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportPng = (board: BoardState) =>
  new Promise<void>((resolve, reject) => {
    const { svg, width, height } = boardToSvg(board);
    const img = new Image();
    const scale = 2;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unsupported"));
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      download(canvas.toDataURL("image/png"), `${slug(board.title)}.png`);
      resolve();
    };
    img.onerror = () => reject(new Error("Could not render image"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

export const exportJson = (board: BoardState) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ app: "clarix", version: 2, ...board }, null, 2)], {
      type: "application/json",
    }),
  );
  download(url, `${slug(board.title)}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
