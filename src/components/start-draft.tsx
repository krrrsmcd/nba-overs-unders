"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useTransition } from "react";
import { startDraft } from "@/app/actions";
import { Modal } from "@/components/modal";
import { buttonClass, smallButtonClass } from "@/components/ui";

type P = { id: string; teamName: string };

export function StartDraftButton({ leagueId, players }: { leagueId: string; players: P[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={buttonClass} onClick={() => setOpen(true)}>
        ▶ START DRAFT
      </button>
      {open && <StartDraftDialog leagueId={leagueId} players={players} onClose={() => setOpen(false)} />}
    </>
  );
}

function StartDraftDialog({ leagueId, players, onClose }: { leagueId: string; players: P[]; onClose: () => void }) {
  const [mode, setMode] = useState<"random" | "custom">("random");
  const [order, setOrder] = useState(players);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((o) => arrayMove(o, o.findIndex((p) => p.id === active.id), o.findIndex((p) => p.id === over.id)));
  }

  return (
    <Modal title="START DRAFT" onClose={onClose} locked={pending}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Draft order">
          {(["random", "custom"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`font-pixel border-4 px-2 py-3 text-[10px] shadow-[3px_3px_0_0_#000] ${
                mode === m ? "border-yellow bg-yellow text-bg" : "border-ink bg-bg text-ink"
              }`}
            >
              {m === "random" ? "RANDOM ORDER" : "CUSTOM ORDER"}
            </button>
          ))}
        </div>

        {mode === "random" ? (
          <p className="text-sm text-ink-dim">The app shuffles the players into a random snake order.</p>
        ) : (
          <>
            <p className="text-sm text-ink-dim">Drag players into draft order. First pick at the top.</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={order.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <ol className="flex flex-col gap-2">
                  {order.map((p, i) => (
                    <SortableRow key={p.id} p={p} index={i} />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          </>
        )}

        <p className="text-xs text-ink-dim">Once started, the order is locked and nobody can join.</p>
        {error && <p className="font-pixel text-[10px] leading-relaxed text-magenta">{error}</p>}

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className={smallButtonClass} onClick={onClose} disabled={pending}>
            CANCEL
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await startDraft(leagueId, mode === "custom" ? order.map((p) => p.id) : undefined);
                if (res?.error) setError(res.error);
              })
            }
          >
            {pending ? "STARTING…" : "▶ LOCK & START"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SortableRow({ p, index }: { p: P; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex touch-none cursor-grab items-center gap-3 border-4 bg-bg p-3 select-none active:cursor-grabbing ${
        isDragging ? "z-10 border-cyan shadow-[4px_4px_0_0_#000]" : "border-ink"
      }`}
      {...attributes}
      {...listeners}
    >
      <span className="font-pixel w-8 text-xs text-yellow">#{index + 1}</span>
      <span className="min-w-0 flex-1 font-medium break-words">{p.teamName}</span>
      <span aria-hidden className="font-pixel text-xs text-ink-dim">
        ≡
      </span>
    </li>
  );
}
