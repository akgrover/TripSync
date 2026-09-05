import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Community Guidelines — TripSync",
  description:
    "The rules for trip groups on TripSync, how to report a photo or user, and what happens next.",
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage title="Community Guidelines">
      <p className="text-sm text-slate-400">Last updated: September 4, 2026</p>

      <p>
        TripSync exists to help groups share their photos privately. To keep
        it safe, we have a <strong>zero-tolerance policy</strong> for
        objectionable content and abusive behaviour.
      </p>

      <section>
        <h2>What&apos;s not allowed</h2>
        <ul>
          <li>
            Sexually explicit or pornographic content, or nudity of intimate
            parts
          </li>
          <li>Violent, graphic, or gory content</li>
          <li>
            Hate speech, hate symbols, or content attacking people based on
            race, ethnicity, religion, gender, sexual orientation,
            disability, or nationality
          </li>
          <li>
            Harassment, bullying, threats, or intimidation of other members
          </li>
          <li>
            Content that is illegal, promotes illegal activity, or exploits
            or endangers minors
          </li>
          <li>
            Uploading photos of people who have asked you not to, or content
            you don&apos;t have the right to share
          </li>
          <li>
            Impersonating another person, or attempting to access another
            member&apos;s account or photos
          </li>
        </ul>
      </section>

      <section>
        <h2>How we enforce this</h2>
        <ul>
          <li>
            <strong>Automated screening.</strong> Every uploaded photo is
            automatically screened for explicit, violent, and hateful
            content. Photos that fail screening are removed from all groups
            and are not shown to anyone.
          </li>
          <li>
            <strong>Reporting.</strong> Any member can report a photo from
            the photo view. Reported photos are removed from the
            reporter&apos;s library immediately and are sent to our team for
            review.
          </li>
          <li>
            <strong>Blocking.</strong> Any member can block another member.
            Blocked members&apos; photos disappear from your groups
            instantly, and our team is notified so we can review the
            account.
          </li>
          <li>
            <strong>Our response.</strong> We review all reports and blocks
            within <strong>24 hours</strong>. We remove violating content
            and suspend or permanently terminate the accounts of members who
            break these rules.
          </li>
        </ul>
      </section>

      <section>
        <h2>Your privacy</h2>
        <p>
          Groups are invite-only — only people with your invite code can see
          the photos. Your Face Profile is used only to organise photos
          within your own groups, and you can delete it and your account at
          any time from Profile.
        </p>
      </section>

      <section>
        <h2>Reporting a problem</h2>
        <p>
          If you see something that breaks these guidelines, use Report in
          the photo view or Block the member. You can also contact us at{" "}
          <a
            href="mailto:support@thetripsync.in"
            className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
          >
            support@thetripsync.in
          </a>{" "}
          and we&apos;ll respond within 24 hours.
        </p>
      </section>
    </LegalPage>
  );
}
