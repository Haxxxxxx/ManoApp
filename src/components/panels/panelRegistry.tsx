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
import ReleaseExportPanel from './ReleaseExportPanel';
import BatchUploadPanel from './BatchUploadPanel';
import BatchMetadataPanel from './BatchMetadataPanel';
import AutoTagPanel from './AutoTagPanel';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { Trip, TripStatus } from '../../types/trip';
import type { Song } from '../../types/song';
import type { Release } from '../../types/release';

// Define panel registry type
export interface PanelProps {
  onClose: () => void;
  tripId?: string;
  trip?: Trip | null;
  songs?: Song[];
  onSongsUpdated?: (songs: Song[]) => void;
  onStatusChange?: (newStatus: TripStatus) => void;
  onCreateAlbum?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  setActivePanel?: (panel: string) => void;
  platform?: 'spotify' | 'soundcloud';
  projectId?: string;
  assetId?: string;
  collaborators?: Array<{ id: string; name: string; email?: string; avatar?: string }>;
  song?: Song;
  onCreateRelease?: (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateRelease?: (releaseId: string, updates: Partial<Release>) => Promise<void>;
  existingRelease?: Release;
  release?: Release;
  onExportMixdown?: (blob: Blob, filename: string) => void;
  onFileImported?: (assetId: string) => void;
  onExportComplete?: () => void;
  [key: string]: unknown;
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
    component: ExportSettingsPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Export Settings',
    icon: <CloudDownloadIcon />,
    requiresTrip: false
  },
  'metadata': {
    component: MetadataEditorPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Metadata Editor',
    icon: <EditIcon />,
    requiresTrip: true
  },
  'collaborators': {
    component: CollaboratorsPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Collaborators',
    icon: <GroupAddIcon />,
    requiresTrip: true
  },
  'analytics': {
    component: ProjectAnalyticsPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Project Analytics',
    icon: <BarChartIcon />,
    requiresTrip: false
  },
  'tags': {
    component: TagsAndCategoriesPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Tags & Categories',
    icon: <TagIcon />,
    requiresTrip: true
  },
  'settings': {
    component: ProjectSettingsPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Project Settings',
    icon: <SettingsIcon />,
    requiresTrip: true
  },
  'publish-spotify': {
    component: PublishingPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Publish to Spotify',
    icon: <CloudUploadIcon />,
    requiresTrip: true
  },
  'publish-soundcloud': {
    component: PublishingPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Publish to SoundCloud',
    icon: <CloudUploadIcon />,
    requiresTrip: true
  },
  'song-management': {
    component: SongManagementPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Song Management',
    icon: <MusicNoteIcon />,
    requiresTrip: true
  },
  'create-project': {
    component: ProjectSettingsPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Create New Project',
    icon: <AddIcon />,
    requiresTrip: false
  },
  'upload': {
    component: SongManagementPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Upload Song',
    icon: <CloudUploadIcon />,
    requiresTrip: false
  },
  'create-playlist': {
    component: SongManagementPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Create Playlist',
    icon: <PlaylistAddIcon />,
    requiresTrip: false
  },
  'overview': {
    component: ProjectOverviewPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Project Overview',
    icon: <DashboardIcon />,
    requiresTrip: true
  },
  'mixer': {
    component: MixerPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Audio Mixer',
    icon: <GraphicEqIcon />,
    requiresTrip: false
  },
  'comments': {
    component: CommentsPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Comments',
    icon: <CommentIcon />,
    requiresTrip: true
  },
  'release-planning': {
    component: ReleasePlanningPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Release Planning',
    icon: <ChecklistIcon />,
    requiresTrip: true
  },
  'gdrive-import': {
    component: GoogleDriveImportPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Import from Google Drive',
    icon: <CloudUploadIcon />,
    requiresTrip: false
  },
  'release-export': {
    component: ReleaseExportPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Export Release',
    icon: <CloudUploadIcon />,
    requiresTrip: true
  },
  'batch-upload': {
    component: BatchUploadPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Batch Upload',
    icon: <UploadFileIcon />,
    requiresTrip: true
  },
  'batch-metadata': {
    component: BatchMetadataPanel as unknown as React.ComponentType<PanelProps>,
    title: 'Batch Metadata Editor',
    icon: <EditNoteIcon />,
    requiresTrip: true
  },
  'auto-tag': {
    component: AutoTagPanel as unknown as React.ComponentType<PanelProps>,
    title: 'AI Tag Suggestions',
    icon: <AutoAwesomeIcon />,
    requiresTrip: true
  },
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
    panelProps.onSongsUpdated = (_updatedSongs: Song[]) => {
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

      if (panelType === 'release-export') {
        // Release and songs will be passed via additionalProps from MainContent
        panelProps.projectId = selectedTrip || '';
      }

      if (panelType === 'mixer') {
        // Song with stems will be passed via additionalProps
        // This should be set when opening mixer from a song
      }
  
  return panelProps;
}; 