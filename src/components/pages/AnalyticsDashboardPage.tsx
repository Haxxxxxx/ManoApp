import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button,
  ToggleButton, ToggleButtonGroup, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useAuth } from '../../contexts/AuthContext';
import { getAnalyticsSummary, importAnalyticsCSV } from '../../services/analyticsService';
import type { AnalyticsSummary, DateRange, DateRangePreset } from '../../types/analytics';

function getDateRange(preset: DateRangePreset): DateRange | undefined {
  if (preset === 'custom') return undefined;
  const end = new Date();
  const start = new Date();
  switch (preset) {
    case '7d': start.setDate(end.getDate() - 7); break;
    case '30d': start.setDate(end.getDate() - 30); break;
    case '90d': start.setDate(end.getDate() - 90); break;
    case '1yr': start.setFullYear(end.getFullYear() - 1); break;
  }
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

const AnalyticsDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    const dateRange = getDateRange(datePreset);
    getAnalyticsSummary(currentUser.uid, dateRange)
      .then(setSummary)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentUser, datePreset]);

  const handleImport = async () => {
    if (!importFile || !currentUser) return;
    setImporting(true);
    setImportResult(null);
    try {
      const count = await importAnalyticsCSV(importFile, currentUser.uid);
      setImportResult(`Successfully imported ${count} records`);
      setImportFile(null);
      // Refresh data
      const dateRange = getDateRange(datePreset);
      const newSummary = await getAnalyticsSummary(currentUser.uid, dateRange);
      setSummary(newSummary);
    } catch (err) {
      setImportResult(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  const maxStreams = useMemo(() => {
    if (!summary?.trendsOverTime.length) return 1;
    return Math.max(...summary.trendsOverTime.map(t => t.streams), 1);
  }, [summary]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => setImportOpen(true)}
          >
            Import CSV
          </Button>
          <ToggleButtonGroup
            value={datePreset}
            exclusive
            onChange={(_, v) => v && setDatePreset(v)}
            size="small"
          >
            <ToggleButton value="7d">7D</ToggleButton>
            <ToggleButton value="30d">30D</ToggleButton>
            <ToggleButton value="90d">90D</ToggleButton>
            <ToggleButton value="1yr">1Y</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="primary" />
                <Typography variant="body2" color="text.secondary">Total Streams</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {(summary?.totalStreams || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon color="info" />
                <Typography variant="body2" color="text.secondary">Total Listeners</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {(summary?.totalListeners || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachMoneyIcon color="success" />
                <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ${(summary?.totalRevenue || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MusicNoteIcon color="secondary" />
                <Typography variant="body2" color="text.secondary">Top Songs</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {summary?.topSongs.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Streams Over Time (bar chart using LinearProgress) */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Streams Over Time</Typography>
        {summary?.trendsOverTime.length ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {summary.trendsOverTime.slice(-30).map(point => (
              <Box key={point.date} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" sx={{ minWidth: 80 }}>{point.date}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={(point.streams / maxStreams) * 100}
                  sx={{ flex: 1, height: 16, borderRadius: 1 }}
                />
                <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'right' }}>
                  {point.streams.toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">No streaming data yet. Import a CSV to get started.</Typography>
        )}
      </Paper>

      {/* Platform Comparison */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Platform Breakdown</Typography>
            {summary?.topPlatforms.length ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Platform</TableCell>
                      <TableCell align="right">Streams</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.topPlatforms.map(p => (
                      <TableRow key={p.platformId}>
                        <TableCell>
                          <Chip label={p.platformId} size="small" />
                        </TableCell>
                        <TableCell align="right">{p.streams.toLocaleString()}</TableCell>
                        <TableCell align="right">${p.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">No platform data available.</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Top Countries</Typography>
            {summary?.topCountries.length ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Country</TableCell>
                      <TableCell align="right">Streams</TableCell>
                      <TableCell align="right">Listeners</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.topCountries.slice(0, 10).map(c => (
                      <TableRow key={c.country}>
                        <TableCell>{c.country}</TableCell>
                        <TableCell align="right">{c.streams.toLocaleString()}</TableCell>
                        <TableCell align="right">{c.listeners.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">No geographic data available.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Song Performance Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Song Performance</Typography>
        {summary?.topSongs.length ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Song</TableCell>
                  <TableCell align="right">Streams</TableCell>
                  <TableCell align="right">Share</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.topSongs.map((song, idx) => (
                  <TableRow key={song.songId}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{song.title}</TableCell>
                    <TableCell align="right">{song.streams.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      {summary.totalStreams > 0 ? `${((song.streams / summary.totalStreams) * 100).toFixed(1)}%` : '0%'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">No song performance data yet.</Typography>
        )}
      </Paper>

      {/* Import Dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Analytics CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV file with columns: date, songTitle, platform, streams, listeners, saves, shares, revenue, country
          </Typography>
          <Button component="label" variant="outlined" fullWidth>
            {importFile ? importFile.name : 'Select CSV File'}
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={e => setImportFile(e.target.files?.[0] || null)}
            />
          </Button>
          {importResult && (
            <Alert severity={importResult.startsWith('Successfully') ? 'success' : 'error'} sx={{ mt: 2 }}>
              {importResult}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!importFile || importing}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnalyticsDashboardPage;
