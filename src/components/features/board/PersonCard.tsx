"use client";

import React, { memo } from "react";
import type { Person, Point } from "@/types";
import { CARD_H, CARD_W } from "@/constants";
import { initials, personColor } from "@/utils";
import { cn } from "@/lib/utils";

export type CardState = "normal" | "dimmed" | "highlight" | "path";

type Props = {
  person: Person;
  position: Point;
  selected: boolean;
  dragging: boolean;
  connectTarget: boolean;
  state: CardState;
  degree: number;
  showHandles: boolean;
  onPointerDown: (e: React.PointerEvent, id: number) => void;
  onHandlePointerDown: (e: React.PointerEvent, id: number) => void;
  onDoubleClick: (id: number) => void;
};

const HANDLE_POS = [
  "left-1/2 -top-[7px] -translate-x-1/2",
  "-right-[7px] top-1/2 -translate-y-1/2",
  "left-1/2 -bottom-[7px] -translate-x-1/2",
  "-left-[7px] top-1/2 -translate-y-1/2",
];

/** A person on the board, rendered as a Miro-style card with avatar, name and role. */
export const PersonCard = memo(function PersonCard({
  person,
  position,
  selected,
  dragging,
  connectTarget,
  state,
  degree,
  showHandles,
  onPointerDown,
  onHandlePointerDown,
  onDoubleClick,
}: Props) {
  const color = personColor(person);
  const sub = [person.role, person.age ? `${person.age} yrs` : ""].filter(Boolean).join(" · ");

  return (
    <div
      data-person-id={person.id}
      className={cn(
        "person-card group absolute select-none",
        state === "dimmed" && "opacity-25",
        dragging ? "z-30" : selected ? "z-20" : "z-10",
      )}
      style={{
        left: position.x - CARD_W / 2,
        top: position.y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
      }}
      onPointerDown={(e) => onPointerDown(e, person.id)}
      onDoubleClick={() => onDoubleClick(person.id)}
    >
      <div
        className={cn(
          "card-body relative flex h-full items-center gap-3 rounded-[14px] bg-white pl-3 pr-3.5",
          dragging && "is-dragging",
          selected && "is-selected",
          connectTarget && "is-target",
          state === "path" && "is-path",
          state === "highlight" && "is-highlight",
        )}
      >
        <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full" style={{ background: color }} />
        <div
          className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[14px] font-bold text-[#1c1c1e]"
          style={{ background: color }}
        >
          {initials(person.name)}
          {person.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.avatar}
              alt=""
              draggable={false}
              className="absolute inset-0 size-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold leading-tight tracking-[-0.2px] text-[#1c1c1e]">
            {person.name || "Unnamed"}
          </div>
          {sub && <div className="mt-0.5 truncate text-[12px] leading-tight text-[#6b7083]">{sub}</div>}
        </div>
        {degree > 0 && (
          <span
            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#f1f3f9] px-1.5 text-[10.5px] font-semibold text-[#555a6a]"
            title={`${degree} connection${degree === 1 ? "" : "s"}`}
          >
            {degree}
          </span>
        )}
      </div>

      {showHandles &&
        HANDLE_POS.map((pos, i) => (
          <span
            key={i}
            data-handle
            onPointerDown={(e) => onHandlePointerDown(e, person.id)}
            className={cn(
              "connect-handle absolute z-10 size-3.5 cursor-crosshair rounded-full border-2 border-[#4262ff] bg-white opacity-0 transition-[opacity,transform] duration-150 group-hover:opacity-100 hover:scale-125",
              selected && "opacity-100",
              pos,
            )}
          />
        ))}
    </div>
  );
});
