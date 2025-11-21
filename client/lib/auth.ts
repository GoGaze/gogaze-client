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
import { setAuthToken, removeAuthToken } from "./cookies";

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();

// Helper function to store token in cookie
const storeToken = async (userCredential: UserCredential): Promise<void> => {
  try {
    const token = await userCredential.user.getIdToken();
    setAuthToken(token);
  } catch (error) {
    console.error("Error storing auth token:", error);
  }
};

// Email/Password Sign In
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await storeToken(userCredential);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

// Email/Password Sign Up
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await storeToken(userCredential);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

// Google Sign In
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    await storeToken(userCredential);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

// Sign Out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    removeAuthToken();
  } catch (error) {
    throw error;
  }
};
