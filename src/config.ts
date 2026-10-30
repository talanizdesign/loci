/**
 * Formspree endpoint for the demo form.
 * Replace YOUR_FORM_ID with the ID Formspree gives you (see README, "Connect the form").
 */
export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

/** Number of glass cards in the intro ring. */
export const CARD_COUNT = { desktop: 24, mobile: 14 } as const;

/**
 * Real backdrop blur is the most expensive effect on the page. Only every Nth card gets
 * it; the others use a matched fill. Raise N if the ring drops frames on slower machines.
 */
export const BLUR_EVERY = { desktop: 2, mobile: 3 } as const;

/** Breakpoint below which the mobile layout and timings apply (px). */
export const MOBILE_MAX = 767;

/**
 * How long each section stays pinned, in screen heights. Each section also scrolls into
 * view over one screen before it pins, so Section 2's total is 1 + 1.5 = 2.5 screens.
 */
export const PIN_LENGTH = {
  desktop: { intro: 1, idea: 1.5, worlds: 2, loci: 1.5 },
  mobile: { intro: 0.6, idea: 1, worlds: 1.4, loci: 1.1 },
} as const;
