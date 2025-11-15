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
import DashboardIcon from '@mui/icons-material/Dashboard';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import CommentIcon from '@mui/icons-material/Comment';
import ChecklistIcon from '@mui/icons-material/Checklist';

// Import panel components
import ExportSettingsPanel from './ExportSettingsPanel';
import MetadataEditorPanel from './MetadataEditorPanel';
import CollaboratorsPanel from './CollaboratorsPanel';
import ProjectAnalyticsPanel from './ProjectAnalyticsPanel';
import TagsAndCategoriesPanel from './TagsAndCategoriesPanel';
import ProjectSettingsPanel from './ProjectSettingsPanel';
import PublishingPanel from './PublishingPanel';
import SongManagementPanel from './SongManagementPanel';
import ProjectOverviewPanel from './ProjectOverviewPanel';
import MixerPanel from './MixerPanel';
import CommentsPanel from './CommentsPanel';
import ReleasePlanningPanel from './ReleasePlanningPanel';
import GoogleDriveImportPanel from './GoogleDriveImportPanel';
import type { Trip } from '../../types/trip';
import type { Song } from '../../types/song';

// Define panel registry type
export interface PanelProps {
  onClose: () => void;
  tripId?: string;
  trip?: Trip;
  songs?: Song[];
  onSongsUpdated?: (songs: Song[]) => void;
  // Additional optional props for specific panels
  onStatusChange?: (newStatus: any) => void;
  onCreateAlbum?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  setActivePanel?: (panel: string) => void;
  platform?: 'spotify' | 'soundcloud';
  // New feature panel props
  projectId?: string;
  assetId?: string;
  collaborators?: Array<{ id: string; name: string; email?: string; avatar?: string }>;
  song?: Song;
  onCreateRelease?: (release: any) => Promise<void>;
  existingRelease?: any;
  onExportMixdown?: (blob: Blob, filename: string) => void;
  [key: string]: any; // Allow additional props for flexibility
}

export type PanelRegistry = {
  [key: string]: {
    component: React.ComponentType<PanelProps>;
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
  },
  'overview': {
    component: ProjectOverviewPanel,
    title: 'Project Overview',
    icon: <DashboardIcon />,
    requiresTrip: true
  },
  'mixer': {
    component: MixerPanel,
    title: 'Audio Mixer',
    icon: <GraphicEqIcon />,
    requiresTrip: false
  },
  'comments': {
    component: CommentsPanel,
    title: 'Comments',
    icon: <CommentIcon />,
    requiresTrip: true
  },
  'release-planning': {
    component: ReleasePlanningPanel,
    title: 'Release Planning',
    icon: <ChecklistIcon />,
    requiresTrip: true
  },
  'gdrive-import': {
    component: GoogleDriveImportPanel,
    title: 'Import from Google Drive',
    icon: <CloudUploadIcon />,
    requiresTrip: false
  }
};

// Helper function to get panel props based on panel type
export const getPanelProps = (
  panelType: string, 
  tripData: Trip | null, 
  songs: Song[], 
  onClose: () => void,
  selectedTrip?: string | null
): PanelProps => {
  const panelProps: PanelProps = { onClose };
  
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
    panelProps.onSongsUpdated = (updatedSongs: Song[]) => {
      // This will be handled by the parent component
      // Songs updated
    };
  }
  
  if (panelType === 'overview') {
    panelProps.trip = tripData;
    panelProps.tripId = selectedTrip || '';
    panelProps.songs = songs;
        // Note: Additional callbacks like onCreateAlbum, onExport, etc.
        // can be passed via DynamicPanel's additionalProps if needed
      }

      if (panelType === 'comments') {
        panelProps.projectId = selectedTrip || '';
        // Collaborators will be passed via additionalProps from MainContent
      }

      if (panelType === 'release-planning') {
        panelProps.projectId = selectedTrip || '';
        // Collaborators will be passed via additionalProps from MainContent
      }

      if (panelType === 'gdrive-import') {
        panelProps.projectId = selectedTrip || '';
      }

      if (panelType === 'mixer') {
        // Song with stems will be passed via additionalProps
        // This should be set when opening mixer from a song
      }
  
  return panelProps;
}; 