import type { Metadata } from "next";
import { CONTACT_URL, LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Terms of Service · Overs/Unders" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 9, 2026">
      <p>
        NBA Overs Unders is a free, non-commercial game played among friends. By signing in you agree to these terms.
      </p>
      <h2>THE GAME</h2>
      <ul>
        <li>There is no money involved and nothing to buy. Any side bets between players are their own business.</li>
        <li>Scores come from a third-party data service and may occasionally be delayed or wrong.</li>
        <li>The app is not affiliated with or endorsed by the NBA or any of its teams.</li>
      </ul>
      <h2>YOUR ACCOUNT</h2>
      <p>Keep team and league names friendly. The site owner may remove content or leagues that misuse the app.</p>
      <h2>NO WARRANTY</h2>
      <p>The app is provided as is, with no guarantee that it will be available or error-free.</p>
      <h2>CONTACT</h2>
      <p>
        Questions go through the <a href={CONTACT_URL}>project&apos;s GitHub page</a>.
      </p>
    </LegalPage>
  );
}
