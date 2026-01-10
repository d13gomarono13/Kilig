/**
 * Unit tests for the SceneGraph Validator Tool
 */
import { describe, it, expect } from 'vitest';
import { validateSceneGraphTool } from './validate_scenegraph.js';

describe('validateSceneGraphTool', () => {
    const validSceneGraph = {
        scenes: [{
            id: 'scene-1',
            duration: 5,
            background: '#000000',
            root_nodes: [{
                type: 'Text',
                props: { text: 'Hello World', fontSize: 24 },
                animations: [{
                    prop: 'opacity',
                    target: 1,
                    duration: 0.5,
                    easing: 'easeInOutCubic'
                }]
            }]
        }]
    };

    describe('valid input', () => {
        it('should return VALID for correct scene graph', async () => {
            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify(validSceneGraph)
            });

            expect(result).toBe('VALID');
        });

        it('should accept all valid node types', async () => {
            const nodeTypes = ['Circle', 'Rect', 'Line', 'Text', 'Layout', 'Img', 'Latex', 'Grid', 'Spline'];

            for (const type of nodeTypes) {
                const sceneGraph = {
                    scenes: [{
                        id: 'scene-1',
                        duration: 3,
                        root_nodes: [{
                            type,
                            props: {}
                        }]
                    }]
                };

                const result = await (validateSceneGraphTool as any).execute({
                    json_content: JSON.stringify(sceneGraph)
                });

                expect(result).toBe('VALID');
            }
        });

        it('should accept all valid easing functions', async () => {
            const easings = ['linear', 'easeInQuad', 'easeOutCubic', 'easeInOutExpo'];

            for (const easing of easings) {
                const sceneGraph = {
                    scenes: [{
                        id: 'scene-1',
                        duration: 2,
                        root_nodes: [{
                            type: 'Rect',
                            props: {},
                            animations: [{
                                prop: 'x',
                                target: 100,
                                duration: 1,
                                easing
                            }]
                        }]
                    }]
                };

                const result = await (validateSceneGraphTool as any).execute({
                    json_content: JSON.stringify(sceneGraph)
                });

                expect(result).toBe('VALID');
            }
        });
    });

    describe('JSON parsing errors', () => {
        it('should return error for invalid JSON syntax', async () => {
            const result = await (validateSceneGraphTool as any).execute({
                json_content: '{ invalid json }'
            });

            expect(result).toContain('CRITICAL');
            expect(result).toContain('Invalid JSON');
        });

        it('should handle empty string', async () => {
            const result = await (validateSceneGraphTool as any).execute({
                json_content: ''
            });

            expect(result).toContain('CRITICAL');
        });
    });

    describe('schema validation errors', () => {
        it('should reject empty scenes array', async () => {
            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify({ scenes: [] })
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('at least one scene');
        });

        it('should reject missing scene id', async () => {
            const sceneGraph = {
                scenes: [{
                    duration: 5,
                    root_nodes: [{ type: 'Text', props: {} }]
                }]
            };

            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify(sceneGraph)
            });

            expect(result).toContain('VALIDATION_FAILED');
        });

        it('should reject negative duration', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: -1,
                    root_nodes: [{ type: 'Text', props: {} }]
                }]
            };

            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify(sceneGraph)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('positive');
        });

        it('should reject invalid hex color', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 5,
                    background: 'red', // Not hex
                    root_nodes: [{ type: 'Text', props: {} }]
                }]
            };

            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify(sceneGraph)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('hex color');
        });

        it('should reject invalid node type', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 5,
                    root_nodes: [{ type: 'InvalidType', props: {} }]
                }]
            };

            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify(sceneGraph)
            });

            expect(result).toContain('VALIDATION_FAILED');
        });

        it('should reject invalid easing function', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 5,
                    root_nodes: [{
                        type: 'Rect',
                        props: {},
                        animations: [{
                            prop: 'x',
                            target: 100,
                            duration: 1,
                            easing: 'invalidEasing'
                        }]
                    }]
                }]
            };

            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify(sceneGraph)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('easing');
        });

        it('should reject negative animation duration', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 5,
                    root_nodes: [{
                        type: 'Circle',
                        props: {},
                        animations: [{
                            prop: 'radius',
                            target: 50,
                            duration: -1
                        }]
                    }]
                }]
            };

            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify(sceneGraph)
            });

            expect(result).toContain('VALIDATION_FAILED');
        });
    });

    describe('optional fields', () => {
        it('should accept scene without background', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 5,
                    root_nodes: [{ type: 'Text', props: {} }]
                }]
            };

            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify(sceneGraph)
            });

            expect(result).toBe('VALID');
        });

        it('should accept node without animations', async () => {
            const sceneGraph = {
                scenes: [{
                    id: 'scene-1',
                    duration: 5,
                    root_nodes: [{ type: 'Rect', props: { width: 100 } }]
                }]
            };

            const result = await (validateSceneGraphTool as any).execute({
                json_content: JSON.stringify(sceneGraph)
            });

            expect(result).toBe('VALID');
        });
    });
});
