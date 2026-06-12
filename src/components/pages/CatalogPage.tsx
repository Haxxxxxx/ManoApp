import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  Stack,
  MenuItem,
  Select,
  LinearProgress,
  Tooltip,
  Avatar,
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AlbumIcon from '@mui/icons-material/Album';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import { useAuth } from '../../contexts/AuthContext';
import { getUserSongs, getAlbums, getTrips } from '../../services/firebaseService';
import { Song, SongStatus } from '../../types/song';
import { Album } from '../../types/album';
import { Trip } from '../../types/trip';
import SongStatusBadge from '../common/SongStatusBadge';
import SearchBar from '../common/SearchBar';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';
import { calculateMetadataCompleteness } from '../../utils/metadataCompleteness';
import { palette } from '../../theme/tokens';

const STATUS_OPTIONS: Array<SongStatus | 'all'> = [
  'all',
  'draft',
  'in-review',
  'ready',
  'published',
  'archived',
];

const formatDuration = (d: string | number | undefined): string => {
  if (d == null) return '—';
  if (typeof d === 'string') return d || '—';
  const m = Math.floor(d / 60);
  const s = Math.floor(d % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (d: string | Date | undefined): string => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const CatalogPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [projects, setProjects] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SongStatus | 'all'>('all');

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    setLoading(true);
    Promise.all([
      getUserSongs(currentUser.uid).catch(() => [] as Song[]),
      getAlbums(currentUser.uid).catch(() => [] as Album[]),
      getTrips(currentUser.uid).catch(() => [] as Trip[]),
    ]).then(([s, a, t]) => {
      if (!active) return;
      setSongs(s);
      setAlbums(a as Album[]);
      setProjects(t as Trip[]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [currentUser]);

  const projectName = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p.name]));
    return (id?: string) => (id ? map.get(id) ?? '—' : '—');
  }, [projects]);

  const filteredSongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return songs.filter((s) => {
      if (statusFilter !== 'all' && (s.status ?? 'draft') !== statusFilter) return false;
      if (!q) return true;
      return (
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q) ||
        projectName(s.tripId).toLowerCase().includes(q)
      );
    });
  }, [songs, search, statusFilter, projectName]);

  const filteredAlbums = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return albums;
    return albums.filter(
      (a) => a.title?.toLowerCase().includes(q) || a.artist?.toLowerCase().includes(q)
    );
  }, [albums, search]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
          <LibraryMusicIcon sx={{ color: palette.accent.hover }} />
          <Typography variant="h1">Catalog</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Every song and album across all your projects, in one place.
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab icon={<MusicNoteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Songs (${songs.length})`} />
          <Tab icon={<AlbumIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Albums (${albums.length})`} />
        </Tabs>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <SearchBar
              placeholder={tab === 0 ? 'Search songs, artists, projects…' : 'Search albums…'}
              onSearch={setSearch}
              size="small"
            />
          </Box>
          {tab === 0 && (
            <Select
              value={statusFilter}
              size="small"
              onChange={(e) => setStatusFilter(e.target.value as SongStatus | 'all')}
              sx={{ minWidth: 160 }}
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                  {s === 'all' ? 'All statuses' : s.replace('-', ' ')}
                </MenuItem>
              ))}
            </Select>
          )}
        </Stack>

        {loading ? (
          <SkeletonLoader variant="card" count={6} />
        ) : tab === 0 ? (
          filteredSongs.length === 0 ? (
            <EmptyState
              icon={<MusicNoteIcon sx={{ fontSize: 40 }} />}
              title={songs.length === 0 ? 'No songs yet' : 'No songs match your filters'}
              description={
                songs.length === 0
                  ? 'Add songs inside a project and they will show up here.'
                  : 'Try a different search or status filter.'
              }
            />
          ) : (
            <TableContainer
              sx={{ border: `1px solid ${palette.border.subtle}`, borderRadius: 2 }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ width: 160 }}>Completeness</TableCell>
                    <TableCell align="right">Duration</TableCell>
                    <TableCell align="right">Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSongs.map((song) => {
                    const completeness = calculateMetadataCompleteness(song);
                    return (
                      <TableRow
                        key={song.id}
                        hover
                        onClick={() => navigate(`/song/${song.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              variant="rounded"
                              src={song.imagePath || undefined}
                              sx={{ width: 36, height: 36, bgcolor: palette.surface.elevated }}
                            >
                              <MusicNoteIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap>
                                {song.title || 'Untitled'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {song.artist || 'Unknown artist'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {projectName(song.tripId)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <SongStatusBadge status={song.status ?? 'draft'} />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`${completeness.score}% complete`}>
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={completeness.score}
                                color={completeness.color}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatDuration(song.duration)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(song.updatedAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : filteredAlbums.length === 0 ? (
          <EmptyState
            icon={<AlbumIcon sx={{ fontSize: 40 }} />}
            title={albums.length === 0 ? 'No albums yet' : 'No albums match your search'}
            description={
              albums.length === 0
                ? 'Create an album from your project songs to see it here.'
                : 'Try a different search term.'
            }
            actionLabel={albums.length === 0 ? 'Go to Albums' : undefined}
            onAction={albums.length === 0 ? () => navigate('/albums') : undefined}
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            {filteredAlbums.map((album) => (
              <Box
                key={album.id}
                onClick={() => navigate(`/albums/${album.id}`)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: `1px solid ${palette.border.subtle}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                  '&:hover': { borderColor: palette.border.strong },
                }}
              >
                <Box
                  sx={{
                    aspectRatio: '1 / 1',
                    bgcolor: palette.surface.elevated,
                    display: 'grid',
                    placeItems: 'center',
                    backgroundImage: album.coverImage ? `url(${album.coverImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!album.coverImage && <AlbumIcon sx={{ fontSize: 40, color: palette.text.disabled }} />}
                </Box>
                <Box sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" noWrap>
                    {album.title || 'Untitled album'}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {album.artist || 'Unknown'}
                    </Typography>
                    <Chip
                      label={`${album.songs?.length ?? 0} tracks`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: 11 }}
                    />
                  </Stack>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CatalogPage;
