import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — TripSync",
  description: "How TripSync collects, uses, and protects your data.",
};

const mailLinkClass =
  "font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="TripSync Privacy Policy">
      <p className="text-sm text-slate-400">Last updated: 10th September, 2026</p>

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
            <strong>Face data (biometric):</strong> only if you choose to
            create a &quot;Face Profile.&quot; See Section 3 for full
            details.
          </li>
          <li>
            <strong>Photos:</strong> photos you upload to a group, plus basic
            metadata (dimensions, file size, upload time).
          </li>
          <li>
            <strong>Usage &amp; device data:</strong> app interactions,
            device/OS info, push notification tokens, and diagnostic logs.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. How we use it</h2>
        <ul>
          <li>
            To run the core feature: automatically sorting each group&apos;s
            photos to the people who appear in them.
          </li>
          <li>To authenticate you and secure your account.</li>
          <li>
            To send you notifications about your groups (for example, when
            someone adds photos).
          </li>
          <li>
            To screen uploaded photos for objectionable content, and to act
            on reports and blocks (see Section 7).
          </li>
          <li>To operate, maintain, debug, and improve the service.</li>
        </ul>
      </section>

      <section>
        <h2>3. Face data (biometric information)</h2>
        <p>
          <strong>What we collect.</strong> Creating a Face Profile is
          optional. If you choose to create one, we collect (a) the
          reference selfie you capture with the camera or select from your
          library, and (b) a mathematical face template (&quot;face
          vector&quot;) generated from that selfie by{" "}
          <strong>Amazon Rekognition</strong>. Amazon Rekognition stores the
          template in our face collection and returns an opaque identifier;
          we store only that identifier, not the template itself.
          Separately, for each photo uploaded to a group we store face
          bounding-box coordinates and the match result (which member
          matched, and a similarity score) — these are coordinates and
          account identifiers, not biometric templates.
        </p>
        <p>
          <strong>How we use it.</strong> Face data is used for one purpose
          only: to automatically identify which photos inside your own
          invite-only TripSync groups include you, so that those photos
          appear in your &quot;My Photos&quot; view. We do not use face data
          for advertising, profiling, identity verification, surveillance,
          or to identify anyone outside your own groups. We do not use face
          data to train any machine-learning models; Amazon Rekognition
          processes it solely to perform the matching we request, as our
          processor.
        </p>
        <p>
          <strong>Sharing.</strong> We do not sell your face data, and we do
          not share it with any third party for that third party&apos;s own
          purposes. It is processed only by Amazon Web Services (Amazon S3
          and Amazon Rekognition) acting as our service provider. No
          advertising or analytics provider receives face data.
        </p>
        <p>
          <strong>Storage.</strong> Your reference selfie is stored in a
          private, encrypted Amazon S3 bucket, accessible only through
          short-lived signed links. Your face template is stored in an
          Amazon Rekognition face collection. Both are hosted in AWS region
          [REGION]. Related identifiers and match results are stored in our
          database (MongoDB Atlas).
        </p>
        <p>
          <strong>Retention.</strong> We retain your reference selfie and
          face template only for as long as your Face Profile exists. Face
          templates created temporarily in order to scan an uploaded group
          photo are deleted immediately after the match completes. Face
          match results (a bounding box and which member matched) are
          retained with that photo for as long as the photo exists.
        </p>
        <p>
          <strong>Deletion.</strong> You can delete your face data at any
          time. Replacing your Face Profile deletes the previous template.
          Deleting your account (Profile → Delete Account) permanently
          deletes your reference selfie from Amazon S3 and your face
          template from Amazon Rekognition, together with your account
          data.
        </p>
        <p>
          <strong>Consent.</strong> We collect and process your face
          template only with your consent, given when you create a Face
          Profile. You can decline — you will still see your group&apos;s
          photos, they simply won&apos;t be auto-sorted to you. You can
          withdraw consent at any time by deleting your Face Profile or your
          account.
        </p>
        <p>
          <strong>Indian law.</strong> Under India&apos;s Information
          Technology (Reasonable Security Practices and Procedures and
          Sensitive Personal Data or Information) Rules, 2011, biometric
          information (including your face template) is{" "}
          <strong>Sensitive Personal Data or Information (SPDI)</strong>. We
          collect and process it only with your explicit, opt-in consent, we
          do not use it for any purpose beyond matching you to your group
          photos, and you can withdraw consent at any time.
        </p>
      </section>

      <section>
        <h2>4. How photos and identity are shared</h2>
        <ul>
          <li>
            Photos you upload are visible to{" "}
            <strong>members of that group</strong> (invite-only). They are
            not public and are not indexed by search engines.
          </li>
          <li>Photos are served to members through short-lived signed links.</li>
          <li>We do not sell your personal data.</li>
        </ul>
      </section>

      <section>
        <h2>5. Service providers</h2>
        <p>We use service providers (processors) who handle data on our behalf:</p>
        <ul>
          <li>
            <strong>Amazon Web Services</strong> — photo and selfie storage
            (Amazon S3), face detection/matching and content-moderation
            screening (Amazon Rekognition).
          </li>
          <li>
            <strong>MongoDB Atlas</strong> — our database.
          </li>
          <li>
            <strong>Twilio</strong> — sending one-time codes by SMS.
          </li>
          <li>
            <strong>Apple Push Notification service, via Expo</strong> —
            delivering push notifications.
          </li>
          <li>
            <strong>Google and Apple</strong> — sign-in, if you choose those
            options.
          </li>
          <li>
            <strong>PostHog</strong> — product analytics (app interactions
            and device/diagnostic data; never face data or your photos).
          </li>
          <li>
            <strong>Unsplash</strong> — default group cover images, chosen
            from your group name.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Data retention</h2>
        <ul>
          <li>
            <strong>Account info, face template, and reference selfie:</strong>{" "}
            deleted immediately when you delete your account.
          </li>
          <li>
            <strong>Temporary face templates</strong> used to scan a photo:
            deleted immediately after matching.
          </li>
          <li>
            <strong>Photos you shared to a group:</strong> these belong to
            that group because you chose to share them there, so they remain
            in the group after you leave or delete your account. They are
            simply no longer tied to your identity — you stop being tagged
            or matched to them, and they remain visible to members of that
            group only, same as before.
          </li>
          <li>
            <strong>Photos you remove:</strong> removing a photo removes it
            from your own library; other members keep their copies.
          </li>
          <li>
            <strong>Storage limits:</strong> if you exceed your storage
            allowance, photos you add after that point remain available to
            view and download for 7 days, after which they are removed from
            your account unless you free up space. Other members&apos;
            copies are unaffected.
          </li>
          <li>
            <strong>Reports and blocks:</strong> we retain a record of
            reports and blocks so we can review abuse and enforce our terms.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Content moderation, reporting and blocking</h2>
        <ul>
          <li>
            Every photo uploaded is automatically screened for objectionable
            content using Amazon Rekognition. Photos detected as explicit,
            violent, visually disturbing, or containing hate symbols are
            rejected and are not shown to anyone.
          </li>
          <li>
            Any member can report a photo, or block another member, from
            inside the app. Reporting removes the photo from your library
            immediately; blocking immediately removes that member&apos;s
            photos from your groups and notifies us so we can review the
            account.
          </li>
          <li>
            We review reports and blocks within 24 hours, remove violating
            content, and suspend or terminate accounts that breach our
            Community Guidelines or Terms of Use.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Your rights &amp; choices</h2>
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
            <strong>Withdraw face-data consent</strong> anytime by deleting
            your Face Profile or your account.
          </li>
          <li>
            <strong>Access, correction &amp; erasure:</strong> under India&apos;s
            Digital Personal Data Protection Act, 2023 (DPDPA), you can ask
            us to confirm what personal data we hold about you, correct or
            complete it, or erase it (including withdrawing consent to your
            Face Profile at any time, without affecting the lawfulness of
            processing before withdrawal). You can also register a
            grievance about how we&apos;ve handled your data. To do any of
            this, contact{" "}
            <a href="mailto:the.creative.act108@gmail.com" className={mailLinkClass}>
              the.creative.act108@gmail.com
            </a>
            ; we aim to acknowledge requests within 24 hours and resolve
            them within 15 days.
          </li>
        </ul>
      </section>

      <section>
        <h2>9. Security</h2>
        <p>
          Data is encrypted in transit (TLS) and at rest (S3 encryption).
          Photos and selfies are stored in private buckets and served only
          through short-lived signed links. Access is restricted to
          authorized systems and personnel. No method is 100% secure.
        </p>
      </section>

      <section>
        <h2>10. Where your data is processed</h2>
        <p>
          TripSync is offered only to users in India, and we do not offer
          the app in the EU, UK, US, or other regions. Your photos,
          reference selfie, and face template are stored in AWS region
          [us-east]. Some of our service providers — for example Amazon Web
          Services — may process or store data outside India as part of
          running their infrastructure. Where that happens, we still
          require our service providers to protect it consistent with this
          policy.
        </p>
      </section>

      <section>
        <h2>11. Children</h2>
        <p>
          TripSync is intended for users who are <strong>18 or older</strong>.
          Under the DPDPA, anyone under 18 is a &quot;child,&quot; and
          processing a child&apos;s personal data — including creating a
          Face Profile — requires verifiable consent from a parent or
          lawful guardian. TripSync does not currently support that consent
          flow, so the app is not directed to, and may not knowingly be
          used by, anyone under 18. If we learn an account belongs to
          someone under 18, we will delete the account and associated data.
        </p>
      </section>

      <section>
        <h2>12. Changes</h2>
        <p>
          We may update this policy; we&apos;ll post the new date and, for
          material changes, notify you in-app.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p>
          TripSync is built and run by two independent developers, not a
          registered company, so there&apos;s no company name or office
          address to list here. For anything about this policy, your data,
          or how a report or complaint was handled, write to{" "}
          <a href="mailto:the.creative.act108@gmail.com" className={mailLinkClass}>
            the.creative.act108@gmail.com
          </a>
          , or reach us directly:
        </p>
        <ul>
          <li>
            Akshit Grover —{" "}
            <a href="mailto:akgrover.contact@gmail.com" className={mailLinkClass}>
              akgrover.contact@gmail.com
            </a>
          </li>
          <li>
            Saurav Bhagat —{" "}
            <a href="mailto:sauravbhagat088@gmail.com" className={mailLinkClass}>
              sauravbhagat088@gmail.com
            </a>
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
