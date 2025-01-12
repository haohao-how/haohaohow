import { SkillType } from "#data/model.ts";
import * as r from "#data/rizzleSchema.ts";
import { Drizzle } from "#server/lib/db.ts";
import { computeCvrEntities, pull, push } from "#server/lib/replicache.ts";
import * as s from "#server/schema.ts";
import { Rating } from "#util/fsrs.ts";
import { invariant } from "@haohaohow/lib/invariant";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import assert from "node:assert/strict";
import { test } from "node:test";
import { withDbTest, withTxTest } from "./db";

async function createUser(tx: Drizzle, id: string = nanoid()) {
  const [user] = await tx.insert(s.user).values([{ id }]).returning();
  assert.ok(user != null);
  return user;
}

void test(`push()`, async (t) => {
  const txTest = withTxTest(t, { isolationLevel: `repeatable read` });

  await test(`database transaction isolation level`, async (t) => {
    const txTest = withTxTest(t, { isolationLevel: `read committed` });

    await txTest(`fails when using the default`, async (tx) => {
      const result = push(tx, `1`, {
        profileId: ``,
        clientGroupId: ``,
        pushVersion: 1,
        schemaVersion: `3`,
        mutations: [],
      });

      await assert.rejects(result, /transaction_isolation/);
    });
  });

  await txTest(`handles no mutations`, async (tx) => {
    await push(tx, `1`, {
      profileId: ``,
      clientGroupId: ``,
      pushVersion: 1,
      schemaVersion: `3`,
      mutations: [],
    });
  });

  await txTest(
    `only allows a client group if it matches the user`,
    async (tx) => {
      const user1 = await createUser(tx);
      const user2 = await createUser(tx);

      // Create a client group
      const [clientGroup] = await tx
        .insert(s.replicacheClientGroup)
        .values([
          {
            id: `1`,
            userId: user1.id,
            cvrVersion: 1,
          },
        ])
        .returning();
      invariant(clientGroup != null);

      const mut = {
        id: 1,
        name: `noop`,
        args: {},
        timestamp: 10123,
        clientId: `c0f86dc7-4d49-4f37-a25b-4d06c9f1cb37`,
      };

      // User 2 doesn't own the clientGroup
      await assert.rejects(
        push(tx, user2.id, {
          profileId: ``,
          clientGroupId: clientGroup.id,
          pushVersion: 1,
          schemaVersion: `3`,
          mutations: [mut],
        }),
      );

      // User 1 does own the clientGroup
      await push(tx, user1.id, {
        profileId: ``,
        clientGroupId: clientGroup.id,
        pushVersion: 1,
        schemaVersion: `3`,
        mutations: [mut],
      });
    },
  );

  await txTest(
    `creates a client group and client if one doesn't exist`,
    async (tx) => {
      const clientId = `clientid`;
      const clientGroupId = `clientgroupid`;

      const user = await createUser(tx);

      const mut = {
        id: 1,
        name: `noop`,
        args: {},
        timestamp: 1,
        clientId,
      };

      await push(tx, user.id, {
        profileId: ``,
        clientGroupId,
        pushVersion: 1,
        schemaVersion: `3`,
        mutations: [mut],
      });

      const client = await tx.query.replicacheClient.findFirst({
        where: (t, { eq }) => eq(t.id, clientId),
      });
      assert.equal(client?.id, clientId);

      const clientGroup = await tx.query.replicacheClientGroup.findFirst({
        where: (t, { eq }) => eq(t.id, clientGroupId),
      });
      assert.equal(clientGroup?.id, clientGroupId);
    },
  );

  await txTest(`initSkillState() should insert to the db`, async (tx) => {
    const clientId = `clientid`;
    const clientGroupId = `clientgroupid`;

    const user = await createUser(tx);

    const now = new Date();

    const mut = {
      id: 1,
      name: `addSkillState`,
      args: r.initSkillState.marshalArgs({
        skill: {
          type: SkillType.EnglishToHanzi,
          hanzi: `我`,
        },
        now,
      }),
      timestamp: 1,
      clientId,
    };

    await push(tx, user.id, {
      profileId: ``,
      clientGroupId,
      pushVersion: 1,
      schemaVersion: `3`,
      mutations: [mut],
    });

    const skillState = await tx.query.skillState.findFirst({
      where: (t, { eq }) => eq(t.userId, user.id),
    });
    assert.ok(skillState != null);
    assert.deepEqual(skillState.dueAt, now);
    assert.deepEqual(skillState.createdAt, now);
    assert.equal(skillState.srs, null);
    assert.deepEqual(skillState.skill, {
      type: SkillType.EnglishToHanzi,
      hanzi: `我`,
    });
  });

  await txTest(`skips already processed mutations`, async (tx) => {
    const user = await createUser(tx);

    // Create a client group
    const [clientGroup] = await tx
      .insert(s.replicacheClientGroup)
      .values([{ userId: user.id }])
      .returning();
    invariant(clientGroup != null);

    // Create a client
    const [client] = await tx
      .insert(s.replicacheClient)
      .values([{ clientGroupId: clientGroup.id, lastMutationId: 1 }])
      .returning();
    invariant(client != null);

    const mut = {
      id: client.lastMutationId, // use the same ID
      name: `addSkillState`,
      args: r.initSkillState.marshalArgs({
        skill: {
          type: SkillType.EnglishToHanzi,
          hanzi: `我`,
        },
        now: new Date(),
      }),
      timestamp: 1,
      clientId: client.id,
    };

    await push(tx, user.id, {
      profileId: ``,
      clientGroupId: clientGroup.id,
      pushVersion: 1,
      schemaVersion: `3`,
      mutations: [mut],
    });

    assert.deepEqual(
      await tx.query.skillState.findMany({
        where: (t, { eq }) => eq(t.userId, user.id),
      }),
      // The mutation SHOULDN'T have done anything, it should be skipped.
      [],
    );
  });

  await txTest(`does not process mutations from the future`, async (tx) => {
    const user = await createUser(tx);

    // Create a client group
    const [clientGroup] = await tx
      .insert(s.replicacheClientGroup)
      .values([{ userId: user.id }])
      .returning();
    invariant(clientGroup != null);

    // Create a client
    const [client] = await tx
      .insert(s.replicacheClient)
      .values([{ clientGroupId: clientGroup.id, lastMutationId: 1 }])
      .returning();
    invariant(client != null);

    const mut = {
      id: client.lastMutationId + 2,
      name: ``,
      args: {},
      timestamp: 1,
      clientId: client.id,
    };

    await assert.rejects(
      push(tx, user.id, {
        profileId: ``,
        clientGroupId: clientGroup.id,
        pushVersion: 1,
        schemaVersion: `3`,
        mutations: [mut],
      }),
    );
  });

  await txTest(
    `invalid mutations must still update client.lastMutationID`,
    async (tx) => {
      const user = await createUser(tx);

      // Create a client group
      const [clientGroup] = await tx
        .insert(s.replicacheClientGroup)
        .values([{ userId: user.id }])
        .returning();
      invariant(clientGroup != null);

      // Create a client
      const [client] = await tx
        .insert(s.replicacheClient)
        .values([{ clientGroupId: clientGroup.id, lastMutationId: 1 }])
        .returning();
      invariant(client != null);

      const mut = {
        id: client.lastMutationId + 1,
        name: `invalidMutation`,
        args: {},
        timestamp: 1,
        clientId: client.id,
      };

      await push(tx, user.id, {
        profileId: ``,
        clientGroupId: clientGroup.id,
        pushVersion: 1,
        schemaVersion: `3`,
        mutations: [mut],
      });

      assert.partialDeepStrictEqual(
        await tx.query.replicacheClient.findFirst({
          where: (t, { eq }) => eq(t.id, client.id),
        }),
        { lastMutationId: mut.id },
      );
    },
  );

  await txTest(
    `returns correct error for invalid schema version`,
    async (tx) => {
      const result = await push(tx, `1`, {
        profileId: ``,
        clientGroupId: ``,
        pushVersion: 1,
        schemaVersion: `666`,
        mutations: [],
      });

      assert.deepEqual(result, {
        error: `VersionNotSupported`,
        versionType: `schema`,
      });
    },
  );

  await txTest(`returns correct error for invalid push version`, async (tx) => {
    const result = await push(tx, `1`, {
      profileId: ``,
      clientGroupId: ``,
      pushVersion: 666,
      schemaVersion: `3`,
      mutations: [],
    });

    assert.deepEqual(result, {
      error: `VersionNotSupported`,
      versionType: `push`,
    });
  });
});

void test(`pull()`, async (t) => {
  const txTest = withTxTest(t, { isolationLevel: `repeatable read` });

  await test(`database transaction isolation level`, async (t) => {
    const txTest = withTxTest(t, { isolationLevel: `read committed` });

    await txTest(`fails when using the default`, async (tx) => {
      const result = pull(tx, `xxx`, {
        profileId: ``,
        clientGroupId: ``,
        pullVersion: 1,
        schemaVersion: `3`,
        cookie: null,
      });

      await assert.rejects(result, /transaction_isolation/);
    });
  });

  await txTest(`creates a CVR with lastMutationIds`, async (tx) => {
    const clientGroupId = nanoid();
    const user = await createUser(tx);

    await pull(tx, user.id, {
      profileId: ``,
      clientGroupId,
      pullVersion: 1,
      schemaVersion: `3`,
      cookie: null,
    });

    const clientGroup = await tx.query.replicacheClientGroup.findFirst({
      where: (t, { eq }) => eq(t.userId, user.id),
    });

    assert.partialDeepStrictEqual(clientGroup, { cvrVersion: 1 });
  });

  await txTest(
    `non-existant client group creates one and stores cvrVersion`,
    async (tx) => {
      const user = await createUser(tx);

      // Create a client group
      const [clientGroup] = await tx
        .insert(s.replicacheClientGroup)
        .values([{ userId: user.id }])
        .returning();
      invariant(clientGroup != null);

      // Create a client with a specific lastMutationId
      const [client] = await tx
        .insert(s.replicacheClient)
        .values([{ clientGroupId: clientGroup.id, lastMutationId: 66 }])
        .returning();
      invariant(client != null);

      const [skillState] = await tx
        .insert(s.skillState)
        .values([
          {
            userId: user.id,
            dueAt: new Date(),
            srs: null,
            skill: {
              type: SkillType.EnglishToHanzi,
              hanzi: `我`,
            },
          },
        ])
        .returning();
      invariant(skillState != null);

      const result = await pull(tx, user.id, {
        profileId: ``,
        clientGroupId: clientGroup.id,
        pullVersion: 1,
        schemaVersion: `3`,
        cookie: null,
      });

      const cookie = `cookie` in result ? result.cookie : null;
      assert.ok(cookie != null);

      const cvr = await tx.query.replicacheCvr.findFirst({
        where: (t, { eq }) => eq(t.id, cookie.cvrId),
      });

      const expectedEntities = await computeCvrEntities(tx, user.id);

      // The CVR should have the lastMutationIds for the clients in the group
      assert.partialDeepStrictEqual(cvr, {
        lastMutationIds: { [client.id]: 66 },
        entities: expectedEntities,
      });
    },
  );

  await txTest(
    `returns lastMutationIdChanges only for changed clients`,
    async (tx) => {
      const clientGroupId = nanoid();
      const clientId1 = nanoid();
      const clientId2 = nanoid();

      const user = await createUser(tx);

      // Push a mutation from client 1
      await push(tx, user.id, {
        profileId: ``,
        clientGroupId,
        pushVersion: 1,
        schemaVersion: `3`,
        mutations: [
          {
            id: 1,
            name: `noop`,
            args: {},
            timestamp: 1,
            clientId: clientId1,
          },
        ],
      });

      // A pull without a cookie should return all clients (at this point just
      // client 1).
      const pull1 = await pull(tx, user.id, {
        profileId: ``,
        clientGroupId,
        pullVersion: 1,
        schemaVersion: `3`,
        cookie: null,
      });
      assert.ok(`cookie` in pull1);
      assert.deepEqual(pull1.lastMutationIdChanges, {
        [clientId1]: 1,
      });

      // Do a new mutation from client 2
      await push(tx, user.id, {
        profileId: ``,
        clientGroupId,
        pushVersion: 1,
        schemaVersion: `3`,
        mutations: [
          {
            id: 1,
            name: `noop`,
            args: {},
            timestamp: 1,
            clientId: clientId2,
          },
        ],
      });

      // A pull without a cookie should return all clients (now client 1 +
      // client 2).
      const pull2 = await pull(tx, user.id, {
        profileId: ``,
        clientGroupId,
        pullVersion: 1,
        schemaVersion: `3`,
        cookie: null,
      });
      assert.ok(`cookie` in pull2);
      assert.deepEqual(pull2.lastMutationIdChanges, {
        [clientId1]: 1,
        [clientId2]: 1,
      });

      // A pull using cookie1 should only report client 2 as changed.
      const pull3 = await pull(tx, user.id, {
        profileId: ``,
        clientGroupId,
        pullVersion: 1,
        schemaVersion: `3`,
        cookie: pull1.cookie,
      });
      assert.ok(`cookie` in pull3);
      assert.deepEqual(pull3.lastMutationIdChanges, {
        [clientId2]: 1,
      });

      // A pull using cookie3 should report no changes.
      const pull4 = await pull(tx, user.id, {
        profileId: ``,
        clientGroupId,
        pullVersion: 1,
        schemaVersion: `3`,
        cookie: pull3.cookie,
      });
      assert.ok(`cookie` in pull4);
      assert.deepEqual(pull4.lastMutationIdChanges, {});
    },
  );

  await txTest(`null cookie, returns skillState patches`, async (tx) => {
    const clientGroupId = nanoid();

    const user = await createUser(tx);

    const now = new Date();

    const [skillState] = await tx
      .insert(s.skillState)
      .values([
        {
          userId: user.id,
          dueAt: now,
          srs: null,
          skill: {
            type: SkillType.EnglishToHanzi,
            hanzi: `我`,
          },
        },
      ])
      .returning();
    invariant(skillState != null);

    const result = await pull(tx, user.id, {
      profileId: ``,
      clientGroupId,
      pullVersion: 1,
      schemaVersion: `3`,
      cookie: null,
    });

    assert.partialDeepStrictEqual(result, {
      cookie: {
        order: 1,
      },
      patch: [
        { op: `clear` },
        {
          op: `put`,
          key: r.skillState.marshalKey(skillState),
          value: r.skillState.marshalValue({
            createdAt: skillState.createdAt,
            srs: null,
            due: skillState.dueAt,
          }),
        },
      ],
    });
  });

  await txTest(`handles deletes for skillState`, async (tx) => {
    const clientGroupId = nanoid();

    const user = await createUser(tx);

    const now = new Date();

    const [skillState] = await tx
      .insert(s.skillState)
      .values([
        {
          userId: user.id,
          dueAt: now,
          srs: null,
          skill: {
            type: SkillType.EnglishToHanzi,
            hanzi: `我`,
          },
        },
      ])
      .returning();
    invariant(skillState != null);

    const pull1 = await pull(tx, user.id, {
      profileId: ``,
      clientGroupId,
      pullVersion: 1,
      schemaVersion: `3`,
      cookie: null,
    });

    await tx.delete(s.skillState).where(eq(s.skillState.id, skillState.id));

    assert.ok(`cookie` in pull1);

    const pull2 = await pull(tx, user.id, {
      profileId: ``,
      clientGroupId,
      pullVersion: 1,
      schemaVersion: `3`,
      cookie: pull1.cookie,
    });

    assert.partialDeepStrictEqual(pull2, {
      cookie: {
        order: 2,
      },
      patch: [
        {
          op: `del`,
          key: r.skillState.marshalKey(skillState),
        },
      ],
    });
  });

  await txTest(`handles deletes for skillRating`, async (tx) => {
    const clientGroupId = nanoid();

    const user = await createUser(tx);

    const now = new Date();

    const [skillRating] = await tx
      .insert(s.skillRating)
      .values([
        {
          userId: user.id,
          skill: {
            type: SkillType.EnglishToHanzi,
            hanzi: `我`,
          },
          rating: r.rFsrsRating.marshal(Rating.Good),
          createdAt: now,
        },
      ])
      .returning();
    invariant(skillRating != null);

    const pull1 = await pull(tx, user.id, {
      profileId: ``,
      clientGroupId,
      pullVersion: 1,
      schemaVersion: `3`,
      cookie: null,
    });

    await tx.delete(s.skillRating).where(eq(s.skillRating.id, skillRating.id));

    assert.ok(`cookie` in pull1);

    const pull2 = await pull(tx, user.id, {
      profileId: ``,
      clientGroupId,
      pullVersion: 1,
      schemaVersion: `3`,
      cookie: pull1.cookie,
    });

    assert.partialDeepStrictEqual(pull2, {
      cookie: {
        order: 2,
      },
      patch: [
        {
          op: `del`,
          key: r.skillRating.marshalKey({
            skill: skillRating.skill,
            createdAt: now,
          }),
        },
      ],
    });
  });
});

void test(`dbTest() examples`, async (t) => {
  const dbTest = withDbTest(t);

  await dbTest(`should work with inline fixtures 1`, async (db) => {
    await db.insert(s.user).values([{ id: `1` }]);

    // Your test logic here
    const users = await db.select().from(s.user);
    assert.equal(users.length, 1);
  });
});

void test(`computeCvr()`, async (t) => {
  const txTest = withTxTest(t);

  await txTest(`works for non-existant user and client group`, async (tx) => {
    assert.deepEqual(await computeCvrEntities(tx, `1`), {
      pinyinFinalAssociation: {},
      pinyinInitialAssociation: {},
      skillState: {},
      skillRating: {},
    });
  });

  await txTest(`works for user`, async (tx) => {
    const user = await createUser(tx);

    assert.deepEqual(await computeCvrEntities(tx, user.id), {
      pinyinFinalAssociation: {},
      pinyinInitialAssociation: {},
      skillState: {},
      skillRating: {},
    });
  });

  await txTest(`only includes skillState for the user`, async (tx) => {
    const user1 = await createUser(tx);
    const user2 = await createUser(tx);

    const [user1SkillState] = await tx
      .insert(s.skillState)
      .values([
        {
          userId: user1.id,
          skill: {
            type: SkillType.EnglishToHanzi,
            hanzi: `我`,
          },
          srs: null,
          dueAt: new Date(),
          createdAt: new Date(),
        },
        {
          userId: user2.id,
          skill: {
            type: SkillType.EnglishToHanzi,
            hanzi: `我`,
          },
          srs: null,
          dueAt: new Date(),
          createdAt: new Date(),
        },
      ])
      .returning({
        id: s.skillState.id,
        skill: s.skillState.skill,
        version: sql<string>`${s.skillState}.xmin`,
      });
    invariant(user1SkillState != null);

    assert.deepEqual(await computeCvrEntities(tx, user1.id), {
      pinyinFinalAssociation: {},
      pinyinInitialAssociation: {},
      skillRating: {},
      skillState: {
        [user1SkillState.id]:
          user1SkillState.version +
          `:` +
          r.skillState.marshalKey(user1SkillState),
      },
    });
  });

  await txTest(`only includes skillRating for the user`, async (tx) => {
    const user1 = await createUser(tx);
    const user2 = await createUser(tx);

    const [user1SkillRating] = await tx
      .insert(s.skillRating)
      .values([
        {
          userId: user1.id,
          skill: {
            type: SkillType.EnglishToHanzi,
            hanzi: `我`,
          },
          rating: r.rFsrsRating.marshal(Rating.Again),
        },
        {
          userId: user2.id,
          skill: {
            type: SkillType.EnglishToHanzi,
            hanzi: `我`,
          },
          rating: r.rFsrsRating.marshal(Rating.Good),
        },
      ])
      .returning({
        id: s.skillRating.id,
        skill: s.skillRating.skill,
        createdAt: s.skillRating.createdAt,
        version: sql<string>`${s.skillRating}.xmin`,
      });
    invariant(user1SkillRating != null);

    assert.deepEqual(await computeCvrEntities(tx, user1.id), {
      pinyinFinalAssociation: {},
      pinyinInitialAssociation: {},
      skillRating: {
        [user1SkillRating.id]:
          user1SkillRating.version +
          `:` +
          r.skillRating.marshalKey({
            skill: user1SkillRating.skill,
            createdAt: user1SkillRating.createdAt,
          }),
      },
      skillState: {},
    });
  });

  await txTest(
    `only includes pinyinFinalAssociation for the user`,
    async (tx) => {
      const user1 = await createUser(tx);
      const user2 = await createUser(tx);

      const [user1PinyinFinalAssociation] = await tx
        .insert(s.pinyinFinalAssociation)
        .values([
          {
            userId: user1.id,
            final: `p`,
            name: `p1`,
          },
          {
            userId: user2.id,
            final: `p`,
            name: `p2`,
          },
        ])
        .returning({
          id: s.pinyinFinalAssociation.id,
          final: s.pinyinFinalAssociation.final,
          version: sql<string>`${s.pinyinFinalAssociation}.xmin`,
        });
      invariant(user1PinyinFinalAssociation != null);

      assert.deepEqual(await computeCvrEntities(tx, user1.id), {
        pinyinFinalAssociation: {
          [user1PinyinFinalAssociation.id]:
            user1PinyinFinalAssociation.version +
            `:` +
            r.pinyinFinalAssociation.marshalKey(user1PinyinFinalAssociation),
        },
        pinyinInitialAssociation: {},
        skillRating: {},
        skillState: {},
      });
    },
  );

  await txTest(
    `only includes pinyinInitialAssociation for the user`,
    async (tx) => {
      const user1 = await createUser(tx);
      const user2 = await createUser(tx);

      const [user1PinyinInitialAssociation] = await tx
        .insert(s.pinyinInitialAssociation)
        .values([
          {
            userId: user1.id,
            initial: `p`,
            name: `p1`,
          },
          {
            userId: user2.id,
            initial: `p`,
            name: `p2`,
          },
        ])
        .returning({
          id: s.pinyinInitialAssociation.id,
          initial: s.pinyinInitialAssociation.initial,
          version: sql<string>`${s.pinyinInitialAssociation}.xmin`,
        });
      invariant(user1PinyinInitialAssociation != null);

      assert.deepEqual(await computeCvrEntities(tx, user1.id), {
        pinyinFinalAssociation: {},
        pinyinInitialAssociation: {
          [user1PinyinInitialAssociation.id]:
            user1PinyinInitialAssociation.version +
            `:` +
            r.pinyinInitialAssociation.marshalKey(
              user1PinyinInitialAssociation,
            ),
        },
        skillRating: {},
        skillState: {},
      });
    },
  );
});
