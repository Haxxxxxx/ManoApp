import { useState, useCallback } from 'react';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../firebase/config';

interface StorageState {
  loading: boolean;
  error: Error | null;
  progress: number;
}

interface StorageActions {
  uploadFile: (file: File, path: string) => Promise<string>;
  deleteFile: (path: string) => Promise<void>;
  getFileUrl: (path: string) => Promise<string>;
}

/**
 * Custom hook for handling Firebase Storage operations
 * @returns Object containing storage state and actions
 */
export function useStorage(): StorageState & StorageActions {
  const [state, setState] = useState<StorageState>({
    loading: false,
    error: null,
    progress: 0
  });

  /**
   * Upload a file to Firebase Storage
   * @param file - File to upload
   * @param path - Storage path
   * @returns Promise resolving to the download URL
   */
  const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
    if (!storage) {
      throw new Error('Storage service is not available');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }));

      // Create storage reference
      const storageRef = ref(storage, path);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      setState(prev => ({ ...prev, loading: false, progress: 100 }));
      return downloadURL;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Upload failed')
      }));
      throw error;
    }
  }, []);

  /**
   * Delete a file from Firebase Storage
   * @param path - Storage path of the file to delete
   */
  const deleteFile = useCallback(async (path: string): Promise<void> => {
    if (!storage) {
      throw new Error('Storage service is not available');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Delete failed')
      }));
      throw error;
    }
  }, []);

  /**
   * Get the download URL for a file
   * @param path - Storage path of the file
   * @returns Promise resolving to the download URL
   */
  const getFileUrl = useCallback(async (path: string): Promise<string> => {
    if (!storage) {
      throw new Error('Storage service is not available');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      setState(prev => ({ ...prev, loading: false }));
      return url;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to get file URL')
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    uploadFile,
    deleteFile,
    getFileUrl
  };
} 