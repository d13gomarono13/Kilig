/**
 * Text Chunker Service
 * 
 * Advanced text chunking with word-based overlap and section-aware strategies.
 * Ported from arxiv-paper-curator Python implementation.
 */

import { getSettings } from '../../config/index.js';
import type { ChunkingSettings } from '../../config/index.js';

export interface ChunkMetadata {
    chunkIndex: number;
    startChar: number;
    endChar: number;
    wordCount: number;
    overlapWithPrevious: number;
    overlapWithNext: number;
    sectionTitle?: string;
}

export interface TextChunk {
    text: string;
    metadata: ChunkMetadata;
    arxivId: string;
    paperId: string;
}

export interface Section {
    title: string;
    content: string;
}

export class TextChunker {
    private chunkSize: number;
    private overlapSize: number;
    private minChunkSize: number;

    constructor(settings?: ChunkingSettings) {
        const config = settings || getSettings().chunking;
        this.chunkSize = config.chunkSize;
        this.overlapSize = config.overlapSize;
        this.minChunkSize = config.minChunkSize;

        if (this.overlapSize >= this.chunkSize) {
            throw new Error('Overlap size must be less than chunk size');
        }

        console.log(
            `[TextChunker] Initialized: chunkSize=${this.chunkSize}, overlapSize=${this.overlapSize}, minChunkSize=${this.minChunkSize}`
        );
    }

    /**
     * Split text into words
     */
    private splitIntoWords(text: string): string[] {
        return text.match(/\S+/g) || [];
    }

    /**
     * Reconstruct text from words
     */
    private reconstructText(words: string[]): string {
        return words.join(' ');
    }

    /**
     * Chunk a paper using hybrid section-based approach
     */
    chunkPaper(
        title: string,
        abstract: string,
        fullText: string,
        arxivId: string,
        paperId: string,
        sections?: Section[] | Record<string, string> | string
    ): TextChunk[] {
        // Try section-based chunking first
        if (sections) {
            try {
                const sectionChunks = this.chunkBySections(title, abstract, arxivId, paperId, sections);
                if (sectionChunks.length > 0) {
                    console.log(`[TextChunker] Created ${sectionChunks.length} section-based chunks for ${arxivId}`);
                    return sectionChunks;
                }
            } catch (error) {
                console.warn(`[TextChunker] Section-based chunking failed for ${arxivId}:`, error);
            }
        }

        // Fallback to traditional word-based chunking
        console.log(`[TextChunker] Using traditional word-based chunking for ${arxivId}`);
        return this.chunkText(fullText, arxivId, paperId);
    }

    /**
     * Chunk text into overlapping segments using word-based approach
     */
    chunkText(text: string, arxivId: string, paperId: string): TextChunk[] {
        if (!text || !text.trim()) {
            console.warn(`[TextChunker] Empty text provided for paper ${arxivId}`);
            return [];
        }

        const words = this.splitIntoWords(text);

        if (words.length < this.minChunkSize) {
            console.warn(
                `[TextChunker] Text for paper ${arxivId} has only ${words.length} words, less than minimum ${this.minChunkSize}`
            );

            if (words.length > 0) {
                return [
                    {
                        text: this.reconstructText(words),
                        metadata: {
                            chunkIndex: 0,
                            startChar: 0,
                            endChar: text.length,
                            wordCount: words.length,
                            overlapWithPrevious: 0,
                            overlapWithNext: 0,
                        },
                        arxivId,
                        paperId,
                    },
                ];
            }
            return [];
        }

        const chunks: TextChunk[] = [];
        let chunkIndex = 0;
        let currentPosition = 0;

        while (currentPosition < words.length) {
            const chunkStart = currentPosition;
            const chunkEnd = Math.min(currentPosition + this.chunkSize, words.length);

            const chunkWords = words.slice(chunkStart, chunkEnd);
            const chunkText = this.reconstructText(chunkWords);

            // Calculate character offsets (approximate)
            const startChar = chunkStart > 0 ? this.reconstructText(words.slice(0, chunkStart)).length + 1 : 0;
            const endChar = this.reconstructText(words.slice(0, chunkEnd)).length;

            // Calculate overlaps
            const overlapWithPrevious = chunkStart > 0 ? Math.min(this.overlapSize, chunkStart) : 0;
            const overlapWithNext = chunkEnd < words.length ? this.overlapSize : 0;

            chunks.push({
                text: chunkText,
                metadata: {
                    chunkIndex,
                    startChar,
                    endChar,
                    wordCount: chunkWords.length,
                    overlapWithPrevious,
                    overlapWithNext,
                },
                arxivId,
                paperId,
            });

            // Move to next chunk position (with overlap)
            currentPosition += this.chunkSize - this.overlapSize;
            chunkIndex++;

            if (chunkEnd >= words.length) break;
        }

        console.log(`[TextChunker] Chunked paper ${arxivId}: ${words.length} words -> ${chunks.length} chunks`);
        return chunks;
    }

    /**
     * Section-based chunking strategy
     */
    private chunkBySections(
        title: string,
        abstract: string,
        arxivId: string,
        paperId: string,
        sections: Section[] | Record<string, string> | string
    ): TextChunk[] {
        const sectionsDict = this.parseSections(sections);
        if (Object.keys(sectionsDict).length === 0) return [];

        // Filter unwanted sections
        const filteredSections = this.filterSections(sectionsDict, abstract);
        if (Object.keys(filteredSections).length === 0) {
            console.warn(`[TextChunker] No meaningful sections found after filtering for ${arxivId}`);
            return [];
        }

        // Create header (title + abstract)
        const header = `${title}\n\nAbstract: ${abstract}\n\n`;

        const chunks: TextChunk[] = [];
        const smallSections: Array<{ title: string; content: string; wordCount: number }> = [];

        const sectionItems = Object.entries(filteredSections);

        for (let i = 0; i < sectionItems.length; i++) {
            const [sectionTitle, sectionContent] = sectionItems[i];
            const content = String(sectionContent || '');
            const sectionWords = content.split(/\s+/).length;

            if (sectionWords < 100) {
                // Collect small sections to combine
                smallSections.push({ title: sectionTitle, content, wordCount: sectionWords });

                // If last section or next is large, process accumulated
                if (i === sectionItems.length - 1 ||
                    String(sectionItems[i + 1]?.[1] || '').split(/\s+/).length >= 100) {
                    const combined = this.createCombinedChunk(header, smallSections, chunks, arxivId, paperId);
                    chunks.push(...combined);
                    smallSections.length = 0;
                }
            } else if (sectionWords <= 800) {
                // Perfect size - single chunk
                const chunkText = `${header}Section: ${sectionTitle}\n\n${content}`;
                chunks.push(this.createSectionChunk(chunkText, sectionTitle, chunks.length, arxivId, paperId));
            } else {
                // Large section - split
                const sectionText = `Section: ${sectionTitle}\n\n${content}`;
                const fullSectionText = `${header}${sectionText}`;
                const sectionChunks = this.splitLargeSection(
                    fullSectionText,
                    header,
                    sectionTitle,
                    chunks.length,
                    arxivId,
                    paperId
                );
                chunks.push(...sectionChunks);
            }
        }

        return chunks;
    }

    /**
     * Parse sections from various formats
     */
    private parseSections(sections: Section[] | Record<string, string> | string): Record<string, string> {
        if (typeof sections === 'string') {
            try {
                const parsed = JSON.parse(sections);
                if (Array.isArray(parsed)) {
                    return this.parseSectionsArray(parsed);
                }
                if (typeof parsed === 'object') {
                    return parsed;
                }
            } catch {
                return {};
            }
        }

        if (Array.isArray(sections)) {
            return this.parseSectionsArray(sections);
        }

        if (typeof sections === 'object') {
            return sections;
        }

        return {};
    }

    private parseSectionsArray(sections: any[]): Record<string, string> {
        const result: Record<string, string> = {};
        sections.forEach((section, i) => {
            if (typeof section === 'object' && section !== null) {
                const sectionTitle = section.title || section.heading || `Section ${i + 1}`;
                const content = section.content || section.text || '';
                result[sectionTitle] = content;
            } else {
                result[`Section ${i + 1}`] = String(section);
            }
        });
        return result;
    }

    /**
     * Filter unwanted sections
     */
    private filterSections(sections: Record<string, string>, abstract: string): Record<string, string> {
        const filtered: Record<string, string> = {};
        const abstractWords = new Set(abstract.toLowerCase().split(/\s+/));

        for (const [sectionTitle, content] of Object.entries(sections)) {
            const contentStr = String(content).trim();

            // Skip empty
            if (!contentStr) continue;

            // Skip metadata sections
            if (this.isMetadataSection(sectionTitle)) continue;

            // Skip duplicate abstracts
            if (this.isDuplicateAbstract(contentStr, abstract, abstractWords)) {
                                continue;
            }

            // Skip small metadata-only sections
            if (contentStr.split(/\s+/).length < 20 && this.isMetadataContent(contentStr)) {
                                continue;
            }

            filtered[sectionTitle] = contentStr;
        }

        return filtered;
    }

    private isMetadataSection(title: string): boolean {
        const titleLower = title.toLowerCase().trim();
        const metadataIndicators = [
            'content', 'header', 'authors', 'author', 'affiliation', 'email',
            'arxiv', 'preprint', 'submitted', 'received', 'accepted'
        ];

        if (metadataIndicators.includes(titleLower) || titleLower.length < 5) {
            return true;
        }

        return metadataIndicators.some(ind => titleLower.includes(ind) && titleLower.length < 20);
    }

    private isDuplicateAbstract(content: string, abstract: string, abstractWords: Set<string>): boolean {
        const contentLower = content.toLowerCase().trim();
        const abstractLower = abstract.toLowerCase().trim();

        // Direct match
        if (abstractLower.includes(contentLower) || contentLower.includes(abstractLower)) {
            return true;
        }

        // Word overlap check
        const contentWords = new Set(contentLower.split(/\s+/));
        if (abstractWords.size > 10) {
            let overlap = 0;
            for (const word of abstractWords) {
                if (contentWords.has(word)) overlap++;
            }
            if (overlap / abstractWords.size > 0.8) {
                return true;
            }
        }

        return false;
    }

    private isMetadataContent(content: string): boolean {
        const contentLower = content.toLowerCase();
        const patterns = ['@', 'arxiv:', 'university', 'institute', 'department',
            'college', 'gmail.com', 'edu', 'ac.uk', 'preprint'];

        const wordCount = content.split(/\s+/).length;
        if (wordCount < 30) {
            const matches = patterns.filter(p => contentLower.includes(p)).length;
            if (matches >= 2) return true;
        }

        return false;
    }

    private createCombinedChunk(
        header: string,
        smallSections: Array<{ title: string; content: string; wordCount: number }>,
        existingChunks: TextChunk[],
        arxivId: string,
        paperId: string
    ): TextChunk[] {
        if (smallSections.length === 0) return [];

        const combinedContent = smallSections.map(s => `Section: ${s.title}\n\n${s.content}`);
        const totalWords = smallSections.reduce((sum, s) => sum + s.wordCount, 0);
        const combinedText = `${header}${combinedContent.join('\n\n')}`;

        // If too small and have previous chunk, merge
        if (totalWords + header.split(/\s+/).length < 200 && existingChunks.length > 0) {
            const prevChunk = existingChunks[existingChunks.length - 1];
            prevChunk.text += `\n\n${combinedContent.join('\n\n')}`;
            prevChunk.metadata.wordCount = prevChunk.text.split(/\s+/).length;
            prevChunk.metadata.sectionTitle = `${prevChunk.metadata.sectionTitle || ''} + Combined`;
            return [];
        }

        const titles = smallSections.map(s => s.title).slice(0, 3);
        let combinedTitle = titles.join(' + ');
        if (smallSections.length > 3) {
            combinedTitle += ` + ${smallSections.length - 3} more`;
        }

        return [this.createSectionChunk(combinedText, combinedTitle, existingChunks.length, arxivId, paperId)];
    }

    private createSectionChunk(
        chunkText: string,
        sectionTitle: string,
        chunkIndex: number,
        arxivId: string,
        paperId: string
    ): TextChunk {
        return {
            text: chunkText,
            metadata: {
                chunkIndex,
                startChar: 0,
                endChar: chunkText.length,
                wordCount: chunkText.split(/\s+/).length,
                overlapWithPrevious: 0,
                overlapWithNext: 0,
                sectionTitle,
            },
            arxivId,
            paperId,
        };
    }

    private splitLargeSection(
        fullSectionText: string,
        header: string,
        sectionTitle: string,
        baseChunkIndex: number,
        arxivId: string,
        paperId: string
    ): TextChunk[] {
        // Remove header for chunking, add back to each chunk
        const sectionOnly = fullSectionText.slice(header.length);
        const traditionalChunks = this.chunkText(sectionOnly, arxivId, paperId);

        return traditionalChunks.map((chunk, i) => ({
            text: `${header}${chunk.text}`,
            metadata: {
                chunkIndex: baseChunkIndex + i,
                startChar: chunk.metadata.startChar,
                endChar: chunk.metadata.endChar + header.length,
                wordCount: chunk.text.split(/\s+/).length + header.split(/\s+/).length,
                overlapWithPrevious: chunk.metadata.overlapWithPrevious,
                overlapWithNext: chunk.metadata.overlapWithNext,
                sectionTitle: `${sectionTitle} (Part ${i + 1})`,
            },
            arxivId,
            paperId,
        }));
    }
}

// Factory function
export function createTextChunker(): TextChunker {
    return new TextChunker();
}
