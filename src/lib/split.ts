import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

/** Splits a statement into words. SplitText keeps the full sentence readable for screen readers. */
export function splitWords(el: HTMLElement): HTMLElement[] {
  return SplitText.create(el, { type: 'words', wordsClass: 'word' }).words as HTMLElement[];
}

/** Word-by-word reveal: a soft upward fade with a slight blur-to-sharp. */
export function revealWords(el: HTMLElement, vars: gsap.TweenVars = {}): gsap.core.Tween {
  return gsap.fromTo(
    splitWords(el),
    { opacity: 0, yPercent: 40, filter: 'blur(10px)' },
    {
      opacity: 1,
      yPercent: 0,
      filter: 'blur(0px)',
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.07,
      clearProps: 'filter',
      ...vars,
    },
  );
}
