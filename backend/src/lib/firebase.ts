import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { env } from '../config/env.js';

let auth: Auth | null | undefined;

/** Lazily initialises firebase-admin. Returns null when Firebase credentials are not configured. */
export function getFirebaseAuth(): Auth | null {
  if (auth !== undefined) return auth;

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    auth = null;
    return auth;
  }

  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    auth = getAuth();
  } catch (error) {
    console.error('[firebase] admin initialisation failed', error);
    auth = null;
  }
  return auth;
}
