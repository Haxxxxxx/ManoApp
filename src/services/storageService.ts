import { ref, listAll, getDownloadURL, uploadBytes, deleteObject, FirebaseStorage, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase/config';
import { FILE_SIZE_LIMITS, ALLOWED_AUDIO_TYPES, ALLOWED_IMAGE_TYPES, UPLOAD_CHUNK_SIZE } from '../utils/constants';
import { retry } from '../utils/retry';

const SHARED_DRIVE_FOLDER = 'shared-drive';
const NOTION_TEMPLATES_FOLDER = 'notion-templates';
const COVER_ART_FOLDER = 'cover-art';

// Helper function to check if storage is available
const checkStorage = (): FirebaseStorage => {
  if (!storage) {
    throw new Error('Storage service is not available');
  }
  return storage;
};

export const getSharedDriveFiles = async () => {
  const storageInstance = checkStorage();

  try {
    const sharedDriveRef = ref(storageInstance, SHARED_DRIVE_FOLDER);
    const filesList = await listAll(sharedDriveRef);
    
    // Get download URLs for all files
    const filesWithUrls = await Promise.all(
      filesList.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          name: item.name,
          fullPath: item.fullPath,
          url: url
        };
      })
    );
    
    return filesWithUrls;
  } catch (error) {
    // Error accessing shared drive
    throw new Error('Failed to access shared drive. Please check your Firebase Storage configuration.');
  }
};

export const getNotionTemplate = async (templateName: string) => {
  const storageInstance = checkStorage();

  try {
    const templateRef = ref(storageInstance, `${NOTION_TEMPLATES_FOLDER}/${templateName}`);
    const url = await getDownloadURL(templateRef);
    return url;
  } catch (error) {
    // Error getting Notion template
    throw new Error('Failed to get Notion template. Please check your Firebase Storage configuration.');
  }
};

export const storageService = {
  async uploadFile(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
    const storageInstance = checkStorage();

    try {
      const storageRef = ref(storageInstance, path);
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
            // Upload error - reject immediately
            reject(new Error(`Failed to upload file: ${error.message || 'Unknown error'}`));
          },
          async () => {
            try {
              const downloadURL = await retry(
                () => getDownloadURL(uploadTask.snapshot.ref),
                {
                  maxAttempts: 3,
                  initialDelay: 500,
                }
              );
              resolve(downloadURL);
            } catch (error) {
              // Error getting download URL
              reject(new Error('Failed to get download URL. Please check your Firebase Storage configuration.'));
            }
          }
        );
      });
    } catch (error) {
      // Error in uploadFile
      throw new Error('Failed to upload file. Please check your Firebase Storage configuration.');
    }
  },

  async uploadFileInChunks(file: File, path: string, _chunkSize = UPLOAD_CHUNK_SIZE, onProgress?: (progress: number) => void): Promise<string> {
    const storageInstance = checkStorage();

    try {
      // For large files, use resumable upload which handles chunking automatically
      // Firebase Storage handles chunking internally for resumable uploads
      const storageRef = ref(storageInstance, path);
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
            // Upload error
            reject(new Error(`Failed to upload file: ${error.message || 'Unknown error'}`));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              // Error getting download URL
              reject(new Error('Failed to get download URL. Please check your Firebase Storage configuration.'));
            }
          }
        );
      });
    } catch (error) {
      // Error in uploadFileInChunks
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
export const uploadMusicFile = async (
  file: File,
  tripId: string,
  songId?: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.AUDIO_STORAGE) {
      throw new Error(`File size exceeds ${FILE_SIZE_LIMITS.AUDIO_STORAGE / (1024 * 1024)}MB limit`);
    }

    // Validate file type
    const isValidType = ALLOWED_AUDIO_TYPES.includes(file.type as typeof ALLOWED_AUDIO_TYPES[number]);
    if (!isValidType) {
      throw new Error(`Invalid file type. Allowed types: ${ALLOWED_AUDIO_TYPES.join(', ')}`);
    }

    // Create file path
    const timestamp = Date.now();
    const filePath = songId
      ? `music/${tripId}/${songId}_${timestamp}.${file.name.split('.').pop()}`
      : `music/${tripId}/${timestamp}.${file.name.split('.').pop()}`;

    // Use storageService.uploadFile for progress tracking
    if (onProgress) {
      // Create metadata for the upload
      const metadata = {
        contentType: file.type,
        customMetadata: {
          tripId,
          songId: songId || 'new',
          uploadedAt: timestamp.toString(),
        },
      };
      
      // Use resumable upload with metadata and progress tracking
      const storageRef = ref(checkStorage(), filePath);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            reject(new Error(`Failed to upload file: ${error.message || 'Unknown error'}`));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(new Error('Failed to get download URL. Please check your Firebase Storage configuration.'));
            }
          }
        );
      });
    }

    // Fallback to direct upload if no progress callback needed
    const storageRef = ref(checkStorage(), filePath);
    const metadata = {
      contentType: file.type,
      customMetadata: {
        tripId,
        songId: songId || 'new',
        uploadedAt: timestamp.toString(),
      },
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    // Error in uploadMusicFile
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
  if (file.size > FILE_SIZE_LIMITS.AUDIO_STORAGE) {
    throw new Error(`File size exceeds maximum limit of ${FILE_SIZE_LIMITS.AUDIO_STORAGE / (1024 * 1024)}MB`);
  }

  // Validate file type
  const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number]);
  if (!isValidType) {
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
    
    return downloadURL;
  } catch (error) {
    // Error uploading cover art
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
    // File deleted successfully
  } catch (error) {
    // Error deleting file
    throw error;
  }
};

export const getAudioUrl = async (filePath: string): Promise<string> => {
  try {
    const storageInstance = checkStorage();
    const audioRef = ref(storageInstance, filePath);
    return await getDownloadURL(audioRef);
  } catch (error) {
    // Error getting audio URL
    throw new Error('Failed to get audio URL');
  }
}; 

/**
 * Upload multiple stem files in batch with progress tracking
 * @param files Array of files to upload
 * @param tripId The ID of the trip
 * @param songId The ID of the song
 * @param onProgress Callback for overall progress (0-100)
 * @param onFileProgress Callback for individual file progress (fileIndex, progress)
 * @returns Array of storage paths for uploaded files
 */
export const uploadStemFiles = async (
  files: File[],
  tripId: string,
  songId: string,
  onProgress?: (overallProgress: number) => void,
  onFileProgress?: (fileIndex: number, progress: number) => void
): Promise<string[]> => {
  const storageInstance = checkStorage();
  const uploadedPaths: string[] = [];
  const totalFiles = files.length;
  let completedFiles = 0;

  try {
    // Validate all files first
    for (const file of files) {
      if (file.size > FILE_SIZE_LIMITS.AUDIO_STORAGE) {
        throw new Error(`File ${file.name} exceeds ${FILE_SIZE_LIMITS.AUDIO_STORAGE / (1024 * 1024)}MB limit`);
      }

      const isValidType = ALLOWED_AUDIO_TYPES.includes(file.type as typeof ALLOWED_AUDIO_TYPES[number]);
      if (!isValidType) {
        throw new Error(`Invalid file type for ${file.name}. Allowed types: ${ALLOWED_AUDIO_TYPES.join(', ')}`);
      }
    }

    // Upload files sequentially to avoid overwhelming the connection
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const filePath = `stems/${tripId}/${songId}/${timestamp}_${i}_${file.name}`;

      const storageRef = ref(storageInstance, filePath);
      const metadata = {
        contentType: file.type,
        customMetadata: {
          tripId,
          songId,
          stemIndex: i.toString(),
          uploadedAt: timestamp.toString(),
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const fileProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onFileProgress) {
              onFileProgress(i, fileProgress);
            }

            // Calculate overall progress
            const overallProgress = ((completedFiles + (fileProgress / 100)) / totalFiles) * 100;
            if (onProgress) {
              onProgress(overallProgress);
            }
          },
          (error) => {
            reject(new Error(`Failed to upload stem file ${file.name}: ${error.message || 'Unknown error'}`));
          },
          async () => {
            try {
              await getDownloadURL(uploadTask.snapshot.ref);
              uploadedPaths.push(filePath);
              completedFiles++;
              
              // Update overall progress
              const overallProgress = (completedFiles / totalFiles) * 100;
              if (onProgress) {
                onProgress(overallProgress);
              }

              resolve();
            } catch (error) {
              reject(new Error(`Failed to get download URL for ${file.name}`));
            }
          }
        );
      });
    }

    return uploadedPaths;
  } catch (error) {
    // If any file fails, clean up successfully uploaded files
    for (const path of uploadedPaths) {
      try {
        await deleteFile(path);
      } catch (deleteError) {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}; 