// lib/auth.ts

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";
import { syncSession, clearSession } from "./cookies";

const googleProvider = new GoogleAuthProvider();

const storeToken = async (userCredential: UserCredential): Promise<void> => {
  try {
    await syncSession(await userCredential.user.getIdToken());
  } catch (error) {
    console.error("Error establishing session:", error);
  }
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await storeToken(userCredential);
  return userCredential;
};

export const signUpWithEmail = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await storeToken(userCredential);
  return userCredential;
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  await storeToken(userCredential);
  return userCredential;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
  await clearSession();
};
