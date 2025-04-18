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
        console.error('Error uploading file using Admin SDK:', error);
        reject(error);
      });
      
      blobStream.on('finish', () => {
        blob.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        }).then(([url]) => {
          console.log('File uploaded successfully using Admin SDK:', url);
          resolve(url);
        }).catch((error) => {
          console.error('Error getting signed URL:', error);
          reject(error);
        });
      });
      
      blobStream.end(file.arrayBuffer());
    });
  } catch (error) {
    console.error('Error uploading file using Admin SDK:', error);
    throw error;
  }
};

export const adminDeleteFile = async (path: string): Promise<void> => {
  try {
    const bucket = adminStorage.bucket();
    await bucket.file(path).delete();
    console.log('File deleted successfully using Admin SDK:', path);
  } catch (error) {
    console.error('Error deleting file using Admin SDK:', error);
    throw error;
  }
};

// Functions operations using Admin SDK
export const adminCallFunction = async (functionName: string, data?: any) => {
  try {
    // Note: Admin SDK doesn't support direct function calls like the client SDK
    // You'll need to use HTTP calls or the Firebase Admin SDK's REST API
    console.warn('Direct function calls are not supported in the Admin SDK. Please use HTTP calls instead.');
    throw new Error('Direct function calls are not supported in the Admin SDK');
  } catch (error) {
    console.error(`Error calling function ${functionName} using Admin SDK:`, error);
    throw error;
  }
};

// Firestore operations using Admin SDK
export const adminGetDocument = async (collection: string, docId: string) => {
  try {
    const docRef = adminDb.collection(collection).doc(docId);
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log(`Document ${docId} does not exist in collection ${collection}`);
      return null;
    }
    console.log(`Document ${docId} retrieved successfully using Admin SDK`);
    return doc.data();
  } catch (error) {
    console.error(`Error getting document ${docId} using Admin SDK:`, error);
    throw error;
  }
};

export const adminSetDocument = async (collection: string, docId: string, data: any) => {
  try {
    const docRef = adminDb.collection(collection).doc(docId);
    await docRef.set(data);
    console.log(`Document ${docId} set successfully using Admin SDK`);
  } catch (error) {
    console.error(`Error setting document ${docId} using Admin SDK:`, error);
    throw error;
  }
}; 