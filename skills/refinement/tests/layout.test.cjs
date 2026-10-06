const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../scripts/core.cjs');

function lines(...all) {
  return all.join('\n');
}

// Compact picture of the laid-out story; questioned text shows as [q1:text].
function sketch(markdown) {
  return core.layout(core.readDocument(markdown)).map(sketchBlock).join('');
}

function sketchBlock(block) {
  switch (block.type) {
    case 'paragraph':
      return `<p>${sketchInline(block.inline)}</p>`;
    case 'heading':
      return `<h${block.level}>${sketchInline(block.inline)}</h${block.level}>`;
    case 'code':
      return `<pre lang=${block.lang}>${sketchInline(block.inline)}</pre>`;
    case 'rule':
      return '<hr>';
    case 'quote':
      return `<blockquote>${block.blocks.map(sketchBlock).join('')}</blockquote>`;
    case 'list': {
      const items = block.items.map((item) => `<li>${item.map(sketchBlock).join('')}</li>`).join('');
      return block.ordered ? `<ol start=${block.start}>${items}</ol>` : `<ul>${items}</ul>`;
    }
    case 'table': {
      const row = (cells, tag) => `<tr>${cells.map((c) => `<${tag}>${sketchInline(c)}</${tag}>`).join('')}</tr>`;
      return `<table>${row(block.head, 'th')}${block.rows.map((r) => row(r, 'td')).join('')}</table>`;
    }
    default:
      throw new Error(`unknown block ${block.type}`);
  }
}

function sketchInline(nodes) {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return node.questions.length ? `[${node.questions.join('+')}:${node.text}]` : node.text;
        case 'break':
          return '<br>';
        case 'strong':
          return `<b>${sketchInline(node.children)}</b>`;
        case 'em':
          return `<i>${sketchInline(node.children)}</i>`;
        case 'del':
          return `<s>${sketchInline(node.children)}</s>`;
        case 'code':
          return `<code>${sketchInline(node.children)}</code>`;
        case 'link':
          return `<a href=${node.href}>${sketchInline(node.children)}</a>`;
        default:
          throw new Error(`unknown inline ${node.type}`);
      }
    })
    .join('');
}

function textPieces(blocks) {
  const pieces = [];
  const fromInline = (nodes) =>
    nodes.forEach((n) => (n.type === 'text' ? pieces.push(n) : n.children && fromInline(n.children)));
  const fromBlock = (block) => {
    if (block.inline) fromInline(block.inline);
    if (block.blocks) block.blocks.forEach(fromBlock);
    if (block.items) block.items.forEach((item) => item.forEach(fromBlock));
    if (block.head) [block.head, ...block.rows].forEach((row) => row.forEach(fromInline));
  };
  blocks.forEach(fromBlock);
  return pieces;
}

test('plain lines separated by blank lines become paragraphs', () => {
  assert.equal(
    sketch(lines('Export invoice to PDF', '', 'As an accountant,', 'I want a PDF.')),
    '<p>Export invoice to PDF</p><p>As an accountant,\nI want a PDF.</p>',
  );
});

test('a questioned fragment is marked with its question', () => {
  assert.equal(
    sketch('Given an issued <mark id="q1">invoice</mark>, when'),
    '<p>Given an issued [q1:invoice], when</p>',
  );
});

test('a question may start in plain text and end inside bold text', () => {
  assert.equal(sketch('a <mark id="q1">b **c</mark> d**'), '<p>a [q1:b ]<b>[q1:c] d</b></p>');
});

test('text covered by nested questions carries both, outer first', () => {
  assert.equal(
    sketch('<mark id="q1">an <mark id="q2">issued</mark> invoice</mark>'),
    '<p>[q1:an ][q1+q2:issued][q1: invoice]</p>',
  );
});

test('hash-prefixed lines become headings of that level', () => {
  assert.equal(sketch(lines('# Story', '### Acceptance Criteria ###')), '<h1>Story</h1><h3>Acceptance Criteria</h3>');
});

test('a numbered list keeps its first number and nests indented bullets', () => {
  assert.equal(
    sketch(lines('3. three', '4. four', '   - nested', '   - twice')),
    '<ol start=3><li><p>three</p></li><li><p>four</p><ul><li><p>nested</p></li><li><p>twice</p></li></ul></li></ol>',
  );
});

test('list items separated by blank lines stay in one list', () => {
  assert.equal(
    sketch(lines('- one', '', '- two', '', 'after')),
    '<ul><li><p>one</p></li><li><p>two</p></li></ul><p>after</p>',
  );
});

test('a wrapped list item continues on the next line', () => {
  assert.equal(sketch(lines('1. Given an invoice,', 'then a file.')), '<ol start=1><li><p>Given an invoice,\nthen a file.</p></li></ol>');
});

test('fenced code is shown verbatim', () => {
  assert.equal(
    sketch(lines('```java', 'int **x** = 1;', '', 'return x;', '```', 'after')),
    '<pre lang=java>int **x** = 1;\n\nreturn x;</pre><p>after</p>',
  );
});

test('a pipe table has header and body cells', () => {
  assert.equal(
    sketch(lines('| Field | Rule |', '|-------|:----:|', '| name | **required** |', '| vat | optional |')),
    '<table><tr><th>Field</th><th>Rule</th></tr>' +
      '<tr><td>name</td><td><b>required</b></td></tr><tr><td>vat</td><td>optional</td></tr></table>',
  );
});

test('quoted lines become a quote that may hold a list', () => {
  assert.equal(
    sketch(lines('> Note:', '> - an <mark id="q1">odd</mark> rule')),
    '<blockquote><p>Note:</p><ul><li><p>an [q1:odd] rule</p></li></ul></blockquote>',
  );
});

test('a line of dashes is a separator', () => {
  assert.equal(sketch(lines('above', '', '---', '', 'below')), '<p>above</p><hr><p>below</p>');
});

test('placeholders in angle brackets stay literal', () => {
  assert.equal(sketch('named invoice-<number>.pdf'), '<p>named invoice-<number>.pdf</p>');
});

test('inline styles are recognised', () => {
  assert.equal(
    sketch('**bold** *em* _em_ ~~gone~~ `co*de*`'),
    '<p><b>bold</b> <i>em</i> <i>em</i> <s>gone</s> <code>co*de*</code></p>',
  );
});

test('identifiers and arithmetic are not mistaken for emphasis', () => {
  assert.equal(sketch('user_first_name and 2 * 3 * 4 and a_b_'), '<p>user_first_name and 2 * 3 * 4 and a_b_</p>');
});

test('escaped markup characters show as the plain character', () => {
  assert.equal(sketch('\\*not em\\* and 1\\. item'), '<p>*not em* and 1. item</p>');
});

test('links and bare addresses become links', () => {
  assert.equal(
    sketch('[docs](https://x.y/z "title"), see https://x.y/q.'),
    '<p><a href=https://x.y/z>docs</a>, see <a href=https://x.y/q>https://x.y/q</a>.</p>',
  );
});

test('two trailing spaces force a line break', () => {
  assert.equal(sketch(lines('one  ', 'two')), '<p>one<br>two</p>');
});

test('every piece of text points back to its place in the story', () => {
  const doc = core.readDocument(
    lines(
      '# Export <mark id="q1">invoice</mark>',
      '',
      'As an **accountant**, I want `PDF`',
      'so that [I](https://x.y) can \\*archive\\* it.',
      '',
      '1. Given an *issued* invoice',
      '   - nested <mark id="q2">bullet **one**</mark>',
      '> quoted _line_',
      '> second line',
      '',
      '| A | B |',
      '|---|---|',
      '| 1 | ~~2~~ |',
      '',
      '```',
      'code <b>',
      '```',
    ),
  );

  const pieces = textPieces(core.layout(doc));

  assert.ok(pieces.length > 20);
  for (const piece of pieces.filter((p) => !p.atomic)) {
    assert.equal(doc.text.slice(piece.start, piece.end), piece.text);
  }
  assert.deepEqual(
    pieces.filter((p) => p.questions.includes('q2')).map((p) => p.text),
    ['bullet ', 'one'],
  );
});

test('the pieces of a story appear in reading order', () => {
  const doc = core.readDocument(lines('# A', '', '- b **c**', '- d', '', '> e'));

  const starts = textPieces(core.layout(doc)).map((p) => p.start);

  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
});
