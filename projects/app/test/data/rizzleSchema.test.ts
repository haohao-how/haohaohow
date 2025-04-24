import { SkillType } from "#data/model.ts";
import { rSkill, rSkillType } from "#data/rizzleSchema.ts";
import { hanziWordToGloss } from "#data/skills.ts";
import { r } from "#util/rizzle.ts";
import assert from "node:assert/strict";
import type { TestContext } from "node:test";
import test from "node:test";
import type { ReadTransaction, WriteTransaction } from "replicache";

function makeMockTx(t: TestContext) {
  const readTx = {
    get: t.mock.fn<ReadTransaction[`get`]>(async () => undefined),
    scan: t.mock.fn<ReadTransaction[`scan`]>(() => {
      return null as never;
    }),
    clientID: null as never,
    environment: null as never,
    location: null as never,
    has: null as never,
    isEmpty: null as never,
  } satisfies ReadTransaction;

  const writeTx = {
    ...readTx,
    set: t.mock.fn<WriteTransaction[`set`]>(async () => undefined),
    mutationID: null as never,
    reason: null as never,
    put: null as never,
    del: null as never,
  } satisfies WriteTransaction;

  return {
    ...writeTx,
    readonly: readTx,
    [Symbol.dispose]: () => {
      writeTx.get.mock.resetCalls();
      writeTx.set.mock.resetCalls();
      writeTx.scan.mock.resetCalls();
    },
  };
}

await test(`skill as key`, async (t) => {
  const posts = r.entity(`foo/[skill]`, {
    skill: rSkill(),
    text: r.string(),
  });

  // Marshal and unmarshal round tripping
  for (const skill of [`eh:好:good`, `he:好:good`] as const) {
    using tx = makeMockTx(t);
    await posts.set(tx, { skill }, { skill, text: `hello` });
    const [, marshaledData] = tx.set.mock.calls[0]!.arguments;
    tx.get.mock.mockImplementationOnce(async () => marshaledData);
    assert.deepEqual(await posts.get(tx, { skill }), {
      skill,
      text: `hello`,
    });
    assert.equal(tx.get.mock.callCount(), 1);
    assert.deepEqual(tx.get.mock.calls[0]?.arguments, [`foo/${skill}`]);
  }
});

await test(`${rSkillType.name}()`, async (t) => {
  const posts = r.entity(`foo/[id]`, {
    id: r.string(),
    skill: rSkillType(),
  });

  // Marshal and unmarshal round tripping
  for (const skillType of [
    SkillType.Deprecated_EnglishToRadical,
    SkillType.Deprecated_PinyinToRadical,
    SkillType.Deprecated_RadicalToEnglish,
    SkillType.Deprecated_RadicalToPinyin,
    SkillType.Deprecated,
    SkillType.GlossToHanziWord,
    SkillType.HanziWordToGloss,
    SkillType.HanziWordToPinyin,
    SkillType.HanziWordToPinyinFinal,
    SkillType.HanziWordToPinyinInitial,
    SkillType.HanziWordToPinyinTone,
    SkillType.ImageToHanziWord,
    SkillType.PinyinToHanziWord,
  ] as const) {
    using tx = makeMockTx(t);

    await posts.set(tx, { id: `1` }, { id: `1`, skill: skillType });
    const [, marshaledData] = tx.set.mock.calls[0]!.arguments;
    tx.get.mock.mockImplementationOnce(async () => marshaledData);
    assert.deepEqual(await posts.get(tx, { id: `1` }), {
      id: `1`,
      skill: skillType,
    });
  }
});

await test(`${rSkill.name}()`, async (t) => {
  const posts = r.entity(`foo/[id]`, {
    id: r.string(),
    skill: rSkill(),
  });

  // Marshal and unmarshal round tripping
  for (const skill of [hanziWordToGloss(`好:good`)] as const) {
    using tx = makeMockTx(t);
    const id = `1`;
    await posts.set(tx, { id }, { id, skill });
    const [, marshaledData] = tx.set.mock.calls[0]!.arguments;
    tx.get.mock.mockImplementationOnce(async () => marshaledData);
    assert.deepEqual(await posts.get(tx, { id }), { id, skill });
  }
});
