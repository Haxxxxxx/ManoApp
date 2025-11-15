import { initializeApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';

// Load environment variables
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_APP_ID'
];

for (const envVar of requiredEnvVars) {
  if (!env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize Firebase only if no apps exist
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  // Error initializing Firebase app - critical error, app may not function
  throw error;
}

// Initialize services with error handling
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;

try {
  auth = getAuth(app);
} catch (error) {
  // Error initializing Firebase Auth - critical error
  throw error;
}

try {
  db = getFirestore(app);
} catch (error) {
  // Error initializing Firebase Firestore - critical error
  throw error;
}

try {
  storage = getStorage(app);
} catch (error) {
  // Error initializing Firebase Storage - critical error
  if (env.PROD) {
    throw error;
  }
}

try {
  functions = getFunctions(app);
} catch (error) {
  // Error initializing Firebase Functions - critical error
  if (env.PROD) {
    throw error;
  }
}

export { app, auth, db, storage, functions };
