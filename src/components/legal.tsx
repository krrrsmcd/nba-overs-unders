import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <Link href="/" className="arcade-title self-start text-2xl leading-none">
        OVERS/UNDERS
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="text-sm text-ink-dim">Last updated {updated}</p>
      </header>
      <div className="flex flex-col gap-4 leading-relaxed text-ink [&_a]:text-cyan [&_a]:underline [&_h2]:font-pixel [&_h2]:mt-4 [&_h2]:text-xs [&_h2]:text-yellow [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </main>
  );
}

export const CONTACT_URL = "https://github.com/krrrsmcd/nba-overs-unders/issues";
