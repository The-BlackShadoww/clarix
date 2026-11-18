"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Braces,
  Check,
  ChevronDown,
  Download,
  FileImage,
  FilePlus2,
  Keyboard,
  LayoutTemplate,
  Loader2,
  Search,
  Upload,
} from "lucide-react";
import { IconButton, Kbd, Menu, MenuDivider, MenuItem, MenuLabel, MOD, Panel } from "./primitives";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  onTitle: (t: string) => void;
  isSaved: boolean;
  stats: { people: number; links: number };
  onSearch: () => void;
  onExport: (kind: "png" | "svg" | "json") => void;
  onImport: () => void;
  onNewBoard: () => void;
  onTemplates: () => void;
  onShortcuts: () => void;
};

export const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect width="32" height="32" rx="9" fill="#4262ff" />
    <circle cx="10" cy="11" r="3.6" fill="#fff" />
    <circle cx="22" cy="10" r="3" fill="#ffd02f" />
    <circle cx="17" cy="22" r="3.6" fill="#fff" />
    <path d="M10 11 L17 22 L22 10" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".85" />
  </svg>
);

/** Floating header: board identity on the left, search / export on the right. */
export const TopBar: React.FC<Props> = ({
  title,
  onTitle,
  isSaved,
  stats,
  onSearch,
  onExport,
  onImport,
  onNewBoard,
  onTemplates,
  onShortcuts,
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const commitTitle = () => {
    if (draft !== null) onTitle(draft.trim() || "Untitled board");
    setDraft(null);
  };

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-50 flex items-start justify-between gap-3 sm:inset-x-4 sm:top-4">
      <Panel className="pointer-events-auto flex h-12 min-w-0 items-center gap-1 pl-2 pr-1.5">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-[#f3f4f8]" title="Clarix home">
          <Logo className="size-7" />
          <span className="hidden text-[16px] font-bold tracking-[-0.4px] text-[#1c1c1e] md:inline">Clarix</span>
        </Link>
        <div className="mx-1 h-6 w-px bg-[#e6e8ee]" />
        <input
          aria-label="Board title"
          value={draft ?? title}
          onFocus={() => setDraft(title)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(null);
              e.currentTarget.blur();
            }
          }}
          className="h-8 w-[110px] min-w-0 rounded-md bg-transparent px-2 text-[14.5px] font-semibold text-[#1c1c1e] outline-none transition-colors hover:bg-[#f3f4f8] focus:bg-white focus:ring-2 focus:ring-[#4262ff]/40 sm:w-[190px]"
        />
        <span
          className={cn(
            "hidden items-center gap-1 whitespace-nowrap px-1 text-[12px] font-medium transition-colors lg:flex",
            isSaved ? "text-[#00a46a]" : "text-[#a5a8b5]",
          )}
        >
          {isSaved ? <Check className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
          {isSaved ? "Saved" : "Saving"}
        </span>
        <Menu
          trigger={(open, toggle) => (
            <button
              type="button"
              onClick={toggle}
              aria-label="Board menu"
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-[#555a6a] hover:bg-[#f3f4f8]",
                open && "bg-[#f3f4f8]",
              )}
            >
              <ChevronDown className="size-4" />
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Board</MenuLabel>
              <MenuItem icon={<FilePlus2 />} onClick={() => (close(), onNewBoard())}>New blank board</MenuItem>
              <MenuItem icon={<LayoutTemplate />} onClick={() => (close(), onTemplates())}>Start from template…</MenuItem>
              <MenuDivider />
              <MenuItem icon={<Upload />} onClick={() => (close(), onImport())}>Import JSON…</MenuItem>
              <MenuItem icon={<Braces />} onClick={() => (close(), onExport("json"))}>Export JSON</MenuItem>
              <MenuDivider />
              <MenuItem icon={<Keyboard />} hint="?" onClick={() => (close(), onShortcuts())}>Keyboard shortcuts</MenuItem>
            </>
          )}
        </Menu>
      </Panel>

      <div className="pointer-events-auto flex items-center gap-2">
        <Panel className="hidden h-12 items-center gap-3 px-4 text-[12.5px] font-medium text-[#6b7083] xl:flex">
          <span><b className="font-semibold text-[#1c1c1e]">{stats.people}</b> people</span>
          <span className="size-1 rounded-full bg-[#c7cad5]" />
          <span><b className="font-semibold text-[#1c1c1e]">{stats.links}</b> relationships</span>
        </Panel>
        <Panel className="flex h-12 items-center gap-1 p-1">
          <button
            type="button"
            onClick={onSearch}
            className="flex h-10 items-center gap-2 rounded-[10px] px-2.5 text-[13.5px] font-medium text-[#6b7083] hover:bg-[#f3f4f8] sm:w-[210px]"
          >
            <Search className="size-4" />
            <span className="hidden flex-1 text-left sm:inline">Search people…</span>
            <Kbd className="hidden sm:inline-flex">{MOD} K</Kbd>
          </button>
          <div className="hidden sm:block">
            <IconButton label="Shortcuts" shortcut="?" side="bottom" onClick={onShortcuts}>
              <Keyboard className="size-[18px]" />
            </IconButton>
          </div>
          <Menu
            align="right"
            trigger={(open, toggle) => (
              <button
                type="button"
                onClick={toggle}
                className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#4262ff] px-3.5 text-[13.5px] font-semibold text-white shadow-[0_2px_8px_rgba(66,98,255,0.35)] transition-colors hover:bg-[#3451e8]"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuLabel>Download board as</MenuLabel>
                <MenuItem icon={<FileImage />} hint="2×" onClick={() => (close(), onExport("png"))}>PNG image</MenuItem>
                <MenuItem icon={<FileImage />} hint="vector" onClick={() => (close(), onExport("svg"))}>SVG image</MenuItem>
                <MenuItem icon={<Braces />} hint="data" onClick={() => (close(), onExport("json"))}>JSON file</MenuItem>
              </>
            )}
          </Menu>
        </Panel>
      </div>
    </div>
  );
};
