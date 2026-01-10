/**
 * Unit tests for the Comic Manifest Validator Tool
 */
import { describe, it, expect } from 'vitest';
import { validateComicManifestTool } from './validate_comic_manifest.js';

describe('validateComicManifestTool', () => {
    const validManifest = {
        title: 'Test Comic',
        pages: [{
            id: 'page-1',
            panels: [{
                id: 'panel-1',
                type: 'image',
                layout: { x: 1, y: 1, w: 3, h: 4 }
            }]
        }]
    };

    describe('valid input', () => {
        it('should return VALID for correct manifest', async () => {
            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(validManifest)
            });

            expect(result).toBe('VALID');
        });

        it('should accept multiple pages', async () => {
            const manifest = {
                title: 'Multi-page Comic',
                pages: [
                    { id: 'page-1', panels: [{ id: 'p1', type: 'text', layout: { x: 1, y: 1, w: 2, h: 2 } }] },
                    { id: 'page-2', panels: [{ id: 'p2', type: 'image', layout: { x: 1, y: 1, w: 3, h: 3 } }] }
                ]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toBe('VALID');
        });

        it('should accept multiple non-overlapping panels', async () => {
            const manifest = {
                title: 'Grid Layout',
                pages: [{
                    id: 'page-1',
                    panels: [
                        { id: 'top-left', type: 'text', layout: { x: 1, y: 1, w: 3, h: 4 } },
                        { id: 'top-right', type: 'image', layout: { x: 4, y: 1, w: 3, h: 4 } },
                        { id: 'bottom', type: 'text', layout: { x: 1, y: 5, w: 6, h: 4 } }
                    ]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toBe('VALID');
        });
    });

    describe('JSON parsing', () => {
        it('should fail for invalid JSON', async () => {
            const result = await validateComicManifestTool.execute({
                manifest_json: '{ invalid }'
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('Invalid JSON');
        });
    });

    describe('structure validation', () => {
        it('should fail for missing title', async () => {
            const manifest = {
                pages: [{ id: 'p1', panels: [] }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain("Missing 'title'");
        });

        it('should fail for missing pages array', async () => {
            const manifest = { title: 'Comic' };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain("Missing or invalid 'pages'");
        });

        it('should fail for page missing id', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{ panels: [] }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain("missing 'id'");
        });

        it('should fail for page missing panels array', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{ id: 'page-1' }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain("missing 'panels'");
        });
    });

    describe('panel validation', () => {
        it('should fail for panel missing type', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [{ id: 'p1', layout: { x: 1, y: 1, w: 2, h: 2 } }]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain("missing 'type'");
        });

        it('should fail for panel missing layout', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [{ id: 'p1', type: 'text' }]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain("missing 'layout'");
        });
    });

    describe('bounds validation', () => {
        it('should fail for X coordinate out of bounds (< 1)', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [{ id: 'p1', type: 'text', layout: { x: 0, y: 1, w: 2, h: 2 } }]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('X coordinate out of bounds');
        });

        it('should fail for X coordinate out of bounds (> 6)', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [{ id: 'p1', type: 'text', layout: { x: 7, y: 1, w: 1, h: 1 } }]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('X coordinate out of bounds');
        });

        it('should fail for Y coordinate out of bounds', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [{ id: 'p1', type: 'text', layout: { x: 1, y: 9, w: 1, h: 1 } }]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('Y coordinate out of bounds');
        });

        it('should fail for width exceeding grid', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [{ id: 'p1', type: 'text', layout: { x: 5, y: 1, w: 3, h: 2 } }]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('width exceeds');
        });

        it('should fail for height exceeding grid', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [{ id: 'p1', type: 'text', layout: { x: 1, y: 7, w: 2, h: 3 } }]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('height exceeds');
        });
    });

    describe('overlap detection', () => {
        it('should fail for overlapping panels', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [
                        { id: 'p1', type: 'text', layout: { x: 1, y: 1, w: 3, h: 3 } },
                        { id: 'p2', type: 'image', layout: { x: 2, y: 2, w: 2, h: 2 } } // Overlaps
                    ]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain('overlaps');
        });
    });

    describe('revideo panel validation', () => {
        it('should fail for revideo panel missing templateId', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [{
                        id: 'p1',
                        type: 'revideo',
                        layout: { x: 1, y: 1, w: 3, h: 4 },
                        revideo: {}
                    }]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toContain('VALIDATION_FAILED');
            expect(result).toContain("missing 'templateId'");
        });

        it('should accept valid revideo panel with templateId', async () => {
            const manifest = {
                title: 'Comic',
                pages: [{
                    id: 'page-1',
                    panels: [{
                        id: 'p1',
                        type: 'revideo',
                        layout: { x: 1, y: 1, w: 3, h: 4 },
                        revideo: { templateId: 'template-123' }
                    }]
                }]
            };

            const result = await validateComicManifestTool.execute({
                manifest_json: JSON.stringify(manifest)
            });

            expect(result).toBe('VALID');
        });
    });
});
