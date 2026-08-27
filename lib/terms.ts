// ─────────────────────────────────────────────────────────────────────────────
//  YOUR TERMS & CONDITIONS
//
//  Paste your own legal wording here. Nothing on this page is written for you —
//  the text below is empty on purpose, because the terms of your business are
//  yours to write (or to have written for you).
//
//  1. Set TERMS_LAST_UPDATED to the date your terms take effect.
//  2. Add one entry to TERMS_SECTIONS per section of your document.
//     Each entry: { heading, paragraphs: [...], bullets: [...] (optional) }
//
//  Until TERMS_SECTIONS has at least one entry, /terms shows a short "coming
//  soon" notice instead of an empty legal page.
// ─────────────────────────────────────────────────────────────────────────────

export type TermsSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

/** e.g. "27 August 2026". Leave empty to hide the line. */
export const TERMS_LAST_UPDATED = "";

export const TERMS_SECTIONS: TermsSection[] = [
  // {
  //   heading: "1. About us",
  //   paragraphs: ["Your wording here.", "Another paragraph here."],
  //   bullets: ["An optional bullet", "Another bullet"],
  // },
];

export const TERMS_CONTACT_EMAIL = "mundolingu@gmail.com";
