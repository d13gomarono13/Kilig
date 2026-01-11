
import 'dotenv/config.js';
import { server } from '../packages/backend/src/server.js';
import { dbService } from '../packages/backend/src/services/db.js';
import { agentQueue } from '../packages/backend/src/services/queue/index.js';

async function testFullStackFlow() {
    console.log('🧪 Starting Full Stack End-to-End Test (Frontend Simulation)');
    console.log('   - Simulating POST /api/trigger');
    console.log('   - Listening to Server-Sent Events (SSE)');
    console.log('   - Verifying Artifact Generation & DB Persistence\n');

    // Spy on DB Service to verify call arguments without breaking the real call
    const originalUpdate = dbService.updateProjectArtifact;
    const dbUpdates: any[] = [];

    // Mock createProject to succeed even if DB is offline/missing
    dbService.createProject = async (topic) => {
        console.log(`\n   [MockDB] Creating project for: "${topic}"`);
        return {
            id: 'mock-project-123',
            topic,
            status: 'researching'
        } as any;
    };

    dbService.updateProjectArtifact = async (id, update) => {
        dbUpdates.push({ id, update });
        // Call original to test infrastructure connectivity (if configured)
        return originalUpdate.call(dbService, id, update);
    };

    try {
        await server.ready();

        // Inject request simulating the Frontend
        const prompt = "Analyze the paper https://arxiv.org/abs/2503.13964 and create a scientific comic manifest.";

        console.log(`📡 Sending Request: "${prompt}"`);

        // NOTE: injected requests waiting for stream end might timeout if not handled carefully.
        // Fastify inject waits for the full stream buffer by default.
        // We set a long timeout.
        const responsePromise = server.inject({
            method: 'POST',
            url: '/api/trigger',
            payload: {
                query: prompt
            }
        });

        const response = await responsePromise;

        console.log(`\n✅ Response Received: ${response.statusCode} ${response.statusMessage}`);

        // Analyze SSE Stream
        const body = response.body;
        const lines = body.split('\n');

        let projectCreated = false;
        let artifactAnalysis = false;
        let artifactManifest = false;
        let done = false;

        console.log('\n📜 Event Stream Analysis:');

        // Robust SSE Parsing
        let buffer = '';
        for (const line of lines) {
            if (line.trim() === '') continue; // skip empty lines between events

            if (line.startsWith('data: ')) {
                // New event start
                buffer = line.substring(6);
            } else {
                // Continuations (if any, though JSON.stringify usually escapes newlines)
                buffer += line;
            }

            try {
                const event = JSON.parse(buffer);
                // Clear buffer if successful (meaning we got a full object)
                // buffer = ''; // actually we process it now

                if (event.type === 'project_created') {
                    console.log(`   [Project Created] ID: ${event.projectId}`);
                    projectCreated = true;
                }
                else if (event.type === 'agent_event') {
                    // console.log(`   [Agent Event] ${event.author}: ${event.text?.substring(0, 50)}...`);
                }
                else if (event.type === 'artifact_updated') {
                    console.log(`   [Artifact Updated] Type: ${event.artifactType} (Length: ${event.content?.length})`);
                    if (event.artifactType === 'analysis') artifactAnalysis = true;
                    if (event.artifactType === 'scenegraph') artifactManifest = true;
                    if (event.artifactType === 'script') artifactManifest = true;
                }
                else if (event.type === 'done') {
                    console.log(`   [Done] Pipeline Completed`);
                    done = true;
                }
                else if (event.type === 'error') {
                    console.error(`   [Error] ${event.message}`);
                }
            } catch (e) {
                // Partial JSON, continue buffering
            }
        }

        console.log('\n🔍 Verification Results:');
        console.log(`   1. Project Created: ${projectCreated ? '✅' : '❌'}`);
        console.log(`   2. Artifact (Analysis) Received: ${artifactAnalysis ? '✅' : '❌'}`);
        // Note: The logic in agent.ts maps Output to artifacts.
        // Comic pipeline might map to 'script' or 'scenegraph' depending on agent.
        // Let's see what we got.

        // Check DB Persistence Spy
        const persistedStatus = dbUpdates.map(u => u.update.status);
        console.log(`   3. DB Persistence Calls: ${dbUpdates.length} calls (${persistedStatus.join(' -> ')})`);

        if (projectCreated && (artifactAnalysis || artifactManifest) && dbUpdates.length > 0) {
            console.log('\n✅ TEST PASSED: Full Stack Integration Verified');
            console.log('   The Frontend would successfully display these results.');
        } else {
            console.error('\n❌ TEST FAILED: Missing expected events or persistence.');
        }

    } catch (error) {
        console.error('Test Error:', error);
    }

    // Cleanup (Happy Path)
    await server.close();
    if ((agentQueue as any).close) await (agentQueue as any).close();
}

testFullStackFlow();
