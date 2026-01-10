import { z } from 'zod';

// ============================================
// Agent Pipeline Types
// ============================================

export interface AgentMessage {
    role: 'user' | 'agent' | 'system';
    content: string;
    metadata?: Record<string, unknown>;
}

export interface PipelineState {
    stage: 'research' | 'narrative' | 'design' | 'validation';
    currentAgent: string;
    artifacts: Record<string, unknown>;
}

// ============================================
// Scene Graph Types (for video generation)
// ============================================

export const SceneGraphElementSchema = z.object({
    type: z.enum(['text', 'image', 'chart', 'diagram']),
    position: z.object({ x: z.number(), y: z.number() }),
    content: z.any(),
    duration: z.number().optional()
});

export const SceneGraphSchema = z.object({
    scenes: z.array(z.object({
        id: z.string(),
        duration: z.number(),
        elements: z.array(SceneGraphElementSchema)
    }))
});

export type SceneGraph = z.infer<typeof SceneGraphSchema>;
export type SceneGraphElement = z.infer<typeof SceneGraphElementSchema>;

// ============================================
// Comic Manifest Types
// ============================================

export const ComicPanelSchema = z.object({
    id: z.string(),
    description: z.string(),
    type: z.enum(['intro', 'explanation', 'data-viz', 'conclusion']),
    visual_type: z.string(),
    dialogue: z.string().optional(),
    caption: z.string().optional()
});

export const ComicPageSchema = z.object({
    pageNumber: z.number(),
    panels: z.array(ComicPanelSchema)
});

export const ComicManifestSchema = z.object({
    title: z.string(),
    pages: z.array(ComicPageSchema)
});

export type ComicManifest = z.infer<typeof ComicManifestSchema>;
export type ComicPanel = z.infer<typeof ComicPanelSchema>;
export type ComicPage = z.infer<typeof ComicPageSchema>;

// ============================================
// Paper Analysis Types
// ============================================

export interface PaperMetadata {
    arxivId?: string;
    title: string;
    authors?: string[];
    abstract?: string;
    categories?: string[];
    publishedDate?: string;
}

export interface CriticalAnalysis {
    coreConcept: string;
    methodology: string;
    results: string;
    validity: string;
    strengths: string[];
    weaknesses: string[];
}

// ============================================
// API Types
// ============================================

export interface GenerateVideoRequest {
    topic: string;
    paperUrl?: string;
    style?: 'educational' | 'entertaining' | 'professional';
}

export interface GenerateVideoResponse {
    success: boolean;
    videoId?: string;
    manifest?: ComicManifest;
    error?: string;
}

export interface PipelineStatusResponse {
    stage: PipelineState['stage'];
    progress: number; // 0-100
    currentAgent: string;
    message: string;
}
