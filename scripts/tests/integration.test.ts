import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from '../../packages/backend/src/server.js';
import { validateSceneGraph } from '@kilig/shared';

/**
 * End-to-End Integration Tests for Kilig Pipeline
 * 
 * Tests the full flow: Paper Ingestion → Agent Analysis → SceneGraph Generation
 */

describe('Full Pipeline Integration Tests', () => {
    beforeAll(async () => {
        await server.ready();
    });

    afterAll(async () => {
        await server.close();
    });

    describe('Paper Ingestion → Agent Analysis → SceneGraph', () => {
        it('should process arXiv paper and generate valid SceneGraph', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/api/trigger',
                payload: {
                    query: 'Create a video explaining this paper: https://arxiv.org/pdf/2403.05530.pdf'
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            expect(response.statusCode).toBe(200);

            // Parse SSE stream
            const events = parseSSEStream(response.body);

            // Verify pipeline stages
            expect(events).toContainEqual(
                expect.objectContaining({ type: 'project_created' })
            );

            // Find SceneGraph artifact
            const sceneGraphEvent = events.find(
                e => e.type === 'artifact_updated' && e.artifactType === 'scenegraph'
            );

            expect(sceneGraphEvent).toBeDefined();

            // Validate SceneGraph schema
            const sceneGraph = JSON.parse(sceneGraphEvent.content);
            const validation = validateSceneGraph(sceneGraph);

            expect(validation.success).toBe(true);
            expect(sceneGraph.scenes.length).toBeGreaterThan(0);
            expect(sceneGraph.scenes.length).toBeLessThanOrEqual(5);
        }, 120000); // 2 minute timeout for full pipeline

        it('should handle all Revideo component types', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'test-scene',
                    duration: 5,
                    background: '#000000',
                    root_nodes: [
                        { type: 'Circle', props: { radius: 50, fill: '#ff0000' } },
                        { type: 'Rect', props: { width: 100, height: 100 } },
                        { type: 'Text', props: { text: 'Hello' } },
                        { type: 'Latex', props: { tex: 'E = mc^2' } },
                        { type: 'Layout', props: { direction: 'column' }, children: [] },
                    ]
                }]
            };

            const validation = validateSceneGraph(sceneGraph);
            expect(validation.success).toBe(true);
        });

        it('should validate animation easing functions', async () => {
            const validSceneGraph = {
                scenes: [{
                    id: 'animated-scene',
                    duration: 3,
                    root_nodes: [{
                        type: 'Circle',
                        props: { radius: 50 },
                        animations: [
                            {
                                prop: 'position.x',
                                target: 100,
                                duration: 2,
                                easing: 'easeInOutCubic'
                            }
                        ]
                    }]
                }]
            };

            const validation = validateSceneGraph(validSceneGraph);
            expect(validation.success).toBe(true);
        });

        it('should reject invalid easing functions', async () => {
            const invalidSceneGraph = {
                scenes: [{
                    id: 'animated-scene',
                    duration: 3,
                    root_nodes: [{
                        type: 'Circle',
                        props: { radius: 50 },
                        animations: [
                            {
                                prop: 'opacity',
                                target: 0,
                                duration: 1,
                                easing: 'invalidEasing' // Invalid
                            }
                        ]
                    }]
                }]
            };

            const validation = validateSceneGraph(invalidSceneGraph);
            expect(validation.success).toBe(false);
            expect(validation.errors?.some((e: string) => e.includes('easing'))).toBe(true);
        });
    });

    describe('Schema Validation', () => {
        it('should reject invalid SceneGraphs with negative duration', async () => {
            const invalidSceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: -5, // Invalid: negative duration
                    root_nodes: [{ type: 'Circle', props: {} }]
                }]
            };

            const validation = validateSceneGraph(invalidSceneGraph);
            expect(validation.success).toBe(false);
            expect(validation.errors?.some(e => e.includes('positive'))).toBe(true);
        });

        it('should enforce max 5 scenes limit', async () => {
            const sceneGraph = {
                scenes: Array(6).fill(null).map((_, i) => ({
                    id: `scene-${i}`,
                    duration: 2,
                    root_nodes: [{ type: 'Rect', props: {} }]
                }))
            };

            const validation = validateSceneGraph(sceneGraph);
            expect(validation.success).toBe(false);
            expect(validation.errors?.some(e => e.includes('5 scenes'))).toBe(true);
        });

        it('should require at least one scene', async () => {
            const sceneGraph = {
                scenes: []
            };

            const validation = validateSceneGraph(sceneGraph);
            expect(validation.success).toBe(false);
            expect(validation.errors?.some(e => e.includes('at least one scene'))).toBe(true);
        });

        it('should validate hex color format for backgrounds', async () => {
            const invalidSceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 2,
                    background: 'invalid-color', // Invalid: not a hex color
                    root_nodes: [{ type: 'Circle', props: {} }]
                }]
            };

            const validation = validateSceneGraph(invalidSceneGraph);
            expect(validation.success).toBe(false);
            expect(validation.errors?.some(e => e.includes('hex color'))).toBe(true);
        });

        it('should accept valid hex colors', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 2,
                    background: '#FF5733',
                    root_nodes: [{ type: 'Circle', props: {} }]
                }]
            };

            const validation = validateSceneGraph(sceneGraph);
            expect(validation.success).toBe(true);
        });

        it('should require at least one root node per scene', async () => {
            const invalidSceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 2,
                    root_nodes: [] // Invalid: no root nodes
                }]
            };

            const validation = validateSceneGraph(invalidSceneGraph);
            expect(validation.success).toBe(false);
            expect(validation.errors?.some(e => e.includes('at least one root node'))).toBe(true);
        });

        it('should validate component types', async () => {
            const invalidSceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 2,
                    root_nodes: [{
                        type: 'InvalidComponent', // Invalid component type
                        props: {}
                    }]
                }]
            };

            const validation = validateSceneGraph(invalidSceneGraph);
            expect(validation.success).toBe(false);
        });

        it('should support nested children nodes', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 2,
                    root_nodes: [{
                        type: 'Layout',
                        props: { direction: 'column' },
                        children: [
                            { type: 'Circle', props: { radius: 20 } },
                            { type: 'Rect', props: { width: 50, height: 50 } }
                        ]
                    }]
                }]
            };

            const validation = validateSceneGraph(sceneGraph);
            expect(validation.success).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed paper URLs gracefully', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/api/trigger',
                payload: {
                    query: 'Create a video for https://invalid-url-that-does-not-exist.com/paper.pdf'
                }
            });

            const events = parseSSEStream(response.body);
            const hasErrorOrDone = events.some((e: any) => e.type === 'error' || e.type === 'done');

            expect(hasErrorOrDone).toBe(true);
        }, 60000); // 1 minute timeout
    });
});

/**
 * Helper function to parse Server-Sent Events stream
 */
function parseSSEStream(body: string): any[] {
    const events: any[] = [];
    const lines = body.split('\n');

    for (const line of lines) {
        if (line.startsWith('data: ')) {
            try {
                const eventData = JSON.parse(line.substring(6));
                events.push(eventData);
            } catch (e) {
                // Skip malformed JSON
            }
        }
    }

    return events;
}
