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
// Revideo-Compliant Schema
// ============================================

// Valid Revideo component types
export const RevideoComponentType = z.enum([
    'Circle',
    'Rect',
    'Line',
    'Text',
    'Layout',
    'Img',
    'Latex',
    'Grid',
    'Spline'
]);

// Valid easing functions in Revideo
export const EasingFunction = z.enum([
    'linear',
    'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
    'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
    'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
    'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
    'easeInSine', 'easeOutSine', 'easeInOutSine',
    'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
    'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
    'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
    'easeInBack', 'easeOutBack', 'easeInOutBack',
    'easeInBounce', 'easeOutBounce', 'easeInOutBounce',
]);

// Animation schema
export const AnimationSchema = z.object({
    prop: z.string().describe('Property path to animate (e.g., "position.x", "opacity")'),
    target: z.any().describe('Target value for the property'),
    duration: z.number().positive('Animation duration must be positive'),
    easing: EasingFunction.optional().describe('Easing function for smooth transitions'),
});

// Hex color validation
const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;

// Node schema (recursive for children)
export const SceneGraphNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
    type: RevideoComponentType,
    props: z.record(z.any()).describe('Component properties (x, y, width, height, fill, etc.)'),
    children: z.array(SceneGraphNodeSchema).optional(),
    animations: z.array(AnimationSchema).optional(),
}));

// Scene schema
export const SceneSchema = z.object({
    id: z.string().min(1, 'Scene ID is required'),
    duration: z.number().positive('Scene duration must be positive'),
    background: z.string()
        .regex(hexColorRegex, 'Background must be a valid hex color (e.g., #000000)')
        .optional(),
    root_nodes: z.array(SceneGraphNodeSchema)
        .min(1, 'Scene must have at least one root node'),
});

// SceneGraph schema
export const SceneGraphSchema = z.object({
    scenes: z.array(SceneSchema)
        .min(1, 'SceneGraph must have at least one scene')
        .max(5, 'SceneGraph cannot exceed 5 scenes'),
});

export type SceneGraph = z.infer<typeof SceneGraphSchema>;
export type SceneGraphNode = z.infer<typeof SceneGraphNodeSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Animation = z.infer<typeof AnimationSchema>;

// Validation helper function
export function validateSceneGraph(data: unknown): {
    success: boolean;
    data?: SceneGraph;
    errors?: string[];
} {
    const result = SceneGraphSchema.safeParse(data);

    if (result.success) {
        return {
            success: true,
            data: result.data
        };
    }

    return {
        success: false,
        errors: result.error.errors.map(
            err => `${err.path.join('.')}: ${err.message}`
        ),
    };
}

// Legacy compatibility - deprecated, use SceneGraph instead
export const SceneGraphElementSchema = z.object({
    type: z.enum(['text', 'image', 'chart', 'diagram']),
    position: z.object({ x: z.number(), y: z.number() }),
    content: z.any(),
    duration: z.number().optional()
});

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
