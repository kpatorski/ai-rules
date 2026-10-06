#!/usr/bin/env node
// Command line for the refinement skill: story.md <-> self-contained review page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import core from './core.cjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const USAGE = `Usage:
  refinement.mjs render  <story.md>            [-o <page.html>] [--force]   story -> review page
  refinement.mjs extract <page.html>           [-o <story.md>]  [--force]   review page -> story with questions
  refinement.mjs strip   <story.md|page.html>  [-o <clean.md>]  [--force]   story without anchors and threads
  refinement.mjs status  <story.md|page.html>                               list questions and their threads
  refinement.mjs drop    <story.md> <qN>...                                 remove questions from a story
  refinement.mjs help                                                       show this text

render and extract never overwrite an existing file unless --force is given.
The review page needs only a browser; it can also export its markdown itself.`;

class Refusal extends Error {}

function parse(argv) {
  const [command, ...rest] = argv;
  const options = { command, positional: [], output: null, force: false };
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === '--force') options.force = true;
    else if (rest[i] === '-o' || rest[i] === '--output') options.output = rest[++i];
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

function render({ positional: [story], output, force }) {
  const markdown = core.writeDocument(core.readDocument(read(story)));
  const page = read(path.join(HERE, 'page.html'))
    .replace('<!--REFINEMENT_DATA-->', () => core.dataElement({ fileName: path.basename(story), markdown }))
    .replace('/*REFINEMENT_CORE*/', () => read(path.join(HERE, 'core.cjs')));
  write(output || withExtension(story, '.html'), page, force);
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

const COMMANDS = { render, extract, strip, status, drop };

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
