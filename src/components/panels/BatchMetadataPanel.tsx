import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Chip, Checkbox,
  List, ListItem, ListItemText, ListItemIcon, Alert, FormControl,
  InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import { Song, SongStatus } from '../../types/song';
import { useBatchOperations } from '../../hooks/useBatchOperations';
import SongStatusBadge from '../common/SongStatusBadge';

interface BatchMetadataPanelProps {
  songs: Song[];
  onClose: () => void;
  onSongsUpdated?: (songs: Song[]) => void;
}

const BatchMetadataPanel: React.FC<BatchMetadataPanelProps> = ({ songs, onClose, onSongsUpdated }) => {
  const { selectedSongIds, toggleSong, selectAll, deselectAll, applyBatchUpdate } = useBatchOperations();
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [artist, setArtist] = useState('');
  const [status, setStatus] = useState<SongStatus | ''>('');
  const [bpm, setBpm] = useState('');
  const [songKey, setSongKey] = useState('');
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ succeeded: number; failed: number } | null>(null);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleApply = async () => {
    if (selectedSongIds.size === 0) return;
    setApplying(true);
    setResult(null);

    const updates: Partial<Song> = {};
    if (artist) updates.artist = artist;
    if (status) updates.status = status;

    const metadataUpdates: Record<string, unknown> = {};
    if (genre) metadataUpdates.genre = [genre];
    if (tags.length > 0) metadataUpdates.tags = tags;
    if (bpm) metadataUpdates.bpm = parseInt(bpm);
    if (songKey) metadataUpdates.key = songKey;

    if (Object.keys(metadataUpdates).length > 0) {
      updates.metadata = metadataUpdates as Song['metadata'];
    }

    try {
      const { succeeded, failed } = await applyBatchUpdate(updates, songs);
      setResult({ succeeded: succeeded.length, failed: failed.length });

      if (succeeded.length > 0 && onSongsUpdated) {
        const updatedSongs = songs.map(s => {
          if (succeeded.includes(s.id)) {
            return {
              ...s,
              ...updates,
              metadata: { ...s.metadata, ...metadataUpdates },
            };
          }
          return s;
        });
        onSongsUpdated(updatedSongs);
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Batch Metadata Editor</Typography>

      {/* Selection Controls */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button size="small" onClick={() => selectAll(songs.map(s => s.id))}>Select All</Button>
        <Button size="small" onClick={deselectAll}>Deselect All</Button>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
          {selectedSongIds.size} of {songs.length} selected
        </Typography>
      </Box>

      {/* Song Selection List */}
      <Paper sx={{ maxHeight: 300, overflow: 'auto', mb: 3 }}>
        <List dense>
          {songs.map(song => (
            <ListItem key={song.id} onClick={() => toggleSong(song.id)} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <Checkbox checked={selectedSongIds.has(song.id)} edge="start" />
              </ListItemIcon>
              <ListItemText primary={song.title} secondary={song.artist} />
              <SongStatusBadge status={(song.status as SongStatus) || 'draft'} size="small" />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* Batch Edit Fields */}
      <Typography variant="subtitle1" gutterBottom>Edit Fields (applied to all selected)</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <TextField size="small" label="Artist" value={artist} onChange={e => setArtist(e.target.value)} fullWidth />
        <TextField size="small" label="Genre" value={genre} onChange={e => setGenre(e.target.value)} fullWidth />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" label="BPM" type="number" value={bpm} onChange={e => setBpm(e.target.value)} />
          <TextField size="small" label="Key" value={songKey} onChange={e => setSongKey(e.target.value)} />
        </Box>
        <FormControl size="small" fullWidth>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={e => setStatus(e.target.value as SongStatus)}>
            <MenuItem value="">None</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="in-review">In Review</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>
        <Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small" label="Add Tag" value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            />
            <Button onClick={addTag} size="small">Add</Button>
          </Box>
          {tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
              {tags.map(tag => (
                <Chip key={tag} label={tag} size="small" onDelete={() => setTags(prev => prev.filter(t => t !== tag))} />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {result && (
        <Alert severity={result.failed > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
          Updated {result.succeeded} song(s).{result.failed > 0 && ` ${result.failed} failed.`}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={applying || selectedSongIds.size === 0}
        >
          {applying ? 'Applying...' : `Apply to ${selectedSongIds.size} Song(s)`}
        </Button>
      </Box>
    </Box>
  );
};

export default BatchMetadataPanel;
