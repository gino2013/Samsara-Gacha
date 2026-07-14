// node test_no_nobility.js — regression check for the "no hereditary nobility" fix:
// countries with no native royal-court tradition (settler nations + Latin America/Caribbean,
// which fall back to the Euro-feudal default occupation table) must never roll a noble-category
// or court-flavored job, in any era. Catches both: (1) new leaks like "宮廷畫師" that carry a
// court keyword under a different category tag, and (2) countryName/Set mismatches - the real
// bug found during manual testing, where the Set held bare "美國" but every actual USA pool
// entry is compound-named ("美國・矽谷科技菁英圈"), so the filter silently never fired.
const fs = require('fs');
const assert = require('assert');

const dataSrc = fs.readFileSync(__dirname + '/data.js', 'utf8');
const htmlSrc = fs.readFileSync(__dirname + '/index.html', 'utf8');
const pickOccupationSrc = htmlSrc.match(/function pickOccupation[\s\S]*?\n}/)[0];
const baseCountryNameSrc = htmlSrc.match(/function baseCountryName\([^)]*\)\{[^\n]*\}/)[0];

const sandbox = {};
new Function(dataSrc + pickOccupationSrc + baseCountryNameSrc + `
  this.pickOccupation = pickOccupation;
  this.baseCountryName = baseCountryName;
  this.TIERS = TIERS;
  this.NO_HEREDITARY_NOBILITY = NO_HEREDITARY_NOBILITY;
`).call(sandbox);

// Use the REAL pool names (some, like all 7 USA entries, carry a modern sub-region suffix) -
// testing against bare names only would have hidden the actual bug that shipped once already.
const allNames = new Set();
for (const t of Object.keys(sandbox.TIERS)) sandbox.TIERS[t].countries.forEach(c => allNames.add(c[1]));
const targets = [...allNames].filter(n => sandbox.NO_HEREDITARY_NOBILITY.has(sandbox.baseCountryName(n)));
// 37 base country names in the set, but USA alone contributes 7 differently-suffixed pool
// entries ("美國・矽谷科技菁英圈" etc.), so more POOL ENTRIES match than there are base names.
assert.strictEqual(targets.length, 43, `expected 43 pool entries to match the no-nobility list, got ${targets.length}`);

const years = [1100, 1500, 1700, 1850, 1950, 2010];
const tiers = ['UR', 'SSR', 'SR', 'R', 'N'];
const ages = [10, 17, 40];
let trials = 0;
for (const name of targets) {
  for (const year of years) {
    for (const tier of tiers) {
      for (const age of ages) {
        for (let i = 0; i < 8; i++) {
          const occ = sandbox.pickOccupation(tier, year, age, name);
          trials++;
          assert.notStrictEqual(occ.category, 'noble',
            `${name} age ${age} in ${year} (${tier}) rolled a noble-category job: ${occ.name}`);
          assert(!/宮廷|王室|皇室/.test(occ.name + occ.background),
            `${name} age ${age} in ${year} (${tier}) rolled a court-flavored job: ${occ.name}`);
        }
      }
    }
  }
}

// Sanity: an unaffected country (Europe, still routed through the same default table) can
// still roll noble-category jobs - the filter shouldn't accidentally block everyone.
let sawNoble = false;
for (let i = 0; i < 300 && !sawNoble; i++) {
  if (sandbox.pickOccupation('UR', 1200, 40, '法國').category === 'noble') sawNoble = true;
}
assert(sawNoble, 'France (unaffected country) should still be able to roll noble-category jobs');

console.log(`OK — ${trials} trials across ${targets.length} no-nobility pool entries, 0 noble/court leaks. France unaffected.`);
