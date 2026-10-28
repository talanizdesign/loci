import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Ctx } from './main';
import { chapterEl, scrollToChapter, scrollToDemo, type Chapter } from './lib/nav';
import { takeover } from './stage';

/*
 * The fixed top bar: wordmark, chapter progress and the "Book a demo" pill.
 * It also decides when the page is "on dark" (the gradient covers the screen), which
 * turns the bar, the cursor and the mobile button off-white.
 */
export function initTopbar(ctx: Ctx): void {
  const bar = document.querySelector<HTMLElement>('.topbar');
  if (!bar) return;
  const links = Array.from(bar.querySelectorAll<HTMLAnchorElement>('.topbar__nav a'));
  const root = document.documentElement;

  // Chapter links scroll smoothly; the active chapter is in ink
  for (const link of links) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToChapter(ctx, link.dataset.chapter as Chapter);
    });
  }
  bar.querySelector('.topbar__logo')!.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToChapter(ctx, 'intro');
  });
  for (const cta of document.querySelectorAll<HTMLAnchorElement>('a[href="#demo"]:not([data-chapter])')) {
    cta.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToDemo(ctx);
    });
  }

  const setActive = (id: string) => {
    for (const link of links) {
      const active = link.dataset.chapter === id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    }
  };
  setActive('intro');
  for (const link of links) {
    const id = link.dataset.chapter as Chapter;
    ScrollTrigger.create({
      trigger: chapterEl(id),
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => self.isActive && setActive(id),
    });
  }

  // On dark while the gradient fully covers the screen
  let dark = false;
  gsap.ticker.add(() => {
    const cover = Math.hypot(window.innerWidth / 2, window.innerHeight / 2);
    const next = takeover.opacity > 0.6 && takeover.r > cover - 8;
    if (next !== dark) {
      dark = next;
      root.classList.toggle('on-dark', dark);
    }
  });

  // Hidden while the opening plays, so the page starts with only the wordmark
  if (ctx.reducedMotion) bar.classList.add('is-ready');
  else document.addEventListener('loci:ready', () => bar.classList.add('is-ready'), { once: true });
}
