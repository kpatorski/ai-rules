const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../scripts/core.cjs');

const STORY = [
  '# Export invoice',
  '',
  'As an accountant, I want a PDF.',
  '',
  '1. Given an issued <mark id="q1">invoice</mark>, the user clicks Download.',
  '2. The file is named invoice-<number>.pdf.',
  '',
  'Notes for later.',
  '',
  '<!-- refine:threads -->',
  '## Questions',
  '',
  '### q1 · open',
  '1. **KP** · 2026-10-06 09:15 — Does this include corrective invoices?',
  '',
].join('\n');

const BA = { author: 'BA', at: '2026-10-07 11:00' };
const KP = { author: 'KP', at: '2026-10-08 08:00' };

function story() {
  return core.readDocument(STORY);
}

function unitTexts(doc) {
  return core.units(doc).map((u) => doc.text.slice(u.start, u.end));
}

function indexOfUnit(doc, startsWith) {
  const index = unitTexts(doc).findIndex((text) => text.startsWith(startsWith));
  assert.notEqual(index, -1, `no unit starts with ${startsWith}`);
  return index;
}

function edit(doc, startsWith, change, by = BA) {
  const index = indexOfUnit(doc, startsWith);
  return core.editUnit(doc, index, change(unitTexts(doc)[index]), by);
}

function lastMessage(doc, id) {
  const { messages } = doc.threads.find((t) => t.id === id);
  return messages[messages.length - 1];
}

// ---- comparing two texts ----------------------------------------------------------------------

test('the parts of a comparison rebuild both texts', () => {
  const before = 'Given an issued invoice,\nthe user clicks Download.\n\nNotes.';
  const after = 'Given a paid sales invoice,\nthe user clicks Download.\nNew line.\n\nNotes!';

  const parts = core.diff(before, after);

  assert.equal(parts.map((p) => before.slice(p.a[0], p.a[1])).join(''), before);
  assert.equal(parts.map((p) => after.slice(p.b[0], p.b[1])).join(''), after);
  for (const part of parts.filter((p) => p.same)) {
    assert.equal(before.slice(part.a[0], part.a[1]), after.slice(part.b[0], part.b[1]));
  }
  assert.ok(parts.some((p) => p.same) && parts.some((p) => !p.same));
});

test('a comparison never splits a word that only grew', () => {
  const parts = core.diff('one invoice here', 'one invoices here');

  const changed = parts.filter((p) => !p.same);

  assert.deepEqual(changed.map((p) => 'one invoice here'.slice(p.a[0], p.a[1])), ['invoice']);
});

test('identical texts have nothing changed', () => {
  assert.ok(core.diff('same\ntext', 'same\ntext').every((p) => p.same));
});

// ---- blocks that can be edited ----------------------------------------------------------------

test('every top-level block is one editable unit, and every list item its own', () => {
  assert.deepEqual(unitTexts(story()), [
    '# Export invoice',
    'As an accountant, I want a PDF.',
    '1. Given an issued invoice, the user clicks Download.',
    '2. The file is named invoice-<number>.pdf.',
    'Notes for later.',
  ]);
});

test('a list item suggests the marker of the item that would follow it', () => {
  const doc = core.readDocument('1. one\n2. two\n\n- bullet\n\nplain');

  assert.deepEqual(core.units(doc).map((u) => u.next), ['2. ', '3. ', '- ', '']);
});

test('editing words next to a question leaves the question in place and notes the edit in its thread', () => {
  const edited = edit(story(), '1. Given', (text) => text.replace('clicks', 'presses'));

  const written = core.writeDocument(edited);

  assert.match(written, /1\. Given an issued <mark id="q1">invoice<\/mark>, the user presses Download\./);
  assert.equal(lastMessage(edited, 'q1').text, '✎ edited the text around “invoice”');
});

test('editing another block says nothing in the thread of an untouched question', () => {
  const edited = edit(story(), 'Notes', () => 'Notes for now.');

  assert.match(core.writeDocument(edited), /an issued <mark id="q1">invoice<\/mark>, the user/);
  assert.equal(edited.threads[0].messages.length, 1);
});

test('rewording the questioned words keeps the question on them and notes the change in its thread', () => {
  const edited = edit(story(), '1. Given', (text) => text.replace('invoice', 'receipt'));

  assert.match(core.writeDocument(edited), /an issued <mark id="q1">receipt<\/mark>, the user/);
  assert.deepEqual(lastMessage(edited, 'q1'), {
    n: 2,
    author: 'BA',
    at: '2026-10-07 11:00',
    text: '✎ changed the text: “invoice” → “receipt”',
  });
});

test('deleting the questioned words keeps the thread and notes what was removed', () => {
  const edited = edit(story(), '1. Given', () => '1. The user clicks Download.');

  assert.deepEqual(edited.anchors, []);
  assert.equal(lastMessage(edited, 'q1').text, '✎ removed the text: “invoice”');
  assert.equal(core.readDocument(core.writeDocument(edited)).threads[0].messages.length, 2);
});

test('an edit that changes nothing is not a change', () => {
  const doc = story();

  assert.equal(edit(doc, '1. Given', (text) => `  ${text}\n`), doc);
});

test('a block can be removed without leaving a gap or gluing its neighbours together', () => {
  const doc = story();

  const withoutParagraph = core.removeUnit(doc, indexOfUnit(doc, 'As an'), BA);
  const withoutLastItem = core.removeUnit(doc, indexOfUnit(doc, '2. The'), BA);
  const withoutFirstItem = core.removeUnit(doc, indexOfUnit(doc, '1. Given'), BA);

  assert.match(withoutParagraph.text, /^# Export invoice\n\n1\. Given/);
  assert.match(withoutLastItem.text, /Download\.\n\nNotes for later\.$/);
  assert.match(withoutFirstItem.text, /a PDF\.\n\n2\. The file/);
  assert.equal(lastMessage(withoutFirstItem, 'q1').text, '✎ removed the text: “invoice”');
});

test('emptying a block removes it', () => {
  const doc = story();

  const emptied = core.editUnit(doc, indexOfUnit(doc, 'Notes'), '   ', BA);

  assert.equal(unitTexts(emptied).length, 4);
  assert.match(emptied.text, /pdf\.$/);
});

test('a new list item can be added after an existing one', () => {
  const doc = story();

  const added = core.addUnitAfter(doc, indexOfUnit(doc, '2. The'), '3. The PDF has a footer.', BA);

  assert.deepEqual(unitTexts(added).slice(2), [
    '1. Given an issued invoice, the user clicks Download.',
    '2. The file is named invoice-<number>.pdf.',
    '3. The PDF has a footer.',
    'Notes for later.',
  ]);
});

test('a new paragraph can be added after a paragraph or after a list item', () => {
  const doc = story();

  const afterParagraph = core.addUnitAfter(doc, indexOfUnit(doc, 'As an'), 'Out of scope: e-mail.', BA);
  const afterItem = core.addUnitAfter(doc, indexOfUnit(doc, '1. Given'), 'A remark.', BA);

  assert.deepEqual(unitTexts(afterParagraph).slice(1, 3), ['As an accountant, I want a PDF.', 'Out of scope: e-mail.']);
  assert.deepEqual(unitTexts(afterItem).slice(2, 5), [
    '1. Given an issued invoice, the user clicks Download.',
    'A remark.',
    '2. The file is named invoice-<number>.pdf.',
  ]);
});

test('editing needs a name, because the change is signed', () => {
  assert.throws(() => edit(story(), '1. Given', () => '1. Other.', { author: ' ', at: BA.at }), /name/i);
});

test('a whole new version of the story carries the questions over', () => {
  const rewritten = [
    '# Export invoice to PDF',
    '',
    '1. Given an issued invoice, the accountant clicks Download.',
    '2. The file is named invoice-<number>.pdf.',
    '3. A draft cannot be exported.',
  ].join('\n');

  const carried = core.changeText(story(), rewritten, BA);

  assert.equal(carried.text, rewritten);
  assert.match(core.writeDocument(carried), /an issued <mark id="q1">invoice<\/mark>, the accountant/);
  assert.equal(lastMessage(carried, 'q1').text, '✎ edited the text around “invoice”');
});

// ---- who changed what, and what is new for whom -----------------------------------------------

function sent() {
  const doc = story();
  const history = core.recordSave(core.newHistory(doc.text, '2026-10-06 09:00'), doc.text, 'KP', '2026-10-06 09:20');
  return { doc, history };
}

function marksFor(reader, doc, history) {
  const marks = core.changeMarks(doc, history, core.referenceText(history, reader));
  const texts = unitTexts(doc);
  return {
    units: marks.units.flatMap((mark, i) => (mark ? [{ text: texts[i], ...mark }] : [])),
    removed: marks.removed,
  };
}

test('a story that nobody edited has no change marks', () => {
  const { doc, history } = sent();

  assert.deepEqual(marksFor('KP', doc, history), { units: [], removed: [] });
  assert.deepEqual(marksFor('BA', doc, history), { units: [], removed: [] });
});

test('a block the BA changed is new for the developer, with its previous text and who changed it', () => {
  const { doc, history } = sent();
  const edited = edit(doc, '2. The', (text) => text.replace('.pdf', '.pdf, lowercase'));
  const returned = core.recordSave(history, edited.text, 'BA', BA.at);

  assert.deepEqual(marksFor('KP', edited, returned), {
    units: [
      {
        text: '2. The file is named invoice-<number>.pdf, lowercase.',
        kind: 'changed',
        fresh: true,
        before: '2. The file is named invoice-<number>.pdf.',
        author: 'BA',
        at: BA.at,
      },
    ],
    removed: [],
  });
});

test('once the developer has saved, the change stays marked but is no longer new', () => {
  const { doc, history } = sent();
  const edited = edit(doc, '2. The', (text) => text.replace('.pdf', '.pdf, lowercase'));
  const returned = core.recordSave(history, edited.text, 'BA', BA.at);
  const seen = core.recordSave(returned, edited.text, 'KP', KP.at);

  const [mark] = marksFor('KP', edited, seen).units;

  assert.equal(mark.fresh, false);
  assert.equal(mark.before, '2. The file is named invoice-<number>.pdf.');
});

test('added and removed blocks are reported, the removed one after the block that preceded it', () => {
  const { doc, history } = sent();
  const added = core.addUnitAfter(doc, indexOfUnit(doc, '2. The'), '3. A draft cannot be exported.', BA);
  const edited = core.removeUnit(added, indexOfUnit(added, 'As an'), BA);
  const returned = core.recordSave(history, edited.text, 'BA', BA.at);

  const marks = marksFor('KP', edited, returned);

  assert.deepEqual(marks.units.map((u) => [u.text, u.kind, u.fresh]), [['3. A draft cannot be exported.', 'added', true]]);
  assert.deepEqual(marks.removed, [
    { after: 0, text: 'As an accountant, I want a PDF.', fresh: true, author: 'BA', at: BA.at },
  ]);
});

test('an edit that is not saved yet is marked without an author', () => {
  const { doc, history } = sent();
  const edited = edit(doc, 'Notes', () => 'Notes for now.');

  const [mark] = marksFor('BA', edited, history).units;

  assert.deepEqual([mark.kind, mark.fresh, mark.author, mark.at], ['changed', true, null, null]);
});

test('a second round of BA edits is new for the developer, the first round is not', () => {
  const { doc, history } = sent();
  const first = edit(doc, '2. The', (text) => text.replace('.pdf', '.pdf, lowercase'));
  const afterBa = core.recordSave(history, first.text, 'BA', BA.at);
  const afterKp = core.recordSave(afterBa, first.text, 'KP', KP.at);
  const second = edit(first, 'Notes', () => 'Notes for now.');
  const afterBaAgain = core.recordSave(afterKp, second.text, 'BA', '2026-10-09 10:00');

  const marks = marksFor('KP', second, afterBaAgain).units;

  assert.deepEqual(marks.map((u) => [u.text.slice(0, 5), u.fresh]), [['2. Th', false], ['Notes', true]]);
});

test('saving repeatedly does not pile up versions of the same author', () => {
  const { doc, history } = sent();
  const first = edit(doc, 'Notes', () => 'Notes one.');
  const second = edit(first, 'Notes', () => 'Notes two.');

  const saved = core.recordSave(core.recordSave(history, first.text, 'BA', BA.at), second.text, 'BA', BA.at);

  assert.equal(saved.versions.length, 2);
  assert.equal(marksFor('KP', second, saved).units[0].before, 'Notes for later.');
});

test('a message is new for a reader when someone else wrote it after the reader last saved', () => {
  const { history } = sent();
  const reply = { n: 2, author: 'BA', at: '2026-10-07 11:02', text: 'No.' };
  const old = { n: 1, author: 'BA', at: '2026-10-05 08:00', text: 'Earlier.' };
  const own = { n: 3, author: 'KP', at: '2026-10-07 12:00', text: 'Mine.' };

  assert.equal(core.isNewFor(history, 'KP', reply), true);
  assert.equal(core.isNewFor(history, 'KP', old), false);
  assert.equal(core.isNewFor(history, 'KP', own), false);
  assert.equal(core.isNewFor(history, 'BA', { ...own }), true);
  assert.equal(core.isNewFor(history, '', reply), false);
});

test('the history travels inside the page together with the story', () => {
  const { doc, history } = sent();
  const page = `<html>${core.dataElement({ fileName: 'story.md', markdown: core.writeDocument(doc), history })}</html>`;

  assert.deepEqual(core.readPage(page).history, history);
});
