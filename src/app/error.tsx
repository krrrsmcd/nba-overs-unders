"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClass, smallButtonClass } from "@/components/ui";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="font-pixel text-xs text-cyan">ERROR</p>
      <h1 className="arcade-title text-5xl leading-none sm:text-6xl">GAME OVER</h1>
      <p className="text-ink-dim">Something went wrong loading this screen. It&apos;s usually a temporary hiccup.</p>
      <p className="font-pixel blink text-sm text-yellow">CONTINUE?</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className={buttonClass} onClick={() => retry()}>
          ▶ TRY AGAIN
        </button>
        <Link href="/" className={smallButtonClass}>
          HOME
        </Link>
      </div>
      {error.digest && <p className="text-xs text-ink-dim">Error code: {error.digest}</p>}
    </main>
  );
}
