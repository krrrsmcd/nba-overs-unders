"use client";

import { useActionState, useState } from "react";
import { createLeague, type FormState } from "@/app/actions";
import { buttonClass, inputClass } from "@/components/ui";

const SIZES = [
  { n: 2, picks: 15 },
  { n: 3, picks: 10 },
  { n: 5, picks: 6 },
];

export function CreateLeagueForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createLeague, undefined);
  const [size, setSize] = useState(3);

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="font-pixel text-[10px] text-cyan">LEAGUE NAME</span>
        <input name="leagueName" required maxLength={40} className={inputClass} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-pixel text-[10px] text-cyan">YOUR TEAM NAME</span>
        <input name="teamName" required maxLength={24} className={inputClass} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-pixel mb-2 text-[10px] text-cyan">PLAYERS</legend>
        <input type="hidden" name="size" value={size} />
        <div className="grid grid-cols-3 gap-3">
          {SIZES.map((s) => {
            const on = s.n === size;
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => setSize(s.n)}
                aria-pressed={on}
                className={`flex flex-col items-center gap-1 border-4 px-2 py-3 shadow-[3px_3px_0_0_#000] ${
                  on ? "border-yellow bg-yellow text-bg" : "border-ink bg-bg text-ink hover:border-cyan"
                }`}
              >
                <span className="font-display text-3xl leading-none">{s.n}P</span>
                <span className="text-xs font-medium">{s.picks} picks each</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {state?.error && (
        <p role="alert" className="font-pixel text-[10px] leading-relaxed text-magenta">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "LOADING…" : "▶ CREATE LEAGUE"}
      </button>
    </form>
  );
}
