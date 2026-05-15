"use client";

export function BarChart({
  data,
  labels,
  height = 200,
  color = "hsl(239 84% 67%)",
  highlight = -1,
}: {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
  highlight?: number; // index to highlight (last by default if >= 0)
}) {
  const W = 360;
  const H = height;
  const padL = 28;
  const padR = 6;
  const padT = 10;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(...data) * 1.15 || 1;
  const slot = innerW / data.length;
  const barW = Math.min(28, slot * 0.55);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((p) => {
        const v = max * p;
        const y = padT + innerH - (v / max) * innerH;
        return (
          <g key={p}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke="hsl(230 14% 90%)"
              strokeDasharray={p === 0 ? "" : "2 3"}
            />
            <text
              x={padL - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-[hsl(var(--ink-3))] font-mono"
              fontSize="9"
            >
              {Math.round(v)}
            </text>
          </g>
        );
      })}

      {data.map((v, i) => {
        const x = padL + i * slot + (slot - barW) / 2;
        const h = (v / max) * innerH;
        const y = padT + innerH - h;
        const isHi = highlight === i || (highlight < 0 && i === data.length - 1);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="4"
              fill={isHi ? color : "hsl(var(--bg-sunken))"}
              stroke={isHi ? "none" : "hsl(var(--line-strong))"}
            />
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              className="fill-[hsl(var(--ink-3))]"
              fontSize="9.5"
            >
              {labels[i]}
            </text>
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              className={isHi ? "fill-[hsl(var(--ink))]" : "fill-[hsl(var(--ink-3))]"}
              fontSize="9.5"
              fontWeight="600"
            >
              {v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
