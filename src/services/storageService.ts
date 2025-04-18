import { ref, listAll, getDownloadURL, uploadBytes, deleteObject, FirebaseStorage } from 'firebase/storage';
import { storage } from '../firebase/config';
import { adminUploadFile, adminDeleteFile } from './adminService';
import { getStorage } from 'firebase/storage';

const SHARED_DRIVE_FOLDER = 'shared-drive';
const NOTION_TEMPLATES_FOLDER = 'notion-templates';
const MUSIC_FILES_FOLDER = 'music-files';
const COVER_ART_FOLDER = 'cover-art';

// Maximum file size in bytes (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed music file types
const ALLOWED_MUSIC_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/m4a'
];

// Allowed image file types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Helper function to check if storage is available
const checkStorage = () => {
  if (!storage) {
    throw new Error('Storage service is not available. Please check your Firebase configuration and ensure Storage is enabled in your project.');
  }
  return storage as FirebaseStorage;
};

export const getSharedDriveFiles = async () => {
  const storageInstance = checkStorage();

  try {
    const storageRef = ref(storageInstance, SHARED_DRIVE_FOLDER);
    const result = await listAll(storageRef);
    
    const files = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          name: item.name,
          url,
          path: item.fullPath
        };
      })
    );
    
    return files;
  } catch (error) {
    console.error('Error getting shared drive files:', error);
    throw new Error('Failed to get shared drive files. Please check your Firebase Storage configuration.');
  }
};

export const getNotionTemplate = async (templateName: string) => {
  const storageInstance = checkStorage();

  try {
    const templateRef = ref(storageInstance, `${NOTION_TEMPLATES_FOLDER}/${templateName}`);
    const url = await getDownloadURL(templateRef);
    return url;
  } catch (error) {
    console.error('Error getting Notion template:', error);
    throw new Error('Failed to get Notion template. Please check your Firebase Storage configuration.');
  }
};

export const storageService = {
  async uploadFile(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
    checkStorageAvailability();

    try {
      const storageRef = ref(storage as FirebaseStorage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Upload error:', error);
            reject(new Error('Failed to upload file. Please check your Firebase Storage configuration.'));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(new Error('Failed to get download URL. Please check your Firebase Storage configuration.'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw new Error('Failed to upload file. Please check your Firebase Storage configuration.');
    }
  },

  async uploadFileInChunks(file: File, path: string, chunkSize = 5 * 1024 * 1024, onProgress?: (progress: number) => void): Promise<string> {
    checkStorageAvailability();

    try {
      const totalChunks = Math.ceil(file.size / chunkSize);
      const storageRef = ref(storage as FirebaseStorage, path);
      let uploadedBytes = 0;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        const chunkRef = ref(storage as FirebaseStorage, `${path}_chunk_${i}`);
        await uploadBytesResumable(chunkRef, chunk);
        
        uploadedBytes += chunk.size;
        if (onProgress) {
          onProgress((uploadedBytes / file.size) * 100);
        }
      }

      const uploadTask = uploadBytesResumable(storageRef, file);
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.error('Chunk upload error:', error);
            reject(new Error('Failed to upload file chunks. Please check your Firebase Storage configuration.'));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(new Error('Failed to get download URL. Please check your Firebase Storage configuration.'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadFileInChunks:', error);
      throw new Error('Failed to upload file in chunks. Please check your Firebase Storage configuration.');
    }
  }
};

/**
 * Upload a music file to Firebase Storage
 * @param file The file to upload
 * @param tripId The ID of the trip this file belongs to
 * @param songId The ID of the song this file belongs to (optional)
 * @returns The download URL of the uploaded file
 */
export const uploadMusicFile = async (file: File, tripId: string, songId?: string): Promise<string> => {
  const storageInstance = checkStorage();

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Validate file type
  if (!ALLOWED_MUSIC_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MUSIC_TYPES.join(', ')}`);
  }

  try {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = songId 
      ? `${MUSIC_FILES_FOLDER}/${tripId}/${songId}/${fileName}`
      : `${MUSIC_FILES_FOLDER}/${tripId}/${fileName}`;
    
    const storageRef = ref(storageInstance, filePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('Music file uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading music file:', error);
    throw error;
  }
};

/**
 * Upload a cover art image to Firebase Storage
 * @param file The image file to upload
 * @param tripId The ID of the trip this file belongs to
 * @param songId The ID of the song this file belongs to (optional)
 * @returns The download URL of the uploaded file
 */
export const uploadCoverArt = async (file: File, tripId: string, songId?: string): Promise<string> => {
  const storageInstance = checkStorage();

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  try {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = songId 
      ? `${COVER_ART_FOLDER}/${tripId}/${songId}/${fileName}`
      : `${COVER_ART_FOLDER}/${tripId}/${fileName}`;
    
    const storageRef = ref(storageInstance, filePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('Cover art uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading cover art:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param filePath The path of the file to delete
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  const storageInstance = checkStorage();

  try {
    const storageRef = ref(storageInstance, filePath);
    await deleteObject(storageRef);
    console.log('File deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const getAudioUrl = async (filePath: string): Promise<string> => {
  try {
    const storageInstance = checkStorage();
    const audioRef = ref(storageInstance, filePath);
    return await getDownloadURL(audioRef);
  } catch (error) {
    console.error('Error getting audio URL:', error);
    throw new Error('Failed to get audio URL');
  }
}; 