"use client";

import { useState, useTransition } from "react";
import { deleteLeague } from "@/app/actions";
import { Modal } from "@/components/modal";
import { inputClass, smallButtonClass } from "@/components/ui";

const dangerButton =
  "font-pixel inline-flex items-center justify-center whitespace-nowrap border-4 border-magenta bg-magenta px-4 py-3 text-xs text-white " +
  "shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:border-ink-dim disabled:bg-panel-2 disabled:text-ink-dim disabled:shadow-none";

/** Commissioner-only "Delete league" button with a type-the-name confirmation. */
export function DeleteLeagueButton({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === leagueName.trim().toLowerCase();

  return (
    <>
      <button type="button" className={`${smallButtonClass} border-magenta text-magenta`} onClick={() => setOpen(true)}>
        DELETE LEAGUE
      </button>
      {open && (
        <Modal
          title="DELETE LEAGUE"
          onClose={() => {
            setOpen(false);
            setTyped("");
            setError(undefined);
          }}
          locked={pending}
        >
          <div className="flex flex-col gap-4">
            <p>
              This permanently deletes <strong>{leagueName}</strong> for every player: teams, draft picks and standings.
              It can&apos;t be undone.
            </p>
            <label className="flex flex-col gap-2">
              <span className="font-pixel text-[10px] leading-relaxed text-cyan">TYPE THE LEAGUE NAME TO CONFIRM</span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={leagueName}
                autoFocus
                className={inputClass}
              />
            </label>
            {error && <p className="font-pixel text-[10px] leading-relaxed text-magenta">{error}</p>}
            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" className={smallButtonClass} disabled={pending} onClick={() => setOpen(false)}>
                CANCEL
              </button>
              <button
                type="button"
                className={dangerButton}
                disabled={!matches || pending}
                onClick={() =>
                  start(async () => {
                    const res = await deleteLeague(leagueId, typed);
                    if (res?.error) setError(res.error);
                  })
                }
              >
                {pending ? "DELETING…" : "DELETE FOREVER"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/** Footer row holding the commissioner's delete button. */
export function CommissionerZone({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  return (
    <section className="mt-6 flex flex-col items-center gap-2 border-t-2 border-panel-2 pt-6 text-center">
      <p className="font-pixel text-[9px] text-ink-dim">COMMISSIONER</p>
      <DeleteLeagueButton leagueId={leagueId} leagueName={leagueName} />
    </section>
  );
}
