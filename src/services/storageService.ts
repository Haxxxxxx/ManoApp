import { ref, listAll, getDownloadURL, uploadBytesResumable, UploadTask, FirebaseStorage } from 'firebase/storage';
import { storage } from '../firebase/config';

const SHARED_DRIVE_FOLDER = 'shared-drive';
const NOTION_TEMPLATES_FOLDER = 'notion-templates';

const checkStorageAvailability = () => {
  if (!storage) {
    throw new Error('Firebase Storage is not available. Please check your configuration and ensure Storage is enabled in your Firebase project.');
  }
};

export const getSharedDriveFiles = async () => {
  checkStorageAvailability();

  try {
    const storageRef = ref(storage as FirebaseStorage, SHARED_DRIVE_FOLDER);
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
  checkStorageAvailability();

  try {
    const templateRef = ref(storage as FirebaseStorage, `${NOTION_TEMPLATES_FOLDER}/${templateName}`);
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