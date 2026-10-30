import { gsap } from 'gsap';
import type { Ctx } from '../main';
import { PIN_LENGTH } from '../config';
import { pinSection, timeMap } from '../lib/pin';
import { splitWords } from '../lib/split';
import { coverRadius, portal, takeover } from '../stage';

/*
 * Section 4, the only moment of colour. The circle from Section 3 fills with the LOCI
 * gradient and grows until it covers the screen. Then nothing but colour for half a
 * screen, before the statement arrives word by word. Finally the gradient shrinks back
 * into the circle and fades, handing a neutral page to Section 5.
 *
 * Authored in fractions of the whole distance (scroll-in screen plus pin), desktop
 * proportions; timeMap adapts them to phones.
 */
export function initSurprise(ctx: Ctx): void {
  const section = document.getElementById('loci');
  if (!section) return;
  const statement = section.querySelector<HTMLElement>('.surprise__statement')!;
  const support = section.querySelector<HTMLElement>('.surprise__support')!;

  if (ctx.reducedMotion) {
    gsap.set([statement, support], { opacity: 1 });
    return;
  }

  const pin = PIN_LENGTH[ctx.isMobile ? 'mobile' : 'desktop'].loci;
  pinSection(ctx, section, 'loci');
  const at = timeMap(ctx, 'loci');

  const words = splitWords(statement);
  const hidden = { opacity: 0, yPercent: 30, filter: 'blur(10px)' };
  // Set every word's start state up front: a staggered fromTo only applies it to the first
  gsap.set(words, hidden);
  gsap.set(statement, { opacity: 1 });
  const circleR = () => portal.size / 2;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: () => `+=${window.innerHeight * (1 + pin)}`,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  tl
    // 1. The glass circle fills with the gradient...
    .fromTo(takeover, { r: circleR, opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power1.inOut' }, at(0.08))
    // ...and grows until it covers the screen
    .fromTo(takeover, { r: circleR }, { r: coverRadius, duration: 0.2, ease: 'power3.in' }, at(0.2))
    .fromTo(portal, { fade: 1, scale: 1 }, { fade: 0, scale: 1.6, duration: 0.08, ease: 'power1.in' }, at(0.24))
    // 2. A deliberate pause: only the colour, for about half a screen of scrolling
    // 3. The statement, word by word
    .fromTo(words,
      hidden,
      { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.05, stagger: 0.016, ease: 'power2.out' },
      at(0.6))
    // 4. The supporting line
    .fromTo(support, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, at(0.76))
    // 5. Everything leaves; the gradient shrinks back into the circle and fades away
    .to([statement, support], { opacity: 0, y: -20, duration: 0.05, ease: 'power2.in' }, at(0.88))
    .to(takeover, { r: circleR, duration: 0.08, ease: 'power3.inOut' }, at(0.9))
    .to(takeover, { opacity: 0, duration: 1 - at(0.97), ease: 'power1.out' }, at(0.97));
}
