import type { ReactNode } from "react";

/** Skewed magenta header bar used to title each section. */
export function SectionBar({ children, color = "magenta" }: { children: ReactNode; color?: "magenta" | "cyan" | "yellow" }) {
  const bg = { magenta: "bg-magenta text-white", cyan: "bg-cyan text-bg", yellow: "bg-yellow text-bg" }[color];
  return (
    <div className={`skew-bar mb-4 inline-block px-4 py-2 ${bg}`}>
      <h2 className="font-pixel text-xs">{children}</h2>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`pixel-border bg-panel p-4 sm:p-5 ${className}`}>{children}</div>;
}

export const buttonClass =
  "font-pixel inline-flex items-center justify-center gap-2 border-4 border-ink bg-yellow px-4 py-3 text-xs text-bg " +
  "shadow-[4px_4px_0_0_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] " +
  "hover:bg-[#fff27a] disabled:cursor-not-allowed disabled:border-ink-dim disabled:bg-panel-2 disabled:text-ink-dim disabled:shadow-none";

export const smallButtonClass =
  "font-pixel inline-flex items-center justify-center border-2 border-ink bg-panel-2 px-3 py-2 text-[10px] text-ink " +
  "shadow-[2px_2px_0_0_#000] hover:bg-[#2b2b5a] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50";

export const inputClass =
  "w-full border-4 border-ink bg-bg px-3 py-3 text-base text-ink outline-none placeholder:text-ink-dim " +
  "focus:border-cyan shadow-[inset_3px_3px_0_0_rgba(0,0,0,0.5)]";

export function Badge({ children, tone = "dim" }: { children: ReactNode; tone?: "dim" | "cyan" | "yellow" | "magenta" }) {
  const cls = {
    dim: "border-ink-dim text-ink-dim",
    cyan: "border-cyan text-cyan",
    yellow: "border-yellow text-yellow",
    magenta: "border-magenta text-magenta",
  }[tone];
  return <span className={`font-pixel border-2 px-1.5 py-0.5 text-[9px] leading-none ${cls}`}>{children}</span>;
}
