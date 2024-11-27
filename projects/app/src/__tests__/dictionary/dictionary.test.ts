import {
  allHsk1Words,
  allHsk2Words,
  allHsk3Words,
  allRadicalPrimaryForms,
  allRadicalsByStrokes,
  convertPinyinWithToneNumberToToneMark,
  loadHhPinyinChart,
  loadHmmPinyinChart,
  loadMnemonicTheme,
  loadPinyinWords,
  loadRadicalNameMnemonics,
  loadRadicalPinyinMnemonics,
  loadRadicals,
  loadStandardPinyinChart,
  loadWords,
} from "@/dictionary/dictionary";
import { sortComparatorNumber } from "@/util/collections";
import assert from "node:assert";
import test from "node:test";

void test(`radical groups have the right number of elements`, async () => {
  // Data integrity test to ensure that the number of characters in each group
  // matches the expected range.
  const radicalsByStrokes = await allRadicalsByStrokes();
  for (const [, group] of radicalsByStrokes.entries()) {
    assert(group.characters.length === group.range[1] - group.range[0] + 1);
  }
});

void test(`json data can be loaded and passes the schema validation`, async () => {
  await loadPinyinWords();
  await loadStandardPinyinChart();
  await loadHhPinyinChart();
  await loadHmmPinyinChart();
  await loadMnemonicTheme();
  await allHsk1Words();
  await allHsk2Words();
  await allHsk3Words();
  await loadRadicalNameMnemonics();
  await loadRadicalPinyinMnemonics();
  await loadWords();
  await loadRadicals();
  await allRadicalPrimaryForms();
});

void test(`there are 214 radicals to match official kangxi radicals`, async () => {
  const radicals = await loadRadicals();
  assert.equal(radicals.length, 214);
});

void test(`radical name mnemonics don't include radical alternatives`, async () => {
  const radicalNameMnemonics = await loadRadicalNameMnemonics();
  const primarySet = new Set(await allRadicalPrimaryForms());

  const radicalsWithNameMnemonics = new Set(radicalNameMnemonics.keys());

  assert.deepEqual(radicalsWithNameMnemonics.difference(primarySet), new Set());
});

void test(`radical pinyin mnemonics don't include radical alternatives`, async () => {
  const pinyinMnemonics = await loadRadicalPinyinMnemonics();
  const primarySet = new Set(await allRadicalPrimaryForms());

  const radicalsWithNameMnemonics = new Set(pinyinMnemonics.keys());

  assert.deepEqual(radicalsWithNameMnemonics.difference(primarySet), new Set());
});

void test(`radical data uses consistent unicode characters`, async () => {
  const primary = await allRadicalPrimaryForms();
  const primarySet = new Set(primary);

  {
    const violations = primary.filter(isNotCjkUnifiedIdeograph);
    assert.deepEqual(
      violations,
      [],
      await debugNonCjkUnifiedIdeographs(violations),
    );
  }

  {
    const sample = [...(await loadRadicalNameMnemonics()).keys()];
    assert.deepEqual(new Set(sample).difference(primarySet), new Set());
    assert.deepEqual(sample.filter(isNotCjkUnifiedIdeograph), []);
  }

  {
    const sample = (await allRadicalsByStrokes())
      .values()
      .flatMap((r) => r.characters);

    {
      const diff = new Set(sample).difference(primarySet);
      assert.deepEqual(
        diff,
        new Set(),
        await debugNonCjkUnifiedIdeographs([...diff]),
      );
    }
    assert.deepEqual([...sample].filter(isNotCjkUnifiedIdeograph), []);
  }
});

void test(`convertPinyinWithToneNumberToToneMark`, () => {
  // Rules: (from https://en.wikipedia.org/wiki/Pinyin)
  // 1. If there is an a or an e, it will take the tone mark
  // 2. If there is an ou, then the o takes the tone mark
  // 3. Otherwise, the second vowel takes the tone mark

  for (const [input, expected] of [
    // a
    [`a`, `a`],
    [`a1`, `ā`],
    [`a2`, `á`],
    [`a3`, `ǎ`],
    [`a4`, `à`],
    [`a5`, `a`],
    // e
    [`e`, `e`],
    [`e1`, `ē`],
    [`e2`, `é`],
    [`e3`, `ě`],
    [`e4`, `è`],
    [`e5`, `e`],
    // i
    [`bi`, `bi`],
    [`bi1`, `bī`],
    [`bi2`, `bí`],
    [`bi3`, `bǐ`],
    [`bi4`, `bì`],
    [`bi5`, `bi`],
    // o
    [`o`, `o`],
    [`o1`, `ō`],
    [`o2`, `ó`],
    [`o3`, `ǒ`],
    [`o4`, `ò`],
    [`o5`, `o`],
    // u
    [`u`, `u`],
    [`u1`, `ū`],
    [`u2`, `ú`],
    [`u3`, `ǔ`],
    [`u4`, `ù`],
    [`u5`, `u`],
    // u
    [`v`, `ü`],
    [`v1`, `ǖ`],
    [`v2`, `ǘ`],
    [`v3`, `ǚ`],
    [`v4`, `ǜ`],
    [`v5`, `ü`],

    // If there is an ou, then the o takes the tone mark
    [`dou`, `dou`],
    [`dou1`, `dōu`],
    [`dou2`, `dóu`],
    [`dou3`, `dǒu`],
    [`dou4`, `dòu`],
    [`dou5`, `dou`],

    // A few examples
    [`hao3`, `hǎo`],
    [`zhu5`, `zhu`],
    [`zi5`, `zi`],
  ] as const) {
    assert.equal(convertPinyinWithToneNumberToToneMark(input), expected);
  }
});

/**
 * `[label, match1, match2, ...]`
 */
type PinyinProduction = readonly string[];

function expandCombinations(
  rules: readonly PinyinProduction[],
): readonly [string, string][] {
  return rules.flatMap(([label, ...xs]): [string, string][] =>
    xs.map((x) => [label!, x] as const),
  );
}

function splitPinyin(
  pinyin: string,
  initials: readonly PinyinProduction[],
  finals: readonly PinyinProduction[],
): [initial: string, final: string] | null {
  const initialsList = expandCombinations(initials)
    // There's some overlap with initials and finals, the algorithm should use
    // the longest possible initial.
    .toSorted(sortComparatorNumber(([, x]) => x.length))
    .reverse();
  const finalsList = expandCombinations(finals)
    // There's some overlap with initials and finals, the algorithm should use
    // the longest possible initial.
    .toSorted(sortComparatorNumber((x) => x.length))
    .reverse();

  for (const [initialLabel, initial] of initialsList) {
    if (pinyin.startsWith(initial)) {
      const final = pinyin.slice(initial.length);
      for (const [finalLabel, finalCandiate] of finalsList) {
        if (final === finalCandiate) {
          return [initialLabel, finalLabel];
        }
      }
    }
  }

  return null;
}

void test(`standard pinyin covers kangxi pinyin`, async () => {
  const { initials, finals } = await loadStandardPinyinChart();
  const combined = await loadPinyinWords();

  for (const [input, initial, final] of [
    [`a`, `∅`, `a`],
    [`an`, `∅`, `an`],
    [`jue`, `j`, `üe`],
    [`wu`, `∅`, `u`],
    [`wa`, `∅`, `ua`],
    [`er`, `∅`, `er`],
    [`yi`, `∅`, `i`],
    [`ya`, `∅`, `ia`],
    [`yo`, `∅`, `io`],
    [`ye`, `∅`, `ie`],
    [`yai`, `∅`, `iai`],
    [`yao`, `∅`, `iao`],
    [`you`, `∅`, `iu`],
    [`yan`, `∅`, `ian`],
    [`yin`, `∅`, `in`],
    [`yang`, `∅`, `iang`],
    [`ying`, `∅`, `ing`],
    [`wu`, `∅`, `u`],
    [`wa`, `∅`, `ua`],
    [`wo`, `∅`, `uo`],
    [`wai`, `∅`, `uai`],
    [`wei`, `∅`, `ui`],
    [`wan`, `∅`, `uan`],
    [`wen`, `∅`, `un`],
    [`wang`, `∅`, `uang`],
    [`weng`, `∅`, `ong`],
    [`ong`, `∅`, `ong`],
    [`yu`, `∅`, `ü`],
    [`yue`, `∅`, `üe`],
    [`yuan`, `∅`, `üan`],
    [`yun`, `∅`, `ün`],
    [`yong`, `∅`, `iong`],
  ] as const) {
    // todo: assert no duplicate splits
    assert.deepEqual(
      splitPinyin(input, initials, finals),
      [initial, final],
      `${input} didn't split as expected`,
    );
  }

  for (const x of combined) {
    assert.notEqual(
      splitPinyin(x, initials, finals),
      null,
      `couldn't split ${x}`,
    );
  }
});

void test(`hh pinyin covers kangxi pinyin`, async () => {
  const { initials, finals } = await loadHhPinyinChart();
  const combined = await loadPinyinWords();

  for (const x of combined) {
    assert.notEqual(
      splitPinyin(x, initials, finals),
      null,
      `couldn't split ${x}`,
    );
  }

  for (const [input, initial, final] of [
    [`a`, `_`, `a`],
    [`bi`, `bi`, `_`],
    [`tie`, `ti`, `e`],
    [`zhou`, `zh`, `(o)u`],
    [`zhuo`, `zhu`, `o`],
  ] as const) {
    assert.deepEqual(
      splitPinyin(input, initials, finals),
      [initial, final],
      `${input} didn't split as expected`,
    );
  }
});

void test(`hmm pinyin covers kangxi pinyin`, async () => {
  const { initials, finals } = await loadHmmPinyinChart();
  const combined = await loadPinyinWords();

  assert.equal(
    initials.flatMap(([, ...x]) => x).length,
    new Set(initials.flatMap(([, ...x]) => x)).size,
  );
  assert.equal(
    finals.flatMap(([, ...x]) => x).length,
    new Set(finals.flatMap(([, ...x]) => x)).size,
  );

  assert.equal(initials.length, 55);
  assert.equal(finals.length, 13);

  for (const [input, initial, final] of [
    [`a`, `∅`, `a`],
    [`er`, `∅`, `∅`],
    [`ci`, `c`, `∅`],
    [`yi`, `yi`, `∅`],
    [`ya`, `yi`, `a`],
    [`wa`, `wu`, `a`],
    [`wu`, `wu`, `∅`],
    [`bi`, `bi`, `∅`],
    [`bin`, `bi`, `(e)n`],
    [`meng`, `m`, `(e)ng`],
    [`ming`, `mi`, `(e)ng`],
    [`li`, `li`, `∅`],
    [`diu`, `di`, `ou`],
    [`lu`, `lu`, `∅`],
    [`lü`, `lü`, `∅`],
    [`tie`, `ti`, `e`],
    [`zhou`, `zh`, `ou`],
    [`zhuo`, `zhu`, `o`],
    [`shua`, `shu`, `a`],
  ] as const) {
    assert.deepEqual(
      splitPinyin(input, initials, finals),
      [initial, final],
      `${input} didn't split as expected`,
    );
  }

  for (const x of combined) {
    assert.notEqual(
      splitPinyin(x, initials, finals),
      null,
      `couldn't split ${x}`,
    );
  }
});

async function debugNonCjkUnifiedIdeographs(chars: string[]): Promise<string> {
  const swaps = [];

  for (const x of chars) {
    const unified = await kangxiRadicalToCjkRadical(x);
    const msg =
      unified == null
        ? `${x} -> ???`
        : `${x} (${x.codePointAt(0)?.toString(16)}) -> ${unified} (${unified.codePointAt(0)?.toString(16)})`;
    swaps.push(msg);
  }

  return swaps.join(`, `);
}

function isCjkUnifiedIdeograph(char: string): boolean {
  return char.charCodeAt(0) >= 0x4e00 && char.charCodeAt(0) <= 0x9fff;
}

function isNotCjkUnifiedIdeograph(char: string): boolean {
  return !isCjkUnifiedIdeograph(char);
}

async function kangxiRadicalToCjkRadical(
  kangxi: string,
): Promise<string | undefined> {
  const xCodePoint = kangxi.codePointAt(0)!;

  const { EquivalentUnifiedIdeograph } = await import(
    `ucd-full/EquivalentUnifiedIdeograph.json`
  );

  const newCodePoint = EquivalentUnifiedIdeograph.find((rule) => {
    const minHex = rule.range[0]!;
    const maxHex = rule.range[1] ?? rule.range[0]!;

    const min = parseInt(minHex, 16);
    const max = parseInt(maxHex, 16);

    return xCodePoint >= min && xCodePoint <= max;
  })?.unified;

  if (newCodePoint != null) {
    return String.fromCodePoint(parseInt(newCodePoint, 16));
  }
}
