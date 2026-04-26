import React from "react";

type ConnectionLineProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelAB?: string;
  labelBA?: string;
};

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  x1,
  y1,
  x2,
  y2,
  labelAB,
  labelBA,
}) => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;

  const drop1 = Math.min(dist * 0.4, 150);
  const drop2 = -Math.min(dist * 0.4, 150);

  const cy1 = my + drop1;
  const cy2 = my + drop2;

  const tX1 = 0.25 * x1 + 0.5 * mx + 0.25 * x2;
  const tY1 = 0.25 * y1 + 0.5 * cy1 + 0.25 * y2;
  const tX2 = 0.25 * x1 + 0.5 * mx + 0.25 * x2;
  const tY2 = 0.25 * y1 + 0.5 * cy2 + 0.25 * y2;

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
