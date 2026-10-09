"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { buttonClass, smallButtonClass } from "@/components/ui";

export function SignInButton({ callbackURL = "/", label = "SIGN IN WITH GOOGLE" }: { callbackURL?: string; label?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className={buttonClass}
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({ provider: "google", callbackURL });
      }}
    >
      {pending ? "LOADING…" : `▶ ${label}`}
    </button>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className={smallButtonClass}
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      SIGN OUT
    </button>
  );
}
