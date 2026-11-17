import React from "react";
import {
  Download,
  Hand,
  LayoutGrid,
  Minus,
  MousePointer2,
  Plus,
  Route,
  Search,
  Spline,
  Undo2,
  UserPlus,
} from "lucide-react";

const W = 184;
const H = 60;
const ACCENT = "#4262ff";

type Kind = "family" | "work" | "friend";
const KIND: Record<Kind, { color: string; soft: string }> = {
  family: { color: "#e5484d", soft: "#ffe5e5" },
  work: { color: "#5b76fe", soft: "#e3e8ff" },
  friend: { color: "#00a46a", soft: "#d9f6e9" },
};

type Person = { id: string; name: string; role: string; color: string; x: number; y: number };

const PEOPLE: Person[] = [
  { id: "a", name: "Arthur Hale", role: "Grandfather", color: "#ffe6cd", x: 260, y: 178 },
  { id: "m", name: "Margaret Hale", role: "Grandmother", color: "#ffd8f4", x: 520, y: 178 },
  { id: "d", name: "David Hale", role: "Architect", color: "#c3faf5", x: 260, y: 336 },
  { id: "s", name: "Sarah Hale", role: "Paediatrician", color: "#ffc6c6", x: 520, y: 336 },
  { id: "e", name: "Emma Hale", role: "Student", color: "#e0f5d0", x: 260, y: 494 },
  { id: "l", name: "Leo Hale", role: "Musician", color: "#fff3c6", x: 520, y: 494 },
  { id: "p", name: "Priya Shah", role: "Product designer", color: "#d4e4ff", x: 780, y: 336 },
  { id: "n", name: "Noah Kim", role: "Engineer", color: "#e3e8ff", x: 780, y: 494 },
];
const byId = Object.fromEntries(PEOPLE.map((p) => [p.id, p]));

type Link = { from: string; to: string; kind: Kind; label?: string; directed?: boolean };
const LINKS: Link[] = [
  { from: "a", to: "m", kind: "family", label: "spouse" },
  { from: "a", to: "d", kind: "family", label: "parent of", directed: true },
  { from: "m", to: "d", kind: "family", directed: true },
  { from: "d", to: "s", kind: "family", label: "spouse" },
  { from: "d", to: "e", kind: "family", directed: true },
  { from: "s", to: "l", kind: "family", directed: true },
  { from: "e", to: "l", kind: "family", label: "sibling" },
  { from: "s", to: "p", kind: "work", label: "colleague" },
  { from: "p", to: "n", kind: "work", label: "mentor", directed: true },
];

/** The path-finder result shown in the mockup: Leo → Sarah → Priya. */
const PATH = new Set(["s-l", "s-p"]);
const PATH_PEOPLE = new Set(["l", "s", "p"]);

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

function geometry(a: Person, b: Person) {
  if (Math.abs(a.y - b.y) < 1) {
    const [l, r] = a.x < b.x ? [a, b] : [b, a];
    return { d: `M ${l.x + W / 2} ${l.y} L ${r.x - W / 2} ${r.y}`, mx: (l.x + r.x) / 2, my: l.y };
  }
  const [t, btm] = a.y < b.y ? [a, b] : [b, a];
  const y1 = t.y + H / 2;
  const y2 = btm.y - H / 2;
  const ym = (y1 + y2) / 2;
  return {
    d: `M ${t.x} ${y1} C ${t.x} ${ym} ${btm.x} ${ym} ${btm.x} ${y2 - 2}`,
    mx: (t.x + btm.x) / 2,
    my: ym,
  };
}

const Panel = ({ x, y, w, h, r = 12, children }: { x: number; y: number; w: number; h: number; r?: number; children?: React.ReactNode }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={w} height={h} rx={r} fill="#fff" stroke="#e7e9ef" filter="url(#mk-panel)" />
    {children}
  </g>
);

/**
 * A static, scalable rendition of the Clarix board used as the landing-page hero shot.
 * Drawn as a single SVG so it stays crisp and proportional at every screen size.
 */
export const ProductMockup: React.FC = () => (
  <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_40px_100px_-30px_rgba(16,24,64,0.35),0_0_0_1px_rgba(16,24,64,0.08)] sm:rounded-[22px]">
    {/* Window chrome */}
    <div className="flex h-9 items-center gap-2 border-b border-[#eceef2] bg-[#fbfbfc] px-4 sm:h-11">
      <span className="size-2.5 rounded-full bg-[#ff5f57] sm:size-3" />
      <span className="size-2.5 rounded-full bg-[#febc2e] sm:size-3" />
      <span className="size-2.5 rounded-full bg-[#28c840] sm:size-3" />
      <div className="mx-auto hidden h-6 w-[340px] items-center justify-center rounded-md bg-[#f0f1f4] text-[12px] text-[#8a8fa3] sm:flex">
        clarix.app/canvas
      </div>
      <span className="hidden w-[52px] sm:block" />
    </div>

    <svg viewBox="0 0 1200 680" className="block h-auto w-full select-none" role="img" aria-label="The Clarix board showing a family tree with a highlighted connection path">
      <defs>
        <pattern id="mk-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.3" fill="#d6d9e1" />
        </pattern>
        <filter id="mk-card" x="-20%" y="-30%" width="140%" height="170%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#101828" floodOpacity="0.06" />
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#101828" floodOpacity="0.05" />
        </filter>
        <filter id="mk-panel" x="-20%" y="-30%" width="140%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#101828" floodOpacity="0.08" />
        </filter>
        {(["family", "work"] as Kind[]).map((k) => (
          <marker key={k} id={`mk-arrow-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 1 1 L 9 5 L 1 9 z" fill={KIND[k].color} />
          </marker>
        ))}
        <marker id="mk-arrow-path" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 1 1 L 9 5 L 1 9 z" fill={ACCENT} />
        </marker>
      </defs>

      <rect width="1200" height="680" fill="#f7f8fa" />
      <rect width="1200" height="680" fill="url(#mk-dots)" />

      {/* Connectors */}
      <g fill="none" strokeLinecap="round">
        {LINKS.map((l) => {
          const g = geometry(byId[l.from], byId[l.to]);
          const onPath = PATH.has(`${l.from}-${l.to}`);
          const color = onPath ? ACCENT : KIND[l.kind].color;
          return (
            <g key={`${l.from}-${l.to}`}>
              {onPath && <path d={g.d} stroke={ACCENT} strokeOpacity={0.16} strokeWidth={10} />}
              <path
                d={g.d}
                stroke={color}
                strokeWidth={onPath ? 2.6 : 1.8}
                strokeOpacity={onPath ? 1 : 0.75}
                strokeDasharray={onPath ? "8 6" : undefined}
                markerEnd={l.directed ? `url(#mk-arrow-${onPath ? "path" : l.kind})` : undefined}
              >
                {onPath && <animate attributeName="stroke-dashoffset" values="14;0" dur="0.8s" repeatCount="indefinite" />}
              </path>
            </g>
          );
        })}
      </g>

      {/* Connector labels */}
      {LINKS.filter((l) => l.label).map((l) => {
        const g = geometry(byId[l.from], byId[l.to]);
        const w = l.label!.length * 6.2 + 16;
        const onPath = PATH.has(`${l.from}-${l.to}`);
        const color = onPath ? ACCENT : KIND[l.kind].color;
        return (
          <g key={`lbl-${l.from}-${l.to}`} transform={`translate(${g.mx - w / 2} ${g.my - 11})`}>
            <rect width={w} height={22} rx={11} fill="#fff" stroke={onPath ? "#c9d3ff" : KIND[l.kind].soft} strokeWidth={1.5} />
            <text x={w / 2} y={15} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={color}>
              {l.label}
            </text>
          </g>
        );
      })}

      {/* Person cards */}
      {PEOPLE.map((p) => {
        const onPath = PATH_PEOPLE.has(p.id);
        const selected = p.id === "p";
        return (
          <g key={p.id} transform={`translate(${p.x - W / 2} ${p.y - H / 2})`}>
            {selected && <rect x={-5} y={-5} width={W + 10} height={H + 10} rx={16} fill="none" stroke={ACCENT} strokeOpacity={0.25} strokeWidth={4} />}
            <rect width={W} height={H} rx={12} fill="#fff" stroke={onPath ? ACCENT : "#e4e6ec"} strokeWidth={onPath ? 2 : 1} filter="url(#mk-card)" />
            <circle cx={31} cy={30} r={18} fill={p.color} />
            <text x={31} y={34.5} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#1c1c1e">
              {initials(p.name)}
            </text>
            <text x={60} y={27} fontSize={14} fontWeight={600} fill="#1c1c1e">
              {p.name}
            </text>
            <text x={60} y={44} fontSize={12} fill="#8a8fa3">
              {p.role}
            </text>
            {selected &&
              [
                [W / 2, 0],
                [W, H / 2],
                [W / 2, H],
                [0, H / 2],
              ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#fff" stroke={ACCENT} strokeWidth={2} />)}
          </g>
        );
      })}

      {/* Drag-to-connect in progress, from Emma */}
      <path d="M 260 524 C 260 590 380 600 412 600" fill="none" stroke={ACCENT} strokeWidth={2} strokeDasharray="6 6">
        <animate attributeName="stroke-dashoffset" values="12;0" dur="0.6s" repeatCount="indefinite" />
      </path>
      <circle cx={260} cy={524} r={5} fill="#fff" stroke={ACCENT} strokeWidth={2} />
      <g transform="translate(410 592)">
        <path d="M0 0 L0 17 L4.6 12.8 L7.6 19.4 L10.4 18.2 L7.4 11.8 L13.6 11.6 Z" fill="#1c1c1e" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
        <g transform="translate(16 18)">
          <rect width={176} height={26} rx={8} fill="#1c1c1e" />
          <text x={88} y={17.5} textAnchor="middle" fontSize={11.5} fontWeight={500} fill="#fff">
            Drop on a person to connect
          </text>
        </g>
      </g>

      {/* Top-left: board identity */}
      <Panel x={16} y={16} w={292} h={48}>
        <rect x={12} y={12} width={24} height={24} rx={7} fill={ACCENT} />
        <circle cx={20} cy={20.5} r={2.8} fill="#fff" />
        <circle cx={29} cy={19.5} r={2.3} fill="#ffd02f" />
        <circle cx={25} cy={29} r={2.8} fill="#fff" />
        <text x={48} y={29} fontSize={14} fontWeight={700} fill="#1c1c1e">
          Clarix
        </text>
        <line x1={100} y1={14} x2={100} y2={34} stroke="#e7e9ef" />
        <text x={114} y={29} fontSize={13.5} fontWeight={500} fill="#1c1c1e">
          Hale family tree
        </text>
        <circle cx={240} cy={24} r={3.5} fill="#00a46a" />
        <text x={249} y={28.5} fontSize={11.5} fill="#8a8fa3">
          Saved
        </text>
      </Panel>

      {/* Top-right: search + export */}
      <Panel x={812} y={16} w={372} h={48}>
        <rect x={8} y={8} width={236} height={32} rx={8} fill="#f4f5f8" />
        <Search x={18} y={16} width={16} height={16} color="#8a8fa3" strokeWidth={2} />
        <text x={42} y={29} fontSize={12.5} fill="#8a8fa3">
          Search people…
        </text>
        <rect x={194} y={14} width={42} height={20} rx={5} fill="#fff" stroke="#e1e3ea" />
        <text x={215} y={28} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="#6b7085">
          Ctrl K
        </text>
        <rect x={254} y={8} width={110} height={32} rx={8} fill={ACCENT} />
        <Download x={272} y={16} width={16} height={16} color="#fff" strokeWidth={2} />
        <text x={296} y={29} fontSize={12.5} fontWeight={600} fill="#fff">
          Export
        </text>
      </Panel>

      {/* Path finder banner */}
      <Panel x={392} y={82} w={416} h={44} r={22}>
        <circle cx={24} cy={22} r={13} fill="#eef1ff" />
        <Route x={16} y={14} width={16} height={16} color={ACCENT} strokeWidth={2} />
        <text x={46} y={27} fontSize={13} fill="#1c1c1e">
          <tspan fontWeight={600}>Leo → Sarah → Priya</tspan>
          <tspan fill="#8a8fa3">{"  ·  "}</tspan>
          <tspan fill={ACCENT} fontWeight={600}>
            2 degrees of separation
          </tspan>
        </text>
      </Panel>

      {/* Left tool rail */}
      <Panel x={16} y={178} w={52} h={318}>
        {[MousePointer2, Hand, UserPlus, Spline, Route, LayoutGrid].map((Icon, i) => (
          <g key={i} transform={`translate(6 ${8 + i * 44})`}>
            {i === 4 && <rect width={40} height={40} rx={9} fill="#eef1ff" />}
            <Icon x={11} y={11} width={18} height={18} color={i === 4 ? ACCENT : "#3c3f4a"} strokeWidth={1.9} />
          </g>
        ))}
        <line x1={12} y1={274} x2={40} y2={274} stroke="#eceef2" />
        <Undo2 x={17} y={282} width={18} height={18} color="#3c3f4a" strokeWidth={1.9} />
      </Panel>

      {/* Inspector for the selected person */}
      <Panel x={968} y={150} w={216} h={290} r={14}>
        <circle cx={108} cy={52} r={30} fill="#d4e4ff" />
        <text x={108} y={58} textAnchor="middle" fontSize={18} fontWeight={700} fill="#1c1c1e">
          PS
        </text>
        <text x={108} y={104} textAnchor="middle" fontSize={15} fontWeight={700} fill="#1c1c1e">
          Priya Shah
        </text>
        <text x={108} y={122} textAnchor="middle" fontSize={12} fill="#8a8fa3">
          Product designer
        </text>
        <line x1={16} y1={142} x2={200} y2={142} stroke="#eceef2" />
        <text x={16} y={164} fontSize={10.5} fontWeight={700} letterSpacing={0.6} fill="#8a8fa3">
          CONNECTIONS
        </text>
        {[
          ["SH", "#ffc6c6", "Sarah Hale", "colleague"],
          ["NK", "#e3e8ff", "Noah Kim", "mentor"],
        ].map(([ini, color, name, rel], i) => (
          <g key={name} transform={`translate(16 ${178 + i * 44})`}>
            <rect width={184} height={36} rx={9} fill="#f7f8fa" />
            <circle cx={18} cy={18} r={11} fill={color} />
            <text x={18} y={21.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#1c1c1e">
              {ini}
            </text>
            <text x={36} y={22.5} fontSize={12} fontWeight={600} fill="#1c1c1e">
              {name}
            </text>
            <rect x={116} y={9} width={60} height={18} rx={9} fill="#e3e8ff" />
            <text x={146} y={21.5} textAnchor="middle" fontSize={10} fontWeight={600} fill="#5b76fe">
              {rel}
            </text>
          </g>
        ))}
      </Panel>

      {/* Bottom-left legend */}
      <Panel x={84} y={624} w={272} h={40} r={20}>
        {(
          [
            ["Family", "#e5484d"],
            ["Work", "#5b76fe"],
            ["Friend", "#00a46a"],
            ["Other", "#8a8fa3"],
          ] as const
        ).map(([label, color], i) => (
          <g key={label} transform={`translate(${16 + i * 64} 20)`}>
            <circle r={4.5} fill={color} />
            <text x={10} y={4.5} fontSize={12} fontWeight={500} fill="#3c3f4a">
              {label}
            </text>
          </g>
        ))}
      </Panel>

      {/* Bottom-right zoom */}
      <Panel x={1040} y={624} w={144} h={40} r={10}>
        <Minus x={14} y={11} width={18} height={18} color="#3c3f4a" strokeWidth={2} />
        <text x={72} y={25} textAnchor="middle" fontSize={12.5} fontWeight={600} fill="#1c1c1e">
          100%
        </text>
        <Plus x={112} y={11} width={18} height={18} color="#3c3f4a" strokeWidth={2} />
      </Panel>
    </svg>
  </div>
);
