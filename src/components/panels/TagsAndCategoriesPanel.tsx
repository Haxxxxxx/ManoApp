import { Box, Typography, Paper, TextField, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, useTheme } from '@mui/material';
import { useState, useEffect } from 'react';
import { Song } from '../../types';
import { updateSong } from '../../services/firebaseService';
import AddIcon from '@mui/icons-material/Add';

interface TagsAndCategoriesPanelProps {
  songs: Song[];
  onClose: () => void;
  onSongsUpdated?: (updatedSongs: Song[]) => void;
}

const TagsAndCategoriesPanel = ({ songs, onClose: _onClose, onSongsUpdated }: TagsAndCategoriesPanelProps) => {
  const theme = useTheme();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [newTags, setNewTags] = useState<{ [key: string]: string }>({});
  const [allTags, setAllTags] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [_filteredTags, setFilteredTags] = useState<string[]>([]);
  const [localSongs, setLocalSongs] = useState<Song[]>(songs);

  // Default tags for different genres and moods
  const defaultTags = {
    genres: ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Folk', 'Metal'],
    moods: ['Happy', 'Sad', 'Energetic', 'Calm', 'Aggressive', 'Melancholic', 'Upbeat', 'Dark', 'Peaceful', 'Dramatic'],
    instruments: ['Piano', 'Guitar', 'Drums', 'Bass', 'Strings', 'Synth', 'Vocals', 'Saxophone', 'Trumpet', 'Violin'],
    production: ['Studio', 'Live', 'Demo', 'Remix', 'Cover', 'Original', 'Acoustic', 'Electronic', 'Experimental', 'Traditional']
  };

  const allDefaultTags = [
    ...defaultTags.genres,
    ...defaultTags.moods,
    ...defaultTags.instruments,
    ...defaultTags.production
  ];

  // Filter tags based on input
  useEffect(() => {
    if (newTags[selectedSong?.id || '']?.trim()) {
      const filtered = allDefaultTags.filter(tag => 
        tag.toLowerCase().includes(newTags[selectedSong?.id || '']?.toLowerCase()) &&
        !allTags.includes(tag)
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(allDefaultTags.filter(tag => !allTags.includes(tag)));
    }
  }, [newTags, allTags]);

  // Update local songs when props change
  useEffect(() => {
    setLocalSongs(songs);
  }, [songs]);

  const handleTagSelect = async (song: Song, tag: string) => {
    if (!tag.trim()) return;
    
    const updatedTags = [...new Set([...(song.metadata?.tags || []), tag.trim()])];
    
    // Update local state immediately for responsive UI
    const updatedSongs = localSongs.map(s => 
      s.id === song.id 
        ? { 
            ...s, 
            metadata: { 
              ...s.metadata, 
              tags: updatedTags 
            } 
          } 
        : s
    );
    
    // Update local state immediately
    setLocalSongs(updatedSongs);
    
    // If this is the selected song, update it immediately
    if (selectedSong?.id === song.id) {
      setSelectedSong({
        ...selectedSong,
        metadata: {
          ...selectedSong.metadata,
          tags: updatedTags
        }
      });
    }
    
    // Clear the input for this specific song
    setNewTags(prev => ({ ...prev, [song.id]: '' }));
    setActiveInputId(null);
    
    try {
      // Update the song in Firebase
      await updateSong(song.id, {
        ...song,
        metadata: {
          ...song.metadata,
          tags: updatedTags
        }
      });
      
      // Update all tags
      const allTagsSet = new Set<string>();
      updatedSongs.forEach(s => {
        s.metadata?.tags?.forEach(t => allTagsSet.add(t));
      });
      setAllTags(Array.from(allTagsSet));
      
      // Notify parent component
      if (onSongsUpdated) {
        onSongsUpdated(updatedSongs);
      }
    } catch (error) {
      // Error adding tag
      
      // Revert local state if Firebase update fails
      setLocalSongs(songs);
      if (selectedSong?.id === song.id) {
        setSelectedSong(song);
      }
    }
  };

  const handleRemoveTag = async (song: Song, tagToRemove: string) => {
    const updatedTags = (song.metadata?.tags || []).filter(tag => tag !== tagToRemove);
    
    // Update local state immediately for responsive UI
    const updatedSongs = localSongs.map(s => 
      s.id === song.id 
        ? { 
            ...s, 
            metadata: { 
              ...s.metadata, 
              tags: updatedTags 
            } 
          } 
        : s
    );
    
    // Update local state immediately
    setLocalSongs(updatedSongs);
    
    // If this is the selected song, update it immediately
    if (selectedSong?.id === song.id) {
      setSelectedSong({
        ...selectedSong,
        metadata: {
          ...selectedSong.metadata,
          tags: updatedTags
        }
      });
    }
    
    try {
      // Update the song in Firebase
      await updateSong(song.id, {
        ...song,
        metadata: {
          ...song.metadata,
          tags: updatedTags
        }
      });
      
      // Update all tags
      const allTagsSet = new Set<string>();
      updatedSongs.forEach(s => {
        s.metadata?.tags?.forEach(t => allTagsSet.add(t));
      });
      setAllTags(Array.from(allTagsSet));
      
      // Notify parent component
      if (onSongsUpdated) {
        onSongsUpdated(updatedSongs);
      }
    } catch (error) {
      // Error removing tag
      
      // Revert local state if Firebase update fails
      setLocalSongs(songs);
      if (selectedSong?.id === song.id) {
        setSelectedSong(song);
      }
    }
  };

  const handleBulkAddTag = async () => {
    const tagToAdd = newTags[selectedSong?.id || ''];
    if (!tagToAdd?.trim()) return;
    
    // Update local state immediately for responsive UI
    const updatedSongs = localSongs.map(song => {
      const updatedTags = [...new Set([...(song.metadata?.tags || []), tagToAdd.trim()])];
      return {
        ...song,
        metadata: {
          ...song.metadata,
          tags: updatedTags
        }
      };
    });
    
    // Update local state immediately
    setLocalSongs(updatedSongs);
    
    // Clear the input
    setNewTags(prev => ({ ...prev, [selectedSong?.id || '']: '' }));
    setOpenDialog(false);
    
    try {
      // Add tag to all songs in Firebase
      for (const song of songs) {
        await updateSong(song.id, {
          ...song,
          metadata: {
            ...song.metadata,
            tags: [...new Set([...(song.metadata?.tags || []), tagToAdd.trim()])]
          }
        });
      }
      
      // Update all tags
      const allTagsSet = new Set<string>();
      updatedSongs.forEach(s => {
        s.metadata?.tags?.forEach(t => allTagsSet.add(t));
      });
      setAllTags(Array.from(allTagsSet));
      
      // Notify parent component
      if (onSongsUpdated) {
        onSongsUpdated(updatedSongs);
      }
    } catch (error) {
      // Error adding tag to all songs
      
      // Revert local state if Firebase update fails
      setLocalSongs(songs);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tags and Categories
      </Typography>
      
      {/* Global Tag Management */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          All Tags
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {allTags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => {
                // Remove tag from all songs
                songs.forEach(song => handleRemoveTag(song, tag));
              }}
            />
          ))}
        </Box>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          variant="outlined"
        >
          Add Tag to All Songs
        </Button>
      </Paper>
      
      {/* Song-specific Tag Management */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {localSongs.map(song => (
          <Paper key={song.id} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {song.title}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {song.metadata?.tags?.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(song, tag)}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ position: 'relative', flex: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add tag"
                  value={newTags[song.id] || ''}
                  onChange={(e) => setNewTags(prev => ({ ...prev, [song.id]: e.target.value }))}
                  onFocus={() => setActiveInputId(song.id)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagSelect(song, newTags[song.id] || '');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setActiveInputId(null);
                    }
                  }}
                />

                {/* Tag Suggestions Dropdown */}
                {activeInputId === song.id && (
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      mt: 0.5,
                      maxHeight: 300,
                      overflow: 'auto',
                      zIndex: 1000,
                      boxShadow: theme.shadows[4],
                    }}
                  >
                    {Object.entries(defaultTags).map(([category, tags]) => {
                      const filteredCategoryTags = tags.filter(tag => 
                        tag.toLowerCase().includes((newTags[song.id] || '').toLowerCase()) &&
                        !song.metadata?.tags?.includes(tag)
                      );
                      
                      if (filteredCategoryTags.length === 0) return null;

                      return (
                        <Box key={category} sx={{ p: 1 }}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ px: 1, py: 0.5 }}
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Typography>
                          {filteredCategoryTags.map((tag) => (
                            <Box
                              key={tag}
                              onClick={() => handleTagSelect(song, tag)}
                              sx={{
                                px: 2,
                                py: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                              }}
                            >
                              {tag}
                            </Box>
                          ))}
                        </Box>
                      );
                    })}
                  </Paper>
                )}
              </Box>
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleTagSelect(song, newTags[song.id] || '')}
                variant="outlined"
              >
                Add
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
      
      {/* Bulk Add Tag Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Tag to All Songs</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag"
            fullWidth
            value={newTags[selectedSong?.id || ''] || ''}
            onChange={(e) => setNewTags(prev => ({ ...prev, [selectedSong?.id || '']: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleBulkAddTag} variant="contained">
            Add to All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TagsAndCategoriesPanel; 