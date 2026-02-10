import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, LinearProgress, IconButton,
  TextField, Chip, Alert, List, ListItem, ListItemText, ListItemIcon,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { Song } from '../../types/song';
import { useAuth } from '../../contexts/AuthContext';
import { createSong } from '../../services/firebaseService';
import { uploadMusicFile } from '../../services/storageService';
import { audioService } from '../../services/audioService';
import { validateAudioFile } from '../../utils/fileValidation';
import { FILE_SIZE_LIMITS } from '../../utils/constants';
import { removeFileExtension, formatDuration } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/storageHelpers';

interface BatchUploadPanelProps {
  tripId: string;
  onClose: () => void;
  onSongsCreated?: (songs: Song[]) => void;
}

interface FileEntry {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
  abortController?: AbortController;
}

const BatchUploadPanel: React.FC<BatchUploadPanelProps> = ({ tripId, onClose, onSongsCreated }) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [sharedArtist, setSharedArtist] = useState('');
  const [sharedGenre, setSharedGenre] = useState('');
  const [sharedTags, setSharedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => {
      const err = validateAudioFile(f, FILE_SIZE_LIMITS.AUDIO_UPLOAD);
      return !err;
    });
    setFiles(prev => [...prev, ...droppedFiles.map(f => ({ file: f, status: 'pending' as const, progress: 0 }))]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter(f => {
      const err = validateAudioFile(f, FILE_SIZE_LIMITS.AUDIO_UPLOAD);
      return !err;
    });
    setFiles(prev => [...prev, ...selected.map(f => ({ file: f, status: 'pending' as const, progress: 0 }))]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !sharedTags.includes(tagInput.trim())) {
      setSharedTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleUploadAll = async () => {
    if (!currentUser || !tripId || files.length === 0) return;
    setUploading(true);
    const createdSongs: Song[] = [];

    for (let i = 0; i < files.length; i++) {
      const entry = files[i];
      if (entry.status === 'done') continue;

      const controller = new AbortController();
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading', abortController: controller } : f));

      try {
        const metadata = await audioService.getMetadata(entry.file);
        const filePath = await uploadMusicFile(entry.file, tripId, undefined, (progress) => {
          setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, progress } : f));
        });

        const newSong: Omit<Song, 'id'> = {
          title: removeFileExtension(entry.file.name),
          artist: sharedArtist || currentUser.email?.split('@')[0] || 'Unknown Artist',
          duration: formatDuration(metadata.duration),
          filePath,
          userId: currentUser.uid,
          status: 'draft',
          metadata: {
            tags: [...sharedTags, 'uploaded'],
            genre: sharedGenre ? [sharedGenre] : [],
            source: 'upload',
            bpm: metadata.bpm,
            key: metadata.key,
            _originalFileName: entry.file.name,
            _fileSize: entry.file.size,
            _lastModified: entry.file.lastModified,
          },
        };

        const created = await createSong(tripId, newSong);
        createdSongs.push(created);
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done', progress: 100 } : f));
      } catch (err) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: getErrorMessage(err, 'Upload failed') } : f));
      }
    }

    setUploading(false);
    setCompleted(true);
    if (createdSongs.length > 0) {
      onSongsCreated?.(createdSongs);
    }
  };

  const cancelFile = (index: number) => {
    const entry = files[index];
    entry.abortController?.abort();
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error', error: 'Cancelled' } : f));
  };

  const overallProgress = files.length > 0
    ? files.reduce((sum, f) => sum + f.progress, 0) / files.length
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Batch Upload</Typography>

      {/* Drop Zone */}
      <Paper
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 2, mb: 3, cursor: 'pointer' }}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">Drag & drop audio files here</Typography>
        <Button component="label" variant="outlined" sx={{ mt: 2 }}>
          Browse Files
          <input type="file" hidden multiple accept="audio/*" onChange={handleFileSelect} />
        </Button>
      </Paper>

      {/* Shared Metadata */}
      {files.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Shared Metadata</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField size="small" label="Artist" value={sharedArtist} onChange={e => setSharedArtist(e.target.value)} />
            <TextField size="small" label="Genre" value={sharedGenre} onChange={e => setSharedGenre(e.target.value)} />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small" label="Add Tag" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              />
              <Button size="small" onClick={addTag}>Add</Button>
            </Box>
          </Box>
          {sharedTags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
              {sharedTags.map(tag => (
                <Chip key={tag} label={tag} size="small" onDelete={() => setSharedTags(prev => prev.filter(t => t !== tag))} />
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* File List */}
      {files.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom>{files.length} file(s) selected</Typography>
          <List dense>
            {files.map((entry, idx) => (
              <ListItem key={idx} secondaryAction={
                entry.status === 'uploading' ? (
                  <IconButton size="small" onClick={() => cancelFile(idx)}><DeleteIcon /></IconButton>
                ) : entry.status === 'pending' ? (
                  <IconButton size="small" onClick={() => removeFile(idx)}><DeleteIcon /></IconButton>
                ) : null
              }>
                <ListItemIcon><MusicNoteIcon /></ListItemIcon>
                <ListItemText
                  primary={entry.file.name}
                  secondary={
                    entry.status === 'error' ? entry.error :
                    entry.status === 'done' ? 'Uploaded' :
                    entry.status === 'uploading' ? `${Math.round(entry.progress)}%` :
                    `${(entry.file.size / (1024 * 1024)).toFixed(1)} MB`
                  }
                />
                {entry.status === 'uploading' && (
                  <LinearProgress variant="determinate" value={entry.progress} sx={{ width: 100, ml: 2 }} />
                )}
              </ListItem>
            ))}
          </List>

          {uploading && <LinearProgress variant="determinate" value={overallProgress} sx={{ mb: 2 }} />}
          {completed && <Alert severity="success" sx={{ mb: 2 }}>Upload complete!</Alert>}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onClose} variant="outlined">Close</Button>
            <Button
              onClick={handleUploadAll}
              variant="contained"
              disabled={uploading || files.filter(f => f.status === 'pending').length === 0}
              startIcon={<CloudUploadIcon />}
            >
              {uploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} Files`}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default BatchUploadPanel;
