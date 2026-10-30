/**
 * All copy on the page lives here.
 * Edit the text between the quotes, save, and rebuild. Nothing else needs to change.
 * Text inside {{double braces}} in index.html is filled in from this file at build time.
 */
export const content = {
  meta: {
    title: 'LOCI — Creative AI, trained on your brand.',
    description: 'On-brand campaign visuals from your brief, for every market you speak to.',
  },

  nav: {
    chapters: [
      { id: 'intro', label: 'Intro' },
      { id: 'idea', label: 'Idea' },
      { id: 'worlds', label: 'Worlds' },
      { id: 'loci', label: 'Loci' },
      { id: 'demo', label: 'Demo' },
    ],
    cta: 'Book a demo',
  },

  intro: {
    // The headline is set on two lines; the second line is in gradient text.
    headline: {
      line1: 'Creative AI,',
      line2: 'trained on your brand.',
    },
    subline: 'On-brand campaign visuals from your brief, for every market you speak to.',
    cue: 'Scroll to explore',
    // Labels for the glass cards in the ring, each used once and spread evenly around it.
    // The remaining cards are blank glass. Desktop has 24 cards, phones have 14.
    cardLabels: {
      desktop: [
        'Brand DNA', 'Brief', 'Moodboard', 'Reference 03', 'Tone · Warm',
        'Palette', 'Type', 'Audience', 'Culture', 'Intent',
      ],
      mobile: ['Brand DNA', 'Brief', 'Moodboard', 'Tone · Warm', 'Culture', 'Intent'],
    },
  },

  arc: {
    beats: [
      'Explore every direction your idea could take.',
      "Even the ones you haven't imagined yet.",
      'LOCI turns your brief, references and inspiration into campaign visuals that are right for your brand.',
    ],
    captionLead: 'Made to feel right in',
    captionWords: [
      'your brand.', 'Tokyo.', 'São Paulo.', 'Mexico City.', 'Lagos.',
      'every market you speak to.',
    ],
  },

  worlds: {
    cardLabel: 'Your idea',
    intro: "You know the difference between work that looks good and work that's right. So does LOCI.",
    steps: [
      { number: '01', title: 'Brand intelligence', text: "It starts from your brand's creative DNA.", pill: 'Brand' },
      { number: '02', title: 'Intent-led creation', text: "Brief it the way you'd brief your team.", pill: 'Intent' },
      { number: '03', title: 'Context-aware regionalisation', text: 'Take one idea into every market.', pill: 'Context' },
    ],
  },

  surprise: {
    statement: 'Your imagination, extended. Never replaced.',
    support: 'LOCI brings your brand, your intent and your market into every visual it creates.',
  },

  demo: {
    headline: 'See what LOCI makes with your brand.',
    subline: 'A personal walkthrough, built around your own brand.',
    // The brief sentence. Text parts and fields alternate, in reading order.
    brief: [
      { text: "Hi LOCI, I'm" },
      { field: 'name', label: 'Your name', placeholder: 'your name', type: 'text', autocomplete: 'name' },
      { text: ',' },
      { field: 'role', label: 'Your role', placeholder: 'role', type: 'text', autocomplete: 'organization-title' },
      { text: 'at' },
      { field: 'company', label: 'Company', placeholder: 'company', type: 'text', autocomplete: 'organization' },
      { text: ". I'd love to see what LOCI can do for" },
      { field: 'brand', label: 'Brand or market', placeholder: 'brand or market', type: 'text', autocomplete: 'off' },
      { text: '. You can reach me at' },
      { field: 'email', label: 'Work email', placeholder: 'work email', type: 'email', autocomplete: 'email' },
      { text: '.' },
    ],
    submit: 'Book a demo',
    sending: 'Sending…',
    errors: {
      required: 'Please fill this in.',
      email: 'Please use a valid email address.',
      failed: "Your brief didn't send. Please check your connection and try again.",
      retry: 'Try again',
    },
    // {name} is replaced with what the visitor typed.
    thanks: "Thank you, {name}. We'll be in touch soon.",
  },

  footer: {
    copyright: '© 2026 LOCI',
    privacy: 'Privacy',
    privacyHref: '#',
  },
} as const;

export type Content = typeof content;
