/**
 * Analytics Service
 * Queries streaming stats and revenue from Firestore
 */

import { db, auth } from '../firebase/config';
import { collection, getDocs, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { StreamingStats, RevenueEntry, AnalyticsSummary, DateRange } from '../types/analytics';

export async function getStreamingStats(
  userId: string,
  dateRange?: DateRange,
  filters?: { songId?: string; platformId?: string }
): Promise<StreamingStats[]> {
  const q = query(
    collection(db, 'streamingStats'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  let stats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StreamingStats));

  if (dateRange) {
    stats = stats.filter(s => s.date >= dateRange.start && s.date <= dateRange.end);
  }
  if (filters?.songId) {
    stats = stats.filter(s => s.songId === filters.songId);
  }
  if (filters?.platformId) {
    stats = stats.filter(s => s.platformId === filters.platformId);
  }

  return stats;
}

export async function getRevenueSummary(
  userId: string,
  period?: string
): Promise<RevenueEntry[]> {
  const q = query(
    collection(db, 'revenue'),
    where('userId', '==', userId),
    orderBy('period', 'desc')
  );

  const snapshot = await getDocs(q);
  let entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RevenueEntry));

  if (period) {
    entries = entries.filter(e => e.period === period);
  }

  return entries;
}

export async function getAnalyticsSummary(userId: string, dateRange?: DateRange): Promise<AnalyticsSummary> {
  const stats = await getStreamingStats(userId, dateRange);
  const revenue = await getRevenueSummary(userId);

  const totalStreams = stats.reduce((sum, s) => sum + s.streams, 0);
  const totalListeners = stats.reduce((sum, s) => sum + s.listeners, 0);
  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);

  // Top songs
  const songMap = new Map<string, { songId: string; title: string; streams: number }>();
  stats.forEach(s => {
    const existing = songMap.get(s.songId) || { songId: s.songId, title: s.songTitle || s.songId, streams: 0 };
    existing.streams += s.streams;
    songMap.set(s.songId, existing);
  });
  const topSongs = Array.from(songMap.values()).sort((a, b) => b.streams - a.streams).slice(0, 10);

  // Top platforms
  const platformMap = new Map<string, { platformId: string; streams: number; revenue: number }>();
  stats.forEach(s => {
    const existing = platformMap.get(s.platformId) || { platformId: s.platformId, streams: 0, revenue: 0 };
    existing.streams += s.streams;
    existing.revenue += s.revenue;
    platformMap.set(s.platformId, existing);
  });
  const topPlatforms = Array.from(platformMap.values()).sort((a, b) => b.streams - a.streams);

  // Top countries
  const countryMap = new Map<string, { country: string; streams: number; listeners: number }>();
  stats.filter(s => s.country).forEach(s => {
    const existing = countryMap.get(s.country!) || { country: s.country!, streams: 0, listeners: 0 };
    existing.streams += s.streams;
    existing.listeners += s.listeners;
    countryMap.set(s.country!, existing);
  });
  const topCountries = Array.from(countryMap.values()).sort((a, b) => b.streams - a.streams).slice(0, 20);

  // Trends over time
  const dateMap = new Map<string, { date: string; streams: number; revenue: number }>();
  stats.forEach(s => {
    const existing = dateMap.get(s.date) || { date: s.date, streams: 0, revenue: 0 };
    existing.streams += s.streams;
    existing.revenue += s.revenue;
    dateMap.set(s.date, existing);
  });
  const trendsOverTime = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return { totalStreams, totalListeners, totalRevenue, topSongs, topPlatforms, topCountries, trendsOverTime };
}

export async function getSongAnalytics(songId: string, dateRange?: DateRange): Promise<StreamingStats[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be logged in');

  return getStreamingStats(currentUser.uid, dateRange, { songId });
}

interface CSVRow {
  date: string;
  songTitle: string;
  platform: string;
  streams: string;
  listeners: string;
  saves: string;
  shares: string;
  revenue: string;
  country?: string;
}

export async function importAnalyticsCSV(file: File, userId: string): Promise<number> {
  const text = await file.text();
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: CSVRow[] = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row as unknown as CSVRow;
  });

  const batch = writeBatch(db);
  let count = 0;

  for (const row of rows) {
    const statsRef = doc(collection(db, 'streamingStats'));
    batch.set(statsRef, {
      userId,
      songId: row.songTitle?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      songTitle: row.songTitle || 'Unknown',
      platformId: (row.platform || 'unknown').toLowerCase(),
      date: row.date || new Date().toISOString().split('T')[0],
      streams: parseInt(row.streams) || 0,
      listeners: parseInt(row.listeners) || 0,
      saves: parseInt(row.saves) || 0,
      shares: parseInt(row.shares) || 0,
      revenue: parseFloat(row.revenue) || 0,
      country: row.country || undefined,
    });
    count++;

    // Firestore batch limit is 500
    if (count % 450 === 0) {
      await batch.commit();
    }
  }

  await batch.commit();
  return count;
}
