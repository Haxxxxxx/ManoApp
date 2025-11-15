import { adminStorage, adminDb, adminFunctions } from '../firebase/admin';
import { Storage } from '@google-cloud/storage';
import { getStorage } from 'firebase-admin/storage';
import { getFunctions } from 'firebase-admin/functions';
import { getFirestore } from 'firebase-admin/firestore';

// Storage operations using Admin SDK
export const adminUploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const bucket = adminStorage.bucket();
    const blob = bucket.file(path);
    const blobStream = blob.createWriteStream();
    
    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        // Error uploading file using Admin SDK
        reject(error);
      });
      
      blobStream.on('finish', () => {
        blob.getSignedUrl({
          action: 'read',
          expires: Date.now() + TIME_CONSTANTS.ONE_WEEK,
        }).then(([url]) => {
          resolve(url);
        }).catch((error) => {
          // Error getting signed URL
          reject(error);
        });
      });
      
      blobStream.end(file.arrayBuffer());
    });
  } catch (error) {
    // Error uploading file using Admin SDK
    throw error;
  }
};

export const adminDeleteFile = async (path: string): Promise<void> => {
  try {
    const bucket = adminStorage.bucket();
    await bucket.file(path).delete();
    // File deleted successfully
  } catch (error) {
    // Error deleting file using Admin SDK
    throw error;
  }
};

// Functions operations using Admin SDK
export const adminCallFunction = async (functionName: string, data?: unknown) => {
  try {
    // Note: Admin SDK doesn't support direct function calls like the client SDK
    // You'll need to use HTTP calls or the Firebase Admin SDK's REST API
    // Direct function calls are not supported in the Admin SDK
    throw new Error('Direct function calls are not supported in the Admin SDK');
  } catch (error) {
    // Error calling function using Admin SDK
    throw error;
  }
};

// Firestore operations using Admin SDK
export const adminGetDocument = async (collection: string, docId: string) => {
  try {
    const docRef = adminDb.collection(collection).doc(docId);
    const doc = await docRef.get();
    if (!doc.exists) {
      // Document does not exist
      return null;
    }
    // Document retrieved successfully
    return doc.data();
  } catch (error) {
    // Error getting document using Admin SDK
    throw error;
  }
};

export const adminSetDocument = async (collection: string, docId: string, data: Record<string, unknown>) => {
  try {
    const docRef = adminDb.collection(collection).doc(docId);
    await docRef.set(data);
    // Document set successfully
  } catch (error) {
    // Error setting document using Admin SDK
    throw error;
  }
}; 