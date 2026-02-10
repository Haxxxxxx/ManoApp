export interface SearchResult {
  id: string;
  type: 'project' | 'song' | 'album';
  title: string;
  subtitle?: string;
  navigateTo: string;
}

export interface SearchGroup {
  type: SearchResult['type'];
  label: string;
  results: SearchResult[];
}
