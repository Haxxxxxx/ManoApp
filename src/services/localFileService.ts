import { Song } from '../types';

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
    title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
    artist: 'Local File',
    duration: '0:00', // Default duration as string
    filePath: file.path,
    userId: 'local', // Default user ID for local files
    metadata: {
      // Add custom properties that won't conflict with the type
      _source: 'local',
      _originalFileName: file.name,
      _fileSize: file.size,
      _lastModified: file.lastModified.toISOString()
    }
  };
};

export const scanDirectory = async (directoryHandle: FileSystemDirectoryHandle): Promise<LocalFile[]> => {
  const audioFiles: LocalFile[] = [];
  const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

  try {
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file') {
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
      } else if (entry.kind === 'directory') {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(entry);
        audioFiles.push(...subFiles);
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error);
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

    audio.addEventListener('error', (error) => {
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