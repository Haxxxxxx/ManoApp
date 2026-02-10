import { useState, useEffect, useCallback } from 'react';

export type ActivePanel =
  | 'export'
  | 'metadata'
  | 'collaborators'
  | 'analytics'
  | 'tags'
  | 'settings'
  | 'publish-spotify'
  | 'publish-soundcloud'
  | 'song-management'
  | 'create-project'
  | 'upload'
  | 'create-playlist'
  | 'add-song'
  | 'overview'
  | 'mixer'
  | 'comments'
  | 'release-planning'
  | 'release-export'
  | 'gdrive-import'
  | 'auto-tag'
  | null;

interface UsePanelManagerReturn {
  activePanel: ActivePanel;
  setActivePanel: React.Dispatch<React.SetStateAction<ActivePanel>>;
  isCreatingProject: boolean;
  setIsCreatingProject: React.Dispatch<React.SetStateAction<boolean>>;
  showCreateAlbum: boolean;
  setShowCreateAlbum: React.Dispatch<React.SetStateAction<boolean>>;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  showPlatformDialog: boolean;
  setShowPlatformDialog: React.Dispatch<React.SetStateAction<boolean>>;
  handleClosePanel: () => void;
  handleAddSongClick: () => void;
  handleSettingsClick: () => void;
  handlePublish: (selectedTrip: string | null | undefined, currentUser: unknown) => void;
  handlePlatformSelect: (platform: 'spotify' | 'soundcloud') => void;
}

export function usePanelManager(initialPanel?: ActivePanel): UsePanelManagerReturn {
  const [activePanel, setActivePanel] = useState<ActivePanel>(initialPanel || null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlatformDialog, setShowPlatformDialog] = useState(false);

  // Sync with initialPanel changes
  useEffect(() => {
    if (initialPanel) {
      setActivePanel(initialPanel);
    }
  }, [initialPanel]);

  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const handleAddSongClick = useCallback(() => {
    setActivePanel('add-song');
  }, []);

  const handleSettingsClick = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handlePublish = useCallback(
    (selectedTrip: string | null | undefined, currentUser: unknown) => {
      if (!selectedTrip || !currentUser) return;
      setShowPlatformDialog(true);
    },
    []
  );

  const handlePlatformSelect = useCallback((platform: 'spotify' | 'soundcloud') => {
    setShowPlatformDialog(false);
    setActivePanel(`publish-${platform}`);
  }, []);

  return {
    activePanel,
    setActivePanel,
    isCreatingProject,
    setIsCreatingProject,
    showCreateAlbum,
    setShowCreateAlbum,
    showSettings,
    setShowSettings,
    showPlatformDialog,
    setShowPlatformDialog,
    handleClosePanel,
    handleAddSongClick,
    handleSettingsClick,
    handlePublish,
    handlePlatformSelect,
  };
}
