import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  InputAdornment,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  MusicNote as MusicNoteIcon, 
  Info as InfoIcon,
  Album as AlbumIcon,
  Audiotrack as AudiotrackIcon,
  LibraryMusic as LibraryMusicIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { createTrip } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import { useTrips } from '../../contexts/TripContext';
import { Trip } from '../../types/trip';
import { useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import { SUGGESTED_TAGS } from '../../utils/constants';

// Project templates
type TemplateId = 'project' | 'single' | 'album';

interface ProjectTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: JSX.Element;
  tags: string[];
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'project',
    name: 'Empty Project',
    description: 'Start with a blank project',
    icon: <AlbumIcon sx={{ fontSize: 40 }} />,
    tags: []
  },
  {
    id: 'single',
    name: 'Single Release',
    description: 'Project setup for a single track release',
    icon: <AudiotrackIcon sx={{ fontSize: 40 }} />,
    tags: ['single', 'release']
  },
  {
    id: 'album',
    name: 'Album',
    description: 'Full album project setup',
    icon: <LibraryMusicIcon sx={{ fontSize: 40 }} />,
    tags: ['album', 'release']
  }
];

interface EmptyProjectPanelProps {
  onClose: () => void;
  tripId: string;
  onProjectCreated?: (project: Trip) => void;
  isDialog?: boolean;
  mode?: 'project' | 'song';
}

const EmptyProjectPanel: React.FC<EmptyProjectPanelProps> = ({ 
  onClose, 
  tripId, 
  onProjectCreated, 
  isDialog = false,
  mode = 'project'
}) => {
  const { currentUser, artistProfile } = useAuth();
  const { refreshTrips } = useTrips();
  const navigate = useNavigate();
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>(PROJECT_TEMPLATES[0]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // Update tag suggestions based on input
  useEffect(() => {
    if (newTag.trim()) {
      const allTags = [
        ...SUGGESTED_TAGS.genres,
        ...SUGGESTED_TAGS.moods,
        ...SUGGESTED_TAGS.types,
        ...SUGGESTED_TAGS.status
      ];
      
      const filtered = allTags.filter(tag => 
        tag.toLowerCase().includes(newTag.toLowerCase()) &&
        !tags.includes(tag)
      );
      setTagSuggestions(filtered);
    } else {
      setTagSuggestions([]);
    }
  }, [newTag, tags]);

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    // Replace tags with the new template's tags instead of adding them
    setTags(template.tags);

    // Set default values based on template type
    if (template.id === 'single') {
      setIsPrivate(false); // Singles are typically public
      if (!title) {
        setTitle('New Single');
      }
      if (!description) {
        setDescription('Single release project');
      }
    } else if (template.id === 'album') {
      setIsPrivate(true); // Albums start private during creation
      if (!title) {
        setTitle('New Album');
      }
      if (!description) {
        setDescription('Album project');
      }
    } else {
      // Empty project template
      if (!title) {
        setTitle('New Project');
      }
      if (!description) {
        setDescription('');
      }
    }
  };

  // Add helper text based on template
  const getTemplateHelperText = () => {
    switch (selectedTemplate.id) {
      case 'single':
        return 'Perfect for releasing a single track with artwork and metadata';
      case 'album':
        return 'Ideal for a full album release with multiple tracks';
      default:
        return 'Start with a blank project and customize as needed';
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    if (tagToAdd.trim() && !tags.includes(tagToAdd.trim())) {
      setTags([...tags, tagToAdd.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateProject = async () => {
    if (!currentUser) {
      setError('You must be logged in to create a project');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Create a new project with the title as the name
      const newProject = await createTrip({
        name: title.trim(), // Use the title as the name
        description: description || '',
        userId: currentUser.uid,
        songs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [],
        tags: tags,
        status: 'draft',
        type: selectedTemplate.id,
        isPrivate: isPrivate,
        template: selectedTemplate.id,
        metadata: {
          templateType: selectedTemplate.id,
          createdFrom: 'project-panel'
        }
      });
      
      // Show success message
      setSuccess('Project created successfully!');

      // Refresh the trips list to show the new project immediately
      await refreshTrips();
      
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }

      // Wait a moment to show the success message before closing/navigating
      setTimeout(() => {
        onClose();
        // Navigate to the new project
        navigate(`/trip/${newProject.id}`);
      }, 1500);

    } catch (error) {
      // Error creating project
      setError('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderContent = () => (
    <Box sx={{ p: isDialog ? 0 : 3, maxWidth: 800, mx: 'auto' }}>
      {!isDialog && (
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Create New Project
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Project Templates */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Choose a Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {getTemplateHelperText()}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {PROJECT_TEMPLATES.map((template) => (
          <Grid item xs={12} sm={4} key={template.id}>
            <Card 
              variant="outlined"
              sx={{ 
                borderWidth: selectedTemplate.id === template.id ? 2 : 1,
                borderColor: selectedTemplate.id === template.id ? 'primary.main' : 'divider',
                bgcolor: selectedTemplate.id === template.id 
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                  : 'background.paper',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: selectedTemplate.id === template.id ? 'scale(1.03)' : 'scale(1)',
                boxShadow: selectedTemplate.id === template.id 
                  ? `0px 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                  : 'none',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: selectedTemplate.id === template.id ? '4px' : '0px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  transition: 'height 0.3s ease',
                },
                '&:hover': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                  bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                  transform: 'translateY(-4px) scale(1.03)',
                  boxShadow: `0px 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                  '&::before': {
                    height: '4px',
                  },
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleTemplateSelect(template)}
                sx={{ p: 2 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    color: selectedTemplate.id === template.id ? 'primary.main' : 'text.secondary', 
                    mb: 1,
                    transition: 'all 0.2s',
                    transform: selectedTemplate.id === template.id ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {template.icon}
                  </Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                  {template.tags.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {template.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          color={selectedTemplate.id === template.id ? 'primary' : 'default'}
                          variant={selectedTemplate.id === template.id ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Project Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter your project title"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                    borderColor: theme.palette.primary.main,
                  },
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: theme.palette.primary.main,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="This will be the main identifier for your project">
                    <InfoIcon 
                      color="action" 
                      sx={{ 
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          color: 'primary.main',
                          transform: 'scale(1.1)',
                        },
                      }} 
                    />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            placeholder="Brief description of your project (optional)"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                    borderColor: theme.palette.primary.main,
                  },
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: theme.palette.primary.main,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Add context about your project">
                    <InfoIcon 
                      color="action" 
                      sx={{ 
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          color: 'primary.main',
                          transform: 'scale(1.1)',
                        },
                      }} 
                    />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Tags
              <Tooltip title="Add keywords to help organize your projects">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              ))}
            </Box>
            <Autocomplete
              freeSolo
              options={tagSuggestions}
              inputValue={newTag}
              onInputChange={(_, value) => setNewTag(value)}
              onChange={(_, value) => value && handleAddTag(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Add tag"
                  fullWidth
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(newTag)}
                />
              )}
            />
            
            {/* Tag Categories */}
            <Box sx={{ mt: 2 }}>
              {Object.entries(SUGGESTED_TAGS).map(([category, categoryTags]) => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {categoryTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        onClick={() => handleAddTag(tag)}
                        disabled={tags.includes(tag)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Visibility Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isPrivate ? <LockIcon fontSize="small" /> : <PublicIcon fontSize="small" />}
                  <Typography>
                    {isPrivate ? 'Private Project' : 'Public Project'}
                  </Typography>
                </Box>
              }
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {isPrivate 
                ? 'Only you and invited collaborators can access this project'
                : 'Anyone with the link can view this project'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateProject}
          variant="contained"
          disabled={isCreating || !title.trim()}
          startIcon={
            isCreating ? (
              <CircularProgress
                size={20}
                sx={{ color: 'inherit' }}
              />
            ) : (
              <AddIcon />
            )
          }
          sx={{ 
            minWidth: 150,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover:not(:disabled)': {
              transform: 'translateY(-2px)',
              boxShadow: `0px 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            '&:active:not(:disabled)': {
              transform: 'translateY(0)',
            },
            '&:disabled': {
              opacity: 0.6,
            },
          }}
        >
          {isCreating ? 'Creating...' : 'Create Project'}
        </Button>
      </Box>
    </Box>
  );

  if (isDialog) {
    return (
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return renderContent();
};

export default EmptyProjectPanel; 