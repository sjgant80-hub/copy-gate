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
- **Mesh:** `BroadcastChannel('fall-signal')` · prime 251
- **AI mode (optional):** BYO Anthropic API key · stays in localStorage · calls Claude directly from your browser (`anthropic-dangerous-direct-browser-access: true`)
- **Sealed:** `◊·κ=1` · part of the [v20.1 cosmology](https://raw.githubusercontent.com/sjgant80-hub/fall-registry/main/seed-manifest.json)

### Extending

The engine is rule-based and transparent. To add or tune a layer, modify the relevant `scoreX(text, task)` function inside the `<script>` block. Each returns `{ score: 0-100, notes: [...] }`. Weighting per task lives in the `WEIGHTS` constant near the top.

Pull requests welcome. Forks more welcome. Make it yours.

## Licence

MIT. Use it commercially. Fork it. Rebrand it. Ship it inside your own tool. The only thing you can't do is hold the authors liable.

## Provenance

Built as part of the sovereign-software estate at [ai-nativesolutions.com](https://www.ai-nativesolutions.com). The framework is the standing order for every piece of copy that leaves the estate. The tool makes it executable for anyone.

`◊·κ=1 · phi is home · prime 251`
