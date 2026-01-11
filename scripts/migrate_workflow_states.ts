/**
 * Migration and Verification Script for Workflow States
 * 
 * Run with: npx tsx scripts/migrate_workflow_states.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for DDL

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🔧 Running workflow_states migration...');

    // Note: Supabase JS client doesn't support raw DDL directly.
    // We'll use the REST API to run SQL via Supabase's SQL endpoint.
    // However, a simpler approach is to just try to create a row and see if table exists.

    // First, let's check if the table already exists by trying a SELECT
    const { data, error: checkError } = await supabase
        .from('workflow_states')
        .select('session_id')
        .limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
        console.log('❌ Table does not exist. Please run the migration SQL in the Supabase Dashboard:');
        console.log(`
    -- Copy this SQL to https://supabase.com/dashboard/project/dhdacawurrchxkpqiqqz/sql
    
    CREATE TABLE IF NOT EXISTS workflow_states (
      session_id UUID PRIMARY KEY,
      user_id TEXT NOT NULL,
      state JSONB NOT NULL DEFAULT '{}'::jsonb,
      current_step TEXT NOT NULL DEFAULT 'start',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_states_user_id ON workflow_states(user_id);
    `);
        return;
    }

    if (checkError) {
        console.error('❌ Error checking table:', checkError.message);
        return;
    }

    console.log('✅ Table workflow_states exists!');

    // Test INSERT
    const testSessionId = crypto.randomUUID();
    const { error: insertError } = await supabase
        .from('workflow_states')
        .insert({
            session_id: testSessionId,
            user_id: 'test-user-123',
            state: { text: 'Hello World', classification: 'comic', entities: [] },
            current_step: 'scientist'
        });

    if (insertError) {
        console.error('❌ Insert failed:', insertError.message);
        return;
    }
    console.log('✅ Test INSERT succeeded.');

    // Test SELECT
    const { data: selectData, error: selectError } = await supabase
        .from('workflow_states')
        .select('*')
        .eq('session_id', testSessionId)
        .single();

    if (selectError) {
        console.error('❌ Select failed:', selectError.message);
        return;
    }
    console.log('✅ Test SELECT succeeded:', JSON.stringify(selectData, null, 2));

    // Test UPDATE
    const { error: updateError } = await supabase
        .from('workflow_states')
        .update({ current_step: 'narrative', state: { ...selectData.state, analysisResults: { summary: 'test' } } })
        .eq('session_id', testSessionId);

    if (updateError) {
        console.error('❌ Update failed:', updateError.message);
        return;
    }
    console.log('✅ Test UPDATE succeeded.');

    // Cleanup
    const { error: deleteError } = await supabase
        .from('workflow_states')
        .delete()
        .eq('session_id', testSessionId);

    if (deleteError) {
        console.error('❌ Cleanup failed:', deleteError.message);
        return;
    }
    console.log('✅ Cleanup succeeded.');

    console.log('\n🎉 All workflow_states operations verified successfully!');
}

runMigration().catch(console.error);
