import { createClient } from '@supabase/supabase-js';
import { WorkflowState, WorkflowStep } from '../state/workflow-state.js';
import { settings } from '../../config/index.js';

// Initialize Supabase client
const supabase = createClient(settings.supabaseUrl, settings.supabaseKey);

export class StateService {

    /**
     * Initialize a new workflow state session
     */
    async createState(sessionId: string, userId: string, initialState: Partial<WorkflowState>): Promise<void> {
        const { error } = await supabase
            .from('workflow_states')
            .insert({
                session_id: sessionId,
                user_id: userId,
                state: initialState,
                current_step: 'start',
                updated_at: new Date().toISOString()
            });

        if (error) throw new Error(`Failed to create state: ${error.message}`);
    }

    /**
     * Load the current state for a session
     */
    async loadState(sessionId: string): Promise<{ state: WorkflowState, currentStep: WorkflowStep } | null> {
        const { data, error } = await supabase
            .from('workflow_states')
            .select('state, current_step')
            .eq('session_id', sessionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw new Error(`Failed to load state: ${error.message}`);
        }

        return {
            state: data.state as WorkflowState,
            currentStep: data.current_step as WorkflowStep
        };
    }

    /**
     * Update the state and move to the next step
     */
    async updateState(sessionId: string, updates: Partial<WorkflowState>, nextStep?: WorkflowStep): Promise<void> {
        // First, fetch current state to merge deeply if needed (Supabase does shallow merge on top-level JSONB cols usually, 
        // but here we might want to be careful. For now, we assume simple top-level merge).

        // Construct update object
        const dbUpdate: any = {
            updated_at: new Date().toISOString()
        };

        // We need to merge the JSONB. Supabase/Postgres handles jsonb_merge if we just pass the object, 
        // but typically it replaces keys.
        // For safer updates, let's load-modify-save or trust the application logic to pass non-clobbering updates.
        // Optimization: In a real high-concurrency app, use a stored procedure or atomic update. 
        // Here, we'll just update the column.

        // Fetch current to merge in memory (safest for now without stored proc)
        const current = await this.loadState(sessionId);
        if (!current) throw new Error("Session not found during update");

        const newState = { ...current.state, ...updates };

        dbUpdate.state = newState;
        if (nextStep) dbUpdate.current_step = nextStep;

        const { error } = await supabase
            .from('workflow_states')
            .update(dbUpdate)
            .eq('session_id', sessionId);

        if (error) throw new Error(`Failed to update state: ${error.message}`);
    }
}

export const stateService = new StateService();
