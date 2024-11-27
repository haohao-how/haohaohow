import { deepReadonly } from "@/util/collections";
import { invariant } from "@haohaohow/lib/invariant";
import memoize from "lodash/memoize";
import { z } from "zod";

export const loadPinyinWords = memoize(async () =>
  z
    .array(z.string())
    .transform(deepReadonly)
    .parse((await import(`./pinyinWords.asset.json`)).default),
);

export const loadStandardPinyinChart = memoize(async () =>
  z
    .object({
      initials: z.array(z.union([z.string(), z.array(z.string())])),
      finals: z.array(z.union([z.string(), z.array(z.string())])),
    })
    .transform(({ initials, finals }) => ({
      initials: initials.map((x) => (typeof x === `string` ? [x, x] : x)),
      finals: finals.map((x) => (typeof x === `string` ? [x, x] : x)),
    }))
    .transform(deepReadonly)
    .parse((await import(`./standardPinyinChart.asset.json`)).default),
);

export const loadHhPinyinChart = memoize(async () =>
  z
    .object({
      initials: z.array(z.union([z.string(), z.array(z.string())])),
      finals: z.array(z.union([z.string(), z.array(z.string())])),
    })
    .transform(({ initials, finals }) => ({
      initials: initials.map((x) => (typeof x === `string` ? [x, x] : x)),
      finals: finals.map((x) => (typeof x === `string` ? [x, x] : x)),
    }))
    .transform(deepReadonly)
    .parse((await import(`./hhPinyinChart.asset.json`)).default),
);

export const loadHmmPinyinChart = memoize(async () =>
  z
    .object({
      initials: z.array(z.union([z.string(), z.array(z.string())])),
      finals: z.array(z.union([z.string(), z.array(z.string())])),
    })
    .transform(({ initials, finals }) => ({
      initials: initials.map((x) => (typeof x === `string` ? [x, x] : x)),
      finals: finals.map((x) => (typeof x === `string` ? [x, x] : x)),
    }))
    .transform(deepReadonly)
    .parse((await import(`./hmmPinyinChart.asset.json`)).default),
);

export const loadMnemonicTheme = memoize(async () =>
  z
    .object({
      tones: z.array(z.object({ tone: z.number(), desc: z.string() })),
      initials: z.array(
        z.object({ prefix: z.string(), n: z.string(), desc: z.string() }),
      ),
      finals: z.array(
        z.object({
          suffix: z.string(),
          location: z.string(),
          rationale: z.string(),
        }),
      ),
    })
    .transform((x) => ({
      tones: new Map(x.tones.map((t) => [t.tone, t.desc])),
      initials: new Map(x.initials.map((i) => [i.prefix, i])),
      finals: new Map(x.finals.map((f) => [f.suffix, f])),
    }))
    .transform(deepReadonly)
    .parse((await import(`./mnemonicTheme.asset.json`)).default),
);

export const loadRadicalNameMnemonics = memoize(async () =>
  z
    .array(
      z.tuple([
        z.string(),
        z.array(z.object({ mnemonic: z.string(), rationale: z.string() })),
      ]),
    )
    .transform((x) => new Map(x))
    .transform(deepReadonly)
    .parse((await import(`./radicalNameMnemonics.asset.json`)).default),
);

export const allHsk1Words = memoize(async () =>
  z
    .array(z.string())
    .transform(deepReadonly)
    .parse((await import(`./hsk1Words.asset.json`)).default),
);

export const allHsk2Words = memoize(async () =>
  z
    .array(z.string())
    .transform(deepReadonly)
    .parse((await import(`./hsk2Words.asset.json`)).default),
);

export const allHsk3Words = memoize(async () =>
  z
    .array(z.string())
    .transform(deepReadonly)
    .parse((await import(`./hsk3Words.asset.json`)).default),
);

export const loadWords = memoize(async () =>
  z
    .array(
      z.tuple([
        z.string(),
        z.object({
          pinyin: z.array(z.string()),
          definitions: z.array(z.string()),
        }),
      ]),
    )
    .transform((x) => new Map(x))
    .transform(deepReadonly)
    .parse((await import(`./words.asset.json`)).default),
);

export const loadRadicals = memoize(async () =>
  z
    .array(
      z.object({
        hanzi: z.array(z.string()),
        name: z.array(z.string()),
        pinyin: z.array(z.string()),
      }),
    )
    .transform(deepReadonly)
    .parse((await import(`./radicals.asset.json`)).default),
);

export const allRadicalPrimaryForms = memoize(async () =>
  deepReadonly(
    (await allRadicals()).map((r) => {
      const first = r.hanzi[0];
      invariant(first != null);
      return first;
    }),
  ),
);

export const loadRadicalsByHanzi = memoize(async () =>
  deepReadonly(
    new Map((await loadRadicals()).flatMap((r) => r.hanzi.map((h) => [h, r]))),
  ),
);

const loadRadicalStrokes = memoize(async () =>
  z
    .array(
      z.object({
        strokes: z.number(),
        range: z.tuple([z.number(), z.number()]),
        characters: z.array(z.string()),
      }),
    )
    .transform((x) => new Map(x.map((r) => [r.strokes, r])))
    .transform(deepReadonly)
    .parse((await import(`./radicalStrokes.asset.json`)).default),
);

export const loadRadicalPinyinMnemonics = memoize(async () =>
  z
    .array(
      z.tuple([
        z.string(),
        z.array(
          z.object({
            mnemonic: z.string(),
            strategy: z.string(),
          }),
        ),
      ]),
    )
    .transform((x) => new Map(x))
    .transform(deepReadonly)
    .parse((await import(`./radicalPinyinMnemonics.asset.json`)).default),
);

export const allRadicalNormalizations = memoize(async () =>
  deepReadonly(
    new Map(
      (await loadRadicals()).flatMap(({ hanzi }) =>
        hanzi.map((h) => [h, hanzi[0]]),
      ),
    ),
  ),
);

export const normalizeRadicalOrThrow = async (
  radical: string,
): Promise<string> => {
  const result = (await allRadicalNormalizations()).get(radical);
  invariant(result != null, `couldn't find a normalization for ${radical}`);
  return result;
};

export const allRadicals = async () => await loadRadicals();

export const allRadicalsByStrokes = async () => await loadRadicalStrokes();

export const lookupRadicalNameMnemonic = async (hanzi: string) =>
  (await lookupRadicalNameMnemonics(hanzi))?.[0] ?? null;

export const lookupRadicalNameMnemonics = async (hanzi: string) =>
  (await loadRadicalNameMnemonics()).get(
    await normalizeRadicalOrThrow(hanzi),
  ) ?? null;

export const lookupRadicalPinyinMnemonic = async (hanzi: string) =>
  (await lookupRadicalPinyinMnemonics(hanzi))?.[0] ?? null;

export const lookupRadicalPinyinMnemonics = async (hanzi: string) =>
  (await loadRadicalPinyinMnemonics()).get(
    await normalizeRadicalOrThrow(hanzi),
  ) ?? null;

export const lookupWord = async (hanzi: string) =>
  (await loadWords()).get(hanzi) ?? null;

export const lookupRadicalByHanzi = async (hanzi: string) =>
  (await loadRadicalsByHanzi()).get(hanzi) ?? null;

export const lookupRadicalsByStrokes = async (strokes: number) =>
  (await loadRadicalStrokes()).get(strokes) ?? null;

export const radicalStrokes = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
];

/**
 * Converts a single pinyin word written with a tone number suffix to use a tone
 * mark instead (also converts v to ü).
 */
export function convertPinyinWithToneNumberToToneMark(pinyin: string): string {
  if (pinyin.length === 0) {
    return pinyin;
  }

  // An algorithm to find the correct vowel letter (when there is more than one) is as follows:
  //
  // 1. If there is an a or an e, it will take the tone mark
  // 2. If there is an ou, then the o takes the tone mark
  // 3. Otherwise, the second vowel takes the tone mark

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let tone = `012345`.indexOf(pinyin[pinyin.length - 1]!);

  const pinyinLengthWithoutTone = tone > 0 ? pinyin.length - 1 : pinyin.length;

  let result = ``;
  for (let i = 0; i < pinyinLengthWithoutTone; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const char = pinyin[i]!;

    if (tone > 0) {
      const nextChar = pinyin[i + 1];

      if (char === `a` || char === `e`) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result += toneMap[char][tone]!;
        tone = -1;
        continue;
      } else if (char === `o` && nextChar === `u`) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result += toneMap[char][tone]!;
        tone = -1;
        continue;
      } else if (isPinyinVowel(char)) {
        if (isPinyinVowel(nextChar)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          result += toneMap[char][5]! + toneMap[nextChar][tone]!;
          i++;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          result += toneMap[char][tone]!;
        }
        tone = -1;
        continue;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result += isPinyinVowel(char) ? toneMap[char][5]! : char;
  }
  return result;
}

const toneMap = {
  a: `_āáǎàa`,
  e: `_ēéěèe`,
  i: `_īíǐìi`,
  o: `_ōóǒòo`,
  u: `_ūúǔùu`,
  v: `_ǖǘǚǜü`,
} as const;

const isPinyinVowel = (
  char: string | null | undefined,
): char is `a` | `e` | `i` | `o` | `u` | `v` => char != null && char in toneMap;
