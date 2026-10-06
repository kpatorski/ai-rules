const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CLI = path.join(__dirname, '..', 'scripts', 'refine.mjs');
const core = require('../scripts/core.cjs');

const STORY = 'Export invoice to PDF\n\n1. Given an issued invoice, the browser downloads invoice-<number>.pdf.\n';

const ANNOTATED = [
  'Export invoice to PDF',
  '',
  '1. Given an issued <mark id="q1">invoice</mark>, the browser downloads <mark id="q2">invoice-<number>.pdf</mark>.',
  '',
  '<!-- refine:threads -->',
  '## Questions',
  '',
  '### q1 · resolved',
  '1. **KP** · 2026-10-06 09:15 — Does this include corrective invoices?',
  '2. **BA** · 2026-10-07 11:02 — No, only regular ones.',
  '',
  '### q2 · open',
  '1. **KP** · 2026-10-06 09:20 — Which number format?',
  '',
].join('\n');

function workspace(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'refine-'));
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
  return {
    run: (...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8' }),
    read: (name) => fs.readFileSync(path.join(dir, name), 'utf8'),
    has: (name) => fs.existsSync(path.join(dir, name)),
  };
}

test('a rendered page gives back exactly the story it was made from', () => {
  const ws = workspace({ 'story.md': ANNOTATED });

  assert.equal(ws.run('render', 'story.md').status, 0);
  assert.equal(ws.run('extract', 'story.html', '-o', 'back.md').status, 0);

  assert.equal(ws.read('back.md'), ANNOTATED);
});

test('a rendered page is a single self-contained file', () => {
  const ws = workspace({ 'story.md': STORY });

  ws.run('render', 'story.md');

  const page = ws.read('story.html');
  assert.match(page, /^<!DOCTYPE html>/);
  assert.doesNotMatch(page, /<script[^>]+src=|<link[^>]+href=|REFINE_/);
});

test('nothing inlined into a rendered page can break out of its script element', () => {
  const ws = workspace({ 'story.md': ANNOTATED + '\n</script><!-- <script>\n' });

  ws.run('render', 'story.md');

  const page = ws.read('story.html');
  assert.equal(page.match(/<script/g).length, 3);
  assert.equal(page.match(/<\/script>/g).length, 3);
  assert.equal(page.match(/<!--/g), null);
});

test('rendering does not overwrite an existing page unless forced', () => {
  const ws = workspace({ 'story.md': STORY, 'story.html': 'answers from the BA' });

  const refused = ws.run('render', 'story.md');

  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /already exists/);
  assert.equal(ws.read('story.html'), 'answers from the BA');

  assert.equal(ws.run('render', 'story.md', '--force').status, 0);
  assert.match(ws.read('story.html'), /^<!DOCTYPE html>/);
});

test('extracting does not overwrite an existing story unless forced', () => {
  const ws = workspace({ 'story.md': ANNOTATED });
  ws.run('render', 'story.md');

  const refused = ws.run('extract', 'story.html');

  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /already exists/);
});

test('stripping prints the story without anchors and threads', () => {
  const ws = workspace({ 'story.md': ANNOTATED });
  ws.run('render', 'story.md');

  assert.equal(ws.run('strip', 'story.md').stdout, STORY);
  assert.equal(ws.run('strip', 'story.html').stdout, STORY);
});

test('status lists every question with its place, fragment and messages', () => {
  const ws = workspace({ 'story.md': ANNOTATED });

  const { stdout } = ws.run('status', 'story.md');

  assert.equal(
    stdout,
    [
      '2 questions: 1 open, 1 resolved',
      '',
      'q1 · resolved · line 3 · "invoice"',
      '  1. KP · 2026-10-06 09:15 — Does this include corrective invoices?',
      '  2. BA · 2026-10-07 11:02 — No, only regular ones.',
      '',
      'q2 · open · line 3 · "invoice-<number>.pdf"',
      '  1. KP · 2026-10-06 09:20 — Which number format?',
      '',
    ].join('\n'),
  );
});

test('dropping a question removes its anchor and thread and keeps the others', () => {
  const ws = workspace({ 'story.md': ANNOTATED });

  assert.equal(ws.run('drop', 'story.md', 'q1').status, 0);

  const left = ws.read('story.md');
  assert.doesNotMatch(left, /q1/);
  assert.match(left, /downloads <mark id="q2">invoice-<number>\.pdf<\/mark>\./);
  assert.match(left, /### q2 · open/);
});

test('dropping an unknown question changes nothing', () => {
  const ws = workspace({ 'story.md': ANNOTATED });

  const result = ws.run('drop', 'story.md', 'q1', 'q9');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /no question q9/);
  assert.equal(ws.read('story.md'), ANNOTATED);
});

test('a file that is not a refine page is reported, not guessed at', () => {
  const ws = workspace({ 'other.html': '<html><body>hello</body></html>' });

  const result = ws.run('extract', 'other.html');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not a refine page/i);
  assert.equal(ws.has('other.md'), false);
});

test('an unknown command explains the usage', () => {
  const result = workspace({}).run('publish');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage/i);
});

test('asking for help prints the usage and is not an error', () => {
  for (const flag of ['help', '--help', '-h']) {
    const result = workspace({}).run(flag);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:[\s\S]*render[\s\S]*extract[\s\S]*strip[\s\S]*status[\s\S]*drop/);
  }
});

const REWRITTEN = [
  'Export invoice to PDF',
  '',
  '1. Given an issued invoice, the browser downloads invoice-<number>.pdf in lowercase.',
  '2. A draft cannot be exported.',
  '',
].join('\n');

test('a rendered page remembers the story it started from', () => {
  const ws = workspace({ 'story.md': ANNOTATED });

  ws.run('render', 'story.md');

  const { history } = core.readPage(ws.read('story.html'));
  assert.equal(history.versions.length, 1);
  assert.equal(history.versions[0].text + '\n', STORY);
});

test('a story rewritten outside the page gets the questions of the older one and shows what changed', () => {
  const ws = workspace({ 'story.md': ANNOTATED, 'from-ba.md': REWRITTEN });

  const result = ws.run('rebase', 'story.md', 'from-ba.md', '--by', 'BA');

  assert.equal(result.status, 0, result.stderr);
  const page = core.readPage(ws.read('from-ba.html'));
  assert.match(page.markdown, /an issued <mark id="q1">invoice<\/mark>, the browser downloads <mark id="q2">invoice-<number>\.pdf<\/mark> in lowercase\./);
  assert.match(page.markdown, /\*\*BA\*\* · [\d-]+ [\d:]+ — ✎ edited the text around “invoice”/);
  assert.deepEqual(page.history.versions.map((v) => v.author), [null, 'BA']);
  assert.equal(page.history.versions[0].text + '\n', STORY);
});

test('a returned page keeps its history when a rewritten story is laid over it', () => {
  const ws = workspace({ 'story.md': ANNOTATED, 'from-ba.md': REWRITTEN });
  ws.run('render', 'story.md');

  ws.run('rebase', 'story.html', 'from-ba.md', '--by', 'BA', '-o', 'next.html');

  const { history } = core.readPage(ws.read('next.html'));
  assert.equal(history.versions.length, 2);
  assert.equal(history.versions[1].text + '\n', REWRITTEN);
});

test('a rewritten story that brings its own questions keeps them', () => {
  const own = REWRITTEN.replace('A draft', 'A <mark id="q5">draft</mark>') +
    '\n<!-- refine:threads -->\n## Questions\n\n### q5 · open\n1. **BA** · 2026-10-07 10:00 — Is that right?\n';
  const ws = workspace({ 'story.md': ANNOTATED, 'from-ba.md': own });

  ws.run('rebase', 'story.md', 'from-ba.md', '--by', 'BA');

  const page = core.readPage(ws.read('from-ba.html'));
  assert.equal(page.markdown, own);
  assert.equal(page.history.versions.length, 2);
});

test('laying a rewritten story over an older one does not overwrite an existing page', () => {
  const ws = workspace({ 'story.md': ANNOTATED, 'from-ba.md': REWRITTEN, 'from-ba.html': 'keep me' });

  const refused = ws.run('rebase', 'story.md', 'from-ba.md');

  assert.notEqual(refused.status, 0);
  assert.equal(ws.read('from-ba.html'), 'keep me');
});
