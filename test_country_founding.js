// node test_country_founding.js — regression check: a chain past-life roll must never land on
// a country that hadn't been founded yet by that life's year (e.g. no "Germany" before 1871,
// no "Singapore" before 1965). rollOne(year) filters TIERS[tier].countries down to founded-by-
// then candidates before picking, rather than generating the anachronism and patching it later.
const fs = require('fs');
const assert = require('assert');

const dataSrc = fs.readFileSync(__dirname + '/data.js', 'utf8');
const htmlSrc = fs.readFileSync(__dirname + '/index.html', 'utf8');
const rollOneSrc = htmlSrc.match(/function rollOne[\s\S]*?\n}/)[0];
const rollTierSrc = htmlSrc.match(/function rollTier[\s\S]*?\n}/)[0];
const baseCountryNameSrc = htmlSrc.match(/function baseCountryName\([^)]*\)\{[^\n]*\}/)[0];

// rollOne() closes over these as bare module-level identifiers (sincePity, stats,
// historyData) in the real script, not sandbox.* properties - declare them the same way here.
const sandbox = {};
new Function(dataSrc + rollTierSrc + baseCountryNameSrc + `
  const TIER_ORDER = ["UR","SSR","SR","R","N"];
  let sincePity = 0;
  let stats = { total:0, UR:0, SSR:0, SR:0, R:0, N:0 };
  let historyData = [];
` + rollOneSrc + `
  this.rollOne = rollOne;
  this.baseCountryName = baseCountryName;
  this.TIERS = TIERS;
  this.COUNTRY_FOUNDED = COUNTRY_FOUNDED;
`).call(sandbox);

// sanity: the map actually has real entries and covers well-known cases
assert(sandbox.COUNTRY_FOUNDED['德國'] === 1871);
assert(sandbox.COUNTRY_FOUNDED['新加坡'] === 1965);
assert(sandbox.COUNTRY_FOUNDED['美國'] === 1776);
assert(Object.keys(sandbox.COUNTRY_FOUNDED).length > 80, 'expected a substantial founding-year map');

const years = [1000, 1200, 1400, 1600, 1750, 1800, 1850, 1900, 1930, 1950, 1965, 1980, 2000, 2010];
let trials = 0, violations = [];
for (const year of years) {
  for (let i = 0; i < 400; i++) {
    const r = sandbox.rollOne(year);
    trials++;
    const founded = sandbox.COUNTRY_FOUNDED[sandbox.baseCountryName(r.name)];
    if (founded !== undefined && founded > year) {
      violations.push(`${r.name} (founded ${founded}) rolled for year ${year}`);
    }
  }
}
assert.strictEqual(violations.length, 0, `anachronistic country rolls:\n${violations.slice(0, 10).join('\n')}`);

// sanity: filtering doesn't silently exclude everything for an early year - modern countries
// (post-1900) should stop appearing once the year is early enough, while old ones keep showing up
let sawModernAt1200 = false, sawAnyAt1200 = false;
for (let i = 0; i < 500; i++) {
  const r = sandbox.rollOne(1200);
  sawAnyAt1200 = true;
  if ((sandbox.COUNTRY_FOUNDED[sandbox.baseCountryName(r.name)] || 0) > 1800) sawModernAt1200 = true;
}
assert(sawAnyAt1200, 'rollOne(1200) should still return something (fallback safety net)');
assert(!sawModernAt1200, 'rollOne(1200) should never surface a post-1800 country');

// single-pull mode (no year arg) is unaffected - always "today", every country still eligible
let sawGermanyToday = false;
for (let i = 0; i < 2000 && !sawGermanyToday; i++) {
  if (sandbox.baseCountryName(sandbox.rollOne().name) === '德國') sawGermanyToday = true;
}
assert(sawGermanyToday, 'rollOne() with no year (today) should still be able to roll Germany');

console.log(`OK — ${trials} chain rolls across ${years.length} eras, 0 anachronistic countries. Single-pull mode unaffected.`);
