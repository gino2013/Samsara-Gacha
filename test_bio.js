// node test_bio.js — smallest check that the detailed biography builder works.
// Extracts buildLifeDetailHTML..buildLifeBiographyHTML from index.html and runs them on sample lives.
const fs = require('fs');
const assert = require('assert');

const src = fs.readFileSync(__dirname + '/data.js', 'utf8')
  + fs.readFileSync(__dirname + '/index.html', 'utf8')
      .match(/(\/\/ Renders a life as flowing prose[\s\S]*?)\nfunction showChainReview/)[1];
const sandbox = {};
new Function(src + `
  this.buildLifeBiographyHTML = buildLifeBiographyHTML;
  this.LIFE_CHAPTERS = LIFE_CHAPTERS;
`).call(sandbox);

const adult = { occupation:'工匠師傅', occCategory:'artisan', background:'工匠家庭出身，自小當學徒磨練手藝',
  age:79, married:true, marryAge:24, children:3, deathCause:'壽終正寢',
  legacy:'用一生證明了，手藝人也能活得有尊嚴', meaning:'一輩子與活火和材料為伍' };
const teen  = { occupation:'學徒', occCategory:'artisan', background:'工匠家庭出身', age:17,
  married:false, deathCause:'瘟疫', childDeathNote:'還沒來得及長大成人的模樣，就已經是最後一面' };
const child = { occupation:'牧童', occCategory:'farmer', background:'農家出身', age:8,
  deathCause:'瘟疫', childDeathNote:'沒能長大，是這個家永遠的遺憾' };

for(const cat of Object.keys(sandbox.LIFE_CHAPTERS)){
  for(const stage of ['childhood','youth','early','peak','midlife','twilight']){
    assert(Array.isArray(sandbox.LIFE_CHAPTERS[cat][stage]) && sandbox.LIFE_CHAPTERS[cat][stage].length >= 4,
      `${cat}.${stage} pool missing/short`);
  }
}
const a = sandbox.buildLifeBiographyHTML(adult);
assert(!a.includes('undefined'), 'adult bio has undefined');
assert(a.includes('工匠師傅') && a.includes('壽終正寢') && a.includes('此生印記'), 'adult bio missing parts');
const plain = a.replace(/<[^>]+>/g, '');
assert(plain.length > 400, `adult bio too short: ${plain.length} chars`);
const ages = [...a.matchAll(/ri-bio-age">(\d+)歲/g)].map(m => +m[1]);
assert(ages.every((v, i) => i === 0 || v >= ages[i-1]), `ages not ascending: ${ages}`);
const t = sandbox.buildLifeBiographyHTML(teen);
assert(!t.includes('undefined') && t.includes('最後一面'), 'teen bio broken');
const c = sandbox.buildLifeBiographyHTML(child);
assert(!c.includes('undefined') && c.includes('短短的一生'), 'child bio broken');
console.log('BIO OK — adult sample %d chars, ages %s', plain.length, ages.join(','));
