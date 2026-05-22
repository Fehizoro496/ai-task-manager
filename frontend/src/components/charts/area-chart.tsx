"use client";
import { useId } from "react";

export function AreaChart({
  data,
  ideal,
  color = "hsl(239 84% 67%)",
  height = 220,
  xLabels,
  yMax,
  yTicks = 4,
}: {
  data: number[];
  ideal?: number[];
  color?: string;
  height?: number;
  xLabels?: string[];
  yMax?: number;
  yTicks?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const W = 600;
  const H = height;
  const padL = 36;
  const padR = 8;
  const padT = 12;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const rawMax = Math.max(...data, ...(ideal ?? [0]));
  const max = yMax ?? Math.max(rawMax * 1.1, 1); // évite max=0 → NaN sur dataset vide/plat
  const step = innerW / (data.length - 1);
  const x = (i: number) => padL + i * step;
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  const linePath = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const areaPath = `${linePath} L${x(data.length - 1)},${padT + innerH} L${padL},${padT + innerH} Z`;
  const idealPath = ideal?.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");

  // Y axis ticks
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => (max / yTicks) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id={`grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(t)}
            y2={y(t)}
            stroke="hsl(230 14% 90%)"
            strokeDasharray={i === 0 ? "" : "2 3"}
          />
          <text
            x={padL - 6}
            y={y(t) + 3}
            textAnchor="end"
            className="fill-[hsl(var(--ink-3))] font-mono"
            fontSize="9"
          >
            {Math.round(t)}
          </text>
        </g>
      ))}

      {/* Ideal */}
      {idealPath && (
        <path
          d={idealPath}
          fill="none"
          stroke="hsl(var(--ink-4))"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
      )}

      {/* Area */}
      <path d={areaPath} fill={`url(#grad-${uid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {data.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="2.5" fill={color} />
          <circle cx={x(i)} cy={y(v)} r="5" fill={color} fillOpacity="0.18" />
        </g>
      ))}

      {/* X labels */}
      {xLabels?.map((l, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          textAnchor="middle"
          className="fill-[hsl(var(--ink-3))]"
          fontSize="9.5"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}
