import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Ctx } from './main';

/*
 * On touch devices (no custom cursor), a fixed glass "Book a demo" button at the bottom
 * centre. It steps aside while the brief is on screen. Its click is wired in topbar.ts
 * along with every other link to #demo.
 */
export function initMobileCta(ctx: Ctx): void {
  const button = document.querySelector<HTMLElement>('.mobile-cta');
  const form = document.getElementById('brief');
  if (!button || !form) return;
  if (ctx.finePointer && !ctx.isMobile) {
    button.remove();
    return;
  }

  ScrollTrigger.create({
    trigger: form,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => button.classList.toggle('is-away', self.isActive),
  });

  const show = () => button.classList.add('is-ready');
  if (ctx.reducedMotion) show();
  else document.addEventListener('loci:ready', show, { once: true });
}
