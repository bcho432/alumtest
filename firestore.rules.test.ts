import * as fs from 'fs';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

// Helper functions
const createTestUser = (uid: string, isAdmin = false) => ({
  uid,
  email: `${uid}@example.com`,
  displayName: `Test User ${uid}`,
  isAdmin,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

const createTestProfile = (id: string, ownerId: string) => ({
  id,
  ownerId,
  name: `Test Profile ${id}`,
  description: 'Test description',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

// Tests for editor request stats
describe('Editor Request Stats', () => {
  it('allows users to read their own request stats', async () => {
    const uid = 'user1';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    await db.collection('users').doc(uid).collection('editorRequestStats').doc('stats').set({
      pendingRequests: 0,
      lastRequestAt: null,
      cooldownUntil: null,
    });

    const stats = await db.collection('users').doc(uid).collection('editorRequestStats').doc('stats').get();
    expect(stats.exists).toBe(true);
  });

  it('allows users to update their own request stats', async () => {
    const uid = 'user1';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    await assertSucceeds(
      db.collection('users').doc(uid).collection('editorRequestStats').doc('stats').set({
        pendingRequests: 1,
        lastRequestAt: Timestamp.now(),
        cooldownUntil: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      })
    );
  });

  it('prevents users from reading other users request stats', async () => {
    const uid = 'user1';
    const otherUid = 'user2';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    await assertFails(
      db.collection('users').doc(otherUid).collection('editorRequestStats').doc('stats').get()
    );
  });
});

// Tests for editor requests
describe('Editor Requests', () => {
  it('allows users to create requests with valid stats', async () => {
    const uid = 'user1';
    const profileId = 'profile1';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    // Set up valid request stats
    await db.collection('users').doc(uid).collection('editorRequestStats').doc('stats').set({
      pendingRequests: 0,
      lastRequestAt: null,
      cooldownUntil: null,
    });

    await assertSucceeds(
      db.collection('editorRequests').add({
        userId: uid,
        profileId,
        status: 'pending',
        reason: 'I want to help manage this profile',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    );
  });

  it('prevents users from creating requests with invalid stats', async () => {
    const uid = 'user1';
    const profileId = 'profile1';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    // Set up invalid request stats (too many pending requests)
    await db.collection('users').doc(uid).collection('editorRequestStats').doc('stats').set({
      pendingRequests: 3,
      lastRequestAt: Timestamp.now(),
      cooldownUntil: null,
    });

    await assertFails(
      db.collection('editorRequests').add({
        userId: uid,
        profileId,
        status: 'pending',
        reason: 'I want to help manage this profile',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    );
  });

  it('allows users to read their own requests', async () => {
    const uid = 'user1';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    const requestRef = await db.collection('editorRequests').add({
      userId: uid,
      profileId: 'profile1',
      status: 'pending',
      reason: 'Test request',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const request = await requestRef.get();
    expect(request.exists).toBe(true);
  });

  it('allows admins to read all requests for their profiles', async () => {
    const uid = 'user1';
    const profileId = 'profile1';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    // Create a profile with the user as admin
    await db.collection('profiles').doc(profileId).set({
      ...createTestProfile(profileId, uid),
      roles: {
        [uid]: 'admin',
      },
    });

    // Create a request from another user
    await db.collection('editorRequests').add({
      userId: 'user2',
      profileId,
      status: 'pending',
      reason: 'Test request',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const requests = await db.collection('editorRequests').where('profileId', '==', profileId).get();
    expect(requests.size).toBe(1);
  });

  it('allows users to update their own request status', async () => {
    const uid = 'user1';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    const requestRef = await db.collection('editorRequests').add({
      userId: uid,
      profileId: 'profile1',
      status: 'pending',
      reason: 'Test request',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await assertSucceeds(
      requestRef.update({
        status: 'withdrawn',
        updatedAt: Timestamp.now(),
      })
    );
  });

  it('prevents users from updating other fields in their requests', async () => {
    const uid = 'user1';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    const requestRef = await db.collection('editorRequests').add({
      userId: uid,
      profileId: 'profile1',
      status: 'pending',
      reason: 'Test request',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await assertFails(
      requestRef.update({
        reason: 'Updated reason',
        updatedAt: Timestamp.now(),
      })
    );
  });

  it('allows admins to delete requests', async () => {
    const uid = 'user1';
    const profileId = 'profile1';
    const db = testEnv.authenticatedContext(uid).firestore();
    
    // Create a profile with the user as admin
    await db.collection('profiles').doc(profileId).set({
      ...createTestProfile(profileId, uid),
      roles: {
        [uid]: 'admin',
      },
    });

    const requestRef = await db.collection('editorRequests').add({
      userId: 'user2',
      profileId,
      status: 'pending',
      reason: 'Test request',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await assertSucceeds(requestRef.delete());
  });
}); 