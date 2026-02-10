/**
 * Analytics Types
 * Types for streaming analytics, revenue tracking, and dashboard data
 */

export interface StreamingStats {
  id: string;
  userId: string;
  songId: string;
  songTitle?: string;
  platformId: string;
  date: string;
  streams: number;
  listeners: number;
  saves: number;
  shares: number;
  revenue: number;
  country?: string;
  city?: string;
}

export interface RevenueEntry {
  id: string;
  userId: string;
  platformId: string;
  period: string;
  amount: number;
  currency: string;
  type: 'streaming' | 'download' | 'sync' | 'mechanical' | 'performance';
  songId?: string;
  description?: string;
}

export interface AnalyticsSummary {
  totalStreams: number;
  totalListeners: number;
  totalRevenue: number;
  topSongs: Array<{ songId: string; title: string; streams: number }>;
  topPlatforms: Array<{ platformId: string; streams: number; revenue: number }>;
  topCountries: Array<{ country: string; streams: number; listeners: number }>;
  trendsOverTime: Array<{ date: string; streams: number; revenue: number }>;
}

export interface DateRange {
  start: string;
  end: string;
}

export type DateRangePreset = '7d' | '30d' | '90d' | '1yr' | 'custom';
