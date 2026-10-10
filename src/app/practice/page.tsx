import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PracticeDraft } from "@/components/practice-draft";

export const metadata: Metadata = { title: "Practice Draft · Overs/Unders" };

export default function PracticePage() {
  return (
    <PageShell>
      <header className="flex flex-col gap-2">
        <p className="font-pixel text-[10px] text-cyan">NOTHING HERE IS SAVED</p>
        <h1 className="arcade-title text-4xl leading-tight sm:text-5xl">PRACTICE DRAFT</h1>
      </header>
      <PracticeDraft />
    </PageShell>
  );
}
