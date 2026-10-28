import { gsap } from 'gsap';
import { content } from './content';
import { BLUR_EVERY, CARD_COUNT } from './config';

/*
 * The stage is one fixed layer that holds the elements the story hands from section to
 * section: the drifting light, the glass cards and the O. Sections never own these
 * elements; they only tween the plain state objects below, and the render loop turns that
 * state into transforms every frame. That is what lets the story play backwards cleanly.
 *
 * 3D: there is no preserve-3d (it breaks backdrop-filter). Every card and the O sit at
 * the centre of the screen and carry their own perspective() transform, so they share
 * one vanishing point and their positions come from the same 3D maths.
 */

const DEG = Math.PI / 180;
const PERSPECTIVE = 1400;

export type Card = {
  el: HTMLElement;
  /** 0 = not yet placed, 1 = in place on the ring (tweened by the intro) */
  appear: number;
  /** Smoothed cursor influence and lean direction */
  lift: number;
  leanX: number;
  leanY: number;
  zIndex: number;
  /** Labelled cards always sit in front of their blank neighbours */
  labelled: boolean;
};

/** Ring layout. Sections tween these values. */
export const ring = {
  radius: 300,
  /** Base tilt of the ring plane, in degrees */
  tilt: 24,
  /** Distance of the ring's centre behind the screen plane, in px */
  depth: -220,
  /** Vertical offset on screen, balancing the perspective (near cards look larger) */
  offsetY: 0,
  /** Accumulated in-plane rotation, in degrees */
  spin: 0,
  /** Degrees per second: 6 is one full turn per minute */
  spinSpeed: 0,
  /** 0..1, how strongly the ring and cards respond to the cursor */
  pointer: 0,
};

/** The O of the wordmark, drawn as an SVG circle in the ring plane. */
export const ringO = {
  /** Offset from the centre of the screen, in px */
  x: 0,
  y: 0,
  /** 1 = the size of the ring */
  scale: 1,
  /** Stroke width on screen, in px */
  stroke: 1,
  /** 0..1, how far the O has tilted into the ring plane */
  tilt: 0,
  opacity: 0,
};

/** The arc that the ring opens into (Section 2). */
export const arc = {
  /** 0 = ring, 1 = arc */
  t: 0,
  /** How far the cards have slid along the arc, in card slots */
  shift: 0,
  radius: 1200,
  /** Screen offset of the arc's highest point below the centre, in px */
  apexY: 100,
  /** Distance between card centres along the arc, in px */
  spacing: 150,
  depth: -60,
  /** Card scale on the arc */
  scale: 1.04,
};

/** The arc cards gathering into one idea (Section 3): 0 = on the arc, 1 = merged */
export const merge = { t: 0 };

export const IDEA_LAYERS = 5;

/** The YOUR IDEA card and the stack behind it (Section 3) */
export const idea = {
  /** Screen offset of the card's centre from the centre of the screen, in px */
  x: 0,
  y: 0,
  width: 260,
  /** Opacity of the front card */
  front: 0,
  /** 0..1: the card thickens into a stack */
  thick: 0,
  /** 0..1: the stack fans out in an isometric view */
  fan: 0,
  /** Extra turn while fanned, in degrees */
  drift: 0,
  /** 0..1: each layer takes on its own light */
  tint: 0,
  /** 0..1: the card turns edge-on */
  edge: 0,
  /** Opacity of the circle on the cards */
  circle: 1,
};

/**
 * The glass circle that leaves the card and becomes the portal. Section 3 owns its
 * position and opacity; Section 4 owns fade and scale. Keeping one owner per value means
 * two scrubbed timelines never fight over it after a fast scroll.
 */
export const portal = { x: 0, y: 0, scale: 1, opacity: 0, fade: 1, size: 44 };

/**
 * The takeover (Section 4): the LOCI gradient, revealed through a circle that starts as
 * the portal and grows until it covers the screen.
 */
export const takeover = { r: 0, opacity: 0 };

/** Radius that covers the whole screen from the portal's position */
export function coverRadius(): number {
  return Math.hypot(window.innerWidth / 2 + Math.abs(portal.x), window.innerHeight / 2 + Math.abs(portal.y)) + 2;
}

/** Where the circle sits on the idea card, relative to the card's centre, in px */
export function circleOnCard(): { x: number; y: number } {
  return { x: idea.width * 0.27, y: -idea.width * (4 / 3) * 0.31 };
}

type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number };
const pose = (): Pose => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 });

/** Blends pose a into pose b by t, writing into out */
function mix(out: Pose, a: Pose, b: Pose, t: number): void {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.z = a.z + (b.z - a.z) * t;
  out.rx = a.rx + (b.rx - a.rx) * t;
  out.ry = a.ry + (b.ry - a.ry) * t;
  out.rz = a.rz + (b.rz - a.rz) * t;
  out.s = a.s + (b.s - a.s) * t;
}

/** Wraps v into [-n/2, n/2) */
const wrap = (v: number, n: number): number => ((((v + n / 2) % n) + n) % n) - n / 2;

const smoothstep = (a: number, b: number, v: number): number => {
  const x = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export type Stage = {
  el: HTMLElement;
  cards: Card[];
  wordmark: HTMLElement;
  letters: { l: HTMLElement; o: HTMLElement; c: HTMLElement; i: HTMLElement };
  /** Fits the ring and cards to the viewport; called on resize */
  layout: () => void;
  /** Draws one frame; used when nothing moves (reduced motion) */
  renderOnce: () => void;
};

type Options = { isMobile: boolean; finePointer: boolean; reducedMotion: boolean };

export function createStage({ isMobile, finePointer, reducedMotion }: Options): Stage {
  const el = document.createElement('div');
  el.className = 'stage';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="lights">
      <div class="lights__blob lights__blob--a"></div>
      <div class="lights__blob lights__blob--b"></div>
      <div class="lights__blob lights__blob--c"></div>
      <div class="lights__glow"></div>
    </div>
    <div class="stage__cards"></div>
    <div class="idea"></div>
    <div class="takeover"></div>
    <div class="portal glass"></div>
    <svg class="stage__o" viewBox="-100 -100 200 200"><circle r="100" /></svg>
    <div class="wordmark">
      <span class="wordmark__l">L</span><span class="wordmark__o"></span><span class="wordmark__c">C</span><span class="wordmark__i">I</span>
    </div>`;
  document.body.prepend(el);

  const count = isMobile ? CARD_COUNT.mobile : CARD_COUNT.desktop;
  // Each label once, spread evenly around the ring between blank cards
  const labels = isMobile ? content.intro.cardLabels.mobile : content.intro.cardLabels.desktop;
  const labelAt = new Map(labels.map((label, j) => [Math.round((j * count) / labels.length), label]));
  const holder = el.querySelector<HTMLElement>('.stage__cards')!;
  const cards: Card[] = Array.from({ length: count }, (_, i) => {
    const card = document.createElement('div');
    const blurEvery = isMobile ? BLUR_EVERY.mobile : BLUR_EVERY.desktop;
    card.className = i % blurEvery === 0 ? 'card glass' : 'card glass glass--lite';
    const label = labelAt.get(i);
    if (label) card.innerHTML = `<span class="card__label">${label}</span>`;
    // Each card catches the light a little differently
    card.style.setProperty('--sheen-x', `${(i * 37) % 100}%`);
    card.style.setProperty('--sheen-y', `${(i * 61) % 100}%`);
    holder.appendChild(card);
    return { el: card, appear: 0, lift: 0, leanX: 0, leanY: 0, zIndex: 0, labelled: Boolean(label) };
  });

  // The idea stack: the same label and circle on every layer; only the light differs.
  // Back to front: dimmer, cooler, warmer, a hint of indigo, brighter.
  const tints = [
    'linear-gradient(160deg, rgba(30, 39, 45, 0.06), rgba(30, 39, 45, 0.2))',
    'linear-gradient(160deg, rgba(111, 132, 168, 0.18), rgba(111, 132, 168, 0.42))',
    'linear-gradient(160deg, rgba(222, 206, 186, 0.3), rgba(196, 176, 152, 0.42))',
    'linear-gradient(160deg, rgba(31, 42, 79, 0.08), rgba(31, 42, 79, 0.26))',
    'linear-gradient(160deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.14))',
  ];
  const ideaHolder = el.querySelector<HTMLElement>('.idea')!;
  const layers = Array.from({ length: IDEA_LAYERS }, (_, i) => {
    const layer = document.createElement('div');
    layer.className = 'idea__card glass';
    layer.style.zIndex = String(i + 1);
    layer.innerHTML = `
      <span class="idea__tint" style="background:${tints[i % tints.length]}"></span>
      <span class="idea__label">${content.worlds.cardLabel}</span>
      <span class="idea__o glass"></span>`;
    ideaHolder.appendChild(layer);
    return {
      el: layer,
      tint: layer.querySelector<HTMLElement>('.idea__tint')!,
      o: layer.querySelector<HTMLElement>('.idea__o')!,
    };
  });
  const portalEl = el.querySelector<HTMLElement>('.portal')!;
  const takeoverEl = el.querySelector<HTMLElement>('.takeover')!;

  const svg = el.querySelector<SVGSVGElement>('.stage__o')!;
  const circle = svg.querySelector('circle')!;
  const wordmark = el.querySelector<HTMLElement>('.wordmark')!;
  const letters = {
    l: wordmark.querySelector<HTMLElement>('.wordmark__l')!,
    o: wordmark.querySelector<HTMLElement>('.wordmark__o')!,
    c: wordmark.querySelector<HTMLElement>('.wordmark__c')!,
    i: wordmark.querySelector<HTMLElement>('.wordmark__i')!,
  };

  let cx = 0;
  let cy = 0;
  let cardW = 120;
  const layout = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    cx = vw / 2;
    cy = vh / 2;
    cardW = isMobile ? Math.round(Math.min(64, vw * 0.155)) : Math.round(Math.min(124, Math.max(92, vw * 0.083)));
    ring.radius = isMobile ? Math.min(vw * 0.45, vh * 0.32) : Math.min(vw * 0.4, vh * 0.4);
    ring.offsetY = -vh * 0.035;
    arc.radius = isMobile ? vw * 1.5 : vw * 0.9;
    arc.apexY = isMobile ? vh * 0.08 : vh * 0.12;
    arc.scale = isMobile ? 1.25 : 1.04;
    arc.spacing = cardW * arc.scale * (isMobile ? 1.18 : 1.23);
    idea.width = isMobile ? Math.round(Math.min(200, vw * 0.5)) : Math.round(Math.min(300, Math.max(220, vw * 0.18)));
    // Portrait tablets set the copy under the stack, like phones (see sections.css)
    const narrow = !isMobile && vw <= 900;
    idea.x = isMobile || narrow ? 0 : Math.max(0, (1280 - vw) * 0.12);
    idea.y = isMobile ? -vh * 0.1 : narrow ? -vh * 0.12 : 0;
    portal.size = Math.round(idea.width * 0.16);
    const root = document.documentElement.style;
    root.setProperty('--idea-w', `${idea.width}px`);
    root.setProperty('--portal-d', `${portal.size}px`);
    root.setProperty('--card-w', `${cardW}px`);
    root.setProperty('--ring-r', `${ring.radius}px`);
    root.setProperty('--arc-apex', `${arc.apexY}px`);
    root.setProperty('--arc-scale', String(arc.scale));
  };
  layout();

  // Cursor, smoothed. Only on devices with a fine pointer.
  const ptr = { tx: cx, ty: cy, x: cx, y: cy, active: false };
  const tilt = { x: 0, y: 0 };
  if (finePointer && !reducedMotion) {
    window.addEventListener('pointermove', (e) => {
      ptr.tx = e.clientX;
      ptr.ty = e.clientY;
      if (!ptr.active) {
        ptr.x = e.clientX;
        ptr.y = e.clientY;
        ptr.active = true;
      }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => (ptr.active = false));
  }

  const glow = el.querySelector<HTMLElement>('.lights__glow')!;
  let glowOpacity = -1;
  const ringPose = pose();
  const arcPose = pose();
  const mergePose = pose();
  const out = pose();

  const render = (deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000;
    const t = arc.t;
    // The ring turns on its own, slowing to a stop as it opens into the arc
    ring.spin = (ring.spin + ring.spinSpeed * dt * (1 - t)) % 360;

    ptr.x += (ptr.tx - ptr.x) * 0.12;
    ptr.y += (ptr.ty - ptr.y) * 0.12;
    const weight = ptr.active ? ring.pointer * (1 - t) : 0;
    // The ring leans a few degrees towards the cursor, like following a gaze.
    tilt.x += (((cy - ptr.y) / cy) * 4 * weight - tilt.x) * 0.04;
    tilt.y += (((ptr.x - cx) / cx) * 5 * weight - tilt.y) * 0.04;

    const rx = (ring.tilt + tilt.x) * DEG;
    const ry = tilt.y * DEG;
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const R = ring.radius;
    const n = cards.length;
    const sigma = isMobile ? 70 : 120;
    const spinSlots = (ring.spin * n) / 360;

    for (let i = 0; i < n; i++) {
      const card = cards[i];
      // The card's slot around the ring: 0 is the top, ±n/2 the bottom
      const slot = wrap(i + spinSlots, n);

      // Ring pose: a point on the ring, then the ring's tilt (rotateX, then rotateY)
      const a = (slot * 360 / n - 90) * DEG;
      let x = R * Math.cos(a);
      let y = R * Math.sin(a);
      let z = y * sinX;
      y = y * cosX;
      ringPose.x = x * cosY + z * sinY;
      ringPose.z = -x * sinY + z * cosY + ring.depth;
      ringPose.y = y + ring.offsetY;
      ringPose.rx = (ring.tilt + tilt.x) * 0.55;
      ringPose.ry = tilt.y * 0.55;
      ringPose.rz = 0;
      ringPose.s = 1;

      // Arc pose: the top of a very large circle, a wide horizon across the lower half
      let o = card.appear;
      if (t > 0) {
        const u = wrap(slot - arc.shift, n);
        const th = (u * arc.spacing) / arc.radius;
        arcPose.x = arc.radius * Math.sin(th);
        arcPose.y = arc.apexY + arc.radius * (1 - Math.cos(th));
        arcPose.z = arc.depth - Math.abs(arcPose.x) * 0.12;
        arcPose.rx = 0;
        arcPose.ry = (arcPose.x / cx) * 12;
        arcPose.rz = (th / DEG) * 0.6;
        arcPose.s = arc.scale;
        mix(out, ringPose, arcPose, t);
        // The ring opens at the bottom: cards there fade while it opens, and are
        // off-screen at the ends of the arc by the time it has fully formed
        o *= 1 - smoothstep(n / 2 - 1.6, n / 2 - 0.4, Math.abs(slot)) * Math.min(1, t * 3, (1 - t) * 3);
      } else {
        Object.assign(out, ringPose);
      }

      // Merge pose: every card gathers at the centre, at the size of the idea card
      if (merge.t > 0) {
        if (merge.t >= 1) {
          card.el.style.opacity = '0';
          continue;
        }
        mergePose.x = idea.x + slot * 1.5;
        mergePose.y = idea.y;
        mergePose.z = 0;
        mergePose.rx = 0;
        mergePose.ry = 0;
        mergePose.rz = slot * 0.4;
        mergePose.s = idea.width / cardW;
        mix(out, out, mergePose, merge.t);
        o *= 1 - smoothstep(0.65, 1, merge.t);
      }

      // Cursor proximity, measured on screen
      const k = PERSPECTIVE / (PERSPECTIVE - out.z);
      const dx = cx + out.x * k - ptr.x;
      const dy = cy + out.y * k - ptr.y;
      const dist = Math.hypot(dx, dy) || 1;
      const target = weight * Math.exp(-(dist * dist) / (2 * sigma * sigma));
      card.lift += (target - card.lift) * 0.07;
      card.leanX += ((dy / dist) * target - card.leanX) * 0.07;
      card.leanY += ((dx / dist) * target - card.leanY) * 0.07;

      const lean = 13;
      z = out.z + card.lift * 70 - (1 - card.appear) * 60;
      const tx = out.rx - card.leanX * lean;
      const ty = out.ry + card.leanY * lean;
      const sc = out.s * (0.94 + 0.06 * card.appear);
      card.el.style.transform =
        `perspective(${PERSPECTIVE}px) translate3d(${out.x.toFixed(2)}px,${out.y.toFixed(2)}px,${z.toFixed(2)}px) ` +
        `rotateX(${tx.toFixed(2)}deg) rotateY(${ty.toFixed(2)}deg) rotateZ(${out.rz.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      card.el.style.opacity = o.toFixed(3);
      const zi = Math.round(z + 500) + (card.labelled ? 1000 : 0);
      if (zi !== card.zIndex) {
        card.zIndex = zi;
        card.el.style.zIndex = String(zi);
      }
    }

    renderIdea();
    renderTakeover();

    // The faint gradient glow belongs to the ring only
    const g = Math.round((1 - t) * 1000) / 1000;
    if (g !== glowOpacity) {
      glowOpacity = g;
      glow.style.opacity = String(0.09 * g);
    }

    // The O, in the same plane as the ring once it has tilted into it
    if (ringO.opacity > 0.001) {
      const oTiltX = (ring.tilt + tilt.x) * ringO.tilt;
      const oTiltY = tilt.y * ringO.tilt;
      svg.style.transform =
        `perspective(${PERSPECTIVE}px) translate3d(${ringO.x.toFixed(2)}px,${(ringO.y + ring.offsetY * ringO.tilt).toFixed(2)}px,${(ring.depth * ringO.tilt).toFixed(2)}px) ` +
        `rotateX(${oTiltX.toFixed(2)}deg) rotateY(${oTiltY.toFixed(2)}deg) scale(${ringO.scale.toFixed(5)})`;
      // Stroke in viewBox units so it lands at ringO.stroke px on screen
      const unitPx = ((R * 2) / 200) * ringO.scale;
      circle.setAttribute('stroke-width', (ringO.stroke / unitPx).toFixed(3));
    }
    svg.style.opacity = ringO.opacity.toFixed(3);
  };

  // The idea stack. No preserve-3d (it breaks backdrop-filter): each layer carries the
  // same rotations and is pushed along the stack's normal with its own translateZ.
  let ideaVisible = true;
  const renderIdea = () => {
    const portalOpacity = portal.opacity * portal.fade;
    const visible = idea.front > 0.001 || portalOpacity > 0.001;
    if (visible !== ideaVisible) {
      ideaVisible = visible;
      ideaHolder.style.visibility = visible ? 'visible' : 'hidden';
      portalEl.style.visibility = visible ? 'visible' : 'hidden';
    }
    if (!visible) return;

    const n = layers.length;
    const gap = (7 + (isMobile ? 70 : 96) * idea.fan) * idea.thick;
    const centre = ((n - 1) / 2) * gap * idea.fan;
    const rx = 52 * idea.fan;
    const rz = -36 * idea.fan + idea.drift;
    const ry = 90 * idea.edge;
    const fade = 1 - smoothstep(0.6, 1, idea.edge);
    for (let i = 0; i < n; i++) {
      const layer = layers[i];
      const front = i === n - 1;
      const presence = front ? idea.front : Math.min(1, Math.max(0, idea.thick * n - (n - 1 - i)));
      const z = (i - (n - 1)) * gap + centre;
      // Each layer turns a little further, so the stack fans like a hand of cards
      const spread = (i - (n - 1)) * 5 * idea.fan;
      layer.el.style.opacity = (presence * fade).toFixed(3);
      layer.el.style.transform =
        `perspective(${PERSPECTIVE}px) translate3d(${idea.x.toFixed(2)}px,${idea.y.toFixed(2)}px,0) ` +
        `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${(rz + spread).toFixed(2)}deg) translateZ(${z.toFixed(2)}px)`;
      layer.tint.style.opacity = idea.tint.toFixed(3);
      layer.o.style.opacity = idea.circle.toFixed(3);
    }

    portalEl.style.opacity = portalOpacity.toFixed(3);
    portalEl.style.transform =
      `translate3d(${portal.x.toFixed(2)}px,${portal.y.toFixed(2)}px,0) scale(${portal.scale.toFixed(4)})`;
  };

  let takeoverShown = false;
  const renderTakeover = () => {
    const shown = takeover.opacity > 0.001;
    if (shown !== takeoverShown) {
      takeoverShown = shown;
      takeoverEl.style.visibility = shown ? 'visible' : 'hidden';
    }
    if (!shown) return;
    takeoverEl.style.opacity = takeover.opacity.toFixed(3);
    takeoverEl.style.clipPath =
      `circle(${takeover.r.toFixed(2)}px at calc(50% + ${portal.x.toFixed(2)}px) calc(50% + ${portal.y.toFixed(2)}px))`;
  };

  // With reduced motion nothing moves, so the ring is drawn once (and again on resize)
  const renderOnce = () => render(0);
  if (reducedMotion) {
    window.addEventListener('resize', () => {
      layout();
      renderOnce();
    });
  } else {
    gsap.ticker.add((_t, delta) => render(delta));
    window.addEventListener('resize', layout);
  }

  return { el, cards, wordmark, letters, layout, renderOnce };
}
