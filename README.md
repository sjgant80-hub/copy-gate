# ⌬ Copy Gate

> Run every line of copy through the same six layers. Jung. Freud. Sales 101. SEO. AI-SEO. Platform. Sovereign · single file · MIT.

**Live:** [sjgant80-hub.github.io/copy-gate](https://sjgant80-hub.github.io/copy-gate/) · **Fork it:** [github.com/sjgant80-hub/copy-gate](https://github.com/sjgant80-hub/copy-gate)

## What it is

A sovereign tool for anyone who ships copy. Paste a draft. Pick the job (LinkedIn post, sales page, README, email, anything). The engine reads the copy through six layers, weighted for the task, and tells you exactly where it's strong, where it's hedging, and where the rewrite has to happen.

Runs entirely in your browser. Your copy never leaves your device.

## The six layers

| # | Layer | What it checks |
|---|---|---|
| 1 | **Jung** | Archetypal voice · shadow surfacing · depth markers |
| 2 | **Freud** | id / ego / superego gap · defence puncture |
| 3 | **Sales 101** | Hook · stakes · specificity · proof · CTA |
| 4 | **SEO** | Keyword cluster · intent · headings · meta shape |
| 5 | **AI-SEO / GEO** | Citation-shape · entity density · attributable claims |
| 6 | **Platform** | Native fit per channel (length, hooks, breaks) |

Each task type has a different weighting — a sales page lives or dies by Sales 101 with Jung in support; a blog post leads with AI-SEO and SEO; a LinkedIn post is Jung-first with Sales + Platform close behind.

## Use it

1. Open [the tool](https://sjgant80-hub.github.io/copy-gate/) (or `copy-gate.html` from `file://`)
2. Paste your draft into the textarea
3. Pick task type and audience archetype (or leave audience on auto-detect)
4. Hit **Run the Gate**
5. Read the 6 scores and the prioritized findings
6. (Optional) paste your Anthropic API key for an AI deep-read second pass

Save readings to IndexedDB. Export individually as Markdown or the whole journal as JSON.

## Why a gate

Most copy fails because it only optimises one or two layers.

- Sales-only copy is hollow. It converts the wrong people.
- Jung-only copy doesn't convert anyone — it just makes them feel something.
- SEO-only copy reads like it was written by a robot for other robots.
- AI-SEO-only copy gets cited by Claude but doesn't move a single human.

The gate forces every layer to clear its bar — weighted to the task — before the copy ships. The engine doesn't write for you. It tells you where you're hedging.

## For developers

```
copy-gate.html      one file · 58KB · vanilla JS · no dependencies
README.md           this
LICENSE             MIT
```

Open the file from `file://` and it works. That's the test.

### Architecture

- **Sovereign:** single HTML file · vanilla JS · works from `file://`
- **Storage:** IndexedDB (saved readings) · localStorage (API key) · no server
- **Mesh:** `BroadcastChannel('fall-signal')`: open tabs of the tool can find each other
- **AI mode (optional):** BYO Anthropic API key · stays in localStorage · calls Claude directly from your browser (`anthropic-dangerous-direct-browser-access: true`)

### Extending

The engine is rule-based and transparent. To add or tune a layer, modify the relevant `scoreX(text, task)` function inside the `<script>` block. Each returns `{ score: 0-100, notes: [...] }`. Weighting per task lives in the `WEIGHTS` constant near the top.

Pull requests welcome. Forks more welcome. Make it yours.

## Licence

MIT. Use it commercially. Fork it. Rebrand it. Ship it inside your own tool. The only thing you can't do is hold the authors liable.

## Provenance

Built by AI Native Solutions. The six-layer framework is the check every piece of our own copy goes through; the tool makes it executable for anyone.

## Use it from an agent

`SKILL.md` makes this repository an agent skill in the open SKILL.md format (Claude Code, Codex CLI, Cursor and
others read it). The agent runs `scripts/copy-gate.mjs`, one Node.js 20+ file with no dependencies and no network,
and gets the same six scores and gate score as this page. The page's optional AI deep read is not part of it.

    node scripts/copy-gate.mjs examples/linkedin-sample.json

`node make-zip.mjs` checks the package against Agensi's published rules and builds `dist/copy-gate.zip`, the upload
for the Agensi skill marketplace. CI builds the same ZIP on every push and prints its SHA-256.

## Proof

- **One source of truth:** the KERNEL block of `index.html` is the six-layer engine. `node build.mjs` copies it
  byte-for-byte into `kernel.mjs` and into the skill script; CI fails if the three ever differ, or if
  `copy-gate.html` stops being the same file as `index.html`.
- **Tests:** `npm test` runs the engine tests (every threshold at its boundary) and runs the skill script alone in an
  empty folder, the way Agensi runs it, against the expected outputs in `examples/`.
- **Mutation gate:** witness v0.6 checks every single-operator mutant of `kernel.mjs`; the receipt is
  `receipts/witness.json`, re-checked by CI on every push: https://github.com/sjgant80-hub/copy-gate/actions/workflows/ci.yml
