"use client";

import { useActionState, useEffect, useState } from "react";
import { updateTeamName, type FormState } from "@/app/actions";
import { Modal } from "@/components/modal";
import { buttonClass, inputClass, smallButtonClass } from "@/components/ui";

/** "Rename Team" button that opens the rename form in a dialog. */
export function RenameTeamButton({ leagueId, current }: { leagueId: string; current: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={smallButtonClass} onClick={() => setOpen(true)}>
        RENAME TEAM
      </button>
      {open && <RenameDialog leagueId={leagueId} current={current} onClose={() => setOpen(false)} />}
    </>
  );
}

function RenameDialog({ leagueId, current, onClose }: { leagueId: string; current: string | null; onClose: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateTeamName.bind(null, leagueId), undefined);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <Modal title="RENAME TEAM" onClose={onClose} locked={pending}>
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="font-pixel text-[10px] text-cyan">TEAM NAME</span>
          <input name="teamName" required maxLength={24} defaultValue={current ?? ""} autoFocus className={inputClass} />
        </label>
        {state?.error && <p className="font-pixel text-[10px] leading-relaxed text-magenta">{state.error}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className={smallButtonClass} onClick={onClose} disabled={pending}>
            CANCEL
          </button>
          <button type="submit" className={buttonClass} disabled={pending}>
            {pending ? "SAVING…" : "▶ SAVE"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
