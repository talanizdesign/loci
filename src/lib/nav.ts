import type { Ctx } from '../main';

export type Chapter = 'intro' | 'idea' | 'worlds' | 'loci' | 'demo';

/**
 * Where each chapter link lands, as a fraction of that section's pinned length, so the
 * visitor arrives at a moment where the chapter reads well: the first beat over the arc,
 * the fanned stack, the statement over the colour.
 */
const LANDING: Record<Chapter, number> = { intro: 0, idea: 0.1, worlds: 0.25, loci: 0.66, demo: 0 };

/** The element that spans a chapter's whole scroll distance (its pin spacer, if pinned). */
export function chapterEl(id: Chapter): HTMLElement {
  const section = document.getElementById(id)!;
  const parent = section.parentElement!;
  return parent.classList.contains('pin-spacer') ? parent : section;
}

function chapterY(id: Chapter): number {
  if (id === 'intro') return 0;
  const section = document.getElementById(id)!;
  const el = chapterEl(id);
  const top = el.getBoundingClientRect().top + window.scrollY;
  const pinned = el === section ? 0 : el.offsetHeight - section.offsetHeight;
  return top + pinned * LANDING[id];
}

export function scrollToChapter(ctx: Ctx, id: Chapter, onArrive?: () => void): void {
  const y = chapterY(id);
  if (ctx.lenis) {
    ctx.lenis.scrollTo(y, {
      duration: Math.min(3.2, 1.2 + Math.abs(y - window.scrollY) / 4000),
      easing: (t) => 1 - Math.pow(1 - t, 4),
      onComplete: () => onArrive?.(),
    });
  } else {
    window.scrollTo({ top: y, behavior: ctx.reducedMotion ? 'auto' : 'smooth' });
    onArrive?.();
  }
}

/** Scrolls to the brief and puts the caret in its first empty blank. */
export function scrollToDemo(ctx: Ctx): void {
  scrollToChapter(ctx, 'demo', () => {
    const blanks = Array.from(document.querySelectorAll<HTMLInputElement>('#brief .blank input'));
    (blanks.find((input) => !input.value) ?? blanks[0])?.focus({ preventScroll: true });
  });
}
