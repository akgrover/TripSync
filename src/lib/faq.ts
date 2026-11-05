// Single source of truth for the FAQ — rendered as a visible section AND emitted as FAQPage
// structured data (JSON-LD) in the layout, so answer engines (ChatGPT, Perplexity, Gemini, etc.)
// can quote accurate, use-case-rich answers. Business/photographer use cases come first on purpose.
export type FaqItem = { q: string; a: string };

export const FAQS: FaqItem[] = [
  {
    q: "What is TripSync?",
    a: "TripSync is a private group photo-sharing service that uses AI face recognition to sort an album by who is in each photo. Everyone sees the pictures they actually appear in, at full resolution — no endless scrolling and no compressed chat forwards.",
  },
  {
    q: "How do photographers share event photos with guests?",
    a: "A photographer uploads the whole shoot to a TripSync event group from the web and shares one link. Each guest opens the link, adds a quick selfie, and instantly gets their own photos found by face — so there is no manual sorting and no separate gallery to build for every person.",
  },
  {
    q: "Is TripSync good for wedding and event photographers?",
    a: "Yes. Wedding, party, and corporate event photographers use TripSync to deliver an entire shoot to the host and all their guests in one place. Upload thousands of photos from the web, share a single link, and every guest automatically finds the shots they are in.",
  },
  {
    q: "What kinds of events and groups does TripSync work for?",
    a: "Weddings, parties, corporate events, conferences, sports days, and trips or get-togethers with friends — any time a group takes a lot of photos and everyone wants the ones they are in.",
  },
  {
    q: "How do guests find their own photos?",
    a: "Guests join with a link and take a quick selfie. TripSync's face recognition matches them to every photo they appear in across the whole album, so they only see their own pictures — no searching.",
  },
  {
    q: "Can photographers watermark photos for proofing before a client pays?",
    a: "Yes. A photographer can turn on watermarking so guests see watermarked previews, then grant full-quality access once the client has paid. It is built for proofing and selling event photos.",
  },
  {
    q: "Does TripSync deliver full-resolution photos?",
    a: "Yes. Photos are shared and downloaded at full resolution, so guests get the real quality — not the shrunken versions that messaging apps produce.",
  },
  {
    q: "Is TripSync private and secure?",
    a: "Yes. Every group is private and invite-only. People only see photos from groups they have joined, and depending on the group's settings, members may see only the photos they are in or added themselves.",
  },
  {
    q: "Do I use the app or the website?",
    a: "Both. Photographers and event hosts upload and manage everything in TripSync Studio on the web — best for large uploads and organising folders. Guests and friends use the free iPhone and Android app to join a group and get their photos.",
  },
  {
    q: "How do I share photos from a trip with friends?",
    a: "Create a shared group in the app, everyone adds their photos, and face recognition sorts the album so each friend gets the pictures they are in. In a shared group everyone keeps their own copy.",
  },
  {
    q: "Is TripSync free?",
    a: "The app is free to download, and you can create a group and start sharing at no cost. Paid plans with more storage are available for photographers and hosts running larger events.",
  },
];
