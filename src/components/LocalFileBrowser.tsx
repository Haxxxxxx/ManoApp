import React, { useState } from 'react';
import { Box, Button, Typography, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

interface LocalFileBrowserProps {
  onFilesSelected: (files: File[]) => void;
  onClose: () => void;
}

const LocalFileBrowser: React.FC<LocalFileBrowserProps> = ({ onFilesSelected, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const audioFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '');
    });
    setSelectedFiles(audioFiles);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFiles = () => {
    onFilesSelected(selectedFiles);
    setSelectedFiles([]);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Audio Files</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            component="label"
            sx={{ mb: 2 }}
          >
            Choose Files
            <input
              type="file"
              hidden
              multiple
              accept=".mp3,.wav,.ogg,.m4a"
              onChange={handleFileSelect}
            />
          </Button>

          <List>
            {selectedFiles.map((file, index) => (
              <ListItem
                key={`${file.name}-${index}`}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />
              </ListItem>
            ))}
          </List>

          {selectedFiles.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddFiles}
              sx={{ mt: 2 }}
            >
              Add {selectedFiles.length} Files
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LocalFileBrowser; 