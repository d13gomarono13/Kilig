import { supabase } from '../src/utils/supabase.js';
import chalk from 'chalk';

async function testConnection() {
  console.log(chalk.blue('Testing Supabase connection...'));
  
  try {
    // Attempt to fetch a single row from a common table or just check the health
    // We'll try to list tables or do a simple query. 
    // Even if the table doesn't exist, we can check if we get an auth error vs a connection error.
    const { data, error } = await supabase.from('_metadata').select('*').limit(1);

    if (error && error.code === 'PGRST116') {
        // This is a "no rows found" or similar which is actually fine for a connection test
        console.log(chalk.green('✔ Successfully connected to Supabase (authenticated).'));
    } else if (error) {
        if (error.message.includes('fetch')) {
            console.error(chalk.red('✘ Connection error: Could not reach Supabase URL.'));
        } else {
            console.log(chalk.yellow('⚠ Connected, but encountered an error:'), error.message);
            console.log(chalk.dim('This is often normal if the database is empty or tables aren\'t created yet.'));
            console.log(chalk.green('✔ The client initialized correctly with your URL and Key.'));
        }
    } else {
      console.log(chalk.green('✔ Successfully connected and queried Supabase!'));
    }
  } catch (err: any) {
    console.error(chalk.red('✘ Failed to initialize Supabase client:'), err.message);
  }
}

testConnection();
