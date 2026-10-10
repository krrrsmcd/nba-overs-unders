import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { smallButtonClass } from "@/components/ui";

/** Inner-page layout: small logo link home (optionally with a Go Back button), then the request-time content behind Suspense. */
export function PageShell({ children, back = false }: { children: ReactNode; back?: boolean }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
      <div className="flex items-center gap-4">
        {back && (
          <Link href="/" className={smallButtonClass}>
            ◀ GO BACK
          </Link>
        )}
        <Link href="/" className="arcade-title text-2xl leading-none">
          OVERS/UNDERS
        </Link>
      </div>
      <Suspense fallback={<p className="font-pixel blink text-center text-sm text-yellow">LOADING…</p>}>
        {children}
      </Suspense>
    </main>
  );
}
