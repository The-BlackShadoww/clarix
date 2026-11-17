"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const Kbd = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <kbd
    className={cn(
      "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-[#e0e2e8] bg-[#f7f8fa] px-1 font-sans text-[10.5px] font-semibold text-[#555a6a]",
      className,
    )}
  >
    {children}
  </kbd>
);

type TipSide = "right" | "bottom" | "top" | "left";

const tipPos: Record<TipSide, string> = {
  right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
};

export const IconButton = ({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
  side = "right",
  className,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  side?: TipSide;
  className?: string;
}) => (
  <div className="group/tip relative">
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-10 items-center justify-center rounded-[10px] text-[#3a3d4a] transition-colors duration-150",
        "hover:bg-[#f0f2f7] disabled:pointer-events-none disabled:opacity-35",
        "focus-visible:outline-2 focus-visible:outline-[#5b76fe]",
        active && "bg-[#e8ecff] text-[#4262ff] hover:bg-[#e0e6ff]",
        className,
      )}
    >
      {children}
    </button>
    <span
      className={cn(
        "pointer-events-none absolute z-[70] flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#1c1c1e] px-2 py-1 text-[12px] font-medium text-white opacity-0 shadow-lg transition-opacity delay-0 duration-100 group-hover/tip:opacity-100 group-hover/tip:delay-300",
        tipPos[side],
      )}
    >
      {label}
      {shortcut && <span className="text-[#a5a8b5]">{shortcut}</span>}
    </span>
  </div>
);

export const Panel = ({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("board-panel", className)} {...rest}>
    {children}
  </div>
);

/** Minimal dropdown: a trigger plus a floating panel that closes on outside click / Escape. */
export const Menu = ({
  trigger,
  children,
  align = "left",
  className,
}: {
  trigger: (open: boolean, toggle: () => void) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div
          className={cn(
            "board-panel animate-in fade-in zoom-in-95 absolute top-full z-[80] mt-2 min-w-[220px] p-1.5 duration-150",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

export const MenuItem = ({
  icon,
  children,
  hint,
  onClick,
  danger,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  hint?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] font-medium text-[#1c1c1e] transition-colors hover:bg-[#f3f4f8]",
      danger && "text-[#d93636] hover:bg-[#fff0f0]",
    )}
  >
    {icon && <span className={cn("text-[#6b7083] [&_svg]:size-4", danger && "text-[#d93636]")}>{icon}</span>}
    <span className="flex-1">{children}</span>
    {hint && <span className="text-[12px] text-[#a5a8b5]">{hint}</span>}
  </button>
);

export const MenuLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#a5a8b5]">
    {children}
  </div>
);

export const MenuDivider = () => <div className="mx-1 my-1 h-px bg-[#eceef2]" />;

/** Centred modal dialog with backdrop. */
export const Dialog = ({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="animate-in fade-in fixed inset-0 z-[100] flex items-start justify-center bg-[#1c1c1e]/25 px-4 pt-[12vh] backdrop-blur-[2px] duration-150"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "board-panel animate-in fade-in zoom-in-95 slide-in-from-top-2 w-full max-w-[560px] overflow-hidden duration-200",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
