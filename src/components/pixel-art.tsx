/** Small original pixel-art icons drawn as SVG rects. */

function Pixels({ rows, palette, size, label }: { rows: string[]; palette: Record<string, string>; size: number; label: string }) {
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      width={size * (w / h)}
      height={size}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      className="inline-block shrink-0"
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) => (palette[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[c]} /> : null)),
      )}
    </svg>
  );
}

const FLAME = [
  "...r...",
  "..rr...",
  "..rrr..",
  ".rroor.",
  ".rooor.",
  "rooyoor",
  "royyyor",
  ".ryyyr.",
];

export function Flame({ size = 12 }: { size?: number }) {
  return <Pixels rows={FLAME} palette={{ r: "#ff2e88", o: "#ff7a1a", y: "#ffe53b" }} size={size} label="Hot streak" />;
}

const TROPHY = [
  "................",
  "...yyyyyyyyyy...",
  ".yyYYYYYYYYYYyy.",
  "y..yYYYYYYYYy..y",
  "y..yYYYYYYYYy..y",
  ".y.yYYYYYYYYy.y.",
  "..yyYYYYYYYYyy..",
  "....yYYYYYYy....",
  ".....yYYYYy.....",
  "......yYYy......",
  "......yYYy......",
  ".....yyyyyy.....",
  "....ooooooooo...",
  "....oOOOOOOOo...",
  "...ooooooooooo..",
  "................",
];

export function Trophy({ size = 96 }: { size?: number }) {
  return (
    <Pixels
      rows={TROPHY}
      palette={{ y: "#c98500", Y: "#ffe53b", o: "#5a2d81", O: "#9085e9" }}
      size={size}
      label="Trophy"
    />
  );
}

const CONFETTI_COLORS = ["#ffe53b", "#22e4ff", "#ff2e88", "#ff7a1a"];

/** Falling pixel confetti for the champion banner (positions are fixed, not random, so renders match). */
export function Confetti({ count = 22 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${((i * 7) % 16) * 0.2}s`,
            animationDuration: `${2.6 + ((i * 5) % 7) * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}
