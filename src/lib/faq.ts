// Single source of truth for the FAQ - rendered as a visible section AND emitted as FAQPage
// structured data (JSON-LD) in the layout, so answer engines (ChatGPT, Perplexity, Gemini, etc.)
// can quote accurate answers. Plain language; photographer/business questions come first on purpose.
export type FaqItem = { q: string; a: string };

export const FAQS: FaqItem[] = [
  {
    q: "What is TripSync?",
    a: "TripSync puts everyone's photos from an event in one place and uses face recognition to find the ones each person is in. Everyone gets their own photos in full quality, without scrolling through hundreds of pictures or getting shrunken copies from chat apps.",
  },
  {
    q: "I'm a photographer - why would I use TripSync?",
    a: "You upload the whole shoot once and share a single link. Every guest finds their own photos by face, so you skip the sorting and the download links that expire. And your studio name and logo show up on the link, the QR poster, and each guest's gallery, so everyone at the event sees who shot it.",
  },
  {
    q: "Can I add my own logo and brand?",
    a: "Yes. Add your studio name, logo, and a cover photo in your profile. They appear on the pages and posters your clients and their guests see, so your brand travels with every photo you share.",
  },
  {
    q: "What is the QR code for?",
    a: "Every event gets a printable QR poster. Put it on a table at the event. Guests scan it with their phone, get the app or open the gallery in their browser, and find the photos they are in.",
  },
  {
    q: "How do guests get their photos?",
    a: "They open your link, add a quick selfie, and face recognition shows them every photo they appear in. They can view and download in full quality - no searching.",
  },
  {
    q: "Can I watermark photos until a client pays?",
    a: "Yes. Turn on watermarking and guests see watermarked previews. You give full-quality access once the client has paid. It is built for proofing and selling event photos.",
  },
  {
    q: "Are the photos full quality?",
    a: "Yes. Photos are shared and downloaded at full resolution, not the shrunken versions that messaging apps create.",
  },
  {
    q: "Is TripSync private?",
    a: "Yes. Every group is private and invite-only. People only see photos from groups they have joined, and you can limit guests to just the photos they are in.",
  },
  {
    q: "Do I use the app or the website?",
    a: "Photographers and event hosts use TripSync Studio on the web to upload and manage events - it is best for large uploads. Guests use the free iPhone and Android app, or open the shared link in their browser.",
  },
  {
    q: "What does it cost?",
    a: "The app is free, and you can start a group at no cost. Paid plans add more storage and photos, plus watermarking and folders, for photographers and hosts running bigger events.",
  },
];
