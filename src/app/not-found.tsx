import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="font-pixel text-xs text-cyan">404</p>
      <h1 className="arcade-title text-5xl leading-none sm:text-6xl">AIRBALL</h1>
      <p className="text-ink-dim">That page doesn&apos;t exist. Check the link, or head back to the start.</p>
      <Link href="/" className={buttonClass}>
        ◀ HOME
      </Link>
    </main>
  );
}
