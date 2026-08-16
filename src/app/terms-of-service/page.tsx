import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — TripSync",
  description: "The terms that govern your use of the TripSync app.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="TripSync Terms of Service / EULA" draft>
      <p className="text-sm text-slate-400">Last updated: [DATE]</p>

      <p>
        These Terms govern your use of the TripSync app provided by{" "}
        <strong>[COMPANY LEGAL NAME]</strong>. By using TripSync you agree
        to these Terms and to our{" "}
        <a
          href="/privacy-policy"
          className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
        >
          Privacy Policy
        </a>
        .
      </p>

      <section>
        <h2>1. Eligibility &amp; accounts</h2>
        <p>
          You must be at least [13/16/18] and provide accurate information.
          You&apos;re responsible for activity under your account.
        </p>
      </section>

      <section>
        <h2>2. The service</h2>
        <p>
          TripSync lets groups share trip photos and, with your consent,
          uses face recognition to sort each person&apos;s photos to them.
        </p>
      </section>

      <section>
        <h2>3. Your content &amp; license</h2>
        <p>
          You retain ownership of photos you upload. You grant TripSync a
          limited license to store, process, and display your content{" "}
          <strong>to members of your trip groups</strong> and to operate the
          service (including face-matching). You represent you have the
          right to upload each photo and to share images of the people in
          them.
        </p>
      </section>

      <section>
        <h2>4. Acceptable use — no objectionable content</h2>
        <p>
          You agree <strong>not</strong> to upload content that is illegal,
          non-consensual, sexual/abusive, harassing, hateful, or that
          violates others&apos; privacy or IP. You will not misuse
          others&apos; images or biometric data.
        </p>
      </section>

      <section>
        <h2>5. Reporting, blocking, and removal</h2>
        <ul>
          <li>
            You can <strong>report</strong> a photo and{" "}
            <strong>block</strong> a user in the app.
          </li>
          <li>
            We may <strong>remove content and suspend or terminate
            accounts</strong> that violate these Terms, and we aim to act on
            valid reports promptly (target: within 24 hours).
          </li>
          <li>
            There is <strong>no tolerance</strong> for objectionable content
            or abusive users.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Biometric consent</h2>
        <p>
          Face recognition runs only after you opt in by creating a Face
          profile. You can delete your Face profile or account at any time;
          see the Privacy Policy.
        </p>
      </section>

      <section>
        <h2>7. Termination</h2>
        <p>
          You may delete your account anytime. We may suspend/terminate for
          violations or legal reasons. On deletion, your account, face
          template, and reference selfie are removed and you&apos;re removed
          from all groups (photos you uploaded may remain in groups,
          untagged).
        </p>
      </section>

      <section>
        <h2>8. Disclaimers &amp; limitation of liability</h2>
        <p>
          The service is provided &quot;as is.&quot; Face matching is{" "}
          <strong>not guaranteed to be accurate</strong>. To the extent
          permitted by law, [COMPANY] is not liable for indirect or
          consequential damages. [Insert cap.]
        </p>
      </section>

      <section>
        <h2>9. Governing law &amp; disputes</h2>
        <p>
          These Terms are governed by the laws of [JURISDICTION]. [Insert
          dispute-resolution/venue terms.]
        </p>
      </section>

      <section>
        <h2>10. Changes &amp; contact</h2>
        <p>
          We may update these Terms and will post the new date. Contact:
          [SUPPORT EMAIL], [COMPANY ADDRESS].
        </p>
      </section>
    </LegalPage>
  );
}
