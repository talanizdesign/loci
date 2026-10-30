import './styles/fonts.css';
import 'lenis/dist/lenis.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/glass.css';
import './styles/stage.css';
import './styles/sections.css';
import './styles/ui.css';
import './styles/reduced-motion.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import { MOBILE_MAX } from './config';
import { createStage, type Stage } from './stage';
import { initIntro } from './sections/intro';
import { initRingToArc } from './sections/ring-to-arc';
import { initWorlds } from './sections/worlds';
import { initSurprise } from './sections/surprise';
import { initDemo } from './sections/demo';
import { initTopbar } from './topbar';
import { initCursor } from './cursor';
import { initMobileCta } from './mobile-cta';
import { initReduced } from './reduced';

gsap.registerPlugin(ScrollTrigger, SplitText);

export type Ctx = {
  lenis: Lenis | null;
  stage: Stage;
  reducedMotion: boolean;
  isMobile: boolean;
  finePointer: boolean;
};

// Reduced motion follows the visitor's system setting; add ?motion=reduced to preview it
const reducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  new URLSearchParams(window.location.search).get('motion') === 'reduced';
const isMobile = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.documentElement.classList.toggle('reduced-motion', reducedMotion);
// Tells the safety net in index.html that the app started (see the head script there)
document.documentElement.classList.add('app-ready');

// The story always starts at the beginning.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// Smooth scrolling, driven by GSAP's ticker so Lenis and ScrollTrigger share one clock.
// Scrolling stays paused until the opening sequence has played.
let lenis: Lenis | null = null;
if (!reducedMotion) {
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

const stage = createStage({ isMobile, finePointer, reducedMotion });
const ctx: Ctx = { lenis, stage, reducedMotion, isMobile, finePointer };

// Wait for fonts so SplitText and the wordmark measure the final glyphs.
document.fonts.ready.then(() => {
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
  initIntro(ctx);
  initRingToArc(ctx);
  initWorlds(ctx);
  initSurprise(ctx);
  initDemo(ctx);
  initTopbar(ctx);
  initCursor(ctx);
  initMobileCta(ctx);
  initReduced(ctx);
  ScrollTrigger.refresh();
});
