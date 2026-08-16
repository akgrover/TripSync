import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — TripSync",
  description: "How TripSync collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="TripSync Privacy Policy" draft>
      <p className="text-sm text-slate-400">Last updated: [DATE]</p>

      <p>
        <strong>[COMPANY LEGAL NAME]</strong> (&quot;TripSync&quot;,
        &quot;we&quot;, &quot;us&quot;) operates the TripSync mobile app.
        This policy explains what we collect, why, and your choices — with
        special attention to <strong>face data</strong>, which is sensitive.
      </p>

      <section>
        <h2>1. Information we collect</h2>
        <ul>
          <li>
            <strong>Account info:</strong> phone number (phone login), and/or
            name and email (Google / Apple sign-in).
          </li>
          <li>
            <strong>Face data (biometric):</strong> when you create a
            &quot;Face profile,&quot; we process your selfie to create a{" "}
            <strong>face template</strong> used only to recognize which trip
            photos you appear in. Face templates are stored and matched by{" "}
            <strong>Amazon Rekognition</strong> (AWS). We do not sell or
            share face data.
          </li>
          <li>
            <strong>Photos:</strong> photos you upload to a trip group, plus
            basic metadata (dimensions, upload time).
          </li>
          <li>
            <strong>Usage &amp; device data:</strong> app interactions,
            device/OS info, and diagnostic logs.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. How we use it</h2>
        <ul>
          <li>
            To run the core feature: automatically sorting each trip&apos;s
            photos to the people who appear in them.
          </li>
          <li>To authenticate you and secure your account.</li>
          <li>To operate, maintain, debug, and improve the service.</li>
        </ul>
      </section>

      <section>
        <h2>3. How photos and identity are shared</h2>
        <ul>
          <li>
            Photos you upload are visible to{" "}
            <strong>members of that trip group</strong> (invite-only).
          </li>
          <li>
            We use <strong>service providers (processors)</strong> who
            handle data on our behalf: <strong>Amazon Web Services</strong>{" "}
            (storage + face recognition), <strong>Twilio</strong> (OTP SMS),{" "}
            <strong>Unsplash</strong> (trip cover images from your trip
            name), and our hosting provider. We do <strong>not</strong> sell
            your personal data.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Biometric data — consent, retention, deletion</h2>
        <ul>
          <li>
            We collect and process your face template{" "}
            <strong>only with your consent</strong>, given when you create a
            Face profile. You can decline (you&apos;ll still see group
            photos, just not auto-sorted to you).
          </li>
          <li>
            We retain your face template until you{" "}
            <strong>delete your Face profile or your account</strong>, at
            which point it is deleted from Amazon Rekognition.
          </li>
          <li>
            [Add any jurisdiction-specific biometric disclosures — e.g.,
            US-Illinois BIPA retention schedule.]
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Your rights &amp; choices</h2>
        <ul>
          <li>
            <strong>Delete your account</strong> anytime in-app (Profile →
            Delete Account): this removes your account, face template, and
            reference selfie, and removes you from all groups.
          </li>
          <li>
            <strong>Leave a group</strong> anytime: you lose access to that
            group&apos;s photos and are untagged there.
          </li>
          <li>
            <strong>Access / correction / other rights:</strong> [describe
            how users exercise GDPR/CCPA rights and your response time]. To
            request data deletion outside the app, contact [PRIVACY EMAIL]
            or see [ACCOUNT DELETION URL].
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Data retention</h2>
        <p>
          We keep data while your account is active and delete it on account
          deletion, except where we must retain limited records for
          legal/security reasons. [Specify durations.]
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          Data is encrypted in transit (TLS) and at rest (S3 encryption).
          Access is restricted to authorized systems and personnel. No
          method is 100% secure.
        </p>
      </section>

      <section>
        <h2>8. International transfers</h2>
        <p>
          Data may be processed in [REGION, e.g., the United States] by AWS
          and other providers. [Add transfer-mechanism language if serving
          EU/UK users.]
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>
          TripSync is not directed to children under [13/16]. We do not
          knowingly collect their data.
        </p>
      </section>

      <section>
        <h2>10. Changes</h2>
        <p>
          We may update this policy; we&apos;ll post the new date and, for
          material changes, notify you in-app.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>[COMPANY LEGAL NAME], [ADDRESS] — [PRIVACY EMAIL].</p>
      </section>
    </LegalPage>
  );
}
