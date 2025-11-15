/**
 * Comment Composer Component
 * 
 * Component for composing comments with @mention autocomplete
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useMentions } from '../../hooks/useMentions';
import { Comment } from '../../types/comment';

interface Collaborator {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface CommentComposerProps {
  /** Collaborators for @mention autocomplete */
  collaborators: Collaborator[];
  
  /** Callback when comment is submitted */
  onSubmit: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  /** Reply to comment ID (optional) */
  replyTo?: string;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Whether composer is disabled */
  disabled?: boolean;
}

const CommentComposer: React.FC<CommentComposerProps> = ({
  collaborators,
  onSubmit,
  replyTo,
  placeholder = 'Add a comment...',
  disabled = false,
}) => {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const mentions = useMentions({
    collaborators,
    value: text,
    onChange: setText,
  });

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        body: text.trim(),
        mentions: mentions.mentionedUserIds,
        replyTo,
        resolved: false,
        // Note: projectId and authorId should be set by parent component
        projectId: '',
        authorId: '',
      });
      setText('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          rows={3}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setCursorPosition(e.target.selectionStart || 0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          sx={{ mb: 2 }}
        />

        {/* Mention Autocomplete */}
        {mentions.isInMentionContext && mentions.autocompleteOptions.length > 0 && (
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              zIndex: 1000,
              maxHeight: 200,
              overflow: 'auto',
              mt: -2,
            }}
          >
            <List dense>
              {mentions.autocompleteOptions.map((collaborator) => (
                <ListItemButton
                  key={collaborator.id}
                  onClick={() => mentions.insertMention(collaborator)}
                >
                  <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                    {collaborator.name.charAt(0)}
                  </Avatar>
                  <ListItemText
                    primary={collaborator.name}
                    secondary={collaborator.email}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            Press Cmd/Ctrl + Enter to submit
          </Typography>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={!text.trim() || disabled || isSubmitting}
            size="small"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CommentComposer;

