import React from "react";
import { Person } from "@/types";
import { getColorFromName, getSizeFromAge } from "@/utils";

type PersonNodeProps = {
  /** The person data object. */
  person: Person;
  /** Current Cartesian coordinates on the canvas. */
  position: { x: number; y: number };
  /** Depth index to render overlapping nodes correctly. */
  z: number;
  /** True if this specific node is currently being dragged. */
  isDragging: boolean;
  /** True if this node was the last one clicked/selected. */
  isSelected: boolean;
  /** Mouse down handler to initiate dragging and selection. */
  onMouseDown: (e: React.MouseEvent, id: number) => void;
};

/**
 * Renders an individual node (person) on the infinite canvas.
 * Displays the person's avatar (or initial), name, and a badge showing relation count.
 * Uses inline styles heavily because its position, size, and z-index update frequently (60fps during drag).
 *
 * @param props - Component properties.
 */

export const PersonNode: React.FC<PersonNodeProps> = ({
  person,
  position,
  z,
  isDragging,
  isSelected,
  onMouseDown,
}) => {
  const size = getSizeFromAge(person.age);
  const nodeColor = getColorFromName(person.name);
  const relationCount = person.relations.length;

  return (
    <div
      className="absolute flex flex-col items-center group"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isSelected ? 45 : z + 1,
      }}
    >
      <div
        onMouseDown={(e) => onMouseDown(e, person.id)}
        className={`node-circle rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 ease-out`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: isDragging
            ? "0 16px 40px rgba(91, 118, 254, 0.22), 0 0 0 3px rgba(91, 118, 254, 0.4)"
            : isSelected
              ? "0 8px 24px rgba(91, 118, 254, 0.15), 0 0 0 2.5px #5b76fe"
              : "0 2px 8px rgba(0,0,0,0.06), rgb(224,226,232) 0px 0px 0px 1.5px",
          userSelect: "none",
          backgroundColor: person.avatar ? "transparent" : nodeColor,
          transform: isDragging
            ? "scale(1.1)"
            : isSelected
              ? "scale(1.06)"
              : "scale(1)",
        }}
      >
        {person.avatar ? (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${person.avatar})` }}
          />
        ) : (
          <span
            className="font-semibold text-[#1c1c1e] pointer-events-none select-none"
            style={{ fontSize: size * 0.38 }}
          >
            {person.name.charAt(0).toUpperCase()}
          </span>
        )}

        {relationCount > 0 && (
          <div
            className="absolute -bottom-1 -right-1 bg-[#5b76fe] text-white rounded-full flex items-center justify-center font-semibold z-20"
            style={{
              width: 20,
              height: 20,
              fontSize: 10,
              boxShadow: "0 2px 6px rgba(91, 118, 254, 0.3)",
            }}
          >
            {relationCount}
          </div>
        )}
      </div>

      <div
        className="mt-1.5 text-center pointer-events-none select-none transition-opacity duration-200"
        style={{
          maxWidth: size + 30,
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        <span className="text-[11px] font-medium text-[#1c1c1e] leading-tight block truncate">
          {person.name}
        </span>
      </div>
    </div>
  );
};
