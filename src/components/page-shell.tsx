import Link from "next/link";
import { Suspense, type ReactNode } from "react";

/** Inner-page layout: small logo link home, then the request-time content behind Suspense. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
      <Link href="/" className="arcade-title self-start text-2xl leading-none">
        OVERS/UNDERS
      </Link>
      <Suspense fallback={<p className="font-pixel blink text-center text-sm text-yellow">LOADING…</p>}>
        {children}
      </Suspense>
    </main>
  );
}
