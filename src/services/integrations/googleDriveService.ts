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
    throw new Error('Firebase Functions service is not available');
  }

  const startOAuth = httpsCallable<{}, { authUrl: string; state: string }>(
    functions as Functions,
    'startGoogleDriveOAuth'
  );

  const result = await startOAuth({});
  return result.data;
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
    throw new Error('Firebase Functions service is not available');
  }

  const handleCallback = httpsCallable<
    { code: string; state: string },
    { success: boolean }
  >(functions as Functions, 'handleGoogleDriveCallback');

  const result = await handleCallback({ code, state });
  return result.data;
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
    throw new Error('Firebase Functions service is not available');
  }

  const listFiles = httpsCallable<ListFilesOptions, ListFilesResult>(
    functions as Functions,
    'listGoogleDriveFiles'
  );

  const result = await listFiles(options);
  return result.data;
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
    throw new Error('Firebase Functions service is not available');
  }

  const importFile = httpsCallable<ImportFileOptions, ImportFileResult>(
    functions as Functions,
    'importGoogleDriveFile'
  );

  const result = await importFile(options);
  return result.data;
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
    return false;
  }
}

