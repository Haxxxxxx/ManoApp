import React from 'react';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import BarChartIcon from '@mui/icons-material/BarChart';
import TagIcon from '@mui/icons-material/Tag';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';

// Import panel components
import ExportSettingsPanel from './ExportSettingsPanel';
import MetadataEditorPanel from './MetadataEditorPanel';
import CollaboratorsPanel from './CollaboratorsPanel';
import ProjectAnalyticsPanel from './ProjectAnalyticsPanel';
import TagsAndCategoriesPanel from './TagsAndCategoriesPanel';
import ProjectSettingsPanel from './ProjectSettingsPanel';
import PublishingPanel from './PublishingPanel';
import SongManagementPanel from './SongManagementPanel';

// Define panel registry type
export type PanelRegistry = {
  [key: string]: {
    component: React.ComponentType<any>;
    title: string;
    icon?: React.ReactNode;
    requiresTrip?: boolean;
  };
};

// Create a panel registry
export const panelRegistry: PanelRegistry = {
  'export': {
    component: ExportSettingsPanel,
    title: 'Export Settings',
    icon: <CloudDownloadIcon />,
    requiresTrip: false
  },
  'metadata': {
    component: MetadataEditorPanel,
    title: 'Metadata Editor',
    icon: <EditIcon />,
    requiresTrip: true
  },
  'collaborators': {
    component: CollaboratorsPanel,
    title: 'Collaborators',
    icon: <GroupAddIcon />,
    requiresTrip: true
  },
  'analytics': {
    component: ProjectAnalyticsPanel,
    title: 'Project Analytics',
    icon: <BarChartIcon />,
    requiresTrip: false
  },
  'tags': {
    component: TagsAndCategoriesPanel,
    title: 'Tags & Categories',
    icon: <TagIcon />,
    requiresTrip: true
  },
  'settings': {
    component: ProjectSettingsPanel,
    title: 'Project Settings',
    icon: <SettingsIcon />,
    requiresTrip: true
  },
  'publish-spotify': {
    component: PublishingPanel,
    title: 'Publish to Spotify',
    icon: <CloudUploadIcon />,
    requiresTrip: true
  },
  'publish-soundcloud': {
    component: PublishingPanel,
    title: 'Publish to SoundCloud',
    icon: <CloudUploadIcon />,
    requiresTrip: true
  },
  'song-management': {
    component: SongManagementPanel,
    title: 'Song Management',
    icon: <MusicNoteIcon />,
    requiresTrip: true
  },
  'create-project': {
    component: ProjectSettingsPanel,
    title: 'Create New Project',
    icon: <AddIcon />,
    requiresTrip: false
  },
  'upload': {
    component: SongManagementPanel,
    title: 'Upload Song',
    icon: <CloudUploadIcon />,
    requiresTrip: false
  },
  'create-playlist': {
    component: SongManagementPanel,
    title: 'Create Playlist',
    icon: <PlaylistAddIcon />,
    requiresTrip: false
  }
};

// Helper function to get panel props based on panel type
export const getPanelProps = (
  panelType: string, 
  tripData: any, 
  songs: any[], 
  onClose: () => void,
  selectedTrip?: string | null
) => {
  let panelProps: any = { onClose };
  
  if (panelType === 'metadata' || panelType === 'analytics' || panelType === 'tags' || panelType === 'song-management') {
    panelProps.songs = songs;
  }
  
  if (panelType === 'metadata' || panelType === 'collaborators' || panelType === 'song-management') {
    panelProps.tripId = selectedTrip || '';
  }
  
  if (panelType === 'settings') {
    panelProps.trip = tripData;
  }
  
  if (panelType === 'create-project') {
    // For creating a new project, we don't need to pass a trip
    panelProps.trip = undefined;
  }
  
  if (panelType === 'publish-spotify' || panelType === 'publish-soundcloud') {
    panelProps.trip = tripData;
    panelProps.songs = songs;
    panelProps.platform = panelType === 'publish-spotify' ? 'spotify' : 'soundcloud';
  }
  
  if (panelType === 'song-management') {
    panelProps.onSongsUpdated = (updatedSongs: any[]) => {
      // This will be handled by the parent component
      console.log('Songs updated:', updatedSongs);
    };
  }
  
  return panelProps;
}; 