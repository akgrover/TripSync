import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — TripSync",
  description: "How TripSync collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="TripSync Privacy Policy">
      <p className="text-sm text-slate-400">Last updated: August 27, 2026</p>

      <p>
        TripSync (&quot;we&quot;, &quot;us&quot;) is built and operated by
        Akshit Grover and Saurav Bhagat, working as independent developers
        — TripSync is not offered by a company or other registered legal
        entity. TripSync is currently
        offered only to users located in <strong>India</strong>. This policy
        explains what we collect, why, and your choices — with special
        attention to <strong>face data</strong>, which is sensitive personal
        data under Indian law.
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
            Under India&apos;s Information Technology (Reasonable Security
            Practices and Procedures and Sensitive Personal Data or
            Information) Rules, 2011, biometric information (including your
            face template) is <strong>Sensitive Personal Data or
            Information (SPDI)</strong>. We collect and process it only
            with your explicit, opt-in consent, we don&apos;t use it for
            any purpose beyond matching you to your trip photos, and you can
            withdraw consent at any time by deleting your Face profile.
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
            <strong>Access, correction &amp; erasure:</strong> under India&apos;s
            Digital Personal Data Protection Act, 2023 (DPDPA), you can ask
            us to confirm what personal data we hold about you, correct or
            complete it, or erase it (including withdrawing consent to your
            Face profile at any time, without affecting the lawfulness of
            processing before withdrawal). You can also register a
            grievance about how we&apos;ve handled your data. To do any of
            this, contact{" "}
            <a
              href="mailto:the.creative.act108@gmail.com"
              className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              the.creative.act108@gmail.com
            </a>
            ; we aim to acknowledge requests within 24 hours and resolve
            them within 15 days.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Data retention</h2>
        <p>
          When you delete your account, we delete your personal data —
          your account info, face template, and reference selfie —
          immediately. Photos you shared to a trip group are different:
          they belong to that group because you chose to share them there,
          so they remain in the group after you leave or delete your
          account. They&apos;re just no longer tied to your identity — you
          stop being tagged or matched to them, and members of that group
          only, same as before.
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
        <h2>8. Where your data is processed</h2>
        <p>
          TripSync is offered only to users in India, and we do not offer
          the app in the EU, UK, US, or other regions. That said, some of
          our service providers — for example, Amazon Web Services — may
          process or store data outside India as part of running their
          infrastructure. Where that happens, we still require our service
          providers to protect it consistent with this policy.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>
          TripSync is intended for users who are <strong>18 or older</strong>.
          Under the DPDPA, anyone under 18 is a &quot;child,&quot; and
          processing a child&apos;s personal data — including creating a
          Face profile — requires verifiable consent from a parent or
          lawful guardian. TripSync does not currently support that consent
          flow, so the app is not directed to, and may not knowingly be
          used by, anyone under 18. If we learn an account belongs to
          someone under 18, we will delete the account and associated data.
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
        <p>
          TripSync is built and run by two independent developers, not a
          registered company, so there&apos;s no company name or office
          address to list here. For anything about this policy, your data,
          or how a report or complaint was handled, write to{" "}
          <a
            href="mailto:the.creative.act108@gmail.com"
            className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
          >
            the.creative.act108@gmail.com
          </a>
          , or reach us directly:
        </p>
        <ul>
          <li>
            Akshit Grover —{" "}
            <a
              href="mailto:akgrover.contact@gmail.com"
              className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              akgrover.contact@gmail.com
            </a>
          </li>
          <li>
            Saurav Bhagat —{" "}
            <a
              href="mailto:sauravbhagat088@gmail.com"
              className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              sauravbhagat088@gmail.com
            </a>
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
