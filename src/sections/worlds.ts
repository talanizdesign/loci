import { gsap } from 'gsap';
import type { Ctx } from '../main';
import { PIN_LENGTH } from '../config';
import { pinSection, timeMap } from '../lib/pin';
import { circleOnCard, idea, merge, portal } from '../stage';

/*
 * Section 3. The arc's cards gather into one YOUR IDEA card; it thickens into a stack
 * and fans out in an isometric view, each layer in its own light while the label and the
 * circle stay exactly the same. Then it compresses, turns edge-on, and its circle comes
 * away to the centre of the screen: the portal for Section 4.
 *
 * Authored in fractions of the whole distance: the screen in which the section scrolls
 * into view, plus its pin.
 */
export function initWorlds(ctx: Ctx): void {
  const section = document.getElementById('worlds');
  if (!section) return;
  const intro = section.querySelector<HTMLElement>('.worlds__intro')!;
  const steps = gsap.utils.toArray<HTMLElement>('.worlds__step', section);
  const pillList = section.querySelector<HTMLElement>('.worlds__pills')!;
  const pills = gsap.utils.toArray<HTMLElement>('.pill', section);

  if (ctx.reducedMotion) {
    gsap.set([intro, ...steps, pillList], { opacity: 1 });
    return;
  }

  const pin = PIN_LENGTH[ctx.isMobile ? 'mobile' : 'desktop'].worlds;
  pinSection(ctx, section, 'worlds');
  const at = timeMap(ctx, 'worlds');

  // Where each step becomes the active one
  const stepAt = [0.47, 0.57, 0.67].map(at);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: () => `+=${window.innerHeight * (1 + pin)}`,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => setActive(stepAt.filter((p) => self.progress >= p).length - 1),
    },
  });

  const textIn = { opacity: 1, y: 0, ease: 'power2.out', duration: 0.05 };
  const textOut = { opacity: 0, y: -16, ease: 'power2.in', duration: 0.05 };

  tl
    // The cards slide in from the arc and merge into one larger card
    .to(merge, { t: 1, duration: 0.3, ease: 'power2.inOut' }, at(0))
    .fromTo(idea, { front: 0 }, { front: 1, duration: 0.1, ease: 'power1.inOut' }, at(0.2))
    // The intro line, once the section has settled
    .fromTo(intro, { opacity: 0, y: 16 }, textIn, at(0.33))
    // The card thickens into a stack, then fans out
    .fromTo(idea, { thick: 0 }, { thick: 1, duration: 0.08, ease: 'power2.inOut' }, at(0.37))
    .fromTo(idea, { fan: 0, tint: 0 }, { fan: 1, tint: 1, duration: 0.12, ease: 'power2.inOut' }, at(0.43))
    .fromTo(idea, { drift: 0 }, { drift: 9, duration: 0.36, ease: 'sine.inOut' }, at(0.44))
    .fromTo(pillList, { opacity: 0, x: 12 }, { opacity: 1, x: 0, ease: 'power2.out', duration: 0.05 }, stepAt[0] - 0.04);

  // Three steps, revealed one at a time as the fan opens. On phones they share one
  // place under the stack, so each step leaves before the next arrives.
  steps.forEach((step, i) => {
    if (ctx.isMobile && i > 0) tl.to(steps[i - 1], textOut, stepAt[i] - 0.06);
    tl.fromTo(step, { opacity: 0, y: 16 }, textIn, stepAt[i] - (ctx.isMobile ? 0.01 : 0.03));
  });
  // On phones the steps share one place under the stack, so the intro line makes way
  if (ctx.isMobile) tl.to(intro, textOut, stepAt[0] - 0.06);

  tl
    // The copy leaves, the stack compresses back into one card
    .to([intro, ...steps, pillList], { ...textOut, stagger: 0.008 }, at(0.79))
    .to(idea, { fan: 0, tint: 0, drift: 0, duration: 0.07, ease: 'power2.inOut' }, at(0.8))
    .to(idea, { thick: 0, duration: 0.04, ease: 'power2.in' }, at(0.84))
    // Its circle comes away: the portal takes the circle's exact place...
    .fromTo(portal, { opacity: 0 }, { opacity: 1, duration: 0.001 }, at(0.88))
    .fromTo(idea, { circle: 1 }, { circle: 0, duration: 0.001 }, at(0.88))
    // ...the card turns edge-on, and the circle moves to the centre of the screen
    .fromTo(idea, { edge: 0 }, { edge: 1, duration: 0.07, ease: 'power2.in' }, at(0.885))
    .fromTo(portal, {
      x: () => idea.x + circleOnCard().x,
      y: () => idea.y + circleOnCard().y,
    }, { x: 0, y: 0, duration: 1 - at(0.9), ease: 'expo.inOut' }, at(0.9));

  let active = -2;
  function setActive(index: number) {
    if (index === active) return;
    active = index;
    steps.forEach((step, i) => step.classList.toggle('is-past', i < index));
    pills.forEach((pill, i) => pill.classList.toggle('is-active', i === index));
  }
}
