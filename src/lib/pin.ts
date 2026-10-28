import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PIN_LENGTH } from '../config';
import type { Ctx } from '../main';

type Pinned = keyof (typeof PIN_LENGTH)['desktop'];

/** Pins a section for its configured number of screen heights and returns the trigger. */
export function pinSection(ctx: Ctx, el: HTMLElement, key: Pinned): ScrollTrigger | null {
  if (ctx.reducedMotion) return null;
  const screens = PIN_LENGTH[ctx.isMobile ? 'mobile' : 'desktop'][key];
  return ScrollTrigger.create({
    trigger: el,
    start: 'top top',
    end: () => `+=${window.innerHeight * screens}`,
    pin: true,
    anticipatePin: 1,
  });
}

/**
 * Section timelines are authored as fractions of their whole distance (the screen in
 * which the section scrolls into view, plus its pin), using the desktop proportions.
 * This maps those fractions onto another device's proportions, so a beat placed "just
 * after the section pins" still lands just after it pins on a phone.
 */
export function timeMap(ctx: Ctx, key: Pinned): (p: number) => number {
  const enterOf = (pin: number) => 1 / (1 + pin);
  const authored = enterOf(PIN_LENGTH.desktop[key]);
  const actual = enterOf(PIN_LENGTH[ctx.isMobile ? 'mobile' : 'desktop'][key]);
  return (p) =>
    p <= authored ? (p / authored) * actual : actual + ((p - authored) / (1 - authored)) * (1 - actual);
}
