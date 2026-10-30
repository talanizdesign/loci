import { gsap } from 'gsap';
import type { Ctx } from '../main';
import { content } from '../content';
import { FORMSPREE_ENDPOINT } from '../config';
import { splitWords } from '../lib/split';

/*
 * Section 5. The demo request is one sentence with blanks, like writing a brief to a
 * team. After sending, the sentence folds into a small glass card, flies to the centre
 * and becomes the O again, a hairline circle holding the thank-you.
 */
export function initDemo(ctx: Ctx): void {
  const section = document.getElementById('demo');
  const form = document.querySelector<HTMLFormElement>('#brief');
  if (!section || !form) return;
  const copy = content.demo;
  const headline = section.querySelector<HTMLElement>('.demo__headline')!;
  const sub = section.querySelector<HTMLElement>('.demo__sub')!;
  const card = form.querySelector<HTMLElement>('.brief__card')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const status = form.querySelector<HTMLElement>('.brief__status')!;
  const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('.blank input'));

  entrance();

  // Each blank grows with what is typed; notes clear as soon as the field is fixed
  for (const input of inputs) {
    const blank = input.parentElement!;
    input.addEventListener('input', () => {
      blank.dataset.value = input.value || input.placeholder;
      blank.classList.toggle('is-filled', Boolean(input.value));
      if (input.getAttribute('aria-invalid') === 'true') check(input);
    });
    input.addEventListener('blur', () => {
      if (input.value) check(input);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const invalid = inputs.filter((input) => !check(input));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }
    await send();
  });

  /** Validates one field and shows or clears its note. Returns true when valid. */
  function check(input: HTMLInputElement): boolean {
    const value = input.value.trim();
    let message = '';
    if (!value) message = copy.errors.required;
    else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) message = copy.errors.email;
    const note = document.getElementById(`${input.id}-error`)!;
    note.textContent = message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }

  async function send() {
    const name = (form!.elements.namedItem('name') as HTMLInputElement).value.trim();
    button.disabled = true;
    button.textContent = copy.sending;
    status.textContent = '';
    try {
      await post(new FormData(form!));
      thanks(name);
    } catch {
      button.disabled = false;
      button.textContent = copy.submit;
      // A calm message with a way to try again
      status.textContent = `${copy.errors.failed} `;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'brief__retry';
      retry.textContent = copy.errors.retry;
      retry.addEventListener('click', () => send());
      status.appendChild(retry);
    }
  }

  async function post(data: FormData) {
    if (data.get('_gotcha')) return; // a bot filled the spam trap: say thanks, send nothing
    if (FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
      // Not connected to Formspree yet (see README). In local development the flow is
      // simulated so it can be reviewed; on the published site it fails visibly.
      if (import.meta.env.DEV) {
        console.warn('LOCI: Formspree is not connected yet, so this send was simulated.');
        await new Promise((resolve) => setTimeout(resolve, 900));
        return;
      }
      throw new Error('Formspree endpoint not set');
    }
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Formspree responded ${response.status}`);
  }

  // The card floats in gently as the section enters
  function entrance() {
    if (ctx.reducedMotion) {
      gsap.set([headline, sub, card], { opacity: 1 });
      return;
    }
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 15%', scrub: 1 },
    })
      .fromTo(headline, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0)
      .fromTo(sub, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.15)
      .fromTo(card,
        { opacity: 0, y: 90, rotationX: 8, transformPerspective: 1400, transformOrigin: '50% 0%' },
        { opacity: 1, y: 0, rotationX: 0, duration: 0.7, ease: 'power2.out' }, 0.3);
  }

  /** The sentence folds into a small card, flies to the centre and becomes the O. */
  function thanks(name: string) {
    const overlay = section!.querySelector<HTMLElement>('.thanks')!;
    const bg = overlay.querySelector<HTMLElement>('.thanks__bg')!;
    const o = overlay.querySelector<HTMLElement>('.thanks__o')!;
    const text = overlay.querySelector<HTMLElement>('.thanks__text')!;
    const fold = overlay.querySelector<HTMLElement>('.fold')!;
    text.textContent = copy.thanks.replace('{name}', name);

    const rect = card.getBoundingClientRect();
    overlay.hidden = false;
    ctx.lenis?.stop();
    document.documentElement.classList.add('is-done');

    if (ctx.reducedMotion) {
      gsap.to(bg, { opacity: 1, duration: 0.8 });
      gsap.to(o, { opacity: 1, duration: 1, delay: 0.4, onComplete: () => text.focus() });
      return;
    }

    // The fold starts exactly over the form's card
    const radius = parseFloat(getComputedStyle(card).borderRadius) || 28;
    gsap.set(fold, {
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top,
      borderRadius: radius,
      opacity: 1,
      transformOrigin: '50% 50%',
    });
    const small = { w: 120, h: 160 };
    const dot = o.offsetWidth * 0.12;
    const toCentre = {
      x: window.innerWidth / 2 - rect.width / 2,
      y: window.innerHeight / 2 - rect.height / 2,
    };
    const words = splitWords(text);
    gsap.set(words, { opacity: 0, yPercent: 30, filter: 'blur(8px)' });

    gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => text.focus() })
      .set(card, { opacity: 0 })
      .to(form!.querySelector('.brief__actions'), { opacity: 0, duration: 0.4 }, 0)
      .to([headline, sub], { opacity: 0, duration: 0.6 }, 0)
      .to(bg, { opacity: 1, duration: 1.4, ease: 'power2.inOut' }, 0.2)
      // Folds into a small glass card...
      .to(fold, { scaleX: small.w / rect.width, scaleY: small.h / rect.height, duration: 0.9 }, 0.1)
      // ...which flies to the centre of the screen...
      .to(fold, { x: toCentre.x, y: toCentre.y, duration: 1.1, ease: 'expo.inOut' }, 0.7)
      // ...and turns back into the O
      .to(fold, { scaleX: dot / rect.width, scaleY: dot / rect.height, borderRadius: '50%', duration: 0.7 }, 1.6)
      .fromTo(o, { opacity: 0, scale: 0.12 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'expo.out' }, 2.2)
      .to(fold, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 2.25)
      .to(words, { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', stagger: 0.06 }, 2.9);
  }
}
