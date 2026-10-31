// cli.mjs — Copy Gate on the command line. build.mjs bundles this with the KERNEL block of index.html into
// scripts/copy-gate.mjs, the single file the Agensi skill runs. It reads a piece of copy through the page's six
// layers (Jung, Freud, Sales 101, SEO, AI-SEO, Platform), weighted for the task, and prints the scores, the
// findings, the rewrite priorities and a SHA-256 of the result. The page's optional AI deep read is not part of
// it: the script is deterministic and makes no network calls.
// Exit 0 = a reading was computed · 2 = the input could not be used.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { VERSION, WEIGHTS, ARCHETYPES, gate, rewritePriorities } from './kernel.mjs';

const TASKS = Object.keys(WEIGHTS);
const AUDIENCES = ['auto', ...Object.keys(ARCHETYPES)];
const USAGE = `usage: node copy-gate.mjs <input.json | ->            input: {"text": "…", "task": "linkedin", "audience": "auto"}
       node copy-gate.mjs --file <path> --task <task> [--audience <archetype>]
tasks: ${TASKS.join(', ')}
audiences: ${AUDIENCES.join(', ')} (default auto)
output: a JSON reading on stdout. exit 0 = computed, 2 = bad input`;

class InputError extends Error {}
const fail = (msg) => { throw new InputError(msg); };
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

function readText(path) {
  try { return readFileSync(path === '-' ? 0 : path, 'utf8'); }
  catch (e) { return fail(`cannot read ${path === '-' ? 'stdin' : path}: ${e.code || e.message}`); }
}

// keys sorted at every depth, no whitespace: the form the result hash is taken over
function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}

function reading(rawText, task, audience) {
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  if (text.length < 30) fail('the copy must be at least 30 characters (as on the page)');
  if (!TASKS.includes(task)) fail(`"task" must be one of: ${TASKS.join(', ')}`);
  if (!AUDIENCES.includes(audience)) fail(`"audience" must be one of: ${AUDIENCES.join(', ')}`);
  const r = gate(text, task, audience);
  const result = {
    version: VERSION,
    task: r.task,
    audience: r.audience,
    detectedAudience: r.detected,
    gateScore: r.gateScore,
    weights: r.weights,
    scores: r.scores,
    findings: r.findings,
    rewrite: rewritePriorities(r),
  };
  return {
    tool: 'copy-gate',
    ...result,
    inputSha256: sha(text),
    resultSha256: sha(canonical(result)),
  };
}

async function main(args) {
  let report;
  const flag = (name) => { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; };
  if (args[0] === '--file') {
    if (!flag('--file') || !flag('--task')) { process.stderr.write(USAGE + '\n'); return 2; }
    report = reading(readText(flag('--file')), flag('--task'), flag('--audience') || 'auto');
  } else if (args.length === 1 && (args[0] === '-' || !args[0].startsWith('-'))) {
    let input;
    try { input = JSON.parse(readText(args[0])); } catch (e) { if (e instanceof InputError) throw e; fail(`the input is not valid JSON (${e.message})`); }
    if (!input || typeof input !== 'object') fail('the input must be an object: {"text", "task", "audience"}');
    report = reading(input.text, input.task, input.audience === undefined ? 'auto' : input.audience);
  } else {
    process.stderr.write(USAGE + '\n');
    return 2;
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  return 0;
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (e) {
  process.stderr.write(`copy-gate: ${e instanceof InputError ? e.message : 'internal error: ' + (e && e.message)}\n`);
  process.exitCode = e instanceof InputError ? 2 : 3;
}
