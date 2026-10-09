"use client";

import { useActionState, useState, useTransition } from "react";
import { regenerateLink, updateTeamName, type FormState } from "@/app/actions";
import { buttonClass, inputClass, smallButtonClass } from "@/components/ui";

export function TeamNameForm({ current }: { current: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateTeamName, undefined);
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
        {pending ? "SAVING…" : current ? "RENAME" : "SAVE"}
      </button>
    </form>
  );
}

export function CopyButton({ text }: { text: string }) {
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
      {copied ? "COPIED!" : "COPY"}
    </button>
  );
}

export function RegenerateButton({ playerId, label }: { playerId: string; label: string }) {
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
      <span className="text-xs text-ink-dim">Old link for {label} stops working.</span>
      <button
        type="button"
        disabled={pending}
        className={`${smallButtonClass} border-magenta text-magenta`}
        onClick={() =>
          start(async () => {
            const res = await regenerateLink(playerId);
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
