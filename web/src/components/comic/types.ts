
export type PanelType = 'static' | 'revideo' | 'code' | 'chart' | 'revideo-scene';

export interface RevideoConfig {
  templateId: string; // e.g., "bar-chart-v1", "molecular-structure"
  data: Record<string, any>; // The props for the template
  thumbnailUrl?: string; // Static preview
}

export interface ComicPanelData {
  id: string;
  type: PanelType;
  title?: string;
  content?: string; // For static text
  imageUrl?: string; // Background image or illustration
  revideo?: RevideoConfig;
  codeSnippet?: {
    language: string;
    code: string;
  };
  layout: {
    x: number; // Grid column (1-12)
    y: number; // Grid row
    w: number; // Width (cols)
    h: number; // Height (rows)
  };
}

export interface ComicPage {
  id: string;
  panels: ComicPanelData[];
}

export interface ComicManifest {
  id?: string;
  title: string;
  meta?: Record<string, any>;
  pages: ComicPage[];
}
