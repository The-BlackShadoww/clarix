import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  Command,
  Download,
  Hand,
  Keyboard,
  LayoutTemplate,
  Map as MapIcon,
  Network,
  PenLine,
  Route,
  Save,
  Sparkles,
  Spline,
  Undo2,
  Users,
} from "lucide-react";
import { Logo } from "@/components/features/board/TopBar";
import { ProductMockup } from "@/components/features/landing/ProductMockup";
import { Reveal } from "@/components/features/landing/Reveal";
import {
  ConnectVisual,
  ExportVisual,
  LayoutVisual,
  PaletteVisual,
  PathVisual,
} from "@/components/features/landing/FeatureVisuals";

const NAV = [
  ["Features", "#features"],
  ["How it works", "#how-it-works"],
  ["Use cases", "#use-cases"],
  ["FAQ", "#faq"],
];

const AUDIENCES = [
  "Family historians",
  "Startup founders",
  "People & HR teams",
  "Writers & worldbuilders",
  "Researchers",
  "Community organisers",
];

const EXTRAS = [
  { icon: Save, title: "Autosave", body: "Every change is stored in your browser instantly." },
  { icon: Undo2, title: "Undo & redo", body: "Full history — drags and layouts included." },
  { icon: LayoutTemplate, title: "Templates", body: "Family tree, startup team or friend circle." },
  { icon: MapIcon, title: "Minimap", body: "Never lose your place on a big board." },
  { icon: Keyboard, title: "Shortcuts", body: "V, H, P, C, L — a key for every tool." },
  { icon: Hand, title: "Touch ready", body: "Pinch, pan and drag on phones and tablets." },
];

const STEPS = [
  { key: "P", title: "Add people", body: "Choose the person tool and click anywhere. Add a name, role, colour or photo." },
  { key: "C", title: "Draw relationships", body: "Drag from a card’s handle onto someone else, then choose how they’re related." },
  { key: "L", title: "Explore the map", body: "Auto-arrange, filter by relationship type and trace how any two people connect." },
];

const USE_CASES = [
  {
    icon: Users,
    tint: "#ffe5e5",
    color: "#e5484d",
    title: "Family trees",
    body: "Map generations, marriages and cousins. Hierarchy layout puts partners side by side and children beneath.",
    points: ["Parents, spouses & siblings", "Photos and ages on every card", "Share as a print-ready PNG"],
  },
  {
    icon: Briefcase,
    tint: "#e3e8ff",
    color: "#4262ff",
    title: "Teams & org charts",
    body: "See who reports to whom, who mentors whom, and where the informal connections sit across teams.",
    points: ["Reporting lines & mentorships", "Filter work links in one click", "Onboard new hires faster"],
  },
  {
    icon: PenLine,
    tint: "#d9f6e9",
    color: "#00a46a",
    title: "Stories & research",
    body: "Keep a cast of characters straight, or trace connections between sources, interviewees and organisations.",
    points: ["Any custom relationship label", "Find links you didn’t see", "Export JSON to keep working later"],
  },
];

const FAQ = [
  [
    "Is Clarix free?",
    "Yes. Clarix runs entirely in your browser with no account required — open the board and start mapping.",
  ],
  [
    "Where is my data stored?",
    "Boards autosave to your browser’s local storage, so nothing is sent to a server. Export to JSON any time to back up a board or move it to another device.",
  ],
  [
    "Can I import an existing board?",
    "Yes. Any board exported as JSON can be imported again from the board menu, and you can start from built-in templates.",
  ],
  [
    "Does it work on mobile?",
    "It does. The canvas supports pinch-to-zoom, two-finger panning and dragging cards with touch, and the interface adapts to small screens.",
  ],
];

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#eef1ff] px-3 py-1 text-[13px] font-semibold text-[#4262ff]">
    {children}
  </div>
);

const SectionHeading = ({ eyebrow, title, body }: { eyebrow: React.ReactNode; title: React.ReactNode; body?: string }) => (
  <Reveal className="mx-auto mb-14 max-w-2xl text-center">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="text-[34px] font-semibold leading-[1.1] tracking-[-1.2px] text-balance sm:text-[46px] sm:tracking-[-1.6px]">{title}</h2>
    {body && <p className="mt-4 text-[17px] leading-relaxed text-[#5b6072] text-pretty sm:text-[19px]">{body}</p>}
  </Reveal>
);

const BentoCard = ({
  className = "",
  icon: Icon,
  title,
  body,
  children,
  delay = 0,
}: {
  className?: string;
  icon: React.ElementType;
  title: string;
  body: string;
  children: React.ReactNode;
  delay?: number;
}) => (
  <Reveal delay={delay} className={className}>
    <div className="group flex h-full flex-col overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e8eaef] transition-shadow duration-300 hover:shadow-[0_24px_60px_-24px_rgba(16,24,64,0.22)]">
      <div className="relative bg-[#f7f8fa] bg-[radial-gradient(#dfe2e9_1px,transparent_1px)] px-6 [background-size:18px_18px]">
        {children}
      </div>
      <div className="flex flex-1 flex-col p-6 pt-5">
        <div className="mb-1.5 flex items-center gap-2">
          <Icon className="size-[18px] text-[#4262ff]" />
          <h3 className="text-[18px] font-semibold tracking-[-0.3px]">{title}</h3>
        </div>
        <p className="text-[15px] leading-relaxed text-[#5b6072]">{body}</p>
      </div>
    </div>
  </Reveal>
);

/**
 * The public-facing landing page route (`/`).
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1c1c1e] selection:bg-[#4262ff] selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#eceef2]/80 bg-white/75 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-8" />
            <span className="text-[19px] font-bold tracking-[-0.5px]">Clarix</span>
          </Link>
          <div className="hidden items-center gap-8 text-[14.5px] font-medium text-[#5b6072] md:flex">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="transition-colors hover:text-[#1c1c1e]">
                {label}
              </a>
            ))}
          </div>
          <Link
            href="/canvas"
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#1c1c1e] px-4 py-2 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#33343a]"
          >
            Open board <ArrowRight className="size-4" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d9dce4_1.2px,transparent_1.2px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black_30%,transparent_80%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[420px] h-[520px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(66,98,255,0.18),transparent)] blur-2xl" />
        <div className="pointer-events-none absolute right-[8%] top-[120px] hidden size-[260px] rounded-full bg-[#ffd02f]/25 blur-3xl lg:block" />
        <div className="pointer-events-none absolute left-[6%] top-[200px] hidden size-[240px] rounded-full bg-[#ffc6c6]/40 blur-3xl lg:block" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <a
              href="#features"
              className="mb-7 inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[13.5px] font-medium text-[#3c3f4a] shadow-[0_2px_8px_-2px_rgba(16,24,40,0.08)] ring-1 ring-[#e4e6ec] transition-colors hover:ring-[#c9d3ff]"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-[#4262ff] px-2 py-0.5 text-[12px] font-semibold text-white">
                <Sparkles className="size-3" /> New
              </span>
              Path finder &amp; one-click auto-layout
              <ArrowRight className="size-3.5 text-[#8a8fa3]" />
            </a>
            <h1 className="text-[44px] font-semibold leading-[1.04] tracking-[-1.8px] text-balance sm:text-[68px] sm:tracking-[-2.8px] lg:text-[78px]">
              Map every{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">relationship</span>
                <svg viewBox="0 0 300 20" preserveAspectRatio="none" className="absolute -bottom-1 left-0 z-0 h-[0.32em] w-full sm:-bottom-2" aria-hidden>
                  <path d="M3 14 C 70 4, 150 4, 297 10" stroke="#ffd02f" strokeWidth="9" fill="none" strokeLinecap="round" />
                </svg>
              </span>{" "}
              on one infinite canvas.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-[18px] leading-[1.55] text-[#5b6072] text-pretty sm:text-[20px]">
              Clarix turns families, teams and social circles into a living map. Drag to connect, auto-arrange in one
              click, and see exactly how any two people are linked.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/canvas"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#4262ff] px-7 py-3.5 text-[16px] font-semibold text-white shadow-[0_10px_30px_-6px_rgba(66,98,255,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3451e8] sm:w-auto"
              >
                Start mapping — it’s free <ArrowRight className="size-[18px]" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-white px-7 py-3.5 text-[16px] font-semibold text-[#1c1c1e] ring-1 ring-[#dfe1e7] transition-colors hover:bg-[#f7f8fa] sm:w-auto"
              >
                See how it works
              </a>
            </div>
            <p className="mt-5 text-[13.5px] font-medium text-[#8a8fa3]">No sign-up · Autosaves in your browser · Works on touch</p>
          </div>

          <Reveal delay={0.15} className="relative mx-auto mt-16 max-w-[1120px] sm:mt-20">
            <ProductMockup />
          </Reveal>
        </div>
      </section>

      {/* Audience strip */}
      <section className="border-y border-[#eceef2] bg-[#fbfbfc]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-5 py-9 sm:px-8 lg:flex-row lg:justify-between">
          <span className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8a8fa3]">Built for</span>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[15.5px] font-semibold text-[#3c3f4a] lg:justify-end">
            {AUDIENCES.map((a) => (
              <span key={a} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#c4c9d6]" />
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <SectionHeading
            eyebrow={<><Sparkles className="size-3.5" /> Features</>}
            title="A whiteboard that understands people."
            body="The freedom of an infinite canvas, with tools built for how people relate — not just boxes and arrows."
          />
          <div className="grid gap-5 lg:grid-cols-6">
            <BentoCard
              className="lg:col-span-4"
              icon={Spline}
              title="Drag to connect"
              body="Pull a connector from any card onto another person, then pick Family, Work, Friend or Other and a label. Links are colour-coded and filterable."
            >
              <ConnectVisual />
            </BentoCard>
            <BentoCard
              className="lg:col-span-2"
              delay={0.08}
              icon={Route}
              title="How are they connected?"
              body="Pick any two people and Clarix highlights the shortest chain between them."
            >
              <PathVisual />
            </BentoCard>
            <BentoCard
              className="lg:col-span-2"
              icon={Network}
              title="One-click auto-layout"
              body="Hierarchy, Organic or Circle — cards glide into place and connectors route around them."
            >
              <LayoutVisual />
            </BentoCard>
            <BentoCard
              className="lg:col-span-2"
              delay={0.08}
              icon={Command}
              title="Search & command palette"
              body="Press Ctrl K to jump to anyone, run a layout or export without touching the mouse."
            >
              <PaletteVisual />
            </BentoCard>
            <BentoCard
              className="lg:col-span-2"
              delay={0.16}
              icon={Download}
              title="Export anywhere"
              body="Download a crisp 2× PNG, a vector SVG, or JSON you can import again later."
            >
              <ExportVisual />
            </BentoCard>
          </div>

          <Reveal className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] bg-[#e8eaef] ring-1 ring-[#e8eaef] sm:grid-cols-3 lg:grid-cols-6">
            {EXTRAS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white p-5">
                <Icon className="mb-3 size-5 text-[#1c1c1e]" />
                <div className="text-[14.5px] font-semibold">{title}</div>
                <div className="mt-1 text-[13px] leading-snug text-[#6b7085]">{body}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 bg-[#f7f8fa]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <SectionHeading eyebrow="How it works" title="From a blank board to clarity in minutes." />
          <div className="relative grid gap-5 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-[44px] hidden border-t-2 border-dashed border-[#d3d7e0] md:block" />
            {STEPS.map(({ key, title, body }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className="relative h-full rounded-[24px] bg-white p-8 text-center ring-1 ring-[#e8eaef]">
                  <span className="mx-auto mb-6 flex size-[52px] items-center justify-center rounded-full bg-[#1c1c1e] text-[18px] font-semibold text-white ring-[6px] ring-[#f7f8fa]">
                    {i + 1}
                  </span>
                  <h3 className="mb-2 text-[20px] font-semibold tracking-[-0.4px]">{title}</h3>
                  <p className="text-[15px] leading-relaxed text-[#5b6072]">{body}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-[13px] text-[#8a8fa3]">
                    Shortcut
                    <kbd className="rounded-[6px] bg-[#f2f3f6] px-2 py-0.5 font-sans text-[12px] font-semibold text-[#3c3f4a] ring-1 ring-[#e1e3ea]">
                      {key}
                    </kbd>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <SectionHeading
            eyebrow="Use cases"
            title="One canvas, every kind of network."
            body="Start from a template or a blank board — Clarix adapts to whatever you’re mapping."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {USE_CASES.map(({ icon: Icon, tint, color, title, body, points }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className="flex h-full flex-col rounded-[24px] p-8 ring-1 ring-[#e8eaef] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(16,24,64,0.22)]">
                  <span className="mb-6 flex size-12 items-center justify-center rounded-[14px]" style={{ background: tint }}>
                    <Icon className="size-[22px]" style={{ color }} />
                  </span>
                  <h3 className="mb-2 text-[21px] font-semibold tracking-[-0.4px]">{title}</h3>
                  <p className="mb-6 text-[15px] leading-relaxed text-[#5b6072]">{body}</p>
                  <ul className="mt-auto space-y-2.5 border-t border-[#eceef2] pt-5">
                    {points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-[14.5px] text-[#3c3f4a]">
                        <span className="size-1.5 rounded-full" style={{ background: color }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-t border-[#eceef2]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-[34px] font-semibold leading-[1.1] tracking-[-1.2px] sm:text-[46px] sm:tracking-[-1.6px]">
              Questions, answered.
            </h2>
            <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-[#5b6072]">
              Everything you need to know before opening your first board.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="divide-y divide-[#eceef2] border-y border-[#eceef2]">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="size-5 shrink-0 text-[#8a8fa3] transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-3 pr-8 text-[15.5px] leading-relaxed text-[#5b6072]">{a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-24 sm:px-8">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#1c1c1e] px-6 py-20 text-center text-white sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1.2px,transparent_1.2px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-[#4262ff]/40 blur-[110px]" />
          <div className="relative">
            <h2 className="mx-auto mb-5 max-w-2xl text-[34px] font-semibold leading-[1.08] tracking-[-1.2px] text-balance sm:text-[52px] sm:tracking-[-1.8px]">
              Untangle your network today.
            </h2>
            <p className="mx-auto mb-9 max-w-lg text-[17px] text-[#b5b8c4] sm:text-[18px]">
              Open the board with a sample family tree, or start from a blank canvas. No account needed.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/canvas"
                className="inline-flex items-center gap-2 rounded-[12px] bg-white px-7 py-3.5 text-[16px] font-semibold text-[#1c1c1e] transition-transform hover:-translate-y-0.5"
              >
                Open the board <ArrowRight className="size-[18px]" />
              </Link>
              <span className="text-[13.5px] text-[#8a8fa3]">
                Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-[12px] text-white">?</kbd> on the board for shortcuts
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#eceef2]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <Logo className="size-7" />
            <span className="text-[16px] font-bold tracking-[-0.4px]">Clarix</span>
            <span className="ml-2 hidden text-[13.5px] text-[#8a8fa3] lg:inline">Relationship mapping on an infinite canvas.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] font-medium text-[#5b6072]">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="transition-colors hover:text-[#1c1c1e]">
                {label}
              </a>
            ))}
            <Link href="/canvas" className="text-[#4262ff] hover:text-[#3451e8]">
              Open board
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
