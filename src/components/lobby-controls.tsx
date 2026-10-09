"use client";

import { useActionState, useState, useTransition } from "react";
import { joinLeague, regenerateInvite, updateTeamName, type FormState } from "@/app/actions";
import { buttonClass, inputClass, smallButtonClass } from "@/components/ui";

export function TeamNameForm({ leagueId, current }: { leagueId: string; current: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateTeamName.bind(null, leagueId),
    undefined,
  );
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <label className="flex flex-1 flex-col gap-2">
        <span className="font-pixel text-[10px] text-cyan">YOUR TEAM NAME</span>
        <input
          name="teamName"
          required
          maxLength={24}
          defaultValue={current ?? ""}
          placeholder="Name your team"
          className={inputClass}
        />
        {state?.error && <span className="font-pixel text-[10px] leading-relaxed text-magenta">{state.error}</span>}
        {state?.ok && !pending && <span className="font-pixel text-[10px] text-cyan">SAVED!</span>}
      </label>
      <button type="submit" disabled={pending} className={`${buttonClass} sm:mt-6`}>
        {pending ? "SAVING…" : "RENAME"}
      </button>
    </form>
  );
}

export function JoinForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(joinLeague.bind(null, code), undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-pixel text-[10px] text-cyan">NAME YOUR TEAM</span>
        <input name="teamName" required maxLength={24} placeholder="Buzzer Beaters" className={inputClass} />
      </label>
      {state?.error && (
        <p role="alert" className="font-pixel text-[10px] leading-relaxed text-magenta">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "JOINING…" : "▶ JOIN LEAGUE"}
      </button>
    </form>
  );
}

export function CopyButton({ text, label = "COPY" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={smallButtonClass}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "COPIED!" : label}
    </button>
  );
}

export function RegenerateInviteButton({ leagueId }: { leagueId: string }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();

  if (!confirming) {
    return (
      <button type="button" className={smallButtonClass} onClick={() => setConfirming(true)}>
        NEW LINK
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink-dim">The current link will stop working.</span>
      <button
        type="button"
        disabled={pending}
        className={`${smallButtonClass} border-magenta text-magenta`}
        onClick={() =>
          start(async () => {
            const res = await regenerateInvite(leagueId);
            if (res?.error) setError(res.error);
            setConfirming(false);
          })
        }
      >
        {pending ? "…" : "CONFIRM"}
      </button>
      <button type="button" className={smallButtonClass} onClick={() => setConfirming(false)}>
        CANCEL
      </button>
      {error && <span className="text-xs text-magenta">{error}</span>}
    </span>
  );
}
