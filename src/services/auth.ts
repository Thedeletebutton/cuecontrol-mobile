import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { getFirebaseApp } from './firebase';

// Admin users - these emails have full DJ access without needing a license key
const ADMIN_EMAILS: string[] = [
  'trinitromusic@gmail.com',
];

let auth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!auth) {
    const app = getFirebaseApp();
    if (app) {
      auth = getAuth(app);
    }
  }
  return auth;
}

export function getCurrentUser(): User | null {
  const authInstance = getFirebaseAuth();
  return authInstance?.currentUser || null;
}

export function getCurrentUserId(): string | null {
  return getCurrentUser()?.uid || null;
}

export async function signUp(email: string, password: string): Promise<User> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) throw new Error('Firebase not initialized');

  const credential = await createUserWithEmailAndPassword(authInstance, email, password);
  return credential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) throw new Error('Firebase not initialized');

  const credential = await signInWithEmailAndPassword(authInstance, email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) throw new Error('Firebase not initialized');

  await firebaseSignOut(authInstance);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(authInstance, callback);
}

// Check if the current user is an admin
export function isAdmin(): boolean {
  const user = getCurrentUser();
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

// Check if a specific email is an admin
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Get list of admin emails
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}
