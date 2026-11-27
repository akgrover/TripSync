// Single source of truth for the FAQ - rendered as a visible section AND emitted as FAQPage
// structured data (JSON-LD) in the layout, so answer engines (ChatGPT, Perplexity, Gemini, etc.)
// can quote accurate answers. Plain language; photographer/business questions come first on purpose.
export type FaqItem = { q: string; a: string };

export const FAQS: FaqItem[] = [
  {
    q: "What is TripSync?",
    a: "TripSync is for photographers and event organisers. Upload a whole shoot - a wedding, a marathon, a tournament, any event - and face recognition finds each person's photos for them. Everyone opens one link and gets their own shots in full quality, without scrolling through thousands of images or sending shrunken copies over chat apps.",
  },
  {
    q: "I'm a photographer - why would I use TripSync?",
    a: "You upload the whole shoot once and share a single link. Every guest finds their own photos by face, so you skip the sorting and the download links that expire. And your studio name and logo show up on the link, the QR poster, and each guest's gallery, so everyone at the event sees who shot it.",
  },
  {
    q: "Does TripSync work for sports events and marathons?",
    a: "Yes - it is built for them. Upload the full set from a race, tournament, or sports day and every athlete, parent, and spectator finds their own photos by face. Big crowds and repeated faces are no problem: guests just add a quick selfie and get their shots, no bib-number searching.",
  },
  {
    q: "How does pricing work for event & sports photographers?",
    a: "Instead of an annual plan, you can pay a small per-event fee that covers the AI face matching and hosting for that event. You then bill your clients whatever you like, directly - TripSync only takes its fee and never touches what you charge. The fee scales with the event's size. It is set up per event, so contact us to see if it fits the events you shoot.",
  },
  {
    q: "Can I add my own logo and brand?",
    a: "Yes. Add your studio name, logo, and a cover photo in your profile. They appear on the pages and posters your clients and their guests see, so your brand travels with every photo you share.",
  },
  {
    q: "What is the QR code for?",
    a: "Every event gets a printable QR poster. Put it on a table at the venue or at the finish line. Guests scan it with their phone, get the app or open the gallery in their browser, and find the photos they are in.",
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
    a: "Yes. Every event is private and invite-only. People only see photos from events they have joined, and you can limit guests to just the photos they are in.",
  },
  {
    q: "Do I use the app or the website?",
    a: "Photographers and organisers use TripSync Studio on the web to upload and manage events - it is best for large uploads. Guests use the free iPhone and Android app, or open the shared link in their browser.",
  },
  {
    q: "What does it cost?",
    a: "Photographers and organisers start free, then either pick an annual plan by storage and volume, or pay a small per-event fee for one-off events (covers the AI matching and hosting; you set your own client pricing). Guests never pay TripSync to receive photos a photographer has shared with them.",
  },
];
