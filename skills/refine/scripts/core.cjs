// Refine core: the annotated-story document model.
// Plain script on purpose — it is inlined into the generated page and also loaded by node (CLI, tests).
(function (root) {
  'use strict';

  // This file is inlined into the page's script element, so it must never spell out an HTML comment opener
  // or a script tag: either would change how the browser reads the page. Hence the split strings and \x3c.
  const THREADS_MARKER = '<' + '!-- refine:threads --' + '>';
  const THREADS_TITLE = '## Questions';
  const MARK_TAG = /<mark\b([^>]*)>|<\/mark>/g;
  const ANCHOR_ATTRIBUTES = /^\s+id=(["'])(q\d+)\1\s*$/;
  const THREAD_HEADING = /^### (q\d+) · (open|resolved)\s*$/;
  const MESSAGE_START = /^\d+\. \*\*(.+?)\*\* · (\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?) — (.*)$/;
  const CONTINUATION_INDENT = '   ';
  const DATA_ELEMENT = /\x3cscript type="application\/json" id="refine-data">([\s\S]*?)\x3c\/script>/;

  // ---- reading -------------------------------------------------------------------------------

  function readDocument(markdown) {
    const source = markdown.replace(/\r\n?/g, '\n');
    const markerAt = findThreadsMarker(source);
    const body = (markerAt === -1 ? source : source.slice(0, markerAt)).trimEnd();
    const { text, anchors } = stripAnchors(body);
    const written = markerAt === -1 ? [] : readThreads(source.slice(markerAt + THREADS_MARKER.length));
    return { text, anchors, threads: withThreadForEveryAnchor(written, anchors) };
  }

  function findThreadsMarker(source) {
    if (source.startsWith(THREADS_MARKER)) return 0;
    const at = source.indexOf('\n' + THREADS_MARKER);
    return at === -1 ? -1 : at + 1;
  }

  function stripAnchors(body) {
    const paired = pairAnchorTags(body);
    const anchors = [];
    let text = '';
    let cursor = 0;
    for (const tag of paired) {
      text += body.slice(cursor, tag.at);
      cursor = tag.at + tag.length;
      if (tag.opens) tag.anchor.start = text.length;
      else {
        tag.anchor.end = text.length;
        anchors.push(tag.anchor);
      }
    }
    text += body.slice(cursor);
    return { text, anchors: anchors.filter((a) => a.end > a.start).sort(outerFirst) };
  }

  // Only <mark id="qN"> … </mark> pairs are anchors; any other <mark> stays story text.
  function pairAnchorTags(body) {
    const paired = [];
    const open = [];
    MARK_TAG.lastIndex = 0;
    for (let m = MARK_TAG.exec(body); m; m = MARK_TAG.exec(body)) {
      const closes = m[0] === '</mark>';
      if (!closes) {
        const attributes = ANCHOR_ATTRIBUTES.exec(m[1]);
        open.push(attributes ? { at: m.index, length: m[0].length, id: attributes[2] } : null);
        continue;
      }
      const opening = open.pop();
      if (!opening) continue;
      const anchor = { id: opening.id, start: 0, end: 0 };
      paired.push({ at: opening.at, length: opening.length, opens: true, anchor });
      paired.push({ at: m.index, length: m[0].length, opens: false, anchor });
    }
    return paired.sort((a, b) => a.at - b.at);
  }

  function readThreads(section) {
    const threads = [];
    let thread = null;
    let message = null;
    for (const line of section.split('\n')) {
      const heading = THREAD_HEADING.exec(line);
      if (heading) {
        message = null;
        thread = { id: heading[1], status: heading[2], messages: [] };
        threads.push(thread);
        continue;
      }
      const start = thread && MESSAGE_START.exec(line);
      if (start) {
        message = { author: start[1], at: start[2], lines: [start[3]] };
        thread.messages.push(message);
      } else if (message) {
        message.lines.push(line.startsWith(CONTINUATION_INDENT) ? line.slice(CONTINUATION_INDENT.length) : line.trim());
      }
    }
    return threads.map((t) => ({
      id: t.id,
      status: t.status,
      messages: t.messages.map((m, i) => ({ n: i + 1, author: m.author, at: m.at, text: m.lines.join('\n').trim() })),
    }));
  }

  function withThreadForEveryAnchor(threads, anchors) {
    const known = new Set(threads.map((t) => t.id));
    const missing = [];
    for (const anchor of anchors) {
      if (known.has(anchor.id)) continue;
      known.add(anchor.id);
      missing.push({ id: anchor.id, status: 'open', messages: [] });
    }
    return threads.concat(missing).sort((a, b) => idNumber(a.id) - idNumber(b.id));
  }

  // ---- writing -------------------------------------------------------------------------------

  function writeDocument(doc) {
    const body = applyAnchors(doc.text, doc.anchors);
    if (doc.threads.length === 0) return body + '\n';
    return `${body}\n\n${THREADS_MARKER}\n${THREADS_TITLE}\n\n${doc.threads.map(writeThread).join('\n')}`;
  }

  function applyAnchors(text, anchors) {
    const opening = new Map();
    const closing = new Map();
    for (const anchor of [...anchors].sort(outerFirst)) {
      push(opening, anchor.start, `<mark id="${anchor.id}">`);
      push(closing, anchor.end, '</mark>');
    }
    const cuts = [...new Set([...opening.keys(), ...closing.keys()])].sort((a, b) => a - b);
    let body = '';
    let cursor = 0;
    for (const cut of cuts) {
      body += text.slice(cursor, cut) + (closing.get(cut) || []).join('') + (opening.get(cut) || []).join('');
      cursor = cut;
    }
    return body + text.slice(cursor);
  }

  function push(map, key, value) {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  }

  function writeThread(thread) {
    return `### ${thread.id} · ${thread.status}\n${thread.messages.map(writeMessage).join('')}`;
  }

  function writeMessage(message) {
    const [first, ...rest] = message.text.split('\n');
    const continuation = rest.map((line) => (line ? CONTINUATION_INDENT + line : '') + '\n').join('');
    return `${message.n}. **${message.author}** · ${message.at} — ${first}\n${continuation}`;
  }

  function withoutQuestions(markdown) {
    return readDocument(markdown).text + '\n';
  }

  // ---- changing ------------------------------------------------------------------------------

  function askQuestion(doc, { start, end, author, at, text }) {
    const fragment = trimmedSelection(doc.text, start, end);
    const crossed = doc.anchors.find((a) => overlapsPartly(a, fragment));
    if (crossed) {
      throw new Error(`The selection partly overlaps question ${crossed.id}. Select inside it or around it.`);
    }
    const id = nextId(doc);
    return {
      text: doc.text,
      anchors: [...doc.anchors, { id, start: fragment.start, end: fragment.end }].sort(outerFirst),
      threads: [...doc.threads, { id, status: 'open', messages: [newMessage(1, author, at, text)] }],
    };
  }

  function trimmedSelection(text, start, end) {
    let from = Math.max(0, start);
    let to = Math.min(text.length, end);
    while (from < to && /\s/.test(text[from])) from += 1;
    while (to > from && /\s/.test(text[to - 1])) to -= 1;
    if (from >= to) throw new Error('Select a fragment of the story first.');
    return { start: from, end: to };
  }

  function overlapsPartly(a, b) {
    const overlap = a.start < b.end && b.start < a.end;
    const nested = (a.start <= b.start && b.end <= a.end) || (b.start <= a.start && a.end <= b.end);
    return overlap && !nested;
  }

  function nextId(doc) {
    const used = [...doc.anchors, ...doc.threads].map((x) => idNumber(x.id));
    return `q${Math.max(0, ...used) + 1}`;
  }

  function reply(doc, id, { author, at, text }) {
    return changeThread(doc, id, (thread) => ({
      ...thread,
      messages: [...thread.messages, newMessage(thread.messages.length + 1, author, at, text)],
    }));
  }

  function resolve(doc, id) {
    return changeThread(doc, id, (thread) => ({ ...thread, status: 'resolved' }));
  }

  function reopen(doc, id) {
    return changeThread(doc, id, (thread) => ({ ...thread, status: 'open' }));
  }

  function removeQuestion(doc, id) {
    requireThread(doc, id);
    return {
      text: doc.text,
      anchors: doc.anchors.filter((a) => a.id !== id),
      threads: doc.threads.filter((t) => t.id !== id),
    };
  }

  function changeThread(doc, id, change) {
    requireThread(doc, id);
    return { ...doc, threads: doc.threads.map((t) => (t.id === id ? change(t) : t)) };
  }

  function requireThread(doc, id) {
    if (!doc.threads.some((t) => t.id === id)) throw new Error(`There is no question ${id}.`);
  }

  function newMessage(n, author, at, text) {
    const name = String(author || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    if (!name) throw new Error('Enter your name before writing.');
    const body = String(text || '').replace(/\r\n?/g, '\n').split('\n').map((line) => line.trimEnd()).join('\n').trim();
    if (!body) throw new Error('The message is empty.');
    return { n, author: name, at, text: body };
  }

  function idNumber(id) {
    return Number(id.slice(1));
  }

  // Outer anchors first, so nested tags are written and matched consistently.
  function outerFirst(a, b) {
    return a.start - b.start || b.end - a.end || idNumber(a.id) - idNumber(b.id);
  }

  // ---- laying the story out as blocks ---------------------------------------------------------
  //
  // Every text piece keeps `start`/`end` — its position in `doc.text` — so a selection made in the
  // rendered page can be turned back into a place in the story.

  const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)/;
  const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+|$)/;
  const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
  const QUOTE = /^ {0,3}>[ \t]?/;
  const ITEM = /^( {0,3})(?:([-*+])|(\d{1,9})[.)])(?:[ \t]+|$)/;
  const TABLE_RULE = /^[ \t]*\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
  const ESCAPABLE = /[!-/:-@[-`{-~]/;
  const BARE_LINK = /^https?:\/\/[^\s<>]+/;
  const DELIMITERS = { '*': ['**', '*'], _: ['__', '_'], '~': ['~~'] };

  function layout(doc) {
    let offset = 0;
    const lines = doc.text.split('\n').map((text) => {
      const line = { text, off: offset };
      offset += text.length + 1;
      return line;
    });
    return layoutBlocks(doc.anchors, lines);
  }

  function layoutBlocks(anchors, lines) {
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
      const laid = blockAt(anchors, lines, i);
      if (laid.block) blocks.push({ ...laid.block, ...span(lines, i, laid.next) });
      i = laid.next;
    }
    return blocks;
  }

  // Where the lines [from, to) sit in the story.
  function span(lines, from, to) {
    const last = lines[Math.min(to, lines.length) - 1];
    return { sourceStart: lines[from].off, sourceEnd: last.off + last.text.length };
  }

  function blockAt(anchors, lines, i) {
    const text = lines[i].text;
    if (isBlank(lines[i])) return { next: i + 1 };
    if (FENCE.test(text)) return codeAt(anchors, lines, i);
    if (HEADING.test(text)) return { block: heading(anchors, lines[i]), next: i + 1 };
    if (RULE.test(text)) return { block: { type: 'rule' }, next: i + 1 };
    if (QUOTE.test(text)) return quoteAt(anchors, lines, i);
    if (ITEM.test(text)) return listAt(anchors, lines, i);
    if (startsTable(lines, i)) return tableAt(anchors, lines, i);
    return paragraphAt(anchors, lines, i);
  }

  function isBlank(line) {
    return line.text.trim() === '';
  }

  function startsBlock(text) {
    return FENCE.test(text) || HEADING.test(text) || RULE.test(text) || QUOTE.test(text) || ITEM.test(text);
  }

  function interruptsParagraph(text) {
    if (FENCE.test(text) || HEADING.test(text) || RULE.test(text) || QUOTE.test(text)) return true;
    const item = ITEM.exec(text);
    if (!item || item[0].length === text.length) return false;
    return item[3] === undefined || Number(item[3]) === 1;
  }

  function codeAt(anchors, lines, i) {
    const [, fence, lang] = FENCE.exec(lines[i].text);
    const closing = new RegExp(`^ {0,3}${fence[0]}{${fence.length},}[ \\t]*$`);
    let end = i + 1;
    while (end < lines.length && !closing.test(lines[end].text)) end += 1;
    const source = joined(lines.slice(i + 1, end));
    return { block: { type: 'code', lang, inline: verbatim(anchors, source, 0, source.s.length) }, next: end + 1 };
  }

  function heading(anchors, line) {
    const marker = HEADING.exec(line.text);
    const title = line.text.slice(marker[0].length).replace(/[ \t]+#+[ \t]*$/, '').trimEnd();
    return {
      type: 'heading',
      level: marker[1].length,
      inline: inlineOf(anchors, [{ text: title, off: line.off + marker[0].length }]),
    };
  }

  function quoteAt(anchors, lines, i) {
    const quoted = [];
    let j = i;
    while (j < lines.length && !isBlank(lines[j])) {
      const prefix = QUOTE.exec(lines[j].text);
      if (!prefix && startsBlock(lines[j].text)) break;
      quoted.push(prefix ? cut(lines[j], prefix[0].length) : lines[j]);
      j += 1;
    }
    return { block: { type: 'quote', blocks: layoutBlocks(anchors, quoted) }, next: j };
  }

  function listAt(anchors, lines, i) {
    const ordered = ITEM.exec(lines[i].text)[3] !== undefined;
    const start = ordered ? Number(ITEM.exec(lines[i].text)[3]) : 1;
    const items = [];
    const itemSpans = [];
    let j = i;
    while (j < lines.length) {
      const marker = ITEM.exec(lines[j].text);
      if (!marker || (marker[3] !== undefined) !== ordered || RULE.test(lines[j].text)) break;
      const item = itemAt(lines, j, marker);
      items.push(layoutBlocks(anchors, item.lines));
      itemSpans.push(span(lines, j, item.next));
      j = item.next;
      const afterBlanks = skipBlank(lines, j);
      if (afterBlanks === j) continue;
      if (afterBlanks < lines.length && ITEM.test(lines[afterBlanks].text)) j = afterBlanks;
      else break;
    }
    return { block: { type: 'list', ordered, start, items, itemSpans }, next: j };
  }

  function itemAt(lines, i, marker) {
    const width = marker[0].length;
    const markerIndent = marker[1].length;
    const own = [cut(lines[i], width)];
    let j = i + 1;
    while (j < lines.length) {
      const line = lines[j];
      if (isBlank(line)) {
        const afterBlanks = skipBlank(lines, j);
        if (afterBlanks === lines.length || !belongsToItem(lines[afterBlanks], width, markerIndent)) break;
        for (; j < afterBlanks; j += 1) own.push({ text: '', off: lines[j].off });
      } else if (belongsToItem(line, width, markerIndent)) {
        own.push(cut(line, Math.min(indentChars(line.text, width), line.text.length)));
        j += 1;
      } else if (!isBlank(own[own.length - 1]) && !startsBlock(line.text)) {
        own.push(cut(line, line.text.length - line.text.trimStart().length));
        j += 1;
      } else break;
    }
    return { lines: own, next: j };
  }

  function belongsToItem(line, width, markerIndent) {
    const indent = indentWidth(line.text);
    return indent >= width || (indent > markerIndent && ITEM.test(line.text.trimStart()));
  }

  function indentWidth(text) {
    let width = 0;
    for (const ch of text) {
      if (ch === ' ') width += 1;
      else if (ch === '\t') width += 4;
      else break;
    }
    return width;
  }

  // How many leading characters make up at most `width` columns of indentation.
  function indentChars(text, width) {
    let columns = 0;
    let chars = 0;
    while (chars < text.length && columns < width && (text[chars] === ' ' || text[chars] === '\t')) {
      columns += text[chars] === '\t' ? 4 : 1;
      chars += 1;
    }
    return chars;
  }

  function skipBlank(lines, i) {
    let j = i;
    while (j < lines.length && isBlank(lines[j])) j += 1;
    return j;
  }

  function startsTable(lines, i) {
    if (i + 1 >= lines.length || !lines[i].text.includes('|')) return false;
    const rule = lines[i + 1].text;
    return rule.includes('|') && rule.includes('-') && TABLE_RULE.test(rule);
  }

  function tableAt(anchors, lines, i) {
    const row = (line) => cells(line).map((cell) => inlineOf(anchors, [cell]));
    const rows = [];
    let j = i + 2;
    while (j < lines.length && !isBlank(lines[j]) && lines[j].text.includes('|')) {
      rows.push(row(lines[j]));
      j += 1;
    }
    return { block: { type: 'table', head: row(lines[i]), rows }, next: j };
  }

  function cells(line) {
    const text = line.text;
    const bars = [];
    for (let k = 0; k < text.length; k += 1) {
      if (text[k] === '\\') k += 1;
      else if (text[k] === '|') bars.push(k);
    }
    const edges = [-1, ...bars, text.length];
    const all = [];
    for (let k = 0; k + 1 < edges.length; k += 1) all.push(trimmed(line, edges[k] + 1, edges[k + 1]));
    if (all.length > 1 && all[0].text === '') all.shift();
    if (all.length > 1 && all[all.length - 1].text === '') all.pop();
    return all;
  }

  function paragraphAt(anchors, lines, i) {
    let j = i + 1;
    while (j < lines.length && !isBlank(lines[j]) && !interruptsParagraph(lines[j].text)) j += 1;
    const own = lines.slice(i, j).map((line) => cut(line, line.text.length - line.text.trimStart().length));
    const last = own[own.length - 1];
    own[own.length - 1] = { text: last.text.trimEnd(), off: last.off };
    return { block: { type: 'paragraph', inline: inlineOf(anchors, own) }, next: j };
  }

  function cut(line, chars) {
    return { text: line.text.slice(chars), off: line.off + chars };
  }

  function trimmed(line, from, to) {
    const raw = line.text.slice(from, to);
    const lead = raw.length - raw.trimStart().length;
    return { text: raw.trim(), off: line.off + from + lead };
  }

  // ---- inline text ---------------------------------------------------------------------------

  // Lines of one block joined into a string, with the story position of every character.
  function joined(lines) {
    let s = '';
    const pos = [];
    lines.forEach((line, k) => {
      if (k > 0) {
        s += '\n';
        pos.push(lines[k - 1].off + lines[k - 1].text.length);
      }
      for (let c = 0; c < line.text.length; c += 1) pos.push(line.off + c);
      s += line.text;
    });
    return { s, pos };
  }

  function inlineOf(anchors, lines) {
    const source = joined(lines);
    return inline(anchors, source, 0, source.s.length);
  }

  function inline(anchors, source, from, to) {
    const { s } = source;
    const nodes = [];
    let plainFrom = from;
    let i = from;
    const flush = (upTo) => nodes.push(...verbatim(anchors, source, plainFrom, upTo));
    while (i < to) {
      const found = s[i] === '\n' ? lineEndAt(source, plainFrom, i) : spanAt(anchors, source, i, to);
      if (!found) {
        i += 1;
        continue;
      }
      flush(found.from === undefined ? i : found.from);
      nodes.push(...found.nodes);
      i = found.next;
      plainFrom = found.next;
    }
    flush(to);
    return nodes;
  }

  // A line end preceded by two spaces or a backslash is a forced break; otherwise it is plain text.
  function lineEndAt(source, plainFrom, i) {
    const { s } = source;
    let textEnd = i;
    while (textEnd > plainFrom && s[textEnd - 1] === ' ') textEnd -= 1;
    if (i - textEnd >= 2) return { from: textEnd, nodes: [{ type: 'break' }], next: i + 1 };
    if (i > plainFrom && s[i - 1] === '\\') return { from: i - 1, nodes: [{ type: 'break' }], next: i + 1 };
    return null;
  }

  function spanAt(anchors, source, i, to) {
    const { s, pos } = source;
    const ch = s[i];
    if (ch === '\\' && i + 1 < to && ESCAPABLE.test(s[i + 1])) {
      return { nodes: [piece(anchors, s[i + 1], pos[i], pos[i + 1] + 1, true)], next: i + 2 };
    }
    if (ch === '`') return codeSpanAt(anchors, source, i, to);
    if (ch === '[') return linkAt(anchors, source, i, to);
    if (ch === '!' && s[i + 1] === '[') return linkAt(anchors, source, i + 1, to);
    if (ch === '<') return angleAt(anchors, source, i, to);
    if (ch === 'h' && (i === 0 || !/\w/.test(s[i - 1]))) return bareLinkAt(anchors, source, i, to);
    if (DELIMITERS[ch]) return styledAt(anchors, source, i, to);
    return null;
  }

  function codeSpanAt(anchors, source, i, to) {
    const { s } = source;
    let ticks = 0;
    while (i + ticks < to && s[i + ticks] === '`') ticks += 1;
    for (let j = i + ticks; j < to; j += 1) {
      if (s[j] !== '`') continue;
      let run = 0;
      while (j + run < to && s[j + run] === '`') run += 1;
      if (run === ticks) {
        return { nodes: [{ type: 'code', children: verbatim(anchors, source, i + ticks, j) }], next: j + ticks };
      }
      j += run;
    }
    return null;
  }

  function linkAt(anchors, source, i, to) {
    const { s } = source;
    let depth = 0;
    let close = -1;
    for (let j = i; j < to && close === -1; j += 1) {
      if (s[j] === '\\') j += 1;
      else if (s[j] === '[') depth += 1;
      else if (s[j] === ']' && --depth === 0) close = j;
    }
    if (close === -1 || s[close + 1] !== '(') return null;
    const end = s.indexOf(')', close + 2);
    if (end === -1 || end >= to) return null;
    const href = s.slice(close + 2, end).trim().split(/\s+/)[0].replace(/^<|>$/g, '');
    return { nodes: [{ type: 'link', href, children: inline(anchors, source, i + 1, close) }], next: end + 1 };
  }

  function angleAt(anchors, source, i, to) {
    const rest = source.s.slice(i, to);
    const lineBreak = /^<br\s*\/?>/i.exec(rest);
    if (lineBreak) return { nodes: [{ type: 'break' }], next: i + lineBreak[0].length };
    const link = /^<(https?:\/\/[^\s<>]+)>/.exec(rest);
    if (!link) return null;
    const children = verbatim(anchors, source, i + 1, i + 1 + link[1].length);
    return { nodes: [{ type: 'link', href: link[1], children }], next: i + link[0].length };
  }

  function bareLinkAt(anchors, source, i, to) {
    const link = BARE_LINK.exec(source.s.slice(i, to));
    if (!link) return null;
    const href = link[0].replace(/[.,;:!?)\]'"]+$/, '');
    const children = verbatim(anchors, source, i, i + href.length);
    return { nodes: [{ type: 'link', href, children }], next: i + href.length };
  }

  function styledAt(anchors, source, i, to) {
    const { s } = source;
    for (const delimiter of DELIMITERS[s[i]]) {
      if (!s.startsWith(delimiter, i)) continue;
      const inside = i + delimiter.length;
      if (inside >= to || /\s/.test(s[inside])) return null;
      if (s[i] === '_' && i > 0 && /\w/.test(s[i - 1])) return null;
      const close = closingDelimiter(s, delimiter, inside, to);
      if (close === -1) return null;
      const type = s[i] === '~' ? 'del' : delimiter.length === 2 ? 'strong' : 'em';
      return { nodes: [{ type, children: inline(anchors, source, inside, close) }], next: close + delimiter.length };
    }
    return null;
  }

  function closingDelimiter(s, delimiter, from, to) {
    const single = delimiter.length === 1;
    for (let j = from + 1; j + delimiter.length <= to; j += 1) {
      if (!s.startsWith(delimiter, j) || /\s/.test(s[j - 1])) continue;
      if (single && (s[j - 1] === delimiter || s[j + 1] === delimiter)) continue;
      if (delimiter[0] === '_' && j + delimiter.length < s.length && /\w/.test(s[j + delimiter.length])) continue;
      return j;
    }
    return -1;
  }

  // Text shown exactly as written, cut wherever the story positions stop being consecutive.
  function verbatim(anchors, source, from, to) {
    const { s, pos } = source;
    const pieces = [];
    let runFrom = from;
    for (let i = from + 1; i <= to; i += 1) {
      if (i < to && pos[i] === pos[i - 1] + 1) continue;
      if (i > runFrom) pieces.push(...questioned(anchors, s.slice(runFrom, i), pos[runFrom]));
      runFrom = i;
    }
    return pieces;
  }

  function questioned(anchors, text, start) {
    const end = start + text.length;
    const cuts = new Set([start, end]);
    for (const anchor of anchors) {
      if (anchor.start > start && anchor.start < end) cuts.add(anchor.start);
      if (anchor.end > start && anchor.end < end) cuts.add(anchor.end);
    }
    const edges = [...cuts].sort((a, b) => a - b);
    const pieces = [];
    for (let k = 0; k + 1 < edges.length; k += 1) {
      pieces.push(piece(anchors, text.slice(edges[k] - start, edges[k + 1] - start), edges[k], edges[k + 1], false));
    }
    return pieces;
  }

  function piece(anchors, text, start, end, atomic) {
    const questions = anchors.filter((a) => a.start < end && a.end > start).map((a) => a.id);
    return atomic ? { type: 'text', text, start, end, questions, atomic } : { type: 'text', text, start, end, questions };
  }

  // ---- comparing two texts --------------------------------------------------------------------

  const LINES = /[^\n]*\n|[^\n]+/g;
  const WORDS = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;
  const WORD_CHAR = /[\p{L}\p{N}_]/u;
  const COMPARISON_LIMIT = 4000000;

  // Parts covering both texts in order; each part is either the same in both or changed.
  // Positions are { a: [from, to], b: [from, to] }. Whole words are compared, never half of one.
  function diff(a, b) {
    let head = 0;
    while (head < a.length && head < b.length && a[head] === b[head]) head += 1;
    while (head > 0 && isWordChar(a[head - 1]) && (isWordChar(a[head]) || isWordChar(b[head]))) head -= 1;
    let tail = 0;
    while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1;
    while (tail > 0 && isWordChar(a[a.length - tail]) && (isWordChar(a[a.length - tail - 1]) || isWordChar(b[b.length - tail - 1]))) {
      tail -= 1;
    }
    const middle = compared(a.slice(head, a.length - tail), b.slice(head, b.length - tail), LINES)
      .flatMap((part) => (part.same ? [part] : refined(a.slice(head, a.length - tail), b.slice(head, b.length - tail), part)))
      .map((part) => shifted(part, head, head));
    const parts = [
      { same: true, a: [0, head], b: [0, head] },
      ...middle,
      { same: true, a: [a.length - tail, a.length], b: [b.length - tail, b.length] },
    ];
    return merged(parts.filter((part) => part.a[1] > part.a[0] || part.b[1] > part.b[0]));
  }

  function isWordChar(ch) {
    return ch !== undefined && WORD_CHAR.test(ch);
  }

  // A changed stretch of lines, compared again word by word.
  function refined(a, b, part) {
    return compared(a.slice(part.a[0], part.a[1]), b.slice(part.b[0], part.b[1]), WORDS)
      .map((inner) => shifted(inner, part.a[0], part.b[0]));
  }

  function shifted(part, byA, byB) {
    return { same: part.same, a: [part.a[0] + byA, part.a[1] + byA], b: [part.b[0] + byB, part.b[1] + byB] };
  }

  function merged(parts) {
    const out = [];
    for (const part of parts) {
      const last = out[out.length - 1];
      if (last && last.same === part.same) {
        last.a[1] = part.a[1];
        last.b[1] = part.b[1];
      } else out.push({ same: part.same, a: [...part.a], b: [...part.b] });
    }
    return out;
  }

  function compared(a, b, pattern) {
    const tokensA = a.match(pattern) || [];
    const tokensB = b.match(pattern) || [];
    const startsA = starts(tokensA);
    const startsB = starts(tokensB);
    return runs(tokensA, tokensB).map((run) => ({
      same: run.same,
      a: [startsA[run.a[0]], startsA[run.a[1]]],
      b: [startsB[run.b[0]], startsB[run.b[1]]],
    }));
  }

  function starts(tokens) {
    const at = [0];
    for (const token of tokens) at.push(at[at.length - 1] + token.length);
    return at;
  }

  // Longest common subsequence of two lists, as alternating same/changed runs of indexes.
  function runs(a, b) {
    const n = a.length;
    const m = b.length;
    if (n === 0 && m === 0) return [];
    if ((n + 1) * (m + 1) > COMPARISON_LIMIT) return [{ same: false, a: [0, n], b: [0, m] }];
    const width = m + 1;
    const common = new Int32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i -= 1) {
      for (let j = m - 1; j >= 0; j -= 1) {
        common[i * width + j] = a[i] === b[j]
          ? common[(i + 1) * width + j + 1] + 1
          : Math.max(common[(i + 1) * width + j], common[i * width + j + 1]);
      }
    }
    const out = [];
    const add = (same, i, j, toI, toJ) => {
      const last = out[out.length - 1];
      if (last && last.same === same) {
        last.a[1] = toI;
        last.b[1] = toJ;
      } else out.push({ same, a: [i, toI], b: [j, toJ] });
    };
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) add(true, i, j, (i += 1), (j += 1));
      else if (j < m && (i === n || common[i * width + j + 1] >= common[(i + 1) * width + j])) add(false, i, j, i, (j += 1));
      else add(false, i, j, (i += 1), j);
    }
    return out;
  }

  // ---- editing the story ---------------------------------------------------------------------

  // The blocks a person edits one at a time: every top-level block, and every item of a top-level list.
  // `next` is the list marker a following item would start with.
  function units(doc) {
    const all = [];
    for (const block of layout(doc)) {
      if (block.type !== 'list') {
        all.push({ start: block.sourceStart, end: block.sourceEnd, kind: 'block', next: '' });
        continue;
      }
      block.itemSpans.forEach((item, k) => {
        const next = block.ordered ? `${block.start + k + 1}. ` : '- ';
        all.push({ start: item.sourceStart, end: item.sourceEnd, kind: 'item', next });
      });
    }
    return all;
  }

  function editUnit(doc, index, markdown, by) {
    const unit = units(doc)[index];
    const replacement = markdown.replace(/\r\n?/g, '\n').trim();
    if (!replacement) return removeUnit(doc, index, by);
    return changeText(doc, doc.text.slice(0, unit.start) + replacement + doc.text.slice(unit.end), by);
  }

  // Takes the block out together with one of the gaps around it — the smaller one, so that the
  // neighbours stay as separate as they were.
  function removeUnit(doc, index, by) {
    const all = units(doc);
    const unit = all[index];
    const before = all[index - 1];
    const after = all[index + 1];
    const gapBefore = before ? doc.text.slice(before.end, unit.start) : null;
    const gapAfter = after ? doc.text.slice(unit.end, after.start) : null;
    const keepGapBefore = gapAfter !== null && (gapBefore === null || gapBefore.length >= gapAfter.length);
    const from = keepGapBefore ? unit.start : before ? before.end : unit.start;
    const to = keepGapBefore ? after.start : unit.end;
    return changeText(doc, doc.text.slice(0, from) + doc.text.slice(to), by);
  }

  function addUnitAfter(doc, index, markdown, by) {
    const all = units(doc);
    const unit = all[index];
    const addition = markdown.replace(/\r\n?/g, '\n').trim();
    if (!addition) return doc;
    const continuesList = unit.kind === 'item' && ITEM.test(addition);
    const after = all[index + 1];
    const splitsList = !continuesList && after && doc.text.slice(unit.end, after.start) === '\n';
    const inserted = (continuesList ? '\n' : '\n\n') + addition + (splitsList ? '\n' : '');
    return changeText(doc, doc.text.slice(0, unit.end) + inserted + doc.text.slice(unit.end), by);
  }

  // Replaces the story text. Questions follow the words they were asked about, and every thread
  // whose words or surrounding block were edited gets a note saying so — an edit is often the answer.
  function changeText(doc, text, { author, at }) {
    const next = text.replace(/\r\n?/g, '\n').trimEnd();
    if (next === doc.text) return doc;
    if (!String(author || '').trim()) throw new Error('Enter your name before editing.');
    const parts = diff(doc.text, next);
    const blocksBefore = units(doc);
    const blocksAfter = units({ text: next, anchors: [], threads: [] });
    const anchors = [];
    let threads = doc.threads;
    for (const anchor of doc.anchors) {
      const moved = movedRange(parts, next, anchor);
      const was = doc.text.slice(anchor.start, anchor.end);
      const is = moved ? next.slice(moved.start, moved.end) : '';
      if (moved) anchors.push({ id: anchor.id, start: moved.start, end: moved.end });
      const note = editNote(was, is, moved && blockAround(doc.text, blocksBefore, anchor) === blockAround(next, blocksAfter, moved));
      if (note) threads = threads.map((t) => (t.id === anchor.id ? withMessage(t, author, at, note) : t));
    }
    return { text: next, anchors: anchors.sort(outerFirst), threads };
  }

  function editNote(was, is, sameBlock) {
    if (!is) return `✎ removed the text: “${quoted(was)}”`;
    if (is !== was) return `✎ changed the text: “${quoted(was)}” → “${quoted(is)}”`;
    return sameBlock ? null : `✎ edited the text around “${quoted(was)}”`;
  }

  function blockAround(text, blocks, range) {
    const block = blocks.find((b) => b.start <= range.start && range.start < b.end);
    return block ? text.slice(block.start, block.end) : '';
  }

  // Where the questioned words are in the new text; null when they sat inside a larger stretch that
  // was rewritten, because then nothing says which of the new words replaced them.
  function movedRange(parts, next, anchor) {
    const rewritten = parts.some((p) => !p.same && p.a[0] <= anchor.start && anchor.end <= p.a[1] && p.a[1] - p.a[0] > anchor.end - anchor.start);
    return rewritten ? null : trimmedRange(next, startIn(parts, anchor.start), endIn(parts, anchor.end));
  }

  function startIn(parts, position) {
    const part = parts.find((p) => p.a[0] <= position && position < p.a[1]);
    if (!part) return parts.length ? parts[parts.length - 1].b[1] : 0;
    return part.same ? part.b[0] + (position - part.a[0]) : part.b[0];
  }

  function endIn(parts, position) {
    const part = parts.find((p) => p.a[0] < position && position <= p.a[1]);
    if (!part) return 0;
    return part.same ? part.b[0] + (position - part.a[0]) : part.b[1];
  }

  function trimmedRange(text, start, end) {
    let from = start;
    let to = end;
    while (from < to && /\s/.test(text[from])) from += 1;
    while (to > from && /\s/.test(text[to - 1])) to -= 1;
    return from < to ? { start: from, end: to } : null;
  }

  function quoted(fragment) {
    const flat = fragment.replace(/\s+/g, ' ').trim();
    return flat.length > 160 ? `${flat.slice(0, 160)}…` : flat;
  }

  function withMessage(thread, author, at, text) {
    return { ...thread, messages: [...thread.messages, newMessage(thread.messages.length + 1, author, at, text)] };
  }

  // ---- who changed what ----------------------------------------------------------------------
  //
  // The history lives only in the page. `versions[0]` is the story as first rendered; a version is
  // added when someone saves a changed story. `seen` remembers, per person, when they last saved and
  // which version the story was then — the point from which changes count as new for them.

  function newHistory(text, at) {
    return { versions: [{ author: null, at, text }], seen: {} };
  }

  function recordSave(history, text, author, at) {
    const name = String(author || '').trim();
    const versions = [...history.versions];
    const last = versions.length - 1;
    if (text !== versions[last].text) {
      const othersStandOnLast = Object.entries(history.seen).some(([who, mark]) => who !== name && mark.version === last);
      if (last > 0 && versions[last].author === name && !othersStandOnLast) versions[last] = { author: name, at, text };
      else versions.push({ author: name, at, text });
    }
    const seen = name ? { ...history.seen, [name]: { at, version: versions.length - 1 } } : history.seen;
    return { versions, seen };
  }

  // The story as the reader last saved it; for someone who never saved, the story as first rendered.
  function referenceText(history, reader) {
    const mark = history.seen[String(reader || '').trim()];
    return history.versions[mark ? mark.version : 0].text;
  }

  function isNewFor(history, reader, message) {
    const name = String(reader || '').trim();
    if (!name || message.author === name) return false;
    const mark = history.seen[name];
    return !mark || message.at >= mark.at;
  }

  // Per unit of the current story: null, or how it differs from the first version, whether that is
  // new since `reference`, what it replaced and who did it. Removed blocks are listed separately,
  // each after the unit that now precedes its old place (-1: before everything).
  function changeMarks(doc, history, reference) {
    const current = units(doc).map((unit) => doc.text.slice(unit.start, unit.end));
    const sinceReference = comparedUnits(unitTexts(reference), current);
    const sinceFirst = comparedUnits(unitTexts(history.versions[0].text), current);
    const marked = current.map((text, i) => {
      const mark = sinceReference.marks[i] || sinceFirst.marks[i];
      return mark ? { ...mark, fresh: Boolean(sinceReference.marks[i]), ...introducedBy(history, text) } : null;
    });
    const newlyRemoved = new Set(sinceReference.removed.map((r) => r.text));
    const removed = [
      ...sinceReference.removed.map((r) => ({ ...r, fresh: true })),
      ...sinceFirst.removed.filter((r) => !newlyRemoved.has(r.text)).map((r) => ({ ...r, fresh: false })),
    ].map((r) => ({ ...r, ...removedBy(history, r.text) }));
    return { units: marked, removed: removed.sort((x, y) => x.after - y.after) };
  }

  function comparedUnits(before, after) {
    const marks = after.map(() => null);
    const removed = [];
    for (const run of runs(before, after).filter((r) => !r.same)) {
      const gone = before.slice(run.a[0], run.a[1]);
      const came = run.b[1] - run.b[0];
      for (let k = 0; k < came; k += 1) {
        marks[run.b[0] + k] = k < gone.length ? { kind: 'changed', before: gone[k] } : { kind: 'added', before: null };
      }
      for (const text of gone.slice(came)) removed.push({ after: run.b[1] - 1, text });
    }
    return { marks, removed };
  }

  const unitTextsOf = new Map();

  function unitTexts(text) {
    if (!unitTextsOf.has(text)) {
      if (unitTextsOf.size > 50) unitTextsOf.clear();
      const doc = { text, anchors: [], threads: [] };
      unitTextsOf.set(text, units(doc).map((unit) => text.slice(unit.start, unit.end)));
    }
    return unitTextsOf.get(text);
  }

  function introducedBy(history, text) {
    const version = history.versions.slice(1).find((v) => unitTexts(v.text).includes(text));
    return version ? { author: version.author, at: version.at } : { author: null, at: null };
  }

  function removedBy(history, text) {
    const version = history.versions.find((v, k) => k > 0 && unitTexts(history.versions[k - 1].text).includes(text) && !unitTexts(v.text).includes(text));
    return version ? { author: version.author, at: version.at } : { author: null, at: null };
  }

  // ---- embedding in a page -------------------------------------------------------------------

  // JSON that is safe inside a script element: no "<" survives, so the story cannot close the element.
  function pageData({ fileName, markdown, history }) {
    return JSON.stringify({ format: 1, fileName, markdown, history }).replace(/</g, '\\u003c');
  }

  function dataElement(story) {
    return `\x3cscript type="application/json" id="refine-data">${pageData(story)}\x3c/script>`;
  }

  function readPage(html) {
    const element = DATA_ELEMENT.exec(html);
    if (!element) throw new Error('Not a refine page: no embedded story found.');
    const { fileName, markdown, history } = JSON.parse(element[1]);
    return history ? { fileName, markdown, history } : { fileName, markdown };
  }

  const api = {
    readDocument,
    writeDocument,
    withoutQuestions,
    layout,
    diff,
    units,
    editUnit,
    removeUnit,
    addUnitAfter,
    changeText,
    newHistory,
    recordSave,
    referenceText,
    isNewFor,
    changeMarks,
    askQuestion,
    reply,
    resolve,
    reopen,
    removeQuestion,
    pageData,
    dataElement,
    readPage,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RefineCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
