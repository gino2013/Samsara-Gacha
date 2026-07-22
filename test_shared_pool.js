// node test_shared_pool.js — the narrative pools below are shared by all 196 countries, so a
// French fisherman and a Chinese farmer draw from the same lines. Two ways that breaks immersion:
//   1. culture-specific rituals/institutions (提親, 衙門, 科舉) - fine in OCCUPATIONS_BY_REGION.eastAsia,
//      wrong in a pool France also draws from.
//   2. one death cause dominating an era (瘟疫 was 24% of pre-1750 rolls, so every early life
//      died of plague).
// Region-scoped tables are deliberately NOT checked - Chinese terms belong there.
const fs = require('fs');
const assert = require('assert');

const s = {};
new Function(fs.readFileSync(__dirname + '/data.js', 'utf8') + `
  this.LIFE_CHAPTERS=LIFE_CHAPTERS; this.MEET_SPOUSE=MEET_SPOUSE; this.CHILDREN_NOTES=CHILDREN_NOTES;
  this.NO_CHILDREN_NOTES=NO_CHILDREN_NOTES; this.UNMARRIED_NOTES=UNMARRIED_NOTES;
  this.DEATH_PRELUDES_OLD=DEATH_PRELUDES_OLD; this.DEATH_PRELUDES_EARLY=DEATH_PRELUDES_EARLY;
  this.YOUNG_DEATH_NOTES=YOUNG_DEATH_NOTES; this.CHILD_DEATH_NOTES=CHILD_DEATH_NOTES;
  this.DEATH_CAUSES_BY_ERA=DEATH_CAUSES_BY_ERA; this.OCCUPATIONS_BY_ERA=OCCUPATIONS_BY_ERA;
  this.OCCUPATIONS_BY_REGION=OCCUPATIONS_BY_REGION; this.FLAVOR_BY_REGION=FLAVOR_BY_REGION;
`).call(s);

// ---- 1. no culture-specific institutions/rituals in the globally shared pools ----
const SINO_ONLY = [
  '提親','說媒','媒人','姻緣',        // Chinese betrothal ritual - France has no 提親
  '科舉','放榜','束脩','私塾','秀才','舉人', // imperial exam system
  '衙門','公門','當差','官帽','俸祿','告老還鄉','師爺', // Ming/Qing bureaucracy
  '祠堂','族譜','祖祠','宗族','藩王','宰輔','世子',      // clan ancestral hall / titles
  '算盤','戥子','藥碾','廟會','扁擔','功名'              // region-specific objects & customs
];
const SHARED = ['LIFE_CHAPTERS','MEET_SPOUSE','CHILDREN_NOTES','NO_CHILDREN_NOTES','UNMARRIED_NOTES',
  'DEATH_PRELUDES_OLD','DEATH_PRELUDES_EARLY','YOUNG_DEATH_NOTES','CHILD_DEATH_NOTES'];
const leaks = [];
const walk = (label, node) => {
  if (typeof node === 'string') {
    for (const t of SINO_ONLY) if (node.includes(t)) leaks.push(`${label}: 「${t}」 in "${node.slice(0, 30)}…"`);
  } else if (Array.isArray(node)) node.forEach(n => walk(label, n));
  else if (node && typeof node === 'object') Object.entries(node).forEach(([k, v]) => walk(`${label}.${k}`, v));
};
for (const k of SHARED) walk(k, s[k]);
assert.strictEqual(leaks.length, 0, `culture-specific terms in globally shared pools:\n${leaks.join('\n')}`);

// sanity: the guard is actually looking at real content, and region tables keep their Chinese terms
assert(s.LIFE_CHAPTERS.civic.childhood.length >= 4, 'expected the shared chapter pool to be populated');
const eastAsiaText = JSON.stringify(s.OCCUPATIONS_BY_REGION.eastAsia);
assert(/藩王|宰輔|科舉|衙門/.test(eastAsiaText), 'eastAsia region table should still keep its Chinese-specific terms');

// ---- 2. no single death cause dominates an era ----
const hogs = [];
for (const era of s.DEATH_CAUSES_BY_ERA) {
  if (!era.adult) continue;
  const all = Object.values(era.adult).flat();
  const count = {};
  all.forEach(d => count[d] = (count[d] || 0) + 1);
  for (const [cause, n] of Object.entries(count)) {
    const share = n / all.length;
    if (share > 0.20) hogs.push(`era<${era.before}: 「${cause}」 is ${(share*100).toFixed(0)}% of the pool (${n}/${all.length})`);
  }
  assert(Object.keys(count).length >= 12, `era<${era.before} has only ${Object.keys(count).length} distinct causes - too repetitive`);
}
assert.strictEqual(hogs.length, 0, `a single death cause dominates an era:\n${hogs.join('\n')}`);

// occupation-level death lists override the era pool, so plague must not dominate there either
let total = 0, plague = 0;
const scanEra = table => {
  for (const b of table) {
    if ((b.before ?? Infinity) > 1750) continue;
    for (const jobs of Object.values(b.jobs || {})) for (const j of jobs)
      (j.death || []).forEach(d => { total++; if (d === '瘟疫') plague++; });
  }
};
scanEra(s.OCCUPATIONS_BY_ERA);
Object.values(s.OCCUPATIONS_BY_REGION).forEach(scanEra);
const plagueShare = plague / total;
assert(plagueShare < 0.12, `瘟疫 is ${(plagueShare*100).toFixed(0)}% of pre-1750 occupation death causes (${plague}/${total}) - every early life dies of plague`);

// ---- 3. thread-based categories: the 6 stage arrays must stay index-aligned ----
// (one life walks one thread; a length mismatch silently pairs the wrong lines via % length)
const THREADED = ['noble', 'merchant']; // extend as categories migrate to threads
const STAGES = ['childhood', 'youth', 'early', 'peak', 'midlife', 'twilight'];
for (const cat of THREADED) {
  const lens = STAGES.map(st => s.LIFE_CHAPTERS[cat][st].length);
  assert(new Set(lens).size === 1, `${cat} stages not aligned: ${STAGES.map((st,i)=>`${st}=${lens[i]}`).join(' ')}`);
}

// ---- 4. every {token} used in LIFE_CHAPTERS resolves in FLAVOR_BY_REGION.default ----
const tokens = new Set(JSON.stringify(s.LIFE_CHAPTERS).match(/\{(\w+)\}/g) || []);
for (const t of tokens) {
  const k = t.slice(1, -1);
  assert(s.FLAVOR_BY_REGION.default[k], `placeholder ${t} has no FLAVOR_BY_REGION.default entry`);
}

console.log(`OK — ${SHARED.length} shared pools free of culture-specific terms; no death cause over 20% of any era; 瘟疫 ${(plagueShare*100).toFixed(0)}% of pre-1750 occupation rolls; ${THREADED.length} threaded categories aligned; ${tokens.size} flavor tokens resolve.`);
