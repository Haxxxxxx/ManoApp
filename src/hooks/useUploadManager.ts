import { useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Song } from '../types/song';
import type { SongMetadata } from '../types/song';
import type { ArtistProfile } from '../types/artist';
import { createSong, updateSong } from '../services/firebaseService';
import { uploadMusicFile, uploadCoverArt } from '../services/storageService';
import { audioService } from '../services/audioService';
import { validateAudioFile } from '../utils/fileValidation';
import { FILE_SIZE_LIMITS } from '../utils/constants';
import { getErrorMessage } from '../utils/storageHelpers';
import { removeFileExtension, formatDuration } from '../utils/formatters';
import { checkUploadDuplicates, hasDuplicates, getDuplicateAsset } from '../services/uploadService';
import { isFeatureEnabled } from '../config/features';
import type { Asset } from '../types/asset';

interface UseUploadManagerParams {
  selectedTrip: string | null | undefined;
  currentUser: User | null;
  artistProfile: ArtistProfile | null;
}

interface UseUploadManagerReturn {
  isUploading: boolean;
  uploadProgress: number;
  uploadErrors: Array<{ file: File; error: string }>;
  validFiles: File[];
  duplicateDialogOpen: boolean;
  setDuplicateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  duplicateAsset: Asset | null;
  setDuplicateAsset: React.Dispatch<React.SetStateAction<Asset | null>>;
  pendingFile: File | null;
  setPendingFile: React.Dispatch<React.SetStateAction<File | null>>;
  onDrop: (
    acceptedFiles: File[],
    setSongs: React.Dispatch<React.SetStateAction<Song[]>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>
  ) => Promise<void>;
}

export function useUploadManager({
  selectedTrip,
  currentUser,
  artistProfile,
}: UseUploadManagerParams): UseUploadManagerReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadErrors, setUploadErrors] = useState<Array<{ file: File; error: string }>>([]);
  const [validFiles, setValidFiles] = useState<File[]>([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateAsset, setDuplicateAsset] = useState<Asset | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const validateFile = (file: File) => {
    return validateAudioFile(file, FILE_SIZE_LIMITS.AUDIO_UPLOAD);
  };

  const onDrop = useCallback(
    async (
      acceptedFiles: File[],
      setSongs: React.Dispatch<React.SetStateAction<Song[]>>,
      setError: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
      if (!currentUser || !selectedTrip) {
        setError('Please select a project first');
        return;
      }

      setUploadErrors([]);
      setValidFiles([]);
      setIsUploading(true);
      setUploadProgress(0);

      // Validate all files first
      const errors: Array<{ file: File; error: string }> = [];
      const valid: File[] = [];

      acceptedFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push({ file, error });
        } else {
          valid.push(file);
        }
      });

      setUploadErrors(errors);
      setValidFiles(valid);

      if (valid.length === 0) {
        setIsUploading(false);
        return;
      }

      // Track upload progress across all files
      let completedFiles = 0;
      const totalFiles = valid.length;
      const fileProgress: { [key: number]: number } = {};

      const updateOverallProgress = () => {
        const totalProgress = Object.values(fileProgress).reduce((sum, progress) => sum + progress, 0);
        const overallProgress = totalProgress / totalFiles;
        setUploadProgress(Math.min(overallProgress, 100));
      };

      try {
        await Promise.all(
          valid.map(async (file, index) => {
            try {
              // Check if it's an audio file
              if (
                file.type.startsWith('audio/') ||
                file.type === 'application/octet-stream' ||
                file.name.toLowerCase().endsWith('.mp3') ||
                file.name.toLowerCase().endsWith('.wav') ||
                file.name.toLowerCase().endsWith('.flac') ||
                file.name.toLowerCase().endsWith('.aac') ||
                file.name.toLowerCase().endsWith('.ogg') ||
                file.name.toLowerCase().endsWith('.m4a')
              ) {
                // Check for duplicates if feature enabled
                if (isFeatureEnabled('fingerprint') && currentUser) {
                  const duplicates = await checkUploadDuplicates(file, currentUser.uid);
                  if (hasDuplicates(duplicates)) {
                    const dupAsset = getDuplicateAsset(duplicates);
                    if (dupAsset) {
                      setDuplicateAsset(dupAsset);
                      setPendingFile(file);
                      setDuplicateDialogOpen(true);
                      return;
                    }
                  }
                }

                // Get audio metadata
                const metadata = await audioService.getMetadata(file);

                // Upload the audio file with progress tracking
                const filePath = await uploadMusicFile(file, selectedTrip, undefined, (progress) => {
                  fileProgress[index] = progress;
                  updateOverallProgress();
                });

                // Create a clean metadata object
                const cleanMetadata: Partial<SongMetadata> = {
                  tags: ['uploaded'],
                  genre: [],
                  source: 'upload' as const,
                  _originalFileName: file.name,
                  _fileSize: file.size,
                  _lastModified: file.lastModified,
                };

                if (metadata.bpm) cleanMetadata.bpm = metadata.bpm;
                if (metadata.key) cleanMetadata.key = metadata.key;

                const newSong: Omit<Song, 'id'> = {
                  title: removeFileExtension(file.name),
                  artist: artistProfile?.name || currentUser.email?.split('@')[0] || 'Unknown Artist',
                  duration: formatDuration(metadata.duration),
                  filePath,
                  userId: currentUser.uid,
                  metadata: cleanMetadata,
                };

                const createdSong = await createSong(selectedTrip, newSong);
                setSongs((prev) => [...prev, createdSong]);

                completedFiles++;
                fileProgress[index] = 100;
                updateOverallProgress();
              }
              // Check if it's an image file
              else if (
                file.type.startsWith('image/') ||
                file.name.toLowerCase().endsWith('.jpg') ||
                file.name.toLowerCase().endsWith('.jpeg') ||
                file.name.toLowerCase().endsWith('.png') ||
                file.name.toLowerCase().endsWith('.gif')
              ) {
                const imagePath = await uploadCoverArt(file, selectedTrip);

                setSongs((currentSongs) => {
                  if (currentSongs.length > 0) {
                    const firstSong = currentSongs[0];
                    updateSong(firstSong.id, { imagePath }).catch((err) => {
                      setError(getErrorMessage(err, 'Failed to update song with cover art'));
                    });
                    return currentSongs.map((song) =>
                      song.id === firstSong.id ? { ...song, imagePath } : song
                    );
                  } else {
                    const newSong: Omit<Song, 'id'> = {
                      title: 'Cover Art',
                      artist: artistProfile?.name || currentUser.email?.split('@')[0] || 'Unknown Artist',
                      duration: '0:00',
                      filePath: imagePath,
                      imagePath,
                      userId: currentUser.uid,
                      metadata: {
                        tags: ['cover-art'],
                        genre: [],
                        source: 'upload',
                      },
                    };

                    createSong(selectedTrip, newSong)
                      .then((createdSong) => {
                        setSongs((prev) => {
                          if (prev.some((s) => s.id === createdSong.id)) {
                            return prev;
                          }
                          return [...prev, createdSong];
                        });
                      })
                      .catch((err) => {
                        setError(getErrorMessage(err, 'Failed to create song with cover art'));
                      });

                    return currentSongs;
                  }
                });

                completedFiles++;
                fileProgress[index] = 100;
                updateOverallProgress();
              } else {
                setError(`Unsupported file type: ${file.type} for file ${file.name}`);
                completedFiles++;
                fileProgress[index] = 100;
                updateOverallProgress();
              }
            } catch (fileError) {
              setUploadErrors((prev) => [
                ...prev,
                {
                  file,
                  error: fileError instanceof Error ? fileError.message : 'Upload failed',
                },
              ]);
              completedFiles++;
              fileProgress[index] = 100;
              updateOverallProgress();
            }
          })
        );

        setUploadProgress(100);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to upload files'));
      } finally {
        setIsUploading(false);
      }
    },
    [selectedTrip, currentUser, artistProfile]
  );

  return {
    isUploading,
    uploadProgress,
    uploadErrors,
    validFiles,
    duplicateDialogOpen,
    setDuplicateDialogOpen,
    duplicateAsset,
    setDuplicateAsset,
    pendingFile,
    setPendingFile,
    onDrop,
  };
}
