import React from "react";
import { ArrowDown, CornerDownLeft, FileImage, FileJson, FileCode2, Search, Network, Route } from "lucide-react";

/* Small, static illustrations for the landing-page feature grid. */

const Avatar = ({ text, color, size = 36 }: { text: string; color: string; size?: number }) => (
  <span
    className="flex shrink-0 items-center justify-center rounded-full font-bold text-[#1c1c1e]"
    style={{ background: color, width: size, height: size, fontSize: size * 0.34 }}
  >
    {text}
  </span>
);

const MiniCard = ({ name, role, color, className = "" }: { name: string; role: string; color: string; className?: string }) => (
  <div className={`flex w-[188px] items-center gap-3 rounded-[12px] bg-white px-3 py-2.5 shadow-[0_6px_20px_-8px_rgba(16,24,40,0.18)] ring-1 ring-[#e4e6ec] ${className}`}>
    <Avatar text={name.split(" ").map((w) => w[0]).join("")} color={color} />
    <div className="min-w-0">
      <div className="truncate text-[14px] font-semibold">{name}</div>
      <div className="truncate text-[12px] text-[#8a8fa3]">{role}</div>
    </div>
  </div>
);

export const ConnectVisual = () => (
  <div className="relative h-[170px] w-full sm:h-[230px]">
    <div className="absolute left-1/2 top-0 h-[230px] w-[480px] -translate-x-1/2 origin-top max-sm:scale-[0.7]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 480 230" aria-hidden>
        <path d="M 188 59 C 250 59 230 169 290 169" fill="none" stroke="#4262ff" strokeWidth="2.2" strokeDasharray="7 6" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" values="13;0" dur="0.7s" repeatCount="indefinite" />
        </path>
      </svg>
      <MiniCard name="Maya Ortiz" role="CEO" color="#ffe6cd" className="absolute left-0 top-[30px] ring-2 ring-[#4262ff]" />
      <MiniCard name="Sam Lee" role="Head of design" color="#c3faf5" className="absolute left-[292px] top-[140px]" />
      <div className="absolute left-[24px] top-[118px] w-[214px] rounded-[12px] bg-white p-2 shadow-[0_16px_40px_-12px_rgba(16,24,40,0.28)] ring-1 ring-[#e4e6ec]">
        <div className="mb-1.5 grid grid-cols-4 gap-1">
          {[
            ["Family", "#e5484d", "#ffe5e5"],
            ["Work", "#5b76fe", "#e3e8ff"],
            ["Friend", "#00a46a", "#d9f6e9"],
            ["Other", "#8a8fa3", "#eef0f4"],
          ].map(([l, c, s], i) => (
            <span
              key={l}
              className="rounded-[7px] py-1 text-center text-[11px] font-semibold"
              style={{ background: i === 1 ? s : "transparent", color: i === 1 ? c : "#6b7085" }}
            >
              {l}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {["manages", "co-founder", "mentor"].map((s, i) => (
            <span key={s} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${i === 0 ? "bg-[#4262ff] text-white" : "bg-[#f2f3f6] text-[#555a6a]"}`}>
              {s}
            </span>
          ))}
        </div>
    </div>
    </div>
  </div>
);

export const PathVisual = () => (
  <div className="flex h-[230px] flex-col items-center justify-center gap-1">
    {[
      ["Leo Hale", "#fff3c6"],
      ["Sarah Hale", "#ffc6c6"],
      ["Priya Shah", "#d4e4ff"],
    ].map(([name, color], i) => (
      <React.Fragment key={name}>
        {i > 0 && <ArrowDown className="size-3.5 text-[#4262ff]" />}
        <div className="flex w-[176px] items-center gap-2.5 rounded-[11px] bg-white px-3 py-1.5 shadow-[0_4px_14px_-6px_rgba(16,24,40,0.2)] ring-2 ring-[#4262ff]/80">
          <Avatar text={name.split(" ").map((w) => w[0]).join("")} color={color} size={26} />
          <span className="text-[13.5px] font-semibold">{name}</span>
        </div>
      </React.Fragment>
    ))}
    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#eef1ff] px-3 py-1 text-[12px] font-semibold text-[#4262ff]">
      <Route className="size-3.5" /> 2 degrees of separation
    </span>
  </div>
);

const Dot = ({ cx, cy, fill }: { cx: number; cy: number; fill: string }) => <circle cx={cx} cy={cy} r={7} fill={fill} stroke="#fff" strokeWidth={2} />;

export const LayoutVisual = () => {
  const c = ["#ffc6c6", "#c3faf5", "#ffe6cd", "#ffd8f4", "#d4e4ff", "#e0f5d0"];
  const circle = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + Math.cos(a) * 30, y: 50 + Math.sin(a) * 30 };
  });
  const thumbs: [string, React.ReactNode][] = [
    [
      "Hierarchy",
      <g key="h" stroke="#c4c9d6" strokeWidth={1.6} fill="none">
        <path d="M50 22 L28 50 M50 22 L72 50 M28 50 L18 78 M28 50 L38 78 M72 50 L72 78" />
        <Dot cx={50} cy={22} fill={c[0]} /><Dot cx={28} cy={50} fill={c[1]} /><Dot cx={72} cy={50} fill={c[2]} />
        <Dot cx={18} cy={78} fill={c[3]} /><Dot cx={38} cy={78} fill={c[4]} /><Dot cx={72} cy={78} fill={c[5]} />
      </g>,
    ],
    [
      "Organic",
      <g key="o" stroke="#c4c9d6" strokeWidth={1.6} fill="none">
        <path d="M46 46 L22 30 M46 46 L76 34 M46 46 L34 76 M46 46 L68 70 M76 34 L68 70 M22 30 L34 76" />
        <Dot cx={46} cy={46} fill={c[0]} /><Dot cx={22} cy={30} fill={c[1]} /><Dot cx={76} cy={34} fill={c[2]} />
        <Dot cx={34} cy={76} fill={c[3]} /><Dot cx={68} cy={70} fill={c[4]} /><Dot cx={84} cy={58} fill={c[5]} />
      </g>,
    ],
    [
      "Circle",
      <g key="c" stroke="#c4c9d6" strokeWidth={1.6} fill="none">
        <circle cx={50} cy={50} r={30} />
        {circle.map((p, i) => (
          <Dot key={i} cx={p.x} cy={p.y} fill={c[i]} />
        ))}
      </g>,
    ],
  ];
  return (
    <div className="grid h-[230px] grid-cols-3 content-center gap-3">
      {thumbs.map(([label, art], i) => (
        <div key={label} className={`rounded-[14px] bg-white p-2 ring-1 ${i === 0 ? "ring-2 ring-[#4262ff]" : "ring-[#e4e6ec]"}`}>
          <svg viewBox="0 0 100 100" className="w-full" aria-hidden>
            {art}
          </svg>
          <div className={`pb-1 text-center text-[12px] font-semibold ${i === 0 ? "text-[#4262ff]" : "text-[#555a6a]"}`}>{label}</div>
        </div>
      ))}
    </div>
  );
};

export const PaletteVisual = () => (
  <div className="flex h-[230px] items-center justify-center">
    <div className="w-full max-w-[300px] overflow-hidden rounded-[14px] bg-white shadow-[0_16px_40px_-14px_rgba(16,24,40,0.25)] ring-1 ring-[#e4e6ec]">
      <div className="flex items-center gap-2 border-b border-[#eceef2] px-3.5 py-3 text-[13.5px]">
        <Search className="size-4 text-[#8a8fa3]" />
        <span className="font-medium">sar</span>
        <span className="h-4 w-px animate-pulse bg-[#4262ff]" />
      </div>
      <div className="p-1.5">
        <div className="px-2 pb-1 pt-1 text-[10.5px] font-bold uppercase tracking-wider text-[#8a8fa3]">People</div>
        <div className="flex items-center gap-2.5 rounded-[9px] bg-[#eef1ff] px-2 py-1.5">
          <Avatar text="SH" color="#ffc6c6" size={24} />
          <span className="text-[13px] font-semibold">Sarah Hale</span>
          <CornerDownLeft className="ml-auto size-3.5 text-[#4262ff]" />
        </div>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar text="SL" color="#c3faf5" size={24} />
          <span className="text-[13px]">Sam Lee</span>
        </div>
        <div className="px-2 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-wider text-[#8a8fa3]">Commands</div>
        <div className="flex items-center gap-2.5 px-2 py-1.5 text-[13px]">
          <Network className="size-4 text-[#555a6a]" /> Auto-layout · Hierarchy
        </div>
      </div>
    </div>
  </div>
);

export const ExportVisual = () => (
  <div className="flex h-[230px] items-center justify-center gap-3">
    {[
      [FileImage, "PNG", "2× retina", "#ffe6cd"],
      [FileCode2, "SVG", "Vector", "#d9f6e9"],
      [FileJson, "JSON", "Re-import", "#e3e8ff"],
    ].map(([Icon, ext, sub, tint], i) => {
      const I = Icon as typeof FileImage;
      return (
        <div
          key={ext as string}
          className="flex w-[88px] flex-col items-center rounded-[14px] bg-white px-2 pb-3 pt-4 shadow-[0_8px_24px_-12px_rgba(16,24,40,0.25)] ring-1 ring-[#e4e6ec]"
          style={{ transform: `rotate(${(i - 1) * 5}deg) translateY(${i === 1 ? -8 : 0}px)` }}
        >
          <span className="mb-2 flex size-11 items-center justify-center rounded-[11px]" style={{ background: tint as string }}>
            <I className="size-5 text-[#1c1c1e]" />
          </span>
          <span className="text-[14px] font-bold">.{(ext as string).toLowerCase()}</span>
          <span className="text-[11px] text-[#8a8fa3]">{sub as string}</span>
        </div>
      );
    })}
  </div>
);
