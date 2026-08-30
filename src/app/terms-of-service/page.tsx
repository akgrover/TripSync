import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — TripSync",
  description: "The terms that govern your use of the TripSync app.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="TripSync Terms of Service / EULA">
      <p className="text-sm text-slate-400">Last updated: August 27, 2026</p>

      <p>
        These Terms govern your use of the TripSync app. TripSync is built
        and operated by <strong>Akshit Grover and Saurav Bhagat</strong>,
        working as independent developers (&quot;we&quot;, &quot;us&quot;)
        — TripSync is not offered by a company or other registered legal
        entity, and is currently
        available only to users located in <strong>India</strong>. By using
        TripSync you agree to these Terms and to our{" "}
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
          You must be at least <strong>18 years old</strong> and located in
          India to use TripSync. Under the Indian Contract Act, 1872, only
          someone who has reached the age of majority can enter into a
          binding contract, and TripSync does not currently support
          parental or guardian consent for younger users — so if you are
          under 18, you may not create an account. You must also provide
          accurate information, and you&apos;re responsible for activity
          under your account.
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
          non-consensual, sexual/abusive, harassing, or that violates
          others&apos; privacy or IP. You will not misuse others&apos;
          images or biometric data, and you will not upload content that
          attacks or demeans anyone on the basis of race, caste, religion,
          gender, sexual orientation, disability, or any other protected
          characteristic.
        </p>
        <p>
          <strong>You are solely responsible for what you upload.</strong>{" "}
          We don&apos;t review content before it&apos;s posted, and we
          don&apos;t endorse or vouch for content that users share. To the
          extent permitted by law, we are not liable for content uploaded
          by users — our role is to host and take action on it once we
          have notice, as described in Section 5.
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
          <strong>not guaranteed to be accurate</strong>. TripSync is
          provided by independent developers, not a company, and is free
          to use — to the extent permitted by Indian law, the developers
          of TripSync are not liable for any indirect, incidental, or
          consequential damages arising from your use of the app.
        </p>
      </section>

      <section>
        <h2>9. Governing law &amp; disputes</h2>
        <p>
          These Terms are governed by the laws of India, and any dispute
          is subject to the jurisdiction of the competent courts in India.
        </p>
      </section>

      <section>
        <h2>10. Changes &amp; contact</h2>
        <p>
          We may update these Terms and will post the new date. TripSync
          is operated by independent developers, not a registered company,
          so there&apos;s no company address to list — write to{" "}
          <a
            href="mailto:the.creative.act108@gmail.com"
            className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
          >
            the.creative.act108@gmail.com
          </a>
          , or reach us directly: Akshit Grover (
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
        </p>
      </section>
    </LegalPage>
  );
}
