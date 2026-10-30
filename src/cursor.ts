import { gsap } from 'gsap';
import type { Ctx } from './main';

/*
 * The cursor, for fine pointers only: always a simple dot that follows the mouse with a
 * little smoothing. Canyon red with a thin white outline; off-white with a thin dark
 * outline while the Section 4 gradient covers the screen (the .on-dark class, see
 * ui.css). Over links and buttons it grows slightly and buttons lean towards it. Text
 * fields keep the native text cursor.
 */
type State = 'dot' | 'link' | 'hidden';

const INTERACTIVE = 'a, button, [role="button"], label';
const TEXT_FIELDS = 'input, textarea, select';

export function initCursor(ctx: Ctx): void {
  if (!ctx.finePointer || ctx.reducedMotion) return;
  const root = document.documentElement;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<div class="cursor__dot"></div>';
  cursor.dataset.state = 'hidden';
  document.body.appendChild(cursor);

  const pos = { x: -100, y: -100, tx: -100, ty: -100 };
  let state: State = 'hidden';
  let target: Element | null = null;

  const setState = (next: State) => {
    if (next === state) return;
    state = next;
    cursor.dataset.state = next;
  };

  const resolve = () => {
    if (!target) return setState('hidden');
    if (target.closest(TEXT_FIELDS)) return setState('hidden');
    if (target.closest(INTERACTIVE)) return setState('link');
    setState('dot');
  };

  window.addEventListener('pointermove', (event) => {
    pos.tx = event.clientX;
    pos.ty = event.clientY;
    if (state === 'hidden' && !target) {
      pos.x = pos.tx;
      pos.y = pos.ty;
    }
    target = event.target as Element;
    resolve();
  }, { passive: true });
  // Scrolling moves content under a still mouse, so check again
  window.addEventListener('scroll', () => {
    target = document.elementFromPoint(pos.tx, pos.ty);
    resolve();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    target = null;
    resolve();
  });

  gsap.ticker.add(() => {
    pos.x += (pos.tx - pos.x) * 0.2;
    pos.y += (pos.ty - pos.y) * 0.2;
    cursor.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
  });

  // Buttons lean a few pixels towards the cursor
  for (const el of document.querySelectorAll<HTMLElement>('[data-magnetic]')) {
    const toX = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const toY = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (event) => {
      const box = el.getBoundingClientRect();
      toX(((event.clientX - box.left) / box.width - 0.5) * 10);
      toY(((event.clientY - box.top) / box.height - 0.5) * 8);
    });
    el.addEventListener('pointerleave', () => {
      toX(0);
      toY(0);
    });
  }

  root.classList.add('has-cursor');
}
