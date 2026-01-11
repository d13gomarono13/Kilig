/**
 * Feedback Table Verification Script
 * 
 * Run with: cd packages/backend && pnpm exec tsx ../../scripts/test_feedback_table.ts
 */
import 'dotenv/config';
import { feedbackService } from '../packages/backend/src/services/feedback/feedback-service.js';

async function testFeedbackTable() {
    console.log('📝 Testing Feedback Table & Service...\n');

    const testQuery = "What is the attention mechanism?";
    const testDocId = "doc_validation_123";
    const testUserId = "user_tester";

    try {
        // 1. Submit positive feedback
        console.log('1️⃣ Submitting positive feedback...');
        const feedbackId1 = await feedbackService.collectFeedback(
            testQuery,
            testDocId,
            'positive',
            testUserId
        );
        console.log(`   ✅ Feedback saved! ID: ${feedbackId1}`);

        // 2. Submit negative feedback for same doc (to test aggregation)
        console.log('2️⃣ Submitting negative feedback...');
        const feedbackId2 = await feedbackService.collectFeedback(
            testQuery,
            testDocId,
            'negative',
            testUserId
        );
        console.log(`   ✅ Feedback saved! ID: ${feedbackId2}`);

        // 3. Load feedback stats
        console.log('3️⃣ Loading feedback stats for query...');
        const stats = await feedbackService.loadFeedback(testQuery);

        if (stats.length > 0) {
            console.log(`   ✅ Found stats for document: ${stats[0].documentId}`);
            console.log(`      Positive: ${stats[0].positiveCount}`);
            console.log(`      Negative: ${stats[0].negativeCount}`);
            console.log(`      Net Score: ${stats[0].netScore}`);

            if (stats[0].positiveCount >= 1 && stats[0].negativeCount >= 1) {
                console.log('\n🎉 Feedback table verification SUCCESSFUL!');
            } else {
                console.log('\n⚠️ Stats mismatch! Check database content.');
            }
        } else {
            console.log('\n❌ No stats found! Insert might have failed silently or RLS policy is blocking read.');
        }

    } catch (error: any) {
        console.error(`\n❌ Error: ${error.message}`);
        console.error(error);
    }
}

testFeedbackTable();
