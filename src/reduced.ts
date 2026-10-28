import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Ctx } from './main';

/*
 * Reduced motion: no pinning, no scrubbing, no 3D and no custom cursor (each module
 * checks ctx.reducedMotion). The sections read as a calm sequence instead: each one
 * fades in once as it enters the screen. This module also turns the top bar off-white
 * while it sits over Section 4, which here is a plain gradient section.
 */
export function initReduced(ctx: Ctx): void {
  if (!ctx.reducedMotion) return;
  const root = document.documentElement;
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section'));

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });
  for (const section of sections) {
    section.classList.add('rm-fade');
    observer.observe(section);
  }

  const loci = document.getElementById('loci');
  if (loci) {
    ScrollTrigger.create({
      trigger: loci,
      start: 'top 40px',
      end: 'bottom 40px',
      onToggle: (self) => root.classList.toggle('on-dark', self.isActive),
    });
  }
}
