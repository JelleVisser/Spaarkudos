import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const projectId = 'demo-spaarkudos';
const groupId = 'family-group';
const ownerUid = 'parent-owner';

let testEnvironment;

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

async function createGroup() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'groups', groupId), {
      id: groupId,
      name: 'Familie naam',
      createdBy: ownerUid,
    });
  });
}

describe('Firestore owner access rules', () => {
  it('allows a signed-in parent to create their own group', async () => {
    const owner = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertSucceeds(
      setDoc(doc(owner, 'groups', groupId), {
        id: groupId,
        name: 'Familie naam',
        createdBy: ownerUid,
      }),
    );
  });

  it('prevents a parent from creating a group owned by somebody else', async () => {
    const owner = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertFails(
      setDoc(doc(owner, 'groups', groupId), {
        id: groupId,
        name: 'Familie naam',
        createdBy: 'another-parent',
      }),
    );
  });

  it('allows only the group owner to read a member', async () => {
    await createGroup();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'groups', groupId, 'members', 'child'), {
        id: 'child',
        name: 'Kind',
        currentBalance: 0,
        periodicReward: null,
      });
    });

    const owner = testEnvironment.authenticatedContext(ownerUid).firestore();
    const otherParent = testEnvironment.authenticatedContext('another-parent').firestore();

    await expect(
      assertSucceeds(getDoc(doc(owner, 'groups', groupId, 'members', 'child'))),
    ).resolves.toBeDefined();
    await expect(
      assertFails(getDoc(doc(otherParent, 'groups', groupId, 'members', 'child'))),
    ).resolves.toBeDefined();
  });

  it('allows the group owner to create, rename, and delete a member', async () => {
    await createGroup();
    const owner = testEnvironment.authenticatedContext(ownerUid).firestore();
    const member = doc(owner, 'groups', groupId, 'members', 'child');

    await assertSucceeds(
      setDoc(member, {
        id: 'child',
        name: 'Kind',
        currentBalance: 0,
        periodicReward: null,
      }),
    );
    await assertSucceeds(updateDoc(member, { name: 'Nieuwe naam' }));
    await assertSucceeds(deleteDoc(member));
  });

  it('prevents another parent from changing a member', async () => {
    await createGroup();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'groups', groupId, 'members', 'child'), {
        id: 'child',
        name: 'Kind',
        currentBalance: 0,
        periodicReward: null,
      });
    });
    const otherParent = testEnvironment.authenticatedContext('another-parent').firestore();

    await assertFails(
      updateDoc(doc(otherParent, 'groups', groupId, 'members', 'child'), { name: 'Ongewenst' }),
    );
  });

  it('denies unauthenticated direct Firestore reads', async () => {
    await createGroup();
    const unauthenticated = testEnvironment.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(unauthenticated, 'groups', groupId)));
  });
});
