import { Song } from '../types/index';
import { removeFileExtension } from '../utils/formatters';

// Add type declarations for File System Access API
declare global {
  interface FileSystemFileHandle extends FileSystemHandle {
    kind: 'file';
    getFile(): Promise<File>;
  }
}

export interface LocalFile {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
}

export const convertLocalFileToSong = (file: LocalFile): Song => {
  return {
    id: `local-${file.path}-${file.lastModified.getTime()}`,
    title: removeFileExtension(file.name),
    artist: 'Local File',
    duration: '0:00', // Default duration as string
    filePath: file.path,
    userId: 'local', // Default user ID for local files
    metadata: {
      // Add custom properties that won't conflict with the type
      source: 'local' as const,
      _originalFileName: file.name,
      _fileSize: file.size,
      _lastModified: file.lastModified.getTime(),
      tags: [],
      genre: []
    }
  };
};

export const scanDirectory = async (directoryHandle: FileSystemDirectoryHandle): Promise<LocalFile[]> => {
  const audioFiles: LocalFile[] = [];
  const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

  try {
    const entries: FileSystemHandle[] = [];
    for await (const entry of directoryHandle.values()) {
      entries.push(entry);
    }

    for (const entry of entries) {
      if (entry.kind === 'file' && entry instanceof FileSystemFileHandle) {
        const file = await entry.getFile();
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (allowedExtensions.includes(extension)) {
          audioFiles.push({
            name: file.name,
            path: entry.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified)
          });
        }
      } else if (entry.kind === 'directory' && entry instanceof FileSystemDirectoryHandle) {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(entry);
        audioFiles.push(...subFiles);
      }
    }
  } catch (error) {
    // Error scanning directory
    throw new Error('Failed to scan directory for audio files');
  }

  return audioFiles;
};

export const getAudioMetadata = async (file: File): Promise<{
  duration: number;
  bitrate?: number;
  sampleRate?: number;
}> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(audio.src);
      resolve({
        duration: audio.duration,
      });
    });

    audio.addEventListener('error', (_error) => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio file for metadata extraction'));
    });
  });
};

export const validateAudioFile = (file: File): boolean => {
  const allowedTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a'
  ];

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

  return (
    allowedTypes.includes(file.type) ||
    allowedExtensions.includes(extension)
  );
}; 