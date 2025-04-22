import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { ref } from 'firebase/storage';

// Load environment variables
const env = import.meta.env;

// Debug environment variables
console.log('Environment variables:', {
  apiKey: env.VITE_FIREBASE_API_KEY ? '***' : 'missing',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN? '***' : 'missing',
  projectId: env.VITE_FIREBASE_PROJECT_ID? '***' : 'missing',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET? '***' : 'missing',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID? '***' : 'missing',
  appId: env.VITE_FIREBASE_APP_ID? '***' : 'missing',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID? '***' : 'missing'
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize Firebase only if no apps exist
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log('Firebase app initialized successfully');
  console.log('Firebase config:', {
    projectId: app.options.projectId,
    storageBucket: app.options.storageBucket,
    apiKey: app.options.apiKey ? '***' : 'missing',
    authDomain: app.options.authDomain ? '***' : 'missing'
  });
} catch (error) {
  console.error('Error initializing Firebase app:', error);
  throw error;
}

// Initialize services with error handling
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;

try {
  auth = getAuth(app);
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Auth:', error);
  throw error;
}

try {
  db = getFirestore(app);
  console.log('Firebase Firestore initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Firestore:', error);
  throw error;
}

try {
  // Initialize storage with environment variable bucket
  console.log('Attempting to initialize Firebase Storage...');
  console.log('Storage bucket from env:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
  console.log('App options:', {
    projectId: app.options.projectId,
    storageBucket: app.options.storageBucket
  });
  
  storage = getStorage(app);
  
  if (!storage) {
    console.error('Storage initialization returned null or undefined');
    throw new Error('Storage service is not available');
  }
  console.log('Firebase Storage initialized successfully with bucket:', storage.app.options.storageBucket);
} catch (error) {
  console.error('Error initializing Firebase Storage:', error);
  if (import.meta.env.PROD) {
    throw error;
  }
  console.warn('Continuing without Firebase Storage in development mode');
}

try {
  functions = getFunctions(app);
  console.log('Firebase Functions initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Functions:', error);
  if (import.meta.env.PROD) {
    throw error; // Throw error in production
  }
  // In development, we'll allow the app to continue without functions
  console.warn('Continuing without Firebase Functions in development mode');
}

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    // Check if emulators are running before connecting
    const checkEmulator = async (port: number) => {
      try {
        const response = await fetch(`http://localhost:${port}`);
        return response.ok;
      } catch (error) {
        console.log(`Emulator not running on port ${port}`);
        return false;
      }
    };

    // Connect to emulators if they're running
    const connectToEmulators = async () => {
      console.log('Checking for Firebase emulators...');
      
      const authRunning = await checkEmulator(9099);
      const firestoreRunning = await checkEmulator(8080);
      const storageRunning = await checkEmulator(9199);
      const functionsRunning = await checkEmulator(5001);

      if (authRunning) {
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('Connected to Auth emulator');
      } else {
        console.log('Auth emulator not running. Using production Auth service.');
      }

      if (firestoreRunning) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Connected to Firestore emulator');
      } else {
        console.log('Firestore emulator not running. Using production Firestore service.');
      }

      if (storage && storageRunning) {
        connectStorageEmulator(storage, 'localhost', 9199);
        console.log('Connected to Storage emulator');
      } else if (storage) {
        console.log('Storage emulator not running. Using production Storage service.');
      }

      if (functions && functionsRunning) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log('Connected to Functions emulator');
      } else if (functions) {
        console.log('Functions emulator not running. Using production Functions service.');
      }
      
      if (!authRunning && !firestoreRunning && !storageRunning && !functionsRunning) {
        console.log('No emulators detected. Using production Firebase services.');
      }
    };

    connectToEmulators();
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error);
    console.log('Continuing with production Firebase services.');
  }
}

export { app, auth, db, storage, functions };
