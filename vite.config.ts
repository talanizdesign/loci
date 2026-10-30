import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { content } from './src/content.ts';
import { FORMSPREE_ENDPOINT } from './src/config.ts';

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The demo request, written as one sentence with blanks. Each blank is a real labelled
 * input; the sentence also works as a plain HTML form if scripts fail to load.
 */
function renderBrief(): string {
  let html = '';
  content.demo.brief.forEach((part, i) => {
    const prev = content.demo.brief[i - 1];
    if ('text' in part) {
      // No space before punctuation that follows a blank
      const space = i > 0 && !/^[,.]/.test(part.text) ? ' ' : '';
      html += space + escape(part.text);
    } else {
      const space = prev ? ' ' : '';
      const id = `brief-${part.field}`;
      html +=
        `${space}<span class="blank" data-value="${escape(part.placeholder)}">` +
        `<label class="visually-hidden" for="${id}">${escape(part.label)}</label>` +
        `<input id="${id}" name="${part.field}" type="${part.type}" size="1" placeholder="${escape(part.placeholder)}" ` +
        `autocomplete="${part.autocomplete}" required aria-describedby="${id}-error" ` +
        `${part.type === 'email' ? 'inputmode="email" spellcheck="false" ' : ''}/>` +
        `<span class="blank__error" id="${id}-error"></span>` +
        `</span>`;
    }
  });
  return html;
}

// Fills {{path.to.copy}} in index.html from src/content.ts, so all copy lives in one file
// but still ships as real, crawlable HTML text. {{> brief}} and {{> formspree}} are
// rendered pieces rather than plain text.
function injectContent(): Plugin {
  const lookup = (path: string): string => {
    if (path === '> brief') return renderBrief();
    if (path === '> formspree') return escape(FORMSPREE_ENDPOINT);
    const value = path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], content);
    if (typeof value !== 'string') throw new Error(`content.ts has no text at "${path}"`);
    return escape(value);
  };
  return {
    name: 'loci-inject-content',
    transformIndexHtml: (html) => html.replace(/\{\{\s*(>\s*\w+|[\w.]+)\s*\}\}/g, (_, path: string) => lookup(path.replace(/>\s*/, '> '))),
  };
}

// One self-contained docs/index.html: all CSS, JavaScript and fonts are inlined, so it
// opens by double-clicking (file://) and works under any GitHub Pages repository name.
// Files in public/ (favicon, link-preview image, robots.txt) are copied next to it.
export default defineConfig({
  base: './',
  plugins: [injectContent(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
