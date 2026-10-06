const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../scripts/core.cjs');

const STORY = [
  'Export invoice to PDF',
  '',
  'Acceptance Criteria',
  '',
  '1. Given an issued invoice, when the user clicks "Download PDF", then the browser downloads a PDF file.',
  '2. The file is named invoice-<number>.pdf (e.g. invoice-FV-2026-09-014.pdf).',
  '',
].join('\n');

const ANNOTATED = [
  'Export invoice to PDF',
  '',
  'Acceptance Criteria',
  '',
  '1. Given an issued <mark id="q1">invoice</mark>, when the user clicks "Download PDF", then the browser downloads a PDF file.',
  '2. The file is named invoice-<number>.pdf (e.g. invoice-FV-2026-09-014.pdf).',
  '',
  '<!-- refinement:threads -->',
  '## Questions',
  '',
  '### q1 · open',
  '1. **KP** · 2026-10-06 09:15 — Does this include corrective invoices?',
  '2. **BA** · 2026-10-07 11:02 — No, only regular ones.',
  '',
].join('\n');

function select(doc, fragment) {
  const start = doc.text.indexOf(fragment);
  assert.notEqual(start, -1, `fragment not found: ${fragment}`);
  return { start, end: start + fragment.length };
}

function ask(doc, fragment, text = 'Why?') {
  return core.askQuestion(doc, { ...select(doc, fragment), author: 'KP', at: '2026-10-06 09:15', text });
}

test('story without questions is read as plain text with no threads', () => {
  const doc = core.readDocument(STORY);

  assert.equal(doc.text, STORY.trimEnd());
  assert.deepEqual(doc.anchors, []);
  assert.deepEqual(doc.threads, []);
});

test('story without questions is written back unchanged', () => {
  assert.equal(core.writeDocument(core.readDocument(STORY)), STORY);
});

test('annotated story yields the anchored fragment and its numbered thread', () => {
  const doc = core.readDocument(ANNOTATED);

  assert.equal(doc.text, STORY.trimEnd());
  assert.equal(doc.anchors.length, 1);
  assert.equal(doc.text.slice(doc.anchors[0].start, doc.anchors[0].end), 'invoice');
  assert.deepEqual(doc.threads, [
    {
      id: 'q1',
      status: 'open',
      messages: [
        { n: 1, author: 'KP', at: '2026-10-06 09:15', text: 'Does this include corrective invoices?' },
        { n: 2, author: 'BA', at: '2026-10-07 11:02', text: 'No, only regular ones.' },
      ],
    },
  ]);
});

test('annotated story survives a read/write round trip unchanged', () => {
  assert.equal(core.writeDocument(core.readDocument(ANNOTATED)), ANNOTATED);
});

test('asking a question wraps the selected fragment and starts a thread', () => {
  const doc = core.askQuestion(core.readDocument(STORY), {
    ...select(core.readDocument(STORY), 'invoice,'),
    author: 'KP',
    at: '2026-10-06 09:15',
    text: 'Does this include corrective invoices?',
  });

  const written = core.writeDocument(doc);

  assert.match(written, /Given an issued <mark id="q1">invoice,<\/mark> when/);
  assert.match(written, /### q1 · open\n1\. \*\*KP\*\* · 2026-10-06 09:15 — Does this include corrective invoices\?\n/);
});

test('surrounding whitespace is left out of the anchored fragment', () => {
  const doc = ask(core.readDocument(STORY), ' issued invoice, ');

  assert.match(core.writeDocument(doc), /an <mark id="q1">issued invoice,<\/mark> when/);
});

test('question ids continue after the highest existing one', () => {
  const doc = ask(core.readDocument(ANNOTATED), 'Download PDF');

  assert.deepEqual(doc.threads.map((t) => t.id), ['q1', 'q2']);
});

test('a multi-line message keeps its lines through a round trip', () => {
  const text = 'First line\n\n- a bullet\n### not a heading';
  const doc = ask(core.readDocument(STORY), 'Download PDF', text);

  const reread = core.readDocument(core.writeDocument(doc));

  assert.equal(reread.threads[0].messages[0].text, text);
  assert.equal(reread.threads.length, 1);
});

test('a reply is appended with the next number', () => {
  const doc = core.reply(core.readDocument(ANNOTATED), 'q1', {
    author: 'KP',
    at: '2026-10-08 08:00',
    text: 'And proforma invoices?',
  });

  assert.deepEqual(doc.threads[0].messages[2], {
    n: 3,
    author: 'KP',
    at: '2026-10-08 08:00',
    text: 'And proforma invoices?',
  });
});

test('author names cannot break the message format', () => {
  const doc = core.reply(core.readDocument(ANNOTATED), 'q1', {
    author: ' **Jan**\nKowalski ',
    at: '2026-10-08 08:00',
    text: 'ok',
  });

  const reread = core.readDocument(core.writeDocument(doc));

  assert.equal(reread.threads[0].messages[2].author, 'Jan Kowalski');
});

test('an empty message is rejected', () => {
  assert.throws(
    () => core.reply(core.readDocument(ANNOTATED), 'q1', { author: 'KP', at: '2026-10-08 08:00', text: '  \n ' }),
    /empty/i,
  );
});

test('a thread can be resolved and reopened', () => {
  const resolved = core.resolve(core.readDocument(ANNOTATED), 'q1');
  assert.match(core.writeDocument(resolved), /### q1 · resolved\n/);

  const reopened = core.reopen(resolved, 'q1');
  assert.match(core.writeDocument(reopened), /### q1 · open\n/);
});

test('removing the only question restores the original story', () => {
  const doc = core.removeQuestion(core.readDocument(ANNOTATED), 'q1');

  assert.equal(core.writeDocument(doc), STORY);
});

test('a question can be asked about a fragment inside an already questioned one', () => {
  const outer = ask(core.readDocument(STORY), 'an issued invoice');
  const both = ask(outer, 'issued');

  const written = core.writeDocument(both);

  assert.match(written, /Given <mark id="q1">an <mark id="q2">issued<\/mark> invoice<\/mark>, when/);
  assert.deepEqual(core.readDocument(written).anchors, both.anchors);
});

test('two questions about exactly the same fragment both survive a round trip', () => {
  const both = ask(ask(core.readDocument(STORY), 'issued'), 'issued');

  const reread = core.readDocument(core.writeDocument(both));

  assert.deepEqual(reread.anchors, both.anchors);
});

test('a selection that only partly overlaps a questioned fragment is rejected', () => {
  const doc = ask(core.readDocument(STORY), 'issued invoice');

  assert.throws(() => ask(doc, 'invoice, when'), /overlap/i);
});

test('an empty selection is rejected', () => {
  const doc = core.readDocument(STORY);

  assert.throws(
    () => core.askQuestion(doc, { start: 5, end: 5, author: 'KP', at: '2026-10-06 09:15', text: 'Why?' }),
    /select/i,
  );
});

test('a highlight that is not a question anchor stays part of the story', () => {
  const story = 'Use <mark>yellow</mark> and a stray </mark> and <mark id="q7">unclosed.\n';

  const doc = core.readDocument(story);

  assert.equal(doc.text, story.trimEnd());
  assert.deepEqual(doc.anchors, []);
  assert.equal(core.writeDocument(doc), story);
});

test('an anchor written by hand without a thread gets an empty open thread', () => {
  const doc = core.readDocument('An <mark id="q3">odd</mark> rule.\n');

  assert.deepEqual(doc.threads, [{ id: 'q3', status: 'open', messages: [] }]);
});

test('a thread whose anchor was deleted by hand is kept', () => {
  const orphaned = ANNOTATED.replace('<mark id="q1">invoice</mark>', 'invoice');

  const doc = core.readDocument(orphaned);

  assert.deepEqual(doc.anchors, []);
  assert.equal(doc.threads[0].messages.length, 2);
  assert.equal(core.writeDocument(doc), orphaned);
});

test('stripping questions gives back the original story', () => {
  assert.equal(core.withoutQuestions(ANNOTATED), STORY);
});

test('a story embedded in a page is recovered exactly', () => {
  const markdown = ANNOTATED + '\nTricky: </script><!-- <script>   & "quotes"\n';
  const page = `<html><head>${core.dataElement({ fileName: 'story.md', markdown })}</head></html>`;

  assert.deepEqual(core.readPage(page), { fileName: 'story.md', markdown });
});

test('the embedded story cannot close its own script element', () => {
  const element = core.dataElement({ fileName: 'story.md', markdown: 'a </script> b' });

  assert.equal(element.match(/<\/script>/g).length, 1);
});

test('a page without an embedded story is rejected', () => {
  assert.throws(() => core.readPage('<html></html>'), /refinement page/i);
});
