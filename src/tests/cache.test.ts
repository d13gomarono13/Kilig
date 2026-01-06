import 'dotenv/config';
import { GeminiClient } from '../src/core/gemini-client.js';
import { CacheManager } from '../src/services/cache/index.js';

async function testCache() {
  console.log('--- Testing Cache Integration ---');
  console.log(`Cache Enabled: ${CacheManager.isEnabled}`);

  const client = new GeminiClient({ modelName: 'gemini-2.0-flash' });
  const prompt = 'Hello, what is 2+2? Answer only with the number.';
  const mode = 'analyzer' as any;

  console.log('\n--- Run 1 (Should be Cache Miss) ---');
  const start1 = Date.now();
  const res1 = await client.execute(prompt, mode);
  const end1 = Date.now();
  console.log(`Result: ${res1}`);
  console.log(`Time: ${end1 - start1}ms`);

  console.log('\n--- Run 2 (Should be Cache HIT) ---');
  const start2 = Date.now();
  const res2 = await client.execute(prompt, mode);
  const end2 = Date.now();
  console.log(`Result: ${res2}`);
  console.log(`Time: ${end2 - start2}ms`);

  if (end2 - start2 < (end1 - start1) / 2) {
    console.log('\n✅ Cache HIT verified: Run 2 was significantly faster.');
  } else {
    console.log('\n❌ Cache HIT failed: Run 2 was not significantly faster.');
  }
}

testCache().catch(console.error);
