import { scientistAgent } from '../scientist/index.js';
import { narrativeAgent } from '../narrative/index.js';
import { validatorAgent } from '../validator/index.js';
import { stateService } from './state-service.js';
import { WorkflowState, WorkflowStep } from '../state/workflow-state.js';
import { InMemoryRunner } from '@google/adk';

export class StatefulRunner {

    constructor(private sessionId: string, private userId: string) { }

    /**
     * Main loop: Load state, determine step, execute agent, save state.
     */
    async runStep(userMessage?: string): Promise<WorkflowStep> {

        // 1. Load or Initialize State
        let context = await stateService.loadState(this.sessionId);
        if (!context) {
            if (!userMessage) throw new Error("Cannot start new session without user message");

            const initialState: WorkflowState = {
                text: userMessage,
                classification: 'unknown',
                entities: [],
                conversationHistory: [{ role: 'user', content: userMessage }]
            };

            // Default initial routing: Always start with Scientist for research
            await stateService.createState(this.sessionId, this.userId, initialState);
            context = { state: initialState, currentStep: 'scientist' };
        }

        const { state, currentStep } = context;
        console.log(`[Runner] Current Step: ${currentStep}`);

        // 2. Execute Logic based on Step
        try {
            if (currentStep === 'scientist') {
                return await this.runScientistNode(state);
            }
            else if (currentStep === 'narrative') {
                return await this.runNarrativeNode(state);
            }
            else if (currentStep === 'validator') {
                return await this.runValidatorNode(state);
            }
            else if (currentStep === 'done') {
                console.log("[Runner] Workflow complete.");
                return 'done';
            }

            return 'error';

        } catch (err: any) {
            console.error(`[Runner] Error in step ${currentStep}:`, err);
            await stateService.updateState(this.sessionId, { error: err.message }, 'error');
            return 'error';
        }
    }

    // --- Node Implementations ---

    private async runScientistNode(state: WorkflowState): Promise<WorkflowStep> {
        console.log("[Runner] Executing Scientist Agent...");

        // Initialize ADK runner just for this single turn
        const runner = new InMemoryRunner({ agent: scientistAgent, appName: 'kilig-stateful' });

        // Construct prompt from state
        const prompt = `Research Request: "${state.text}". 
    Previous Context: ${JSON.stringify(state.analysisResults || {})}
    
    Perform research and return the findings using 'synthesize_analysis'.`;

        // Run agent (simplified synchronization)
        const result = await this.executeAgent(runner, prompt);

        // Update State
        // In a real impl, we'd parse the 'synthesize_analysis' tool output. 
        // For now, we assume the agent's final text response contains the analysis or we parse tool calls.
        // Let's assume we capture the 'synthesize_analysis' output.

        await stateService.updateState(this.sessionId, {
            analysisResults: { summary: result }, // Placeholder: Parsing logic needed here
            classification: 'comic' // Simplified routing logic
        }, 'narrative');

        return 'narrative';
    }

    private async runNarrativeNode(state: WorkflowState): Promise<WorkflowStep> {
        console.log("[Runner] Executing Narrative Agent...");
        const runner = new InMemoryRunner({ agent: narrativeAgent, appName: 'kilig-stateful' });

        const prompt = `Create a comic manifest based on this research: 
    ${JSON.stringify(state.analysisResults)}`;

        const result = await this.executeAgent(runner, prompt);

        await stateService.updateState(this.sessionId, {
            manifestJson: { result } // Placeholder
        }, 'validator');

        return 'validator';
    }

    private async runValidatorNode(state: WorkflowState): Promise<WorkflowStep> {
        console.log("[Runner] Executing Validator Agent...");
        const runner = new InMemoryRunner({ agent: validatorAgent, appName: 'kilig-stateful' });

        const prompt = `Validate this manifest: ${JSON.stringify(state.manifestJson)}`;

        const resultText = await this.executeAgent(runner, prompt);

        // Simple heuristic: Does it say "VALID"?
        const isValid = resultText.includes("VALID");

        if (isValid) {
            await stateService.updateState(this.sessionId, {
                validationResult: { isValid: true }
            }, 'done');
            return 'done';
        } else {
            // Retry Loop!
            await stateService.updateState(this.sessionId, {
                validationResult: { isValid: false, feedback: resultText }
            }, 'narrative');
            return 'narrative';
        }
    }

    // Helper to run ADK agent and get final text
    private async executeAgent(runner: InMemoryRunner, prompt: string): Promise<string> {
        const iterator = runner.runAsync({
            userId: this.userId,
            sessionId: this.sessionId,
            newMessage: { role: 'user', parts: [{ text: prompt }] } as any
        });

        let finalResponse = '';
        for await (const event of iterator) {
            if (event.author === 'model' && event.content) {
                finalResponse += event.content.parts?.map(p => p.text).join('') || '';
            }
        }
        return finalResponse;
    }
}
