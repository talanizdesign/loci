import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Ctx } from '../main';
import { pinSection } from '../lib/pin';
import { revealWords } from '../lib/split';
import { ring, ringO } from '../stage';

/*
 * Section 1. On load: the wordmark LOCI, then only its O, which grows into the ring of
 * glass cards; the headline reveals inside it and the ring begins its slow turn.
 */
export function initIntro(ctx: Ctx): void {
  const section = document.getElementById('intro');
  if (!section) return;
  const { stage } = ctx;
  const headline = section.querySelector<HTMLElement>('.intro__headline')!;
  const sub = section.querySelector<HTMLElement>('.intro__sub')!;
  const cue = section.querySelector<HTMLElement>('.intro__cue')!;
  const { l, o, c, i } = stage.letters;

  if (ctx.reducedMotion) {
    stage.wordmark.style.display = 'none';
    // A flat ring, drawn once: no 3D, no turning, no cursor response
    stage.cards.forEach((card) => (card.appear = 1));
    ring.tilt = 0;
    ring.depth = 0;
    stage.renderOnce();
    gsap.to([headline, sub, cue], { autoAlpha: 1, duration: 1, stagger: 0.15 });
    document.dispatchEvent(new Event('loci:ready'));
    return;
  }

  pinSection(ctx, section, 'intro');

  // Measure where the letter O sits, so the circle starts exactly there.
  const oBox = o.getBoundingClientRect();
  const stem = oBox.width * 0.105;
  Object.assign(ringO, {
    x: oBox.left + oBox.width / 2 - window.innerWidth / 2,
    y: oBox.top + oBox.height / 2 - window.innerHeight / 2,
    scale: (oBox.width - stem) / 2 / ring.radius,
    stroke: stem,
    tilt: 0,
    opacity: 0,
  });

  const drift = '0.4em';
  const tl = gsap.timeline({ delay: 0.35, defaults: { ease: 'power3.out' } });
  tl
    // 1. The wordmark, alone on the page
    .fromTo([l, c, i], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.3, stagger: 0.06 })
    .to(ringO, { opacity: 1, duration: 1.3 }, '<0.06')
    // A short beat
    .addLabel('reduce', '+=0.55')
    // 2. L, C and I fade and drift away; the O settles at the centre
    .to(l, { x: `-${drift}`, opacity: 0, filter: 'blur(6px)', duration: 1.2 }, 'reduce')
    .to([c, i], { x: drift, opacity: 0, filter: 'blur(6px)', duration: 1.2, stagger: 0.05 }, 'reduce')
    .to(ringO, { x: 0, y: 0, duration: 1.4, ease: 'expo.inOut' }, 'reduce')
    // 3. The O grows to the size of the ring, thins to a hairline and tilts into its plane
    .to(ringO, { scale: 1, stroke: 1, tilt: 1, duration: 1.6, ease: 'expo.inOut' }, 'reduce+=1.1')
    // 4. Cards appear one by one along the circle; the hairline fades into them
    .addLabel('cards', '-=0.35')
    .to(stage.cards, { appear: 1, duration: 1.1, stagger: 0.05 }, 'cards')
    .to(ringO, { opacity: 0, duration: 1.4, ease: 'power2.inOut' }, 'cards+=0.7')
    // 5. The ring starts turning, and responds to the cursor
    .to(ring, { spinSpeed: 6, duration: 4, ease: 'power2.inOut' }, 'cards+=0.6')
    .to(ring, { pointer: 1, duration: 2.5, ease: 'power2.inOut' }, 'cards+=1.2')
    // Then the headline, word by word
    .set([headline, sub, cue], { autoAlpha: 1 }, 'cards+=1.2')
    .add(revealWords(headline), 'cards+=1.2')
    .call(paintAccent, [], 0)
    .fromTo(sub, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.4 }, '>-0.7')
    .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 1.2 }, '>-0.6')
    .call(() => {
      stage.wordmark.style.visibility = 'hidden';
      ctx.lenis?.start();
      introDone = true;
      // The top bar, cursor and mobile button wait for the opening to finish
      document.dispatchEvent(new Event('loci:ready'));
    }, [], '<0.2');

  // The gradient line is split into words, each with its own transform, so each word is
  // given its slice of one gradient sized to the whole line.
  function paintAccent() {
    const accent = headline.querySelector<HTMLElement>('.intro__accent');
    if (!accent) return;
    accent.classList.add('is-split');
    accent.style.setProperty('--gw', `${accent.offsetWidth}px`);
    accent.style.setProperty('--gh', `${accent.offsetHeight}px`);
    for (const word of accent.querySelectorAll<HTMLElement>('.word')) {
      word.style.setProperty('--gx', `${word.offsetLeft}px`);
      word.style.setProperty('--gy', `${word.offsetTop}px`);
    }
  }
  window.addEventListener('resize', paintAccent);

  // While pinned, the scroll cue leaves first; the rest is handed to Section 2.
  // Opacity follows scroll progress directly, so it is right after any jump.
  let introDone = false;
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${window.innerHeight * 0.3}`,
    onUpdate: (self) => {
      if (introDone) gsap.to(cue, { opacity: 1 - self.progress, duration: 0.4, overwrite: true });
    },
  });
}
