import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Stack,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from '../../contexts/AuthContext';
import { getUserReleases, getTrips } from '../../services/firebaseService';
import { Release } from '../../types/release';
import { Trip } from '../../types/trip';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';
import { palette } from '../../theme/tokens';

type ReleaseStatus = Release['status'];

// One restrained ramp (draft → published), not a rainbow
const STATUS_META: Record<ReleaseStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: palette.text.secondary },
  'in-progress': { label: 'In progress', color: palette.semantic.warning },
  ready: { label: 'Ready', color: palette.semantic.info },
  published: { label: 'Published', color: palette.semantic.success },
  cancelled: { label: 'Cancelled', color: palette.semantic.error },
};

const PIPELINE: ReleaseStatus[] = ['draft', 'in-progress', 'ready', 'published'];

const formatDate = (d?: string): string => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const StatusChip = ({ status }: { status: ReleaseStatus }) => {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{
        color: meta.color,
        border: `1px solid ${meta.color}`,
        bgcolor: 'transparent',
        fontWeight: 600,
      }}
    />
  );
};

const DistributionPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [projects, setProjects] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReleaseStatus | 'all'>('all');

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    setLoading(true);
    Promise.all([
      getUserReleases(currentUser.uid).catch(() => [] as Release[]),
      getTrips(currentUser.uid).catch(() => [] as Trip[]),
    ]).then(([r, t]) => {
      if (!active) return;
      setReleases(r);
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

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: releases.length };
    for (const r of releases) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [releases]);

  const filtered = useMemo(
    () => (filter === 'all' ? releases : releases.filter((r) => r.status === filter)),
    [releases, filter]
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
          <RocketLaunchIcon sx={{ color: palette.accent.hover }} />
          <Typography variant="h1">Distribution</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Every release and where it is in the pipeline, across all your projects.
        </Typography>

        {/* Pipeline summary */}
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            mb: 3,
          }}
        >
          {PIPELINE.map((s) => (
            <Box
              key={s}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${palette.border.subtle}`,
                bgcolor: palette.surface.default,
              }}
            >
              <Typography variant="h2" sx={{ color: STATUS_META[s].color }}>
                {counts[s] ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {STATUS_META[s].label}
              </Typography>
            </Box>
          ))}
        </Box>

        <ToggleButtonGroup
          value={filter}
          exclusive
          size="small"
          onChange={(_, v) => v && setFilter(v)}
          sx={{ mb: 2, flexWrap: 'wrap' }}
        >
          <ToggleButton value="all">All ({counts.all ?? 0})</ToggleButton>
          {PIPELINE.map((s) => (
            <ToggleButton key={s} value={s}>
              {STATUS_META[s].label} ({counts[s] ?? 0})
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {loading ? (
          <SkeletonLoader variant="card" count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<RocketLaunchIcon sx={{ fontSize: 40 }} />}
            title={releases.length === 0 ? 'No releases yet' : 'No releases in this stage'}
            description={
              releases.length === 0
                ? 'Plan a release inside a project to start distributing to providers.'
                : 'Pick another stage to see those releases.'
            }
            actionLabel={releases.length === 0 ? 'Go to projects' : undefined}
            onAction={releases.length === 0 ? () => navigate('/') : undefined}
          />
        ) : (
          <TableContainer sx={{ border: `1px solid ${palette.border.subtle}`, borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Release</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ width: 160 }}>Progress</TableCell>
                  <TableCell align="right">Release date</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" noWrap>
                        {r.title || 'Untitled release'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {r.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {projectName(r.projectId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={r.status} />
                    </TableCell>
                    <TableCell>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, r.progress ?? 0))}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(r.releaseDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="text"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                        onClick={() => navigate(`/trip/${r.projectId}`)}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
};

export default DistributionPage;
