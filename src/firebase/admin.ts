// This file should only be imported in server-side code
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getFunctions } from 'firebase-admin/functions';

// Initialize Firebase Admin
const adminApp = initializeApp({
  credential: cert({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.VITE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
});

// Initialize Admin services
const adminStorage = getStorage(adminApp);
const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);
const adminFunctions = getFunctions(adminApp);

export { adminApp, adminStorage, adminDb, adminAuth, adminFunctions }; 