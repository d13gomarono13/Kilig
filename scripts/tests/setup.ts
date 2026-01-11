/**
 * Test Environment Setup
 * 
 * Configures environment variables and mocks for integration tests
 */

import 'dotenv/config';

// Set test environment
process.env.NODE_ENV = 'test';

// Ensure required environment variables are set
if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.warn('⚠️  Warning: GEMINI_API_KEY or GOOGLE_API_KEY not set. Some tests may fail.');
}

console.log('🧪 Test environment initialized');
