/**
 * Google Drive Service
 * 
 * Wrappers for Google Drive API operations
 */

import { drive_v3, google } from 'googleapis';
import { getValidAccessToken } from './auth';
import * as crypto from 'crypto';

/**
 * Get Google Drive API client
 */
async function getDriveClient(userId: string): Promise<drive_v3.Drive> {
  const accessToken = await getValidAccessToken(userId);
  
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.drive({ version: 'v3', auth });
}

/**
 * List files from Google Drive
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

export interface ListFilesOptions {
  pageSize?: number;
  pageToken?: string;
  query?: string;
}

export interface ListFilesResult {
  files: DriveFile[];
  nextPageToken?: string;
}

export async function listFiles(
  userId: string,
  options: ListFilesOptions = {}
): Promise<ListFilesResult> {
  const drive = await getDriveClient(userId);
  
  const params: drive_v3.Params$Resource$Files$List = {
    pageSize: options.pageSize || 20,
    pageToken: options.pageToken,
    q: options.query || "trashed=false",
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, thumbnailLink)',
  };

  const response = await drive.files.list(params);
  
  const files: DriveFile[] = (response.data.files || []).map(file => ({
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType || 'application/octet-stream',
    size: file.size,
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink,
    thumbnailLink: file.thumbnailLink,
  }));

  return {
    files,
    nextPageToken: response.data.nextPageToken || undefined,
  };
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  userId: string,
  fileId: string
): Promise<DriveFile> {
  const drive = await getDriveClient(userId);
  
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, modifiedTime, webViewLink, thumbnailLink',
  });

  const file = response.data;
  
  return {
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType || 'application/octet-stream',
    size: file.size,
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink,
    thumbnailLink: file.thumbnailLink,
  };
}

/**
 * Download file from Google Drive
 */
export async function downloadFile(
  userId: string,
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  const drive = await getDriveClient(userId);
  
  // Get file metadata first
  const metadata = await getFileMetadata(userId, fileId);
  
  // Download file content
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
    },
    {
      responseType: 'arraybuffer',
    }
  );

  const buffer = Buffer.from(response.data as ArrayBuffer);
  
  return {
    buffer,
    mimeType: metadata.mimeType,
    filename: metadata.name,
  };
}

/**
 * Compute SHA256 hash of a buffer
 */
export function computeHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validate file MIME type
 */
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
  'audio/vorbis',
  'audio/x-m4a',
  'audio/mp4',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

