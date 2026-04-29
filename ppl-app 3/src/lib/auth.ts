// src/lib/auth.ts
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (!userDoc.exists()) throw new Error('User profile not found');
  return { id: cred.user.uid, ...userDoc.data() } as unknown as User;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return { id: uid, ...userDoc.data() } as User;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    const profile = await getUserProfile(firebaseUser.uid);
    callback(profile);
  });
}
