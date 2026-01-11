/**
 * Feedback Service for RAG Improvement
 * 
 * Collects user feedback on search results and adjusts document relevance scores
 * based on historical feedback. Enables continuous learning from user interactions.
 */

import { createClient } from '@supabase/supabase-js';
import { settings } from '../../config/index.js';
import * as crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(settings.supabaseUrl, settings.supabaseKey);

export type FeedbackRating = 'positive' | 'negative';

export interface Feedback {
    id: string;
    query: string;
    queryHash: string;
    documentId: string;
    rating: FeedbackRating;
    userId?: string;
    sessionId?: string;
    createdAt: string;
}

export interface SearchHit {
    documentId: string;
    score: number;
    [key: string]: any;
}

export interface FeedbackStats {
    documentId: string;
    positiveCount: number;
    negativeCount: number;
    netScore: number;
}

/**
 * Normalize and hash a query for consistent lookups
 */
function hashQuery(query: string): string {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
    return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

export class FeedbackService {

    /**
     * Collect user feedback on a search result
     */
    async collectFeedback(
        query: string,
        documentId: string,
        rating: FeedbackRating,
        userId?: string,
        sessionId?: string
    ): Promise<string> {
        const queryHash = hashQuery(query);

        const { data, error } = await supabase
            .from('feedback')
            .insert({
                query,
                query_hash: queryHash,
                document_id: documentId,
                rating,
                user_id: userId,
                session_id: sessionId
            })
            .select('id')
            .single();

        if (error) {
            console.error('[FeedbackService] Error collecting feedback:', error.message);
            throw new Error(`Failed to collect feedback: ${error.message}`);
        }

        console.log(`[FeedbackService] Collected ${rating} feedback for doc ${documentId}`);
        return data.id;
    }

    /**
     * Load historical feedback for a query
     */
    async loadFeedback(query: string): Promise<FeedbackStats[]> {
        const queryHash = hashQuery(query);

        const { data, error } = await supabase
            .from('feedback')
            .select('document_id, rating')
            .eq('query_hash', queryHash);

        if (error) {
            console.error('[FeedbackService] Error loading feedback:', error.message);
            return [];
        }

        // Aggregate by document
        const stats: Map<string, FeedbackStats> = new Map();

        for (const row of data || []) {
            const docId = row.document_id;
            if (!stats.has(docId)) {
                stats.set(docId, {
                    documentId: docId,
                    positiveCount: 0,
                    negativeCount: 0,
                    netScore: 0
                });
            }
            const s = stats.get(docId)!;
            if (row.rating === 'positive') {
                s.positiveCount++;
            } else {
                s.negativeCount++;
            }
            s.netScore = s.positiveCount - s.negativeCount;
        }

        return Array.from(stats.values());
    }

    /**
     * Adjust relevance scores based on historical feedback
     * Boosts positively-rated documents, penalizes negatively-rated ones
     */
    async adjustRelevanceScores<T extends SearchHit>(
        query: string,
        hits: T[]
    ): Promise<T[]> {
        const feedbackStats = await this.loadFeedback(query);

        if (feedbackStats.length === 0) {
            return hits; // No feedback to apply
        }

        // Create lookup map
        const feedbackMap = new Map(feedbackStats.map(f => [f.documentId, f]));

        // Apply score adjustments
        const adjustedHits = hits.map(hit => {
            const feedback = feedbackMap.get(hit.documentId);
            if (!feedback) return hit;

            // Adjustment formula: score * (1 + netScore * 0.1)
            // Each positive adds 10% boost, each negative subtracts 10%
            const multiplier = 1 + (feedback.netScore * 0.1);
            const adjustedScore = hit.score * Math.max(0.1, multiplier); // Floor at 10% of original

            console.log(`[FeedbackService] Adjusted ${hit.documentId}: ${hit.score.toFixed(3)} -> ${adjustedScore.toFixed(3)} (net: ${feedback.netScore})`);

            return { ...hit, score: adjustedScore, feedbackAdjusted: true };
        });

        // Re-sort by adjusted score
        adjustedHits.sort((a, b) => b.score - a.score);

        return adjustedHits;
    }

    /**
     * Get aggregate feedback statistics for analytics
     */
    async getAggregateStats(): Promise<{
        totalFeedback: number;
        positiveCount: number;
        negativeCount: number;
        topRatedDocs: FeedbackStats[];
        worstRatedDocs: FeedbackStats[];
    }> {
        const { data, error } = await supabase
            .from('feedback')
            .select('document_id, rating');

        if (error || !data) {
            return {
                totalFeedback: 0,
                positiveCount: 0,
                negativeCount: 0,
                topRatedDocs: [],
                worstRatedDocs: []
            };
        }

        const stats: Map<string, FeedbackStats> = new Map();
        let positiveCount = 0;
        let negativeCount = 0;

        for (const row of data) {
            if (row.rating === 'positive') positiveCount++;
            else negativeCount++;

            const docId = row.document_id;
            if (!stats.has(docId)) {
                stats.set(docId, {
                    documentId: docId,
                    positiveCount: 0,
                    negativeCount: 0,
                    netScore: 0
                });
            }
            const s = stats.get(docId)!;
            if (row.rating === 'positive') s.positiveCount++;
            else s.negativeCount++;
            s.netScore = s.positiveCount - s.negativeCount;
        }

        const allStats = Array.from(stats.values());
        allStats.sort((a, b) => b.netScore - a.netScore);

        return {
            totalFeedback: data.length,
            positiveCount,
            negativeCount,
            topRatedDocs: allStats.slice(0, 10),
            worstRatedDocs: allStats.slice(-10).reverse()
        };
    }
}

// Singleton instance
export const feedbackService = new FeedbackService();
