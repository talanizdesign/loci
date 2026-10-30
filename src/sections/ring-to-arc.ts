import { gsap } from 'gsap';
import type { Ctx } from '../main';
import { content } from '../content';
import { PIN_LENGTH } from '../config';
import { pinSection, timeMap } from '../lib/pin';
import { arc } from '../stage';

/*
 * Section 2. The ring opens and flattens into a wide arc across the lower half; the
 * cards slide along it. Three beats of copy take turns above the arc, and the caption's
 * last word changes as the cards pass.
 *
 * The timeline spans the screen in which the section scrolls into view plus its pin,
 * authored in fractions of that whole distance (0 → 1).
 */
export function initRingToArc(ctx: Ctx): void {
  const section = document.getElementById('idea');
  if (!section) return;
  const beats = gsap.utils.toArray<HTMLElement>('.arc__beat', section);
  const caption = section.querySelector<HTMLElement>('.arc__caption')!;
  const wordWrap = section.querySelector<HTMLElement>('.arc__word-wrap')!;
  const word = section.querySelector<HTMLElement>('.arc__word')!;
  const introCopy = document.querySelector<HTMLElement>('#intro .intro__copy');
  const words = content.arc.captionWords;

  // Screen readers get the whole caption at once instead of a word that keeps changing
  section.querySelector('.arc__all')!.textContent =
    `${content.arc.captionLead} ${words.map((w) => w.replace(/\.$/, '')).join(', ')}.`;

  if (ctx.reducedMotion) {
    gsap.set([...beats, caption], { opacity: 1 });
    return;
  }

  const pin = PIN_LENGTH[ctx.isMobile ? 'mobile' : 'desktop'].idea;
  pinSection(ctx, section, 'idea');
  const at = timeMap(ctx, 'idea');

  const shiftMax = ctx.stage.cards.length * 0.45;
  let current = 0;
  gsap.set(wordWrap, { width: word.offsetWidth });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: () => `+=${window.innerHeight * (1 + pin)}`,
      scrub: 1,
    },
  });

  const beatIn = { opacity: 0, y: 32, filter: 'blur(8px)' };
  const shown = { opacity: 1, y: 0, filter: 'blur(0px)', ease: 'power2.out' };
  const beatOut = { opacity: 0, y: -32, filter: 'blur(6px)', ease: 'power2.in' };

  tl
    // The headline from Section 1 leaves as the ring begins to open. Opacity only: a
    // transform here would become the positioning context for the phone sub-line.
    .fromTo(introCopy, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: 'power1.in' }, at(0))
    // The ring opens and flattens into the arc, with a quiet stretch before the first beat
    .to(arc, { t: 1, duration: 0.42, ease: 'power2.inOut' }, at(0))
    // Three beats, one at a time. Beats 1 and 2 are one thought, so the second follows
    // straight on as the first leaves; a short pause comes before beat 3.
    .fromTo(beats[0], beatIn, { ...shown, duration: 0.07 }, at(0.4))
    .to(beats[0], { ...beatOut, duration: 0.04 }, at(0.52))
    .fromTo(beats[1], beatIn, { ...shown, duration: 0.06 }, at(0.55))
    .to(beats[1], { ...beatOut, duration: 0.05 }, at(0.68))
    .fromTo(beats[2], beatIn, { ...shown, duration: 0.07 }, at(0.8))
    // The caption, then the cards slide along the arc
    .fromTo(caption, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, at(0.44))
    .fromTo(arc, { shift: 0 }, {
      shift: shiftMax,
      duration: 1 - at(0.44),
      onUpdate: () => setWord(Math.min(words.length - 1, Math.floor((arc.shift / shiftMax) * words.length))),
    }, at(0.44));

  // Swaps the caption's last word: the old one lifts away, the new one rises in
  function setWord(index: number) {
    if (index === current) return;
    current = index;
    gsap.killTweensOf([word, wordWrap]);
    gsap.to(word, {
      opacity: 0,
      yPercent: -40,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        word.textContent = words[index];
        gsap.to(wordWrap, { width: word.offsetWidth, duration: 0.7, ease: 'power3.out' });
        gsap.fromTo(word, { opacity: 0, yPercent: 40 }, { opacity: 1, yPercent: 0, duration: 0.8, ease: 'power3.out' });
      },
    });
  }
}
