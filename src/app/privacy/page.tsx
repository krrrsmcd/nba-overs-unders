import type { Metadata } from "next";
import { CONTACT_URL, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Privacy Policy · Overs/Unders" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 9, 2026">
      <p>
        NBA Overs Unders (&quot;the app&quot;) is a small, non-commercial game for a private group of friends. This page
        explains what information the app collects and how it is used.
      </p>

      <h2>WHAT WE COLLECT</h2>
      <ul>
        <li>
          <strong>From Google sign-in:</strong> your name, email address and profile picture URL. We do not receive
          your Google password or access to any other Google data.
        </li>
        <li>
          <strong>What you enter:</strong> league names, team names and draft picks.
        </li>
        <li>
          <strong>Session data:</strong> a login cookie, plus the IP address and browser type recorded with your login
          session for security.
        </li>
      </ul>

      <h2>HOW WE USE IT</h2>
      <p>
        Only to run the game: signing you in, showing your leagues, and displaying team names, picks and standings to
        the other players in your league. Other players in your league can see your team name; they cannot see your
        email address.
      </p>

      <h2>WHAT WE DON&apos;T DO</h2>
      <ul>
        <li>We don&apos;t sell or share your information with anyone.</li>
        <li>We don&apos;t show ads or use analytics or tracking cookies.</li>
        <li>We don&apos;t send you email.</li>
      </ul>

      <h2>WHERE IT&apos;S STORED</h2>
      <p>
        The app is hosted on Vercel and its database is hosted on Neon (Postgres). NBA game results come from a public
        sports data service; no personal information is sent to it.
      </p>

      <h2>DELETING YOUR DATA</h2>
      <p>
        You can sign out at any time. To have your account and leagues deleted, ask via the{" "}
        <a href={CONTACT_URL}>project&apos;s GitHub page</a> or ask your league&apos;s commissioner to pass the request
        on.
      </p>

      <h2>CHANGES</h2>
      <p>If this policy changes, the date at the top of this page will be updated.</p>
    </LegalPage>
  );
}
