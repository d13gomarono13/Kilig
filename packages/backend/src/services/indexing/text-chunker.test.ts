/**
 * Unit tests for the TextChunker Service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the config before importing
vi.mock('../../config/index.js', () => ({
    getSettings: vi.fn(() => ({
        chunking: {
            chunkSize: 200,
            overlapSize: 50,
            minChunkSize: 20,
            sectionBased: true
        }
    }))
}));

import { TextChunker, createTextChunker } from './text-chunker.js';

describe('TextChunker', () => {
    let chunker: TextChunker;

    beforeEach(() => {
        chunker = new TextChunker({
            chunkSize: 200,
            overlapSize: 50,
            minChunkSize: 20,
            sectionBased: true
        });
    });

    describe('constructor', () => {
        it('should initialize with custom settings', () => {
            const customChunker = new TextChunker({
                chunkSize: 100,
                overlapSize: 25,
                minChunkSize: 10,
                sectionBased: true
            });

            expect(customChunker).toBeDefined();
        });

        it('should throw if overlap >= chunkSize', () => {
            expect(() => {
                new TextChunker({
                    chunkSize: 100,
                    overlapSize: 100,
                    minChunkSize: 10,
                    sectionBased: true
                });
            }).toThrow('Overlap size must be less than chunk size');
        });

        it('should throw if overlap > chunkSize', () => {
            expect(() => {
                new TextChunker({
                    chunkSize: 100,
                    overlapSize: 150,
                    minChunkSize: 10,
                    sectionBased: true
                });
            }).toThrow('Overlap size must be less than chunk size');
        });
    });

    describe('chunkText', () => {
        it('should return empty array for empty text', () => {
            const chunks = chunker.chunkText('', 'arxiv:123', 'paper-1');

            expect(chunks).toHaveLength(0);
        });

        it('should return empty array for whitespace-only text', () => {
            const chunks = chunker.chunkText('   \n\t  ', 'arxiv:123', 'paper-1');

            expect(chunks).toHaveLength(0);
        });

        it('should return single chunk for text smaller than minChunkSize', () => {
            const shortText = 'This is a short text with less than minimum words.';
            const chunks = chunker.chunkText(shortText, 'arxiv:123', 'paper-1');

            expect(chunks).toHaveLength(1);
            expect(chunks[0].text).toBe(shortText);
            expect(chunks[0].metadata.chunkIndex).toBe(0);
        });

        it('should chunk long text into multiple segments', () => {
            // Create text with ~400 words (should result in ~3 chunks with 200 word chunkSize and 50 overlap)
            const words = Array.from({ length: 400 }, (_, i) => `word${i}`);
            const longText = words.join(' ');

            const chunks = chunker.chunkText(longText, 'arxiv:456', 'paper-2');

            expect(chunks.length).toBeGreaterThan(1);
            expect(chunks[0].arxivId).toBe('arxiv:456');
            expect(chunks[0].paperId).toBe('paper-2');
        });

        it('should include proper metadata in each chunk', () => {
            const words = Array.from({ length: 300 }, (_, i) => `test${i}`);
            const text = words.join(' ');

            const chunks = chunker.chunkText(text, 'arxiv:789', 'paper-3');

            for (const chunk of chunks) {
                expect(chunk.metadata).toHaveProperty('chunkIndex');
                expect(chunk.metadata).toHaveProperty('startChar');
                expect(chunk.metadata).toHaveProperty('endChar');
                expect(chunk.metadata).toHaveProperty('wordCount');
                expect(chunk.metadata.wordCount).toBeGreaterThan(0);
            }
        });

        it('should have overlap between consecutive chunks', () => {
            const words = Array.from({ length: 400 }, (_, i) => `overlap${i}`);
            const text = words.join(' ');

            const chunks = chunker.chunkText(text, 'arxiv:overlap', 'paper-overlap');

            expect(chunks.length).toBeGreaterThanOrEqual(2);

            // First chunk should have overlapWithNext > 0
            expect(chunks[0].metadata.overlapWithNext).toBeGreaterThan(0);

            // Second chunk should have overlapWithPrevious > 0
            expect(chunks[1].metadata.overlapWithPrevious).toBeGreaterThan(0);
        });

        it('should increment chunkIndex sequentially', () => {
            const words = Array.from({ length: 600 }, (_, i) => `idx${i}`);
            const text = words.join(' ');

            const chunks = chunker.chunkText(text, 'arxiv:idx', 'paper-idx');

            for (let i = 0; i < chunks.length; i++) {
                expect(chunks[i].metadata.chunkIndex).toBe(i);
            }
        });
    });

    describe('chunkPaper', () => {
        it('should fallback to word-based chunking when no sections provided', () => {
            const words = Array.from({ length: 300 }, (_, i) => `paper${i}`);
            const fullText = words.join(' ');

            const chunks = chunker.chunkPaper(
                'Test Paper Title',
                'This is the abstract.',
                fullText,
                'arxiv:paper1',
                'paper-id-1'
            );

            expect(chunks.length).toBeGreaterThan(0);
        });

        it('should use section-based chunking when sections object provided', () => {
            const sections = {
                'Introduction': 'This is the introduction section with enough content to be meaningful. ' +
                    'It contains multiple sentences and provides context for the paper.',
                'Methods': 'The methods section describes how the research was conducted. ' +
                    'It includes experimental design and data collection procedures.',
                'Results': 'The results section presents the findings. ' +
                    'Statistical analysis showed significant improvements.',
                'Conclusion': 'The conclusion summarizes the key findings and implications.'
            };

            const chunks = chunker.chunkPaper(
                'Research Paper',
                'This paper presents novel findings in the field.',
                'Full text content',
                'arxiv:sections1',
                'paper-sections-1',
                sections
            );

            expect(chunks.length).toBeGreaterThan(0);
        });

        it('should use section-based chunking when sections array provided', () => {
            const sections = [
                { title: 'Background', content: 'Background information about the topic.' },
                { title: 'Methodology', content: 'How we conducted the research study.' }
            ];

            const chunks = chunker.chunkPaper(
                'Array Sections Paper',
                'Abstract of the paper.',
                'Full text',
                'arxiv:arraysec',
                'paper-array',
                sections
            );

            expect(chunks.length).toBeGreaterThan(0);
        });

        it('should handle JSON string sections', () => {
            const sectionsJson = JSON.stringify({
                'Overview': 'Overview section content here.',
                'Analysis': 'Detailed analysis of the data.'
            });

            const chunks = chunker.chunkPaper(
                'JSON Sections Paper',
                'Abstract text.',
                'Full text content',
                'arxiv:json',
                'paper-json',
                sectionsJson
            );

            expect(chunks.length).toBeGreaterThan(0);
        });
    });

    describe('section filtering', () => {
        it('should skip metadata sections like "Authors"', () => {
            const sections = {
                'Authors': 'John Doe, Jane Smith, University',
                'Introduction': 'This is a meaningful introduction with enough content to be included. ' +
                    'It provides context and background for the research being presented.'
            };

            const chunks = chunker.chunkPaper(
                'Test Paper',
                'Abstract',
                'Full text',
                'arxiv:filter',
                'paper-filter',
                sections
            );

            // Should only include Introduction, not Authors
            const allText = chunks.map(c => c.text).join(' ');
            expect(allText).not.toContain('John Doe');
            expect(allText).toContain('Introduction');
        });
    });

    describe('createTextChunker factory', () => {
        it('should create a TextChunker instance', () => {
            const chunker = createTextChunker();

            expect(chunker).toBeInstanceOf(TextChunker);
        });
    });
});
