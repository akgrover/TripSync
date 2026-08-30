import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Community Guidelines — TripSync",
  description:
    "The rules for trip groups on TripSync, how to report a photo or user, and what happens next.",
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage title="TripSync Community Guidelines">
      <p className="text-sm text-slate-400">Last updated: August 27, 2026</p>

      <p>
        TripSync is built and operated by Akshit Grover and Saurav Bhagat,
        working as independent developers, and is currently available only
        to users in{" "}
        <strong>India</strong>. Trip groups are invite-only, but the people
        in them are real, and so are the photos of them. These Guidelines
        explain what we expect from everyone using TripSync, what counts as
        a violation, and what happens when something goes wrong. They work
        alongside our{" "}
        <a
          href="/terms-of-service"
          className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy-policy"
          className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
        >
          Privacy Policy
        </a>
        .
      </p>

      <section>
        <h2>1. What happens in a trip group</h2>
        <ul>
          <li>
            A trip group is created by one member and joined by invite only.
            Anyone who joins can upload photos to it.
          </li>
          <li>
            Photos uploaded to a group are visible to{" "}
            <strong>every member of that group</strong> — no one outside it.
          </li>
          <li>
            If you&apos;ve opted in with a Face profile, TripSync
            automatically matches you to photos you appear in within that
            group. Matching is a convenience feature; it does not change who
            can see a photo.
          </li>
          <li>
            Because everyone in a group can post, everyone shares
            responsibility for keeping it a place people feel safe being
            photographed in.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Zero-tolerance policy</h2>
        <p>
          We don&apos;t review photos before they&apos;re posted, and{" "}
          <strong>
            you are solely responsible for the content you upload and share
          </strong>{" "}
          — including making sure it doesn&apos;t attack or demean anyone
          on the basis of race, caste, religion, gender, sexual
          orientation, disability, or any other protected characteristic.
          TripSync has <strong>zero tolerance</strong> for the following,
          with no exceptions other than the review and appeals process
          described in Sections 4–5 of these Guidelines:
        </p>
        <ul>
          <li>Sexual, exploitative, or abusive content involving anyone, especially minors.</li>
          <li>Non-consensual photos or videos, including images taken or shared without the subject&apos;s knowledge or agreement.</li>
          <li>Harassment, bullying, threats, stalking, or doxxing (sharing someone&apos;s private info without consent).</li>
          <li>Hate speech or content that attacks people based on identity, such as race, caste, religion, gender, sexual orientation, or disability.</li>
          <li>Illegal content or activity of any kind.</li>
          <li>Impersonation, or uploading someone&apos;s likeness to deceive or defame them.</li>
          <li>Misuse of face data — using TripSync&apos;s matching to identify or track someone outside the context of a shared trip.</li>
        </ul>
        <p>
          A single violation of any of the above can result in content
          removal, group removal, or account termination — first offense or
          not.
        </p>
      </section>

      <section>
        <h2>3. If you run into a problem, here&apos;s what you can do</h2>
        <ul>
          <li>
            <strong>Report a photo:</strong> flag the specific content for
            our team to review. See Section 4.
          </li>
          <li>
            <strong>Block a user:</strong> stop seeing content from someone
            and prevent them from seeing content tagged to you, without
            leaving the group.
          </li>
          <li>
            <strong>Leave a group:</strong> immediately lose access to (and
            remove your access from) that group&apos;s photos.
          </li>
          <li>
            <strong>Delete your account:</strong> removes your account, face
            template, and reference selfie, and removes you from every
            group. See the{" "}
            <a
              href="/privacy-policy"
              className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Contact us directly:</strong> for anything urgent, or
            anything a report doesn&apos;t cover — see Section 6.
          </li>
          <li>
            If you or someone else is in immediate danger, contact local
            emergency services first. TripSync&apos;s review process is not
            a substitute for that.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. How to report a photo</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Open the photo in the trip group.</li>
          <li>Tap the &quot;•••&quot; (more) menu on the photo.</li>
          <li>Select <strong>Report</strong>.</li>
          <li>
            Choose the reason that fits best (e.g. non-consensual, sexual
            content, harassment, hate speech, spam, other) and add any detail
            that will help our team review it.
          </li>
          <li>Submit. You&apos;ll get a confirmation in-app.</li>
        </ol>
        <p>
          You can report a photo whether or not you&apos;re tagged in it —
          you don&apos;t need to be a match to flag something that shouldn&apos;t
          be in the group.
        </p>
      </section>

      <section>
        <h2>5. What happens after you report a photo</h2>
        <ul>
          <li>
            <strong>Your report is confidential.</strong> The person who
            uploaded or is tagged in the photo is not told who reported it.
          </li>
          <li>
            <strong>Review:</strong> our team reviews reports against these
            Guidelines, targeting a response within{" "}
            <strong>24 hours</strong> of submission.
          </li>
          <li>
            <strong>Outcomes</strong> depend on what we find, and can
            include: no action (if the content doesn&apos;t violate these
            Guidelines), removing the photo, warning the uploader, removing
            the uploader from the group, or suspending or terminating their
            account.
          </li>
          <li>
            <strong>Illegal content</strong> (e.g. child sexual abuse
            material) is removed immediately and reported to the relevant
            authorities as required by law.
          </li>
          <li>
            <strong>Notification:</strong> you&apos;ll be notified in-app once
            your report has been reviewed and of any action taken, where we
            can share it.
          </li>
          <li>
            <strong>Appeals:</strong> if you believe a report was resolved
            incorrectly — whether your content was removed or your report
            was declined — you can appeal by contacting us (Section 6) with
            the reference from your in-app notification.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Who to contact</h2>
        <ul>
          <li>
            <strong>
              Reports, appeals, urgent issues, general support, and privacy
              or data requests:
            </strong>{" "}
            <a
              href="mailto:the.creative.act108@gmail.com"
              className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              the.creative.act108@gmail.com
            </a>{" "}
            — see also the{" "}
            <a
              href="/privacy-policy"
              className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Direct contacts:</strong> TripSync is built and run by
            two independent developers, not a registered company, so
            there&apos;s no company address to list — but you can reach us
            directly: Akshit Grover (
            <a
              href="mailto:akgrover.contact@gmail.com"
              className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              akgrover.contact@gmail.com
            </a>
            ) or Saurav Bhagat (
            <a
              href="mailto:sauravbhagat088@gmail.com"
              className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              sauravbhagat088@gmail.com
            </a>
            ).
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Changes</h2>
        <p>
          We may update these Guidelines as TripSync grows. We&apos;ll post
          the new date above and, for material changes, notify you in-app.
        </p>
      </section>
    </LegalPage>
  );
}
