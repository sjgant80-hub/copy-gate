---
name: "copy-gate"
description: "Reads a piece of copy through six layers (Jung, Freud, Sales 101, SEO, AI-SEO and platform fit), weighted for the job the copy has to do, and returns a score per layer, a weighted gate score, the findings worst-first and the rewrite priorities, deterministically and with a SHA-256 of the result. Use when the user asks for a review of marketing or product copy, a LinkedIn post, an email, a landing or sales page, a README or docs, or wants to know where a draft is weak before it ships. Rule-based Node.js script with no LLM judge and no network."
summary: "Where is this copy weak? Six layers (Jung, Freud, Sales 101, SEO, AI-SEO, platform), weighted for the task: a score per layer, a gate score, the findings worst-first and the three rewrite priorities. Rule-based and repeatable, no LLM judge, no network, mutation-tested."
version: "1.0.0"
tags: ["copywriting", "marketing", "seo", "content-review", "linkedin", "deterministic"]
use_cases: ["Check a LinkedIn post or email against its platform's conventions before it goes out", "Find the weakest layer of a sales or landing page and the next rewrite move", "Compare two drafts of the same copy on the same six scores"]
docs_url: "https://sjgant80-hub.github.io/copy-gate/"
---

# Copy Gate: where is this copy weak?

Most copy fails because it is written for one or two layers and ignores the rest. Copy Gate reads a draft
through six layers, each a set of fixed, transparent rules, and weights them for the job the copy has to do:

| Layer | What it looks for |
|---|---|
| **Jung** | the voice of the chosen audience archetype; shadow material; sentences carrying weight; verbs of feeling; mirroring the inner voice |
| **Freud** | naming the deeper want; the gap between what people say and want; puncturing a defence; the "should" |
| **Sales 101** | a hook in the first sentence; numbers and named entities; stakes; proof; a call to action; hedge words; earned urgency |
| **SEO** | headings; a keyword cluster; search intent; length for the task; links; an opener that works as a meta description |
| **AI-SEO** | lists and tables; attributed claims; named entities; recency; method; questions; lexical diversity |
| **Platform** | the conventions of the task: LinkedIn length and line breaks, the 280-character tweet, a short email subject, a tight headline, code blocks in a README; jargon |

Tasks (each weights the layers differently): `sales-page`, `blog-post`, `linkedin`, `twitter`, `email`,
`landing`, `readme`, `tool-ux`, `client-deliverable`, `dev-docs`. Audience archetypes: `ruler`, `sage`,
`hero`, `caregiver`, `outlaw`, `lover`, `seeker`, `creator`, or `auto` to detect it from the copy.

## When to use it

- The user asks you to review copy before it ships: a post, an email, a landing or sales page, a README, docs.
- You wrote copy yourself and want a check that does not depend on your own opinion of it.
- Two drafts of the same piece need comparing on the same scale.

It does not write or rewrite copy. It tells you where the draft is weak and what to do first.

## How to run it

The script is `scripts/copy-gate.mjs`: one file, Node.js 20 or newer, no dependencies, no network, and it
writes no files. Run it unchanged and keep the `.mjs` extension.

1. Pass the copy, the task and optionally the audience as JSON, from a file or stdin:

   ```json
   { "text": "…the draft, at least 30 characters…", "task": "linkedin", "audience": "auto" }
   ```

   `node scripts/copy-gate.mjs input.json` or `node scripts/copy-gate.mjs -`. Or read a text file directly:
   `node scripts/copy-gate.mjs --file draft.md --task email --audience sage`.
2. Exit code `0` means a reading was computed; `2` means the input could not be used (the reason is on stderr).
3. Report the gate score, then each finding worst-first (`findings` is already sorted by weight times shortfall)
   with its `verdict` (`good`, `ok`, `warn` or `bad`; the `headline` says it in words, such as
   `FAILS · don't ship`) and its notes, then `rewrite.priorities` in order. If you
   go on to rewrite the copy, run the gate again on the new draft and report both gate scores.

## What it prints

`examples/linkedin-sample.json` is a 900-character LinkedIn post read for the `outlaw` audience. The reading
(`examples/linkedin-sample.out.json`) gives a gate score of **48**, with the findings worst-first:

| Layer | Score | Weight | Verdict | First note |
|---|---|---|---|---|
| Jung | 30 | 30 | WEAK | ✗ No clear outlaw archetype voice — copy reads as generic |
| Freud | 20 | 20 | FAILS | ✗ Stays in ego — never punctures the rationalization |
| Platform | 65 | 25 | WORKS | ✓ Plenty of line breaks · scan-friendly |
| Sales 101 | 75 | 25 | CLEAR | ✓ Opens with a hook pattern |
| AI-SEO | 50 | 5 | WORKS | ✓ List structure (3 items) — LLMs extract these |

The rewrite priorities are Jung ("name the archetypal voice you're speaking from and surface the shadow before
they do") and Freud ("puncture one rationalization · name what they actually want underneath the story").
`examples/weak-draft.json`, a jargon-heavy sales paragraph, scores 7.

## Re-check this skill yourself

Everything here is deterministic: the same text, task and audience give the same scores on any machine, and
no language model judges anything.

- **A reading:** `inputSha256` is the SHA-256 of the copy as read (trimmed); `resultSha256` is the SHA-256 of the
  reading's canonical JSON (keys sorted at every depth). Run the script again on the same input to reproduce both.
- **The examples:** `node scripts/copy-gate.mjs examples/linkedin-sample.json` prints exactly the reading in
  `examples/linkedin-sample.out.json` (`resultSha256` `d1f65e6849a8…`).
- **The page:** https://sjgant80-hub.github.io/copy-gate/ runs the same engine in a browser. Its "Load sample"
  then "Run the Gate" on LinkedIn shows the same gate score of 48 and the same six layer scores.
- **The source:** https://github.com/sjgant80-hub/copy-gate (MIT). The script's KERNEL block is byte-identical to
  the engine of the live page and to `kernel.mjs`; CI fails if they ever differ.
- **CI on every push:** https://github.com/sjgant80-hub/copy-gate/actions/workflows/ci.yml runs the tests, the
  byte-identity check, the receipt check, the witness mutation gate and the ZIP build, and prints the ZIP's SHA-256.
- **The mutation gate:** witness v0.6 (https://github.com/sjgant80-hub/witness, tag `v0.6`) made
  96 single-operator changes (mutants) to the kernel and the tests caught 95 of them. The other 1 is an equivalent mutant: it cannot change behaviour, and its measured reason is in `witness.baseline.json`. The receipt is
  `receipts/witness.json` in the repository, for kernel SHA-256 `7b2e50f4b46fb3c2e9e3ed358e3f5b6d3abad7d60eba7923b1cc315589bd6c22`. With the repository and
  witness v0.6 side by side, `node gate.mjs --witness ../witness/witness.mjs` re-runs it.

## Where it stops

- It is a rule-based reading: it counts patterns (keywords, numbers, headings, line breaks, lengths), it does not
  judge whether the copy is true, persuasive or good. Use the findings as a checklist, not a verdict on quality.
- The rules are written for English.
- The live page also offers an optional deep read by Claude with your own API key. That part is not in this
  skill: the script makes no network calls.

---

MIT licence: see `LICENSE`.
