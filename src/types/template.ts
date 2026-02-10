export type TemplateId = 'project' | 'single' | 'ep' | 'album' | 'mixtape';

export interface TemplateChecklistItem {
  id: string;
  label: string;
  category: 'metadata' | 'audio' | 'distribution' | 'legal' | 'marketing';
  required: boolean;
}

export interface ProjectTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: string; // MUI icon name
  tags: string[];
  defaultType: string;
  checklist: TemplateChecklistItem[];
  suggestedSongCount?: { min: number; max: number };
}
