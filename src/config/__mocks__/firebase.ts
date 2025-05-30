import { mockFirebase } from '../../tests/setup/firebase-mocks';

export const getFirebaseServices = mockFirebase.auth.getAuth;
export const initializeApp = mockFirebase.auth.getAuth;
export const getApps = mockFirebase.auth.getAuth;
export const getApp = mockFirebase.auth.getAuth;

const firebaseMocks = {
  getFirebaseServices,
  initializeApp,
  getApps,
  getApp,
};

export default firebaseMocks; 