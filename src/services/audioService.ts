import { getStorage, ref, getDownloadURL } from 'firebase/storage';

interface AudioMetadata {
  duration: number;
  waveform?: number[];
  bpm?: number;
  key?: string;
}

export const audioService = {
  getMetadata: async (file: File): Promise<AudioMetadata> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        const metadata: AudioMetadata = {
          duration: audio.duration,
        };
        URL.revokeObjectURL(objectUrl);
        resolve(metadata);
      });

      audio.addEventListener('error', (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load audio file: ${error.message}`));
      });

      audio.src = objectUrl;
    });
  },

  getAuthenticatedUrl: async (filePath: string): Promise<string> => {
    try {
      if (filePath.startsWith('https://')) {
        const storage = getStorage();
        const pathWithoutParams = filePath.split('?')[0];
        const storagePath = decodeURIComponent(pathWithoutParams.split('/o/')[1]);
        const storageRef = ref(storage, storagePath);
        return await getDownloadURL(storageRef);
      }
      return filePath;
    } catch (error) {
      // Error getting authenticated URL
      throw error;
    }
  },


  createAudioElement: async (filePath: string): Promise<HTMLAudioElement> => {
    try {
      const authenticatedUrl = await audioService.getAuthenticatedUrl(filePath);
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.src = authenticatedUrl;
      return audio;
    } catch (error) {
      // Error creating audio element
      throw error;
    }
  }
}; 