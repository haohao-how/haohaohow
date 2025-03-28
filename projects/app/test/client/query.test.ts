import {
  computeSkillReviewQueue,
  flagsForSrsState,
  hsk1SkillReview,
} from "#client/query.ts";
import { QuestionFlagType, SrsType } from "#data/model.ts";
import { v7Mutators } from "#data/rizzleMutators.ts";
import { Skill, srsStateFromFsrsState, v7 } from "#data/rizzleSchema.ts";
import { nextReview, Rating } from "#util/fsrs.ts";
import { nanoid } from "#util/nanoid.ts";
import { r } from "#util/rizzle.ts";
import { invariant } from "@haohaohow/lib/invariant";
import assert from "node:assert/strict";
import test from "node:test";
import { parseRelativeTimeShorthand } from "../data/helpers";
import { testReplicacheOptions } from "../util/rizzleHelpers";

await test(`${hsk1SkillReview.name} suite`, async () => {
  await test(`returns everything when no skills have state`, async () => {
    await using rizzle = r.replicache(testReplicacheOptions(), v7, v7Mutators);

    // Sanity check that there should be a bunch in the queue
    const skills = await hsk1SkillReview(rizzle);
    assert.ok(skills.length > 100);
  });
});

await test(`${simulateSkillReviews.name} returns a review queue`, async () => {
  const reviewQueue = await simulateSkillReviews({
    targetSkills: [`he:分:divide`],
    history: [],
  });

  assert.deepEqual(reviewQueue, [
    `he:丿:slash`,
    `he:𠃌:radical`,
    `he:刀:knife`,
    `he:八:eight`,
    `he:分:divide`,
  ]);
});

await test(`${computeSkillReviewQueue.name} suite`, async () => {
  await test(`incorrect answers in a quiz don't get scheduled prematurely`, async () => {
    const reviewQueue = await simulateSkillReviews({
      targetSkills: [`he:分:divide`],
      history: [
        // first question is 丿:slash but they get it wrong. 八 is one of the
        // wrong choices they submit so it's also marked wrong.
        `❌ he:丿:slash he:八:eight`,
        `💤 1h`, // wait past he:八:eight due date
      ],
    });

    // Make sure 八 didn't jump the queue before 𠃌 because it hasn't been
    // introduced yet, instead they should have to answer 𠃌 again.
    const 𠃌Index = reviewQueue.indexOf(`he:𠃌:radical`);
    const 八Index = reviewQueue.indexOf(`he:八:eight`);
    assert.ok(
      𠃌Index < 八Index,
      `he:𠃌:radical should be scheduled before he:八:eight`,
    );
  });

  await test(`learns new skills first (stable sorted to maintain graph order) rather than reviewing not-due skills`, async () => {
    const reviewQueue = await simulateSkillReviews({
      targetSkills: [`he:分:divide`],
      history: [`✅ he:丿:slash`, `💤 1m`],
    });

    assert.deepEqual(reviewQueue, [
      `he:𠃌:radical`,
      `he:刀:knife`,
      `he:八:eight`,
      `he:分:divide`,
      `he:丿:slash`,
    ]);
  });

  await test(`doesn't get stuck reviewing the same skill after all due skills are done`, async () => {
    const targetSkills: Skill[] = [`he:分:divide`];
    const history: SkillReviewOp[] = [
      `❌ he:𠃌:radical`, // Get it wrong initially (so after all the reviews it will have lower "stability" than the others).
      `💤 5s`,
      `✅ he:𠃌:radical`, // Then answer it correctly.
      `💤 5s`,
      `✅ he:刀:knife`,
      `💤 5s`,
      `✅ he:八:eight`,
      `💤 5s`,
      `✅ he:分:divide`,
      `💤 5s`,
      `✅ he:丿:slash`,
    ];

    const [review1] = await simulateSkillReviews({ targetSkills, history });
    history.push(`💤 10s`, `✅ ${review1!}`);
    const [review2] = await simulateSkillReviews({ targetSkills, history });
    history.push(`💤 10s`, `✅ ${review2!}`);
    const [review3] = await simulateSkillReviews({ targetSkills, history });

    assert.notDeepEqual(
      [review1, review2, review3],
      [review1, review1, review1],
    );
  });
});

await test(`${flagsForSrsState.name} suite`, async () => {
  await test(`marks a question as new if it has no srs`, async () => {
    assert.deepEqual(
      flagsForSrsState({
        type: SrsType.Mock,
        prevReviewAt: new Date(),
        nextReviewAt: new Date(),
      }),
      { type: QuestionFlagType.NewSkill },
    );
  });

  await test(`marks a question as new if it has fsrs state but is not stable enough to be introduced`, async () => {
    assert.deepEqual(
      flagsForSrsState(srsStateFromFsrsState(nextReview(null, Rating.Again))),
      { type: QuestionFlagType.NewSkill },
    );
  });
});

type SkillReviewOp =
  | `${`✅` | `✅(easy)` | `✅(hard)` | `❌`} ${Skill}`
  | `💤 ${string}`;

/**
 * Testing helper to calculate a skill review queue based on a history of
 * simulated reviews.
 */
async function simulateSkillReviews({
  targetSkills,
  history,
}: {
  targetSkills: Skill[];
  history: SkillReviewOp[];
}): Promise<Skill[]> {
  await using rizzle = r.replicache(testReplicacheOptions(), v7, v7Mutators);
  let now = new Date();

  for (const event of history) {
    const [op, ...args] = event.split(` `);
    invariant(op != null);

    switch (op) {
      // jump forward in time
      case `💤`: {
        invariant(args[0] != null);
        now = parseRelativeTimeShorthand(args[0], now);
        break;
      }
      // skill rating
      case `❌`:
      case `✅`:
      case `✅(easy)`:
      case `✅(hard)`: {
        const rating =
          op === `✅`
            ? Rating.Good
            : op === `✅(easy)`
              ? Rating.Easy
              : op === `✅(hard)`
                ? Rating.Hard
                : Rating.Again;
        const skills = args as Skill[]; // TODO: shuffle the skills to see if it's sensitive to ordering?

        for (const skill of skills) {
          await rizzle.mutate.rateSkill({ id: nanoid(), skill, rating, now });
        }
        break;
      }
      default: {
        throw new Error(`Invalid operation: ${op}`);
      }
    }
  }

  const reviewQueue = await computeSkillReviewQueue(rizzle, targetSkills, now);
  return reviewQueue;
}
