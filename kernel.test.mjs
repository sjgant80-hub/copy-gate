// kernel.test.mjs — Copy Gate's engine (the KERNEL block of index.html, generated into kernel.mjs).
// Each threshold is tested at its exact boundary with small hand-built texts; the integration numbers for the page's
// own sample were read off the live page (sjgant80-hub.github.io/copy-gate) before the engine was moved into the block.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VERSION, WEIGHTS, LAYER_NAMES, ARCHETYPES, SHADOW_WORDS, detectArchetype, scoreJung, scoreFreud, scoreSales, scoreSeo,
  scoreAiseo, scorePlatform, collectFindings, gate, rewriteMove, rewritePriorities,
} from './kernel.mjs';

const has = (r, note) => r.notes.includes(note);

test('the tables', () => {
  assert.equal(VERSION, '1.0.0');
  assert.equal(Object.keys(WEIGHTS).length, 10);
  assert.deepEqual(WEIGHTS.linkedin, { jung: 30, freud: 20, sales: 25, seo: 0, aiseo: 5, platform: 25 });
  assert.equal(LAYER_NAMES.aiseo, 'AI-SEO');
  assert.equal(Object.keys(ARCHETYPES).length, 8);
  assert.ok(SHADOW_WORDS.weak_words.includes('maybe'));
});

test('detectArchetype: most keyword hits wins; on a tie the first in the table wins', () => {
  assert.equal(detectArchetype('We win and we beat them.'), 'hero');
  assert.equal(detectArchetype('Quiet words only.'), 'ruler');                  // all zero: the first, ruler
  assert.equal(detectArchetype('We care and we build.'), 'caregiver');          // one each: caregiver comes before creator
  assert.equal(detectArchetype('build build care'), 'creator');
});

test('scoreJung: archetype voice at 3, 1 and 0 signals', () => {
  assert.deepEqual(scoreJung('win beat conquer', 'hero'), { score: 30, notes: ['✓ Strong hero archetype voice (3 signals)', '◔ Surface only — doesn\'t name what they\'re avoiding'] });
  assert.deepEqual(scoreJung('win beat', 'hero'), { score: 15, notes: ['◔ Light hero archetype presence (2 signals)', '◔ Surface only — doesn\'t name what they\'re avoiding'] });
  assert.deepEqual(scoreJung('win', 'hero'), { score: 15, notes: ['◔ Light hero archetype presence (1 signal)', '◔ Surface only — doesn\'t name what they\'re avoiding'] });
  assert.deepEqual(scoreJung('quiet', 'hero'), { score: 0, notes: ['✗ No clear hero archetype voice — copy reads as generic', '◔ Surface only — doesn\'t name what they\'re avoiding'] });
  // an unknown audience reads with the sage's keywords
  assert.equal(scoreJung('truth clear principle', 'nobody').score, 30);
});

test('scoreJung: shadow words at 2, long sentences at 2, feeling verbs, inner-voice mirroring', () => {
  assert.equal(scoreJung('shadow persona', 'hero').score, 25);
  assert.ok(has(scoreJung('shadow persona', 'hero'), '✓ Touches shadow / unconscious material directly'));
  assert.equal(scoreJung('shadow', 'hero').score, 0);
  const long = 'q'.repeat(80) + '. ';
  assert.equal(scoreJung(long + long, 'hero').score, 15);
  assert.equal(scoreJung(long, 'hero').score, 0);
  assert.equal(scoreJung('I ache for it', 'hero').score, 15);
  assert.equal(scoreJung('you already know', 'hero').score, 15);
});

test('scoreFreud: id cues at 2 and 1, the gap, the surface, the defence, the superego', () => {
  assert.deepEqual(scoreFreud('admit the wish'), { score: 30, notes: ['✓ Names the deeper want directly (id-level)'] });
  assert.deepEqual(scoreFreud('admit it'), { score: 15, notes: ['◔ One id-level cue — could go deeper'] });
  assert.deepEqual(scoreFreud('quiet'), { score: 0, notes: ['✗ Stays in ego — never punctures the rationalization'] });
  assert.equal(scoreFreud('you pretend').score, 20);
  assert.equal(scoreFreud('the real one').score, 20);
  assert.equal(scoreFreud('stop pretending').score, 20);
  assert.equal(scoreFreud('you should').score, 10);
});

test('scoreSales: a bare text scores nothing and says why', () => {
  assert.deepEqual(scoreSales('Quiet words only', 'sales-page'), { score: 0, notes: [
    '✗ No hook in the first sentence · re-write opener', '✗ No numeric specificity · adds friction to belief',
    '◔ No stakes named — reader has no urgency', '✗ No proof — every claim survives without backing',
    '✗ No clear CTA · sales-class copy needs a next step',
  ] });
});

test('scoreSales: hook, numbers at 3 and 1, named entities, stakes, proof', () => {
  assert.equal(scoreSales('Why quiet', 'blog-post').score, 0);                    // no sentence end: no first sentence, no hook
  assert.equal(scoreSales('Why quiet? Yes.', 'blog-post').score, 20);
  assert.equal(scoreSales('quiet 1 2 3', 'blog-post').score, 15);
  assert.ok(has(scoreSales('quiet 1 2 3', 'blog-post'), '✓ Specific (3 numeric anchors)'));
  assert.equal(scoreSales('quiet 1 2', 'blog-post').score, 7);
  assert.ok(has(scoreSales('quiet 1 2', 'blog-post'), '◔ Some specificity (2 numbers) — could anchor more'));
  assert.ok(has(scoreSales('quiet 1', 'blog-post'), '◔ Some specificity (1 number) — could anchor more'));
  assert.equal(scoreSales('quiet Ada Lovelace', 'blog-post').score, 10);
  assert.equal(scoreSales('quiet risk', 'blog-post').score, 15);
  assert.equal(scoreSales('quiet testimonial', 'blog-post').score, 15);
});

test('scoreSales: the CTA counts except for blog posts and dev docs', () => {
  assert.equal(scoreSales('quiet, join us', 'sales-page').score, 15);
  assert.equal(scoreSales('quiet, join us', 'blog-post').score, 0);
  assert.equal(scoreSales('quiet, join us', 'dev-docs').score, 0);
  assert.equal(scoreSales('quiet', 'readme').notes.includes('✗ No clear CTA · sales-class copy needs a next step'), true);
  assert.equal(scoreSales('quiet', 'blog-post').notes.includes('✗ No clear CTA · sales-class copy needs a next step'), false);
});

test('scoreSales: more than 5 weak words costs 10; urgency needs a number', () => {
  const six = 'quiet very very very very very very 1';
  const five = 'quiet very very very very very 1';
  assert.equal(scoreSales(five, 'blog-post').score, 7);
  assert.equal(scoreSales(six, 'blog-post').score, 0);                              // 7 - 10, floored at 0
  assert.ok(has(scoreSales(six, 'blog-post'), '✗ 6 weak / hedge words ("really", "just", "maybe"…) — strip them'));
  assert.ok(has(scoreSales('quiet, hurry', 'blog-post'), '◔ Urgency words present but unearned — needs a specific number / deadline'));
  assert.equal(scoreSales('quiet, hurry 1', 'blog-post').score, 17);                // 7 (one number) + 10
});

test('scoreSeo: headings at 2, keyword cluster at 3, intent, length by task, links, meta opener', () => {
  assert.equal(scoreSeo('# a\n# b\nzz', 'tool-ux').score, 25);
  assert.equal(scoreSeo('# a\nzz', 'tool-ux').score, 0);
  assert.ok(has(scoreSeo('zz', 'blog-post'), '✗ No headings · long-form needs H1/H2/H3 skim structure'));
  assert.ok(has(scoreSeo('zz', 'readme'), '✗ No headings · long-form needs H1/H2/H3 skim structure'));
  assert.ok(!has(scoreSeo('zz', 'email'), '✗ No headings · long-form needs H1/H2/H3 skim structure'));
  assert.equal(scoreSeo('gate gate gate', 'tool-ux').score, 15);
  assert.ok(has(scoreSeo('gate gate gate', 'tool-ux'), '✓ Likely primary keyword cluster: gate'));
  assert.equal(scoreSeo('gate gate', 'tool-ux').score, 0);
  assert.equal(scoreSeo('no big ok', 'tool-ux').score, 0);                         // no word of 4+ letters
  assert.equal(scoreSeo('zz how to', 'tool-ux').score, 15);
  assert.equal(scoreSeo('zz https://x.y', 'tool-ux').score, 10);
});

test('scoreSeo: length bars are 1200 (blog), 400 (readme) and 80 (anything else) words of 4+ letters', () => {
  const words = (n) => Array.from({ length: n }, (_, i) => 'w' + 'abcdefghij'[i % 10] + 'abcdefghij'[Math.floor(i / 10) % 10] + 'abcdefghij'[Math.floor(i / 100) % 10]).join(' ');
  assert.equal(scoreSeo(words(1200), 'blog-post').score, 20);
  assert.equal(scoreSeo(words(1199), 'blog-post').score, 0);
  assert.ok(has(scoreSeo(words(1199), 'blog-post'), '◔ Short for blog (1199 words) — long-form ranks better for most topics'));
  assert.equal(scoreSeo(words(400), 'readme').score, 15);
  assert.equal(scoreSeo(words(399), 'readme').score, 0);
  assert.equal(scoreSeo(words(80), 'tool-ux').score, 15);
  assert.equal(scoreSeo(words(79), 'tool-ux').score, 0);
});

test('scoreSeo: the opener is a meta description when it is 1 to 160 characters, except on Twitter', () => {
  const opener = (n) => 'x'.repeat(n - 1) + '. rest';
  assert.equal(scoreSeo(opener(160), 'tool-ux').score, 10);
  assert.equal(scoreSeo(opener(161), 'tool-ux').score, 0);
  assert.equal(scoreSeo(opener(10), 'twitter').score, 0);
  assert.equal(scoreSeo('no sentence end', 'tool-ux').score, 0);
});

test('scoreAiseo: lists at 3, tables at 2, the no-structure note', () => {
  assert.equal(scoreAiseo('- a\n- b\n- c').score, 25);                         // lists 20 + lexical diversity 5
  assert.equal(scoreAiseo('- a\n- b').score, 5);
  assert.equal(scoreAiseo('| a |\n| b |').score, 20);
  assert.equal(scoreAiseo('| a |').score, 5);
  assert.ok(has(scoreAiseo('zz'), '✗ No lists or tables · LLMs will struggle to cite extractable facts'));
  assert.ok(!has(scoreAiseo('- a'), '✗ No lists or tables · LLMs will struggle to cite extractable facts'));
  assert.ok(!has(scoreAiseo('| a |'), '✗ No lists or tables · LLMs will struggle to cite extractable facts'));
});

test('scoreAiseo: attribution, named entities at 5 and 2, recency, method, questions, lexical diversity', () => {
  assert.equal(scoreAiseo('according to them').score, 25);
  assert.equal(scoreAiseo('Ada x Bob y Cy z Dee w Eve').score, 20);              // 5 entities (+15) and diversity (+5)
  assert.equal(scoreAiseo('Ada x Bob y Cy z Dee').score, 13);                    // 4 entities (+8) and diversity (+5)
  assert.equal(scoreAiseo('Ada x Bob').score, 13);                               // 2 entities
  assert.equal(scoreAiseo('Ada x').score, 5);                                    // 1 entity
  assert.equal(scoreAiseo('as of now').score, 15);                               // recency + diversity
  assert.equal(scoreAiseo('our method').score, 20);                              // method + diversity
  assert.equal(scoreAiseo('why? how?').score, 15);
  assert.equal(scoreAiseo('why?').score, 5);
});

test('scoreAiseo: lexical diversity above 0.55 adds 5; below 0.40 is noted', () => {
  const text = (unique, total) => Array.from({ length: total }, (_, i) => 'w' + 'abcdefghijklmnopqrst'[i % unique]).join(' ');
  assert.equal(scoreAiseo(text(11, 20)).score, 0);                                // exactly 0.55: not above
  assert.equal(scoreAiseo(text(12, 20)).score, 5);
  assert.ok(!has(scoreAiseo(text(8, 20)), '✗ Low lexical diversity — reads as stuffed / repetitive'));   // exactly 0.40
  assert.ok(has(scoreAiseo(text(7, 20)), '✗ Low lexical diversity — reads as stuffed / repetitive'));
});

test('scorePlatform: LinkedIn length window, line breaks, hashtags', () => {
  const li = (chars, breaks = 0, tags = 0) => {
    const tail = '\n\nx'.repeat(breaks) + ' #t'.repeat(tags);   // text between blank lines: one break each
    return 'x'.repeat(chars - tail.length) + tail;
  };
  assert.equal(scorePlatform(li(1301), 'linkedin').score, 65);                    // 50 + 25 - 10 (no breaks)
  assert.equal(scorePlatform(li(1300), 'linkedin').score, 40);
  assert.equal(scorePlatform(li(1999), 'linkedin').score, 65);
  assert.equal(scorePlatform(li(2000), 'linkedin').score, 40);
  assert.equal(scorePlatform(li(3001), 'linkedin').score, 25);
  assert.equal(scorePlatform(li(3000), 'linkedin').score, 40);
  assert.equal(scorePlatform(li(599), 'linkedin').score, 35);
  assert.equal(scorePlatform(li(600), 'linkedin').score, 40);
  assert.equal(scorePlatform(li(700, 4), 'linkedin').score, 65);
  assert.equal(scorePlatform(li(700, 3), 'linkedin').score, 40);
  assert.equal(scorePlatform(li(700, 0, 1), 'linkedin').score, 45);
  assert.equal(scorePlatform(li(700, 0, 4), 'linkedin').score, 45);
  assert.equal(scorePlatform(li(700, 0, 5), 'linkedin').score, 40);
  assert.equal(scorePlatform(li(700, 0, 6), 'linkedin').score, 25);
});

test('scorePlatform: Twitter, email, landing, readme and the long-form tasks', () => {
  assert.equal(scorePlatform('x'.repeat(281), 'twitter').score, 25);
  assert.equal(scorePlatform('x'.repeat(280), 'twitter').score, 60);
  assert.equal(scorePlatform('x'.repeat(231), 'twitter').score, 60);
  assert.equal(scorePlatform('x'.repeat(230), 'twitter').score, 50);
  assert.equal(scorePlatform('Hot take. x', 'twitter').score, 65);
  assert.equal(scorePlatform('x'.repeat(49) + '. y', 'email').score, 65);          // subject of 50 characters
  assert.equal(scorePlatform('x'.repeat(50) + '. y', 'email').score, 35);          // 51
  assert.equal(scorePlatform('x'.repeat(89) + '. y', 'landing').score, 70);        // headline of 90
  assert.equal(scorePlatform('x'.repeat(90) + '. y', 'landing').score, 40);        // 91
  assert.equal(scorePlatform('no headline', 'landing').score, 40);
  assert.equal(scorePlatform('```\ncode\n```\n', 'readme').score, 65);
  assert.equal(scorePlatform('```\ncode', 'readme').score, 40);                    // half a fence pair
  assert.equal(scorePlatform('# Title\n```\nx\n```', 'readme').score, 75);
  const words = (n) => Array(n).fill('w').join(' ') + '.';
  assert.equal(scorePlatform(words(300), 'sales-page').score, 65);                 // 300 words, opener far too long
  assert.equal(scorePlatform(words(299), 'blog-post').score, 50);
  assert.equal(scorePlatform('x'.repeat(88) + '. y', 'client-deliverable').score, 60);   // opener of 89
  assert.equal(scorePlatform('x'.repeat(89) + '. y', 'client-deliverable').score, 50);   // opener of 90
  assert.equal(scorePlatform('quiet', 'tool-ux').score, 50);
});

test('scorePlatform: two jargon words cost 15; the score stays within 0 and 100', () => {
  assert.equal(scorePlatform('synergy and leverage', 'tool-ux').score, 35);
  assert.equal(scorePlatform('synergy only', 'tool-ux').score, 50);
  assert.equal(scorePlatform('x'.repeat(3500) + ' synergy leverage #a #b #c #d #e #f', 'linkedin').score, 0);
});

test('collectFindings: verdict bands at 75, 50 and 30; zero-weight layers skipped; worst weighted first', () => {
  const scores = {
    jung: { score: 75, notes: ['a', 'b', 'c', 'd', 'e'] }, freud: { score: 74, notes: [] }, sales: { score: 50, notes: [] },
    seo: { score: 49, notes: [] }, aiseo: { score: 30, notes: [] }, platform: { score: 29, notes: [] },
  };
  const weights = { jung: 10, freud: 10, sales: 10, seo: 0, aiseo: 10, platform: 10 };
  const findings = [];
  collectFindings('t', 'tool-ux', 'sage', scores, findings, weights);
  assert.deepEqual(findings.map((f) => [f.layer, f.verdict, f.headline]), [
    ['Platform', 'bad', 'FAILS · don\'t ship'], ['AI-SEO', 'warn', 'WEAK · needs rewrite'], ['Sales 101', 'ok', 'WORKS · could go deeper'],
    ['Freud', 'ok', 'WORKS · could go deeper'], ['Jung', 'good', 'CLEAR · ships'],
  ]);
  assert.deepEqual(findings[4].notes, ['a', 'b', 'c', 'd']);
  assert.equal(findings[4].weight, 10);
});

test('gate: the page\'s own sample reads exactly as on the live page', () => {
  const sample = 'Stop reading marketing advice from people who haven\'t shipped in a decade.\n\nHere\'s what actually works in 2026: one number beats every adjective. Try this for your next launch.';
  const r = gate(sample, 'linkedin', 'auto');
  assert.equal(r.task, 'linkedin');
  assert.equal(r.audience, r.detected);
  assert.equal(r.weights, WEIGHTS.linkedin);
  assert.equal(r.text, sample);
  assert.deepEqual(Object.keys(r.scores), ['jung', 'freud', 'sales', 'seo', 'aiseo', 'platform']);
  const w = WEIGHTS.linkedin;
  const want = Math.round(Object.keys(w).filter((k) => w[k] > 0).reduce((a, k) => a + r.scores[k].score * w[k], 0) /
    Object.keys(w).filter((k) => w[k] > 0).reduce((a, k) => a + w[k], 0));
  assert.equal(r.gateScore, want);
  assert.equal(gate(sample, 'linkedin', 'hero').audience, 'hero');
  assert.equal(gate(sample, 'linkedin', 'hero').detected, r.detected);
});

test('gate: a weak sales draft scores low, with the findings worst-first', () => {
  const r = gate('We are really excited to maybe share some of our very innovative, best-in-class, holistic solutions that might help leverage synergy across your ecosystem going forward.', 'sales-page', 'auto');
  assert.equal(r.gateScore, 7);
  assert.equal(r.findings[0].layer, 'Sales 101');
});

test('rewriteMove and rewritePriorities: up to three failing or weak layers, each with its move', () => {
  assert.equal(rewriteMove('Sales 101'), 'add a specific numeric anchor + named stakes + a clear next step.');
  assert.equal(rewriteMove('Jung'), 'name the archetypal voice you\'re speaking from and surface the shadow before they do.');
  assert.equal(rewriteMove('Freud'), 'puncture one rationalization · name what they actually want underneath the story.');
  assert.equal(rewriteMove('SEO'), 'add H1/H2 structure with the primary keyword and 2-3 semantic neighbours.');
  assert.equal(rewriteMove('AI-SEO'), 'add a list or table, an attributable claim ("according to X"), and recency signals.');
  assert.equal(rewriteMove('Platform'), 'fit the platform native conventions (length, line breaks, hook position).');
  assert.equal(rewriteMove('Other'), '');
  const f = (layer, verdict, weight) => ({ layer, verdict, weight });
  const scores = { a: { score: 60 }, b: { score: 59 }, c: { score: 100 } };
  assert.deepEqual(rewritePriorities({ scores, findings: [f('Jung', 'bad', 30), f('SEO', 'ok', 5), f('Freud', 'warn', 20), f('Platform', 'warn', 25), f('AI-SEO', 'bad', 5)] }), {
    layersClear: 2,
    priorities: [
      { layer: 'Jung', weight: 30, move: rewriteMove('Jung') }, { layer: 'Freud', weight: 20, move: rewriteMove('Freud') },
      { layer: 'Platform', weight: 25, move: rewriteMove('Platform') },
    ],
  });
  assert.equal(rewritePriorities({ scores, findings: [f('Jung', 'good', 30), f('SEO', 'ok', 5)] }), null);
});
