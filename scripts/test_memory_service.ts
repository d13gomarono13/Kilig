/**
 * Memory Service Verification Script
 * 
 * Run with: cd packages/backend && pnpm exec tsx ../../scripts/test_memory_service.ts
 */
import 'dotenv/config';
import { memoryService } from '../packages/backend/src/services/memory/mem0-service.js';

const TEST_USER_ID = 'test-user-memory-123';

async function testMemoryService() {
    console.log('🧠 Testing Memory Service...\n');

    try {
        // 1. Add a user preference
        console.log('1️⃣ Adding user preference...');
        const prefId = await memoryService.addMemory(TEST_USER_ID, 'User prefers concise explanations with code examples', {
            type: 'user_preference',
            source: 'test'
        });
        console.log(`   ✅ Added preference: ${prefId}\n`);

        // 2. Add a validator learning
        console.log('2️⃣ Adding validator learning...');
        const learnId = await memoryService.addMemory(TEST_USER_ID, 'Comic manifests must have at least 2 revideo panels for data visualization', {
            type: 'validator_learning',
            context: 'comic_generation',
            source: 'test'
        });
        console.log(`   ✅ Added learning: ${learnId}\n`);

        // 3. Search for relevant memories
        console.log('3️⃣ Searching for memories about "data visualization"...');
        const searchResults = await memoryService.searchMemories(TEST_USER_ID, 'data visualization in comics', 5);
        console.log(`   ✅ Found ${searchResults.length} relevant memories:`);
        searchResults.forEach((r, i) => {
            console.log(`      ${i + 1}. [${r.memory.metadata?.type}] "${r.memory.content.slice(0, 60)}..." (score: ${r.score.toFixed(3)})`);
        });
        console.log();

        // 4. Get all memories
        console.log('4️⃣ Getting all memories for user...');
        const allMemories = await memoryService.getAllMemories(TEST_USER_ID);
        console.log(`   ✅ Total memories: ${allMemories.length}\n`);

        // 5. Cleanup
        console.log('5️⃣ Cleaning up test data...');
        const deleted = await memoryService.clearUserMemories(TEST_USER_ID);
        console.log(`   ✅ Deleted ${deleted} memories\n`);

        console.log('🎉 All memory service operations verified successfully!');
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testMemoryService();
