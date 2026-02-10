import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  TextField,
  List,
  ListSubheader,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  InputAdornment,
  Slide,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AlbumIcon from '@mui/icons-material/Album';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';

const typeIcons: Record<string, React.ReactNode> = {
  project: <FolderIcon fontSize="small" />,
  song: <MusicNoteIcon fontSize="small" />,
  album: <AlbumIcon fontSize="small" />,
};

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
const mod = isMac ? 'Cmd' : 'Ctrl';

const CommandPalette: React.FC = () => {
  const { query, setQuery, results, isSearching, isOpen, close } = useGlobalSearch();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Flatten results for keyboard navigation
  const flatResults = results.flatMap((g) => g.results);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    items[activeIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  const handleSelect = useCallback(
    (navigateTo: string) => {
      navigate(navigateTo);
      close();
    },
    [navigate, close]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && flatResults[activeIndex]) {
      handleSelect(flatResults[activeIndex].navigateTo);
    }
  };

  const hasQuery = query.trim().length > 0;

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'down' } as Record<string, unknown>}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          pt: '10vh',
        },
      }}
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '70vh' },
      }}
    >
      <TextField
        inputRef={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search projects, songs, albums..."
        autoFocus
        fullWidth
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: isSearching ? (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ) : (
            <InputAdornment position="end">
              <Chip label="esc" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': { border: 'none' },
            fontSize: '1.05rem',
          },
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      />

      <Box sx={{ maxHeight: 'calc(70vh - 80px)', overflow: 'auto' }}>
        {/* Empty state — no query */}
        {!hasQuery && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Start typing to search across your workspace
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FolderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">Projects</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MusicNoteIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">Songs</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AlbumIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">Albums</Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* No results */}
        {hasQuery && results.length === 0 && !isSearching && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No results for "{query}"
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Try a different search term or check spelling
            </Typography>
          </Box>
        )}

        {/* Results */}
        {hasQuery && results.length > 0 && (
          <List dense disablePadding ref={listRef} role="listbox">
            {results.map((group, gi) => (
              <React.Fragment key={group.type}>
                {gi > 0 && <Divider />}
                <ListSubheader
                  sx={{
                    bgcolor: 'background.paper',
                    lineHeight: '28px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                  }}
                >
                  {group.label} ({group.results.length})
                </ListSubheader>
                {group.results.map((r) => {
                  const flatIdx = flatResults.indexOf(r);
                  const isActive = flatIdx === activeIndex;
                  return (
                    <ListItemButton
                      key={r.id}
                      role="option"
                      aria-selected={isActive}
                      selected={isActive}
                      onClick={() => handleSelect(r.navigateTo)}
                      sx={{
                        py: 1,
                        '&.Mui-selected': {
                          bgcolor: 'action.selected',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {typeIcons[r.type]}
                      </ListItemIcon>
                      <ListItemText
                        primary={r.title}
                        secondary={r.subtitle}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      />
                      {isActive && (
                        <KeyboardReturnIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 1 }} />
                      )}
                    </ListItemButton>
                  );
                })}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer hints */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label={`${mod}+K`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} /> toggle
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label="arrow" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} /> navigate
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label="enter" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} /> open
        </Typography>
      </Box>
    </Dialog>
  );
};

export default CommandPalette;
