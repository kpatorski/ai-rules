const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../scripts/core.cjs');

function lines(...all) {
  return all.join('\n');
}

function blocks(markdown) {
  return core.layout(core.readDocument(markdown));
}

function slugs(markdown) {
  return headings(blocks(markdown)).map((heading) => heading.slug);
}

function headings(laid) {
  return laid.flatMap((block) => {
    if (block.type === 'heading') return [block];
    if (block.type === 'quote') return headings(block.blocks);
    if (block.type === 'list') return block.items.flatMap(headings);
    return [];
  });
}

// ---- heading ids ------------------------------------------------------------------------------

test('a heading gets a slug: lower case, spaces as hyphens', () => {
  assert.deepEqual(slugs('### BP-ADR-03'), ['bp-adr-03']);
  assert.deepEqual(slugs('## Acceptance Criteria'), ['acceptance-criteria']);
});

test('a question anchor does not change the slug', () => {
  const story = lines(
    '### <mark id="q1">BP-ADR-03</mark>',
    '',
    '<!-- refine:threads -->',
    '## Questions',
    '',
    '### q1 · open',
    '1. **KP** · 2026-10-06 09:15 — Which decision is this?',
    '',
  );

  assert.deepEqual(slugs(story), ['bp-adr-03']);
});

test('inline markup contributes only its visible text to the slug', () => {
  assert.deepEqual(slugs('## **Save** & `resume`'), ['save--resume']);
  assert.deepEqual(slugs('## See [the *rules*](bp-rules.md#x) ~~now~~'), ['see-the-rules-now']);
});

test('punctuation is dropped from the slug and every space becomes its own hyphen', () => {
  assert.deepEqual(slugs('### BP-ADR-03 — Postal code'), ['bp-adr-03--postal-code']);
  assert.deepEqual(slugs('## snake_case, kept!'), ['snake_case-kept']);
});

test('letters of any alphabet stay in the slug', () => {
  assert.deepEqual(slugs('## Zażółć gęślą'), ['zażółć-gęślą']);
});

test('a repeated heading gets a numbered slug, the first one keeps the bare slug', () => {
  assert.deepEqual(slugs(lines('## Notes', '', 'a', '', '## Notes', '', 'b', '', '## Notes')), [
    'notes',
    'notes-1',
    'notes-2',
  ]);
});

test('a numbered slug never lands on a slug another heading already has', () => {
  assert.deepEqual(slugs(lines('## Notes', '', '## Notes 1', '', '## Notes')), ['notes', 'notes-1', 'notes-2']);
});

test('the ids the page shell uses itself count as taken', () => {
  assert.deepEqual(slugs('# App'), ['app-1']);
  assert.deepEqual(slugs('# Refine data'), ['refine-data-1']);
});

test('headings inside a quote or a list item are numbered in order of appearance', () => {
  assert.deepEqual(slugs(lines('## Notes', '', '> ## Notes', '', '- ## Notes')), ['notes', 'notes-1', 'notes-2']);
});

test('a bold-only paragraph is not a heading and has no slug', () => {
  const [paragraph] = blocks('**Save**');

  assert.equal(paragraph.type, 'paragraph');
  assert.equal('slug' in paragraph, false);
});

test('the headings of the threads section get no slug', () => {
  const story = lines(
    '## Story',
    '',
    'An issued <mark id="q1">invoice</mark>.',
    '',
    '<!-- refine:threads -->',
    '## Questions',
    '',
    '### q1 · open',
    '1. **KP** · 2026-10-06 09:15 — Which one?',
    '',
  );

  assert.deepEqual(slugs(story), ['story']);
});

test('the slug of a plain text is available on its own', () => {
  assert.equal(core.slug('BP-ADR-03 — Postal code'), 'bp-adr-03--postal-code');
  assert.equal(core.slug('Zażółć gęślą'), 'zażółć-gęślą');
});

// ---- links between pages ----------------------------------------------------------------------

test('a relative link to a markdown story points at its rendered page', () => {
  assert.equal(core.pageHref('bp-rules.md#bp-adr-03'), 'bp-rules.html#bp-adr-03');
  assert.equal(core.pageHref('./bp-rules.MD'), './bp-rules.html');
  assert.equal(core.pageHref('../x/story.md?a=1#b'), '../x/story.html?a=1#b');
});

test('every other link is shown as written', () => {
  assert.equal(core.pageHref('https://example.com/a.md'), 'https://example.com/a.md');
  assert.equal(core.pageHref('#x'), '#x');
  assert.equal(core.pageHref('notes.txt'), 'notes.txt');
  assert.equal(core.pageHref('mailto:a@b.c'), 'mailto:a@b.c');
  assert.equal(core.pageHref('notes.txt#intro.md'), 'notes.txt#intro.md');
  assert.equal(core.pageHref('//example.com/a.md'), '//example.com/a.md');
});

test('the story keeps the link it was written with', () => {
  const [paragraph] = blocks('See [BP-ADR-03](bp-rules.md#bp-adr-03).');
  const link = paragraph.inline.find((node) => node.type === 'link');

  assert.equal(link.href, 'bp-rules.md#bp-adr-03');
});
