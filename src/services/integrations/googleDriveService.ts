/**
 * Google Drive Service (Client-side)
 * 
 * Client-side service for interacting with Google Drive integration
 */

import { httpsCallable, Functions } from 'firebase/functions';
import { functions } from '../../firebase/config';
import { Asset } from '../../types/asset';

/**
 * Start Google Drive OAuth flow
 * Returns the OAuth authorization URL
 */
export async function startGoogleDriveOAuth(): Promise<{ authUrl: string; state: string }> {
  if (!functions) {
    throw new Error('Firebase Functions service is not available. Please check your Firebase configuration.');
  }

  try {
    const startOAuth = httpsCallable<{}, { authUrl: string; state: string }>(
      functions as Functions,
      'startGoogleDriveOAuth'
    );

    const result = await startOAuth({});
    
    if (!result.data?.authUrl || !result.data?.state) {
      throw new Error('Invalid response from OAuth service');
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to start Google Drive OAuth: ${error.message}`);
    }
    throw new Error('Failed to start Google Drive OAuth: Unknown error');
  }
}

/**
 * Handle Google Drive OAuth callback
 * Exchanges authorization code for tokens
 */
export async function handleGoogleDriveCallback(
  code: string,
  state: string
): Promise<{ success: boolean }> {
  if (!functions) {
    throw new Error('Firebase Functions service is not available. Please check your Firebase configuration.');
  }

  if (!code || !state) {
    throw new Error('OAuth callback parameters are missing');
  }

  try {
    const handleCallback = httpsCallable<
      { code: string; state: string },
      { success: boolean }
    >(functions as Functions, 'handleGoogleDriveCallback');

    const result = await handleCallback({ code, state });
    
    if (!result.data?.success) {
      throw new Error('OAuth callback failed');
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to complete Google Drive OAuth: ${error.message}`);
    }
    throw new Error('Failed to complete Google Drive OAuth: Unknown error');
  }
}

/**
 * Drive file interface
 */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

/**
 * List files options
 */
export interface ListFilesOptions {
  pageSize?: number;
  pageToken?: string;
  query?: string;
}

/**
 * List files result
 */
export interface ListFilesResult {
  files: DriveFile[];
  nextPageToken?: string;
}

/**
 * List Google Drive files
 */
export async function listGoogleDriveFiles(
  options: ListFilesOptions = {}
): Promise<ListFilesResult> {
  if (!functions) {
    throw new Error('Firebase Functions service is not available. Please check your Firebase configuration.');
  }

  try {
    const listFiles = httpsCallable<ListFilesOptions, ListFilesResult>(
      functions as Functions,
      'listGoogleDriveFiles'
    );

    const result = await listFiles(options);
    
    if (!result.data) {
      throw new Error('Invalid response from Google Drive service');
    }
    
    return {
      files: result.data.files || [],
      nextPageToken: result.data.nextPageToken,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list Google Drive files: ${error.message}`);
    }
    throw new Error('Failed to list Google Drive files: Unknown error');
  }
}

/**
 * Import file options
 */
export interface ImportFileOptions {
  fileId: string;
  projectId?: string;
  targetFolder?: string;
}

/**
 * Import file result
 */
export interface ImportFileResult {
  assetId: string;
  duplicate: boolean;
  message?: string;
  asset?: Asset;
}

/**
 * Import file from Google Drive to ManoApp
 */
export async function importGoogleDriveFile(
  options: ImportFileOptions
): Promise<ImportFileResult> {
  if (!functions) {
    throw new Error('Firebase Functions service is not available. Please check your Firebase configuration.');
  }

  if (!options.fileId) {
    throw new Error('File ID is required');
  }

  try {
    const importFile = httpsCallable<ImportFileOptions, ImportFileResult>(
      functions as Functions,
      'importGoogleDriveFile'
    );

    const result = await importFile(options);
    
    if (!result.data) {
      throw new Error('Invalid response from import service');
    }
    
    if (!result.data.assetId) {
      throw new Error('Import failed: No asset ID returned');
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to import file: ${error.message}`);
    }
    throw new Error('Failed to import file: Unknown error');
  }
}

/**
 * Check if user has Google Drive connected
 */
export async function isGoogleDriveConnected(): Promise<boolean> {
  try {
    // Try to list files (will fail if not connected)
    await listGoogleDriveFiles({ pageSize: 1 });
    return true;
  } catch (error) {
    // Log error in development for debugging
    if (import.meta.env.DEV) {
      console.debug('Google Drive connection check failed:', error);
    }
    return false;
  }
}

