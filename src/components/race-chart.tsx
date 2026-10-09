"use client";

import { useEffect, useRef, useState } from "react";

export type RaceLine = { id: string; name: string; isMe: boolean; values: number[] };

// Categorical slots validated (CVD + contrast) on the dark panel surface #15152e.
// Assigned by draft order so a player's color never changes.
export const SERIES_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];

const H = 260;
const PAD = { top: 16, right: 92, bottom: 28, left: 36 };

function niceStep(max: number) {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? pow * 10;
}

function shortDate(d: string) {
  const [, m, day] = d.split("-").map(Number);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${day}`;
}

export function RaceChart({ dates, lines }: { dates: string[]; lines: RaceLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = dates.length;
  const max = Math.max(1, ...lines.flatMap((l) => l.values));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const iw = w - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => PAD.top + ih - (v / top) * ih;
  const ticks = Array.from({ length: top / step + 1 }, (_, k) => k * step);
  const xTickEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 70))));

  // End labels: highest first; skip a label that would collide (the legend still names it).
  const ends = lines
    .map((l, i) => ({ l, color: SERIES_COLORS[i % SERIES_COLORS.length], v: l.values.at(-1) ?? 0 }))
    .sort((a, b) => b.v - a.v);
  const placed: number[] = [];
  const endLabels = ends.filter((e) => {
    const yy = y(e.v);
    if (placed.some((p) => Math.abs(p - yy) < 14)) return false;
    placed.push(yy);
    return true;
  });

  const hi = hover ?? n - 1;
  const tooltipRows = lines
    .map((l, i) => ({ l, color: SERIES_COLORS[i % SERIES_COLORS.length], v: l.values[hi] ?? 0 }))
    .sort((a, b) => b.v - a.v);

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * iw;
    setHover(Math.min(n - 1, Math.max(0, Math.round((px / iw) * (n - 1)))));
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink" aria-label="Legend">
        {lines.map((l, i) => (
          <li key={l.id} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
            {l.name}
            {l.isMe && <span className="text-ink-dim">(you)</span>}
          </li>
        ))}
      </ul>

      <div ref={ref} className="relative w-full">
        <svg width={w} height={H} role="img" aria-label="Cumulative points by day for each player" className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + iw} y1={y(t)} y2={y(t)} stroke="#2b2b52" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#a9a6c9">
                {t}
              </text>
            </g>
          ))}
          {dates.map((d, i) =>
            i % xTickEvery === 0 || i === n - 1 ? (
              <text key={d} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#a9a6c9">
                {shortDate(d)}
              </text>
            ) : null,
          )}

          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + ih} stroke="#a9a6c9" strokeWidth={1} />
          )}

          {lines.map((l, i) => {
            const color = SERIES_COLORS[i % SERIES_COLORS.length];
            const d = l.values.map((v, k) => `${k ? "L" : "M"}${x(k).toFixed(1)},${y(v).toFixed(1)}`).join("");
            return (
              <g key={l.id}>
                <path d={d} fill="none" stroke={color} strokeWidth={l.isMe ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={x(hi)} cy={y(l.values[hi] ?? 0)} r={4.5} fill={color} stroke="#15152e" strokeWidth={2} />
              </g>
            );
          })}

          {endLabels.map((e) => (
            <text key={e.l.id} x={x(n - 1) + 10} y={y(e.v) + 4} fontSize={11} fill="#f4f1ff">
              {e.l.name.length > 12 ? `${e.l.name.slice(0, 11)}…` : e.l.name}
            </text>
          ))}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={iw}
            height={ih}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
            style={{ touchAction: "pan-y" }}
          />
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 border-2 border-ink bg-bg/95 px-3 py-2 text-xs shadow-[3px_3px_0_0_#000]"
            style={x(hover) > w / 2 ? { right: w - x(hover) + 12 } : { left: x(hover) + 12 }}
          >
            <p className="font-pixel mb-1 text-[9px] text-yellow">{shortDate(dates[hover]).toUpperCase()}</p>
            {tooltipRows.map((r) => (
              <p key={r.l.id} className="flex items-center gap-2 text-ink">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} />
                <span className="flex-1">{r.l.name}</span>
                <span className="font-semibold tabular-nums">{r.v}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <details className="text-xs text-ink-dim">
        <summary className="cursor-pointer">View as table</summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr>
                <th className="py-1 pr-3 font-normal">Date</th>
                {lines.map((l) => (
                  <th key={l.id} className="py-1 pr-3 font-normal">
                    {l.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink">
              {[...dates.keys()].reverse().map((i) => (
                <tr key={dates[i]}>
                  <td className="py-0.5 pr-3 text-ink-dim">{shortDate(dates[i])}</td>
                  {lines.map((l) => (
                    <td key={l.id} className="py-0.5 pr-3">
                      {l.values[i]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
