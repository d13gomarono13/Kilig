/**
 * Direct SQL Migration using Supabase REST API
 * 
 * Run with: cd packages/backend && pnpm exec tsx ../../scripts/create_workflow_table.ts
 */
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sql = `
-- Create a table to store the state of agent workflows
CREATE TABLE IF NOT EXISTS workflow_states (
  session_id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_step TEXT NOT NULL DEFAULT 'start',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_workflow_states_user_id ON workflow_states(user_id);
`;

async function runMigration() {
    console.log('🔧 Creating workflow_states table via SQL API...');

    // Supabase provides a REST API for SQL execution at /rest/v1/rpc
    // But for DDL, we need the SQL HTTP endpoint which is at /sql
    // Note: This requires the project to have the SQL endpoint enabled.

    // Alternative: Use the pg library directly
    // For now, let's try the REST SQL endpoint

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql })
    });

    if (!response.ok) {
        // exec_sql likely doesn't exist. Let's print instructions instead.
        console.log('❌ SQL execution API not available.');
        console.log('\n📋 Please run this SQL manually in the Supabase Dashboard:');
        console.log(`   URL: https://supabase.com/dashboard/project/dhdacawurrchxkpqiqqz/sql/new`);
        console.log('\n--- SQL TO COPY ---');
        console.log(sql);
        console.log('--- END SQL ---\n');
        return;
    }

    const result = await response.json();
    console.log('✅ Migration executed:', result);
}

runMigration().catch(console.error);
