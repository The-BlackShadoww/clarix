"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Command,
  Download,
  Map as MapIcon,
  Network,
  Route,
  Spline,
  Undo2,
} from "lucide-react";
import { HeroGraphic } from "@/components/features/landing/HeroGraphic";
import { Logo } from "@/components/features/board/TopBar";

const FEATURES = [
  {
    icon: Spline,
    tint: "#e3e8ff",
    title: "Drag-to-connect",
    body: "Pull a connector from any person to another. Pick Family, Work, Friend or Other and a label — links are colour-coded and filterable.",
  },
  {
    icon: Network,
    tint: "#ffe6cd",
    title: "One-click auto-layout",
    body: "Hierarchy for family trees and org charts, Organic for social webs, Circle for groups. Cards glide into place and connectors route around obstacles.",
  },
  {
    icon: Route,
    tint: "#d9f6e9",
    title: "How are they connected?",
    body: "Pick any two people and Clarix finds the shortest chain of relationships between them — degrees of separation, highlighted on the map.",
  },
  {
    icon: Command,
    tint: "#ffd8f4",
    title: "Search & command palette",
    body: "Press Ctrl K to jump to anyone on the board, run a layout or export — without touching the mouse.",
  },
  {
    icon: Undo2,
    tint: "#c3faf5",
    title: "Autosave, undo & templates",
    body: "Every change is saved locally with full undo/redo history. Start from a family tree, startup team or friend-circle template.",
  },
  {
    icon: Download,
    tint: "#fff3c6",
    title: "Export anywhere",
    body: "Download your map as a crisp 2× PNG, a vector SVG, or JSON you can import again later.",
  },
];

const STEPS = [
  ["Add people", "Press P and click anywhere on the board. Give them a role, age, colour or photo."],
  ["Draw relationships", "Drag from a card’s handle onto someone else and choose what links them."],
  ["Explore the network", "Auto-arrange, filter by relationship type and trace how anyone is connected."],
];

/**
 * The public-facing landing page route (`/`).
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1c1c1e] selection:bg-[#4262ff] selection:text-white">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-8" />
          <span className="text-xl font-bold tracking-[-0.5px]">Clarix</span>
        </Link>
        <div className="flex items-center gap-6 text-[15px] font-medium text-[#555a6a]">
          <a href="#features" className="hidden transition-colors hover:text-[#1c1c1e] sm:inline">
            Features
          </a>
          <a href="#how-it-works" className="hidden transition-colors hover:text-[#1c1c1e] sm:inline">
            How it works
          </a>
          <Link
            href="/canvas"
            className="rounded-[10px] bg-[#1c1c1e] px-4 py-2.5 text-white transition-colors hover:bg-[#2f3036]"
          >
            Open board
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-5 pb-24 pt-10 sm:px-8 lg:flex-row lg:gap-16 lg:pt-20">
        <div className="z-10 flex-1 space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f3f5ff] px-3 py-1.5 text-[13.5px] font-medium text-[#4262ff] ring-1 ring-[#dfe5ff]">
            <span className="size-2 rounded-full bg-[#4262ff]" />
            New: path finder, auto-layout & PNG export
          </div>
          <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-1.4px] sm:text-[58px] sm:tracking-[-2px] lg:max-w-[620px]">
            See how everyone is <span className="text-[#4262ff]">connected.</span>
          </h1>
          <p className="text-[18px] leading-[1.5] text-[#555a6a] sm:text-[21px] lg:max-w-[540px]">
            Clarix is an infinite canvas for mapping families, teams and social circles. Drag to connect,
            auto-arrange in one click, and trace the path between any two people.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/canvas"
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#4262ff] px-7 py-4 text-[16.5px] font-semibold text-white shadow-[0_10px_28px_rgba(66,98,255,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3451e8]"
            >
              Start mapping — it’s free <ArrowRight className="size-5" />
            </Link>
            <span className="text-[14px] font-medium text-[#8a8fa3]">No sign-up · saves in your browser</span>
          </div>
        </div>
        <HeroGraphic />
      </main>

      {/* Features */}
      <section id="features" className="border-t border-[#eceef2] bg-[#f7f8fa]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-[34px] font-semibold leading-[1.15] tracking-[-1.2px] sm:text-[46px]">
              A whiteboard built for relationships.
            </h2>
            <p className="mt-4 text-[18px] text-[#555a6a] sm:text-[20px]">
              The feel of a collaborative canvas, with tools that understand people and how they relate.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, tint, title, body }) => (
              <div
                key={title}
                className="rounded-[20px] bg-white p-7 ring-1 ring-[#e8eaef] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(16,24,40,0.15)]"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-[12px]" style={{ background: tint }}>
                  <Icon className="size-[22px] text-[#1c1c1e]" />
                </div>
                <h3 className="mb-2 text-[20px] font-semibold tracking-[-0.5px]">{title}</h3>
                <p className="text-[15.5px] leading-relaxed text-[#555a6a]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <h2 className="mb-12 text-center text-[34px] font-semibold tracking-[-1.2px] sm:text-[46px]">Three steps to clarity.</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <div key={title} className="relative rounded-[20px] p-7 ring-1 ring-[#e8eaef]">
              <span className="mb-5 flex size-9 items-center justify-center rounded-full bg-[#1c1c1e] text-[14px] font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mb-2 text-[20px] font-semibold tracking-[-0.5px]">{title}</h3>
              <p className="text-[15.5px] leading-relaxed text-[#555a6a]">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] text-[#8a8fa3]">
          <span className="flex items-center gap-1.5"><MapIcon className="size-4" /> Minimap navigation</span>
          <span>·</span>
          <span>Keyboard shortcuts for every tool</span>
          <span>·</span>
          <span>Works with mouse, trackpad and touch</span>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[28px] bg-[#1c1c1e] px-6 py-16 text-center text-white sm:py-20">
          <h2 className="mb-4 text-[32px] font-semibold tracking-[-1px] sm:text-[44px]">Ready to untangle the complexity?</h2>
          <p className="mb-8 max-w-xl text-[17px] text-[#b5b8c4]">Open the board with a sample family tree, or start from a blank canvas.</p>
          <Link
            href="/canvas"
            className="inline-flex items-center gap-2 rounded-[12px] bg-white px-7 py-4 text-[16.5px] font-semibold text-[#1c1c1e] transition-transform hover:-translate-y-0.5"
          >
            Open the board <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
