import {
  allHsk1Words,
  allHsk2Words,
  allHsk3Words,
  allRadicalPrimaryForms,
  loadHanziDecomposition,
  parseIds,
  unicodeShortIdentifier,
  walkIdsNode,
} from "#dictionary/dictionary.ts";
import { jsonStringifyIndentOneLevel } from "#util/json.ts";
import { invariant } from "@haohaohow/lib/invariant";
import * as fontkit from "fontkit";
import { glob, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.join(import.meta.dirname, `..`);

const notoSansSc = await fontkit.open(
  path.join(projectRoot, `src/assets/fonts/NotoSansSC-VariableFont_wght.ttf`),
);
invariant(notoSansSc.type === `TTF`, `expected a TTF font`);

let pingFangPath;
for await (const p of glob(
  // Sequoia 15.3 path
  `/System/Library/AssetsV2/com_apple_MobileAsset_Font7/*.asset/AssetData/PingFang.ttc`,
)) {
  pingFangPath = p;
  break;
}
invariant(pingFangPath != null, `expected to find PingFang font`);

const pingFangCollection = await fontkit.open(pingFangPath);
invariant(pingFangCollection.type === `TTC`, `expected a TTC font`);
const pingFang = pingFangCollection.fonts[0];
invariant(pingFang != null);

const allChars = new Set(
  (await allRadicalPrimaryForms())
    .concat(await allHsk1Words())
    .concat(await allHsk2Words())
    .concat(await allHsk3Words())
    // Split words into characters because decomposition is per-character.
    .flatMap((x) => Array.from(x)),
);

const allComponents = new Set<string>();
const decompositions = await loadHanziDecomposition();

for (const char of allChars) {
  allComponents.add(char);
  const ids = decompositions.get(char);
  invariant(
    ids != null,
    `character "${char}" (${unicodeShortIdentifier(char)}) has no decomposition`,
  );
  const idsNode = parseIds(ids);
  for (const leaf of walkIdsNode(idsNode)) {
    if (leaf.type === `LeafCharacter`) {
      allComponents.add(leaf.character);
    }
  }
}

const missingGlyphs = new Set<string>();

for (const char of allComponents) {
  const codePoint = char.codePointAt(0);
  invariant(codePoint != null);
  const isMissingGlyph =
    notoSansSc.glyphForCodePoint(codePoint).id === 0 &&
    pingFang.glyphForCodePoint(codePoint).id === 0;
  if (isMissingGlyph) {
    missingGlyphs.add(char);
  }
}

await writeFile(
  path.join(
    import.meta.dirname,
    `../src/dictionary/missingFontGlyphs.asset.json`,
  ),
  jsonStringifyIndentOneLevel({ [`macOS`]: [...missingGlyphs].sort() }),
  `utf8`,
);
