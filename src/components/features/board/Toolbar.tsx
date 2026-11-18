"use client";

import React from "react";
import {
  CircleDot,
  GitFork,
  Hand,
  LayoutTemplate,
  MousePointer2,
  Network,
  Orbit,
  Redo2,
  Spline,
  Undo2,
  UserPlus,
} from "lucide-react";
import type { Tool } from "@/types";
import type { LayoutKind } from "@/lib/graph";
import { IconButton, Kbd, Menu, MenuItem, MenuLabel, MOD, Panel } from "./primitives";

type Props = {
  tool: Tool;
  setTool: (t: Tool) => void;
  onLayout: (k: LayoutKind) => void;
  onTemplates: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  layoutDisabled: boolean;
};

const TOOLS: { id: Tool; label: string; key: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", key: "V", icon: <MousePointer2 className="size-[19px]" /> },
  { id: "hand", label: "Hand", key: "H", icon: <Hand className="size-[19px]" /> },
  { id: "person", label: "Add person", key: "P", icon: <UserPlus className="size-[19px]" /> },
  { id: "connect", label: "Connect people", key: "C", icon: <Spline className="size-[19px]" /> },
];

/** Miro-style vertical tool rail on the left edge of the board. */
export const Toolbar: React.FC<Props> = ({
  tool,
  setTool,
  onLayout,
  onTemplates,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  layoutDisabled,
}) => (
  <div className="pointer-events-none absolute left-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 sm:left-4">
    <Panel className="pointer-events-auto flex flex-col gap-0.5 p-1">
      {TOOLS.map((t) => (
        <IconButton key={t.id} label={t.label} shortcut={t.key} active={tool === t.id} onClick={() => setTool(t.id)}>
          {t.icon}
        </IconButton>
      ))}
      <div className="mx-2 my-1 h-px bg-[#eceef2]" />
      <Menu
        className="left-full top-0 ml-3 mt-0 w-[250px]"
        trigger={(open, toggle) => (
          <IconButton label="Auto-layout" shortcut="L" active={open} onClick={toggle} disabled={layoutDisabled}>
            <Network className="size-[19px]" />
          </IconButton>
        )}
      >
        {(close) => (
          <>
            <MenuLabel>Auto-layout</MenuLabel>
            {(
              [
                ["tree", "Hierarchy", "Generations & reporting lines", <GitFork key="t" className="rotate-180" />],
                ["force", "Organic", "Force-directed clusters", <Orbit key="f" />],
                ["circle", "Circle", "Everyone on one ring", <CircleDot key="c" />],
              ] as const
            ).map(([k, name, desc, icon]) => (
              <MenuItem
                key={k}
                icon={icon}
                onClick={() => {
                  onLayout(k);
                  close();
                }}
              >
                <span className="block">{name}</span>
                <span className="block text-[12px] font-normal text-[#8a8fa3]">{desc}</span>
              </MenuItem>
            ))}
          </>
        )}
      </Menu>
      <IconButton label="Templates" onClick={onTemplates}>
        <LayoutTemplate className="size-[19px]" />
      </IconButton>
    </Panel>

    <Panel className="pointer-events-auto flex flex-col gap-0.5 p-1">
      <IconButton label="Undo" shortcut={`${MOD} Z`} disabled={!canUndo} onClick={onUndo}>
        <Undo2 className="size-[18px]" />
      </IconButton>
      <IconButton label="Redo" shortcut={`${MOD} Y`} disabled={!canRedo} onClick={onRedo}>
        <Redo2 className="size-[18px]" />
      </IconButton>
    </Panel>
  </div>
);

export const ToolHint = ({ tool }: { tool: Tool }) => {
  const hint =
    tool === "person"
      ? <>Click anywhere on the board to place a person</>
      : tool === "connect"
        ? <>Drag from one person to another to link them</>
        : tool === "hand"
          ? <>Drag to move around · hold <Kbd className="mx-0.5">Space</Kbd> anytime</>
          : null;
  if (!hint) return null;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#1c1c1e] px-4 py-2 text-[13px] font-medium text-white shadow-lg duration-200">
      {hint}
      <span className="ml-2 text-[#8a8fa3]">Esc to exit</span>
    </div>
  );
};
