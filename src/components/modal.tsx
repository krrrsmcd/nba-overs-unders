"use client";

import { useEffect, type ReactNode } from "react";

/** Full-screen arcade-style dialog. Closes on Escape or backdrop click unless `locked`. */
export function Modal({
  title,
  onClose,
  locked = false,
  children,
}: {
  title: string;
  onClose: () => void;
  locked?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, locked]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={() => !locked && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pixel-border w-full max-w-md bg-panel p-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-pixel mb-4 text-xs leading-relaxed text-yellow">{title}</h2>
        {children}
      </div>
    </div>
  );
}
