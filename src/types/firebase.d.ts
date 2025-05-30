import { Firestore, Auth, Storage } from 'firebase/firestore';

declare module '@/lib/firebase' {
  export const firestoreDb: Firestore;
  export const auth: Auth;
  export const storage: Storage;
} 