#!/usr/bin/env node
// Command line for the refine skill: story.md <-> self-contained review page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import core from './core.cjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const USAGE = `Usage:
  refine.mjs render  <story.md>            [-o <page.html>] [--force]   story -> review page
  refine.mjs extract <page.html>           [-o <story.md>]  [--force]   review page -> story with questions
  refine.mjs strip   <story.md|page.html>  [-o <clean.md>]  [--force]   story without anchors and threads
  refine.mjs status  <story.md|page.html>                               list questions and their threads
  refine.mjs drop    <story.md> <qN>...                                 remove questions from a story
  refine.mjs rebase  <older.md|page.html> <edited.md> [-o <page.html>] [--by <name>] [--force]
                                                                        page for a story edited outside the page:
                                                                        questions of the older one, changes marked
  refine.mjs help                                                       show this text

render and extract never overwrite an existing file unless --force is given.
The review page needs only a browser; it can also export its markdown itself.`;

class Refusal extends Error {}

function parse(argv) {
  const [command, ...rest] = argv;
  const options = { command, positional: [], output: null, force: false, by: null };
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === '--force') options.force = true;
    else if (rest[i] === '-o' || rest[i] === '--output') options.output = rest[++i];
    else if (rest[i] === '--by') options.by = rest[++i];
    else options.positional.push(rest[i]);
  }
  return options;
}

function isPage(file) {
  return /\.html?$/i.test(file);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Refusal(`${file} does not exist.`);
  return fs.readFileSync(file, 'utf8');
}

// The annotated story, whether it is handed over as markdown or embedded in a review page.
function storyIn(file) {
  const content = read(file);
  return isPage(file) ? core.readPage(content).markdown : content;
}

function write(file, content, force) {
  if (fs.existsSync(file) && !force) {
    throw new Refusal(`${file} already exists. Pass --force to overwrite it, or -o to write elsewhere.`);
  }
  fs.writeFileSync(file, content);
  console.log(`Wrote ${file}`);
}

function withExtension(file, extension) {
  return path.join(path.dirname(file), path.basename(file, path.extname(file)) + extension);
}

function now() {
  const d = new Date();
  const two = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
}

function pageOf(fileName, doc, history) {
  const story = { fileName, markdown: core.writeDocument(doc), history };
  return read(path.join(HERE, 'page.html'))
    .replace('<!--REFINE_DATA-->', () => core.dataElement(story))
    .replace('/*REFINE_CORE*/', () => read(path.join(HERE, 'core.cjs')));
}

function render({ positional: [story], output, force }) {
  const doc = core.readDocument(read(story));
  write(output || withExtension(story, '.html'), pageOf(path.basename(story), doc, core.newHistory(doc.text, now())), force);
}

// A story edited outside the page, shown against the older one: the older questions are carried onto
// the new text (unless the edited story brings its own), and the page marks what changed.
function rebase({ positional: [older, edited], output, force, by }) {
  if (!edited) throw new Refusal(USAGE);
  const olderPage = isPage(older) ? core.readPage(read(older)) : null;
  const olderDoc = core.readDocument(olderPage ? olderPage.markdown : read(older));
  const editedDoc = core.readDocument(storyIn(edited));
  const signed = { author: by || 'external edit', at: now() };
  const hasOwnQuestions = editedDoc.threads.length > 0;
  const doc = hasOwnQuestions ? editedDoc : core.changeText(olderDoc, editedDoc.text, signed);
  const started = (olderPage && olderPage.history) || core.newHistory(olderDoc.text, signed.at);
  const history = core.recordSave(started, doc.text, signed.author, signed.at);
  write(output || withExtension(edited, '.html'), pageOf(path.basename(edited), doc, history), force);
  console.log(hasOwnQuestions ? `Kept the questions found in ${edited}.` : `Carried ${olderDoc.threads.length} question(s) over from ${older}.`);
}

function extract({ positional: [page], output, force }) {
  write(output || withExtension(page, '.md'), core.readPage(read(page)).markdown, force);
}

function strip({ positional: [file], output, force }) {
  const clean = core.withoutQuestions(storyIn(file));
  if (output) write(output, clean, force);
  else process.stdout.write(clean);
}

function status({ positional: [file] }) {
  const doc = core.readDocument(storyIn(file));
  const open = doc.threads.filter((t) => t.status === 'open').length;
  const total = doc.threads.length;
  const report = [`${total} question${total === 1 ? '' : 's'}: ${open} open, ${total - open} resolved`];
  for (const thread of doc.threads) {
    report.push('', `${thread.id} · ${thread.status} · ${placeOf(doc, thread.id)}`);
    for (const m of thread.messages) {
      report.push(`  ${m.n}. ${m.author} · ${m.at} — ${m.text.split('\n').join('\n     ')}`);
    }
  }
  process.stdout.write(report.join('\n') + '\n');
}

function placeOf(doc, id) {
  const anchor = doc.anchors.find((a) => a.id === id);
  if (!anchor) return 'no anchor';
  const line = doc.text.slice(0, anchor.start).split('\n').length;
  return `line ${line} · ${JSON.stringify(doc.text.slice(anchor.start, anchor.end))}`;
}

function drop({ positional: [story, ...ids] }) {
  if (ids.length === 0) throw new Refusal('Name at least one question to drop, e.g. q1.');
  if (isPage(story)) throw new Refusal('drop works on a markdown story; extract the page first.');
  const left = ids.reduce((doc, id) => core.removeQuestion(doc, id), core.readDocument(read(story)));
  fs.writeFileSync(story, core.writeDocument(left));
  console.log(`Dropped ${ids.join(', ')} from ${story}`);
}

const COMMANDS = { render, extract, strip, status, drop, rebase };

try {
  const options = parse(process.argv.slice(2));
  const command = COMMANDS[options.command];
  if (['help', '--help', '-h'].includes(options.command)) console.log(USAGE);
  else if (!command || options.positional.length === 0) throw new Refusal(USAGE);
  else command(options);
} catch (problem) {
  console.error(problem.message);
  process.exitCode = 1;
}
