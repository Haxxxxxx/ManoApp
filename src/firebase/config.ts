import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Load environment variables
const env = import.meta.env;

// Debug environment variables
console.log('Environment variables:', {
  apiKey: env.VITE_FIREBASE_API_KEY ? '***' : 'missing',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Validate required configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.error('Missing Firebase configuration:', missingFields);
  throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Storage
let storage;
try {
  // Initialize storage without explicit bucket
  storage = getStorage(app);
  console.log('Firebase Storage initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Storage:', error);
  if (error instanceof Error) {
    console.error('Storage initialization error details:', error.message);
  }
  // Set storage to null instead of throwing
  storage = null;
}

export { storage };

// Log initialization status
console.log('Firebase initialized:', {
  app: !!app,
  auth: !!auth,
  db: !!db,
  storage: !!storage,
  config: {
    ...firebaseConfig,
    apiKey: '***', // Hide the actual API key in logs
    storageBucket: firebaseConfig.storageBucket // Show the storage bucket for debugging
  }
}); 