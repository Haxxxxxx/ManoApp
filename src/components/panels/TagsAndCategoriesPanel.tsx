import { Box, Typography, Paper, Chip, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { Song } from '../../types';

interface TagsAndCategoriesPanelProps {
  songs: Song[];
  onClose: () => void;
}

const TagsAndCategoriesPanel = ({ songs, onClose }: TagsAndCategoriesPanelProps) => {
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Get unique tags and categories from all songs
  const existingTags = Array.from(new Set(songs.flatMap(song => song.metadata?.tags || [])));
  const existingCategories = Array.from(new Set(songs.flatMap(song => song.metadata?.genre || [])));

  const handleAddTag = () => {
    if (newTag.trim()) {
      // Add tag to selected songs
      setNewTag('');
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      // Add category to selected songs
      setNewCategory('');
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>Tags & Categories</Typography>

        {/* Tags Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Tags</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Add new tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTag}
            >
              Add Tag
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {existingTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => {}}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Categories Section */}
        <Box>
          <Typography variant="h6" gutterBottom>Categories</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Add new category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddCategory}
            >
              Add Category
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {existingCategories.map((category) => (
              <Chip
                key={category}
                label={category}
                onDelete={() => {}}
                color="secondary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onClose}>
            Done
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default TagsAndCategoriesPanel; 