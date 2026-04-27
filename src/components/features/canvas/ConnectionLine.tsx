import React from "react";

type ConnectionLineProps = {
  /** X coordinate of the source node's center. */
  x1: number;
  /** Y coordinate of the source node's center. */
  y1: number;
  /** X coordinate of the target node's center. */
  x2: number;
  /** Y coordinate of the target node's center. */
  y2: number;
  /** The relation label going from node A to node B. */
  labelAB?: string;
  /** The relation label going from node B to node A (if the relation is two-way). */
  labelBA?: string;
};

/**
 * An SVG component that renders interactive, curved lines connecting two nodes on the canvas.
 * Handles single or bidirectional relationships by calculating distinct bezier curves
 * so the lines don't overlap.
 *
 * @param props - ConnectionLineProps containing coordinates and labels.
 */
export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  x1,
  y1,
  x2,
  y2,
  labelAB,
  labelBA,
}) => {
  // Calculate the linear midpoint between the two node centers
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;

  // Calculate the drop (offset) for the quadratic bezier curve control point.
  // This creates the curved effect. If distance is short, curve is shallow. If long, it caps at 150px offset.
  const drop1 = Math.min(dist * 0.4, 150);
  const drop2 = -Math.min(dist * 0.4, 150);

  // cy1 and cy2 are the y-coordinates of the control points for the two possible paths.
  const cy1 = my + drop1;
  const cy2 = my + drop2;

  // Calculate the label positions at roughly t=0.5 along the quadratic bezier curve.
  // The formula for a point on a quadratic bezier is: P(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
  // For t=0.5, this simplifies to P(0.5) = 0.25 * P0 + 0.5 * P1 + 0.25 * P2
  const tX1 = 0.25 * x1 + 0.5 * mx + 0.25 * x2;
  const tY1 = 0.25 * y1 + 0.5 * cy1 + 0.25 * y2;
  const tX2 = 0.25 * x1 + 0.5 * mx + 0.25 * x2;
  const tY2 = 0.25 * y1 + 0.5 * cy2 + 0.25 * y2;

  // Calculate the normal vector (nx, ny) perpendicular to the line to offset the labels
  // so they don't overlap if both AB and BA labels exist.
  const nx = -dy / dist;
  const ny = dx / dist;
  const offset = 14;

  const showAB = !!labelAB;
  const showBA = !!labelBA;

  return (
    <g>
      {showAB && (
        <path
          stroke="#c7cad5"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 4"
          d={`M ${x1} ${y1} Q ${mx} ${cy1} ${x2} ${y2}`}
        />
      )}
      {showBA && (
        <path
          stroke="#c7cad5"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 4"
          d={`M ${x1} ${y1} Q ${mx} ${cy2} ${x2} ${y2}`}
        />
      )}
      {!showAB && !showBA && (
        <path
          stroke="#c7cad5"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 4"
          d={`M ${x1} ${y1} Q ${mx} ${cy1} ${x2} ${y2}`}
        />
      )}
      {showAB && (
        <g>
          <rect
            rx="4"
            ry="4"
            fill="white"
            stroke="#e0e2e8"
            strokeWidth="1"
            x={tX1 + (showBA ? nx * offset : 0) - 24}
            y={tY1 + (showBA ? ny * offset : 0) - 10}
            width="48"
            height="20"
          />
          <text
            x={tX1 + (showBA ? nx * offset : 0)}
            y={tY1 + (showBA ? ny * offset : 0)}
            fontSize={11}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="#555a6a"
            style={{
              pointerEvents: "none",
              fontWeight: 500,
              fontFamily: "var(--font-sans)",
            }}
          >
            {labelAB}
          </text>
        </g>
      )}
      {showBA && (
        <g>
          <rect
            rx="4"
            ry="4"
            fill="white"
            stroke="#e0e2e8"
            strokeWidth="1"
            x={tX2 - (showAB ? nx * offset : 0) - 24}
            y={tY2 - (showAB ? ny * offset : 0) - 10}
            width="48"
            height="20"
          />
          <text
            x={tX2 - (showAB ? nx * offset : 0)}
            y={tY2 - (showAB ? ny * offset : 0)}
            fontSize={11}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="#555a6a"
            style={{
              pointerEvents: "none",
              fontWeight: 500,
              fontFamily: "var(--font-sans)",
            }}
          >
            {labelBA}
          </text>
        </g>
      )}
    </g>
  );
};
