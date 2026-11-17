import { CARD_H, CARD_W } from "@/constants";
import type { Person, Point, RelationType } from "@/types";
import { inferRelationType } from "@/utils";

export type Edge = {
  source: number;
  target: number;
  label: string;
  type: RelationType;
  /** Curvature offset (canvas px) so A→B and B→A don't overlap. */
  bend: number;
};

export const edgeKey = (source: number, target: number) => `${source}->${target}`;

/** Flattens persons' relations into a list of drawable edges. */
export const buildEdges = (persons: Person[]): Edge[] => {
  const ids = new Set(persons.map((p) => p.id));
  const has = new Set<string>();
  for (const p of persons)
    for (const r of p.relations) has.add(edgeKey(p.id, r.id));

  const edges: Edge[] = [];
  for (const p of persons) {
    for (const r of p.relations) {
      if (r.id === p.id || !ids.has(r.id)) continue;
      const twoWay = has.has(edgeKey(r.id, p.id));
      edges.push({
        source: p.id,
        target: r.id,
        label: r.relation,
        type: r.type ?? inferRelationType(r.relation),
        bend: twoWay ? 34 : 0,
      });
    }
  }
  return edges;
};

/** Point where the ray from a card centre towards `toward` leaves the card (plus padding). */
export const clipToCard = (center: Point, toward: Point, pad = 6): Point => {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) return center;
  const hw = CARD_W / 2 + pad;
  const hh = CARD_H / 2 + pad;
  const t = Math.min(
    dx !== 0 ? hw / Math.abs(dx) : Infinity,
    dy !== 0 ? hh / Math.abs(dy) : Infinity,
  );
  return { x: center.x + dx * t, y: center.y + dy * t };
};

export type EdgeGeometry = {
  path: string;
  start: Point;
  end: Point;
  label: Point;
};

export const edgeGeometry = (a: Point, b: Point, bend: number): EdgeGeometry => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  // Quadratic control point; apex of the curve sits at `bend` from the chord.
  const cp = { x: mx + nx * bend * 2, y: my + ny * bend * 2 };
  const start = clipToCard(a, bend ? cp : b);
  const end = clipToCard(b, bend ? cp : a, 10);
  const label = {
    x: 0.25 * start.x + 0.5 * cp.x + 0.25 * end.x,
    y: 0.25 * start.y + 0.5 * cp.y + 0.25 * end.y,
  };
  const path = bend
    ? `M ${start.x} ${start.y} Q ${cp.x} ${cp.y} ${end.x} ${end.y}`
    : `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  return { path, start, end, label };
};

/** True when the straight segment a→b passes through any card other than its endpoints'. */
const segmentHitsCard = (
  a: Point,
  b: Point,
  bend: number,
  positions: Record<number, Point>,
  skip: [number, number],
) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const cp = { x: mx + (-(b.y - a.y) / len) * bend * 2, y: my + ((b.x - a.x) / len) * bend * 2 };
  const hw = CARD_W / 2 + 8;
  const hh = CARD_H / 2 + 8;
  for (const [idStr, c] of Object.entries(positions)) {
    const id = Number(idStr);
    if (id === skip[0] || id === skip[1]) continue;
    for (let t = 0.08; t < 0.93; t += 0.04) {
      const x = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cp.x + t * t * b.x;
      const y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cp.y + t * t * b.y;
      if (Math.abs(x - c.x) < hw && Math.abs(y - c.y) < hh) return true;
    }
  }
  return false;
};

/** Picks a curvature that routes the connector around other cards when possible. */
export const routeBend = (e: Edge, positions: Record<number, Point>): number => {
  const a = positions[e.source];
  const b = positions[e.target];
  if (!a || !b) return e.bend;
  const skip: [number, number] = [e.source, e.target];
  if (!segmentHitsCard(a, b, e.bend, positions, skip)) return e.bend;
  const base = Math.max(Math.abs(e.bend), 30);
  for (const mag of [base + 40, base + 70, base + 110]) {
    for (const sign of e.bend < 0 ? [-1, 1] : [1, -1]) {
      if (!segmentHitsCard(a, b, sign * mag, positions, skip)) return sign * mag;
    }
  }
  return e.bend;
};

export type Bounds ={ minX: number; minY: number; maxX: number; maxY: number };

export const getBounds = (positions: Record<number, Point>): Bounds | null => {
  const pts = Object.values(positions);
  if (pts.length === 0) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x - CARD_W / 2);
    minY = Math.min(minY, p.y - CARD_H / 2);
    maxX = Math.max(maxX, p.x + CARD_W / 2);
    maxY = Math.max(maxY, p.y + CARD_H / 2 + 20);
  }
  return { minX, minY, maxX, maxY };
};

/* ------------------------------------------------------------------ */
/* Path finding                                                        */
/* ------------------------------------------------------------------ */

/** Shortest chain of relations between two people (ignoring direction). */
export const findPath = (
  edges: Edge[],
  from: number,
  to: number,
): { nodes: number[]; edges: Edge[] } | null => {
  if (from === to) return { nodes: [from], edges: [] };
  const adj = new Map<number, { next: number; edge: Edge }[]>();
  const push = (k: number, v: { next: number; edge: Edge }) => {
    if (!adj.has(k)) adj.set(k, []);
    adj.get(k)!.push(v);
  };
  for (const e of edges) {
    push(e.source, { next: e.target, edge: e });
    push(e.target, { next: e.source, edge: e });
  }
  const prev = new Map<number, { node: number; edge: Edge }>();
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const { next, edge } of adj.get(cur) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      prev.set(next, { node: cur, edge });
      queue.push(next);
    }
  }
  if (!prev.has(to)) return null;
  const nodes = [to];
  const pathEdges: Edge[] = [];
  let cur = to;
  while (cur !== from) {
    const p = prev.get(cur)!;
    pathEdges.unshift(p.edge);
    nodes.unshift(p.node);
    cur = p.node;
  }
  return { nodes, edges: pathEdges };
};

/* ------------------------------------------------------------------ */
/* Auto-layout                                                         */
/* ------------------------------------------------------------------ */

export type LayoutKind = "tree" | "force" | "circle";

const centroid = (positions: Record<number, Point>, ids: number[]): Point => {
  const pts = ids.map((id) => positions[id]).filter(Boolean);
  if (pts.length === 0) return { x: 0, y: 0 };
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
};

const SYMMETRIC = /spouse|wife|husband|sibling|brother|sister|cousin|friend|colleague|roommate|neighbo|partner|co-?founder|classmate|peer|knows/i;
const UPWARD = /child of|son of|daughter of|reports to|works for|employee of|intern of|mentee/i;

export const layoutTree = (persons: Person[], edges: Edge[], positions: Record<number, Point>) => {
  const ids = persons.map((p) => p.id);
  const children = new Map<number, number[]>(ids.map((id) => [id, []]));
  const parents = new Map<number, number[]>(ids.map((id) => [id, []]));
  const peers = new Map<number, number[]>(ids.map((id) => [id, []]));

  for (const e of edges) {
    if (SYMMETRIC.test(e.label)) {
      peers.get(e.source)!.push(e.target);
      peers.get(e.target)!.push(e.source);
      continue;
    }
    const [p, c] = UPWARD.test(e.label) ? [e.target, e.source] : [e.source, e.target];
    if (children.get(p)!.includes(c) || children.get(c)!.includes(p)) continue;
    children.get(p)!.push(c);
    parents.get(c)!.push(p);
  }

  // Longest-path layering (Kahn); nodes trapped in cycles fall back to rank 0.
  const rank = new Map<number, number>();
  const indeg = new Map(ids.map((id) => [id, parents.get(id)!.length]));
  const queue = ids.filter((id) => indeg.get(id) === 0);
  queue.forEach((id) => rank.set(id, 0));
  while (queue.length) {
    const cur = queue.shift()!;
    for (const c of children.get(cur)!) {
      rank.set(c, Math.max(rank.get(c) ?? 0, rank.get(cur)! + 1));
      indeg.set(c, indeg.get(c)! - 1);
      if (indeg.get(c) === 0) queue.push(c);
    }
  }
  ids.forEach((id) => !rank.has(id) && rank.set(id, 0));

  // Peers (spouses, siblings…) without a hierarchy of their own join their peer's row.
  for (let pass = 0; pass < 3; pass++) {
    for (const id of ids) {
      if (parents.get(id)!.length || children.get(id)!.length) continue;
      const anchored = peers.get(id)!.find((p) => parents.get(p)!.length || children.get(p)!.length || pass > 0);
      if (anchored !== undefined) rank.set(id, rank.get(anchored)!);
    }
  }

  const layers: number[][] = [];
  for (const id of ids) {
    const r = rank.get(id)!;
    (layers[r] ??= []).push(id);
  }

  // Order each row by the average x-index of parents (barycentre) to limit crossings,
  // keeping peers adjacent.
  const order = new Map<number, number>();
  layers.forEach((layer, li) => {
    if (li === 0) {
      layer.sort((a, b) => (positions[a]?.x ?? 0) - (positions[b]?.x ?? 0));
    } else {
      const score = (id: number) => {
        const ps = [...parents.get(id)!, ...peers.get(id)!].filter((p) => order.has(p));
        return ps.length ? ps.reduce((s, p) => s + order.get(p)!, 0) / ps.length : Infinity;
      };
      layer.sort((a, b) => score(a) - score(b));
    }
    // Pull parent-less peers (e.g. a spouse who married into the family) next to their partner.
    for (const id of [...layer]) {
      if (parents.get(id)!.length) continue;
      const partner = peers.get(id)!.find((p) => p !== id && layer.includes(p) && parents.get(p)!.length);
      if (partner === undefined) continue;
      layer.splice(layer.indexOf(id), 1);
      layer.splice(layer.indexOf(partner) + 1, 0, id);
    }
    layer.forEach((id, i) => order.set(id, i - (layer.length - 1) / 2));
  });

  const c = centroid(positions, ids);
  const gapX = CARD_W + 84;
  const gapY = 180;
  const total = layers.filter(Boolean).length;
  const out: Record<number, Point> = {};
  layers.filter(Boolean).forEach((layer, li) => {
    layer.forEach((id) => {
      out[id] = { x: c.x + order.get(id)! * gapX, y: c.y + (li - (total - 1) / 2) * gapY };
    });
  });
  return out;
};

export const layoutCircle = (persons: Person[], positions: Record<number, Point>) => {
  const ids = persons.map((p) => p.id);
  const c = centroid(positions, ids);
  const n = ids.length;
  const radius = Math.max(220, (n * (CARD_W + 40)) / (2 * Math.PI));
  // Keep current angular order so nodes don't cross over each other.
  const sorted = [...ids].sort((a, b) => {
    const pa = positions[a] ?? c;
    const pb = positions[b] ?? c;
    return Math.atan2(pa.y - c.y, pa.x - c.x) - Math.atan2(pb.y - c.y, pb.x - c.x);
  });
  const out: Record<number, Point> = {};
  sorted.forEach((id, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    out[id] = { x: c.x + Math.cos(a) * radius, y: c.y + Math.sin(a) * radius * 0.78 };
  });
  return out;
};

/** Small force-directed simulation (Fruchterman–Reingold style), run synchronously. */
export const layoutForce = (persons: Person[], edges: Edge[], positions: Record<number, Point>) => {
  const ids = persons.map((p) => p.id);
  const c = centroid(positions, ids);
  const pos = new Map<number, Point>();
  ids.forEach((id, i) => {
    const p = positions[id] ?? c;
    // Deterministic jitter breaks symmetry when nodes are stacked.
    pos.set(id, { x: p.x + Math.cos(i * 2.4) * 8, y: p.y + Math.sin(i * 2.4) * 8 });
  });

  const ideal = 280;
  let temp = 120;
  for (let iter = 0; iter < 320; iter++) {
    const disp = new Map(ids.map((id) => [id, { x: 0, y: 0 }]));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos.get(ids[i])!;
        const b = pos.get(ids[j])!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.max(Math.hypot(dx, dy), 1);
        const f = (ideal * ideal) / d;
        const da = disp.get(ids[i])!;
        const db = disp.get(ids[j])!;
        da.x += (dx / d) * f;
        da.y += (dy / d) * f;
        db.x -= (dx / d) * f;
        db.y -= (dy / d) * f;
      }
    }
    for (const e of edges) {
      const a = pos.get(e.source);
      const b = pos.get(e.target);
      if (!a || !b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.max(Math.hypot(dx, dy), 1);
      const f = (d * d) / ideal;
      const da = disp.get(e.source)!;
      const db = disp.get(e.target)!;
      da.x -= (dx / d) * f;
      da.y -= (dy / d) * f;
      db.x += (dx / d) * f;
      db.y += (dy / d) * f;
    }
    for (const id of ids) {
      const p = pos.get(id)!;
      const d = disp.get(id)!;
      // Gentle gravity keeps disconnected clusters on screen.
      d.x += (c.x - p.x) * 0.6;
      d.y += (c.y - p.y) * 0.6;
      const len = Math.max(Math.hypot(d.x, d.y), 1);
      p.x += (d.x / len) * Math.min(len, temp);
      p.y += (d.y / len) * Math.min(len, temp);
    }
    temp = Math.max(temp * 0.985, 2);
  }

  const out: Record<number, Point> = {};
  // Cards are much wider than tall, so stretch the result horizontally to suit a screen.
  const fc = centroid(Object.fromEntries(pos), ids);
  ids.forEach((id) => {
    const p = pos.get(id)!;
    out[id] = { x: fc.x + (p.x - fc.x) * 1.35, y: fc.y + (p.y - fc.y) * 0.8 };
  });
  return out;
};

export const computeLayout = (
  kind: LayoutKind,
  persons: Person[],
  edges: Edge[],
  positions: Record<number, Point>,
) => {
  if (kind === "tree") return layoutTree(persons, edges, positions);
  if (kind === "circle") return layoutCircle(persons, positions);
  return layoutForce(persons, edges, positions);
};
