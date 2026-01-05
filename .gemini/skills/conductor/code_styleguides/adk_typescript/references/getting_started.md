# Adk_Typescript - Getting Started

**Pages:** 2

---

## Get started¶

**URL:** https://google.github.io/adk-docs/get-started/

**Contents:**
- Get started¶

Agent Development Kit (ADK) is designed to empower developers to quickly build, manage, evaluate and deploy AI-powered agents. These quick start guides get you set up and running a simple agent in less than 20 minutes.

Create your first Python ADK agent in minutes.

Create your first Go ADK agent in minutes.

Create your first Java ADK agent in minutes.

TypeScript Quickstart

Create your first TypeScript ADK agent in minutes.

Start with TypeScript

---

## Build a multi-tool agent¶

**URL:** https://google.github.io/adk-docs/get-started/quickstart/

**Contents:**
- Build a multi-tool agent¶
- 1. Set up Environment & Install ADK¶
- 2. Create Agent Project¶
  - Project structure¶
  - __init__.py¶
  - agent.py¶
  - .env¶
  - agent.ts¶
  - .env¶
  - Create MultiToolAgent.java¶

This quickstart guides you through installing the Agent Development Kit (ADK), setting up a basic agent with multiple tools, and running it locally either in the terminal or in the interactive, browser-based dev UI.

This quickstart assumes a local IDE (VS Code, PyCharm, IntelliJ IDEA, etc.) with Python 3.10+ or Java 17+ and terminal access. This method runs the application entirely on your machine and is recommended for internal development.

Create & Activate Virtual Environment (Recommended):

Create a new project directory, initialize it, and install dependencies:

Create a tsconfig.json file with the following content. This configuration ensures your project correctly handles modern Node.js modules.

To install ADK and setup the environment, proceed to the following steps.

You will need to create the following project structure:

Create the folder multi_tool_agent:

Note for Windows users

When using ADK on Windows for the next few steps, we recommend creating Python files using File Explorer or an IDE because the following commands (mkdir, echo) typically generate files with null bytes and/or incorrect encoding.

Now create an __init__.py file in the folder:

Your __init__.py should now look like this:

Create an agent.py file in the same folder:

Copy and paste the following code into agent.py:

Create a .env file in the same folder:

More instructions about this file are described in the next section on Set up the model.

You will need to create the following project structure in your my-adk-agent directory:

Create an agent.ts file in your project folder:

Copy and paste the following code into agent.ts:

Create a .env file in the same folder:

More instructions about this file are described in the next section on Set up the model.

Java projects generally feature the following project structure:

Create a MultiToolAgent.java source file in the agents.multitool package in the src/main/java/agents/multitool/ directory.

Copy and paste the following code into MultiToolAgent.java:

Your agent's ability to understand user requests and generate responses is powered by a Large Language Model (LLM). Your agent needs to make secure calls to this external LLM service, which requires authentication credentials. Without valid authentication, the LLM service will deny the agent's requests, and the agent will be unable to function.

Model Authentication guide

For a detailed guide on authenticating to different models, see the Authentication guide. This is a critical step to ensure your agent can make calls to the LLM service.

When using Python, open the .env file located inside (multi_tool_agent/) and copy-paste the following code.

When using Java, define environment variables:

When using TypeScript, the .env file is automatically loaded by the import 'dotenv/config'; line at the top of your agent.ts file.

env title=""multi_tool_agent/.env" GOOGLE_GENAI_USE_VERTEXAI=FALSE GOOGLE_GENAI_API_KEY=PASTE_YOUR_ACTUAL_API_KEY_HERE

Replace PASTE_YOUR_ACTUAL_API_KEY_HERE with your actual API KEY.

When using Python, open the .env file located inside (multi_tool_agent/). Copy-paste the following code and update the project ID and location.

When using Java, define environment variables:

When using TypeScript, the .env file is automatically loaded by the import 'dotenv/config'; line at the top of your agent.ts file.

When using Python, open the .env file located inside (multi_tool_agent/). Copy-paste the following code and update the project ID and location.

When using Java, define environment variables:

When using TypeScript, the .env file is automatically loaded by the import 'dotenv/config'; line at the top of your agent.ts file.

Using the terminal, navigate to the parent directory of your agent project (e.g. using cd ..):

There are multiple ways to interact with your agent:

Authentication Setup for Vertex AI Users

If you selected "Gemini - Google Cloud Vertex AI" in the previous step, you must authenticate with Google Cloud before launching the dev UI.

Run this command and follow the prompts: gcloud auth application-default login

Note: Skip this step if you're using "Gemini - Google AI Studio".

Run the following command to launch the dev UI.

Caution: ADK Web for development only

ADK Web is not meant for use in production deployments. You should use ADK Web for development and debugging purposes only.

Note for Windows users

When hitting the _make_subprocess_transport NotImplementedError, consider using adk web --no-reload instead.

Step 1: Open the URL provided (usually http://localhost:8000 or http://127.0.0.1:8000) directly in your browser.

Step 2. In the top-left corner of the UI, you can select your agent in the dropdown. Select "multi_tool_agent".

If you do not see "multi_tool_agent" in the dropdown menu, make sure you are running adk web in the parent folder of your agent folder (i.e. the parent folder of multi_tool_agent).

Step 3. Now you can chat with your agent using the textbox:

Step 4. By using the Events tab at the left, you can inspect individual function calls, responses and model responses by clicking on the actions:

On the Events tab, you can also click the Trace button to see the trace logs for each event that shows the latency of each function calls:

Step 5. You can also enable your microphone and talk to your agent:

Model support for voice/video streaming

In order to use voice/video streaming in ADK, you will need to use Gemini models that support the Live API. You can find the model ID(s) that supports the Gemini Live API in the documentation:

You can then replace the model string in root_agent in the agent.py file you created earlier (jump to section). Your code should look something like:

When using adk run you can inject prompts into the agent to start by piping text to the command like so:

Run the following command, to chat with your Weather agent.

To exit, use Cmd/Ctrl+C.

adk api_server enables you to create a local FastAPI server in a single command, enabling you to test local cURL requests before you deploy your agent.

To learn how to use adk api_server for testing, refer to the documentation on using the API server.

Using the terminal, navigate to your agent project directory:

There are multiple ways to interact with your agent:

Run the following command to launch the dev UI.

Step 1: Open the URL provided (usually http://localhost:8000 or http://127.0.0.1:8000) directly in your browser.

Step 2. In the top-left corner of the UI, select your agent from the dropdown. The agents are listed by their filenames, so you should select "agent".

If you do not see "agent" in the dropdown menu, make sure you are running npx adk web in the directory containing your agent.ts file.

Step 3. Now you can chat with your agent using the textbox:

Step 4. By using the Events tab at the left, you can inspect individual function calls, responses and model responses by clicking on the actions:

On the Events tab, you can also click the Trace button to see the trace logs for each event that shows the latency of each function calls:

Run the following command to chat with your agent.

To exit, use Cmd/Ctrl+C.

npx adk api_server enables you to create a local Express.js server in a single command, enabling you to test local cURL requests before you deploy your agent.

To learn how to use api_server for testing, refer to the documentation on testing.

Using the terminal, navigate to the parent directory of your agent project (e.g. using cd ..):

Run the following command from the terminal to launch the Dev UI.

DO NOT change the main class name of the Dev UI server.

Step 1: Open the URL provided (usually http://localhost:8080 or http://127.0.0.1:8080) directly in your browser.

Step 2. In the top-left corner of the UI, you can select your agent in the dropdown. Select "multi_tool_agent".

If you do not see "multi_tool_agent" in the dropdown menu, make sure you are running the mvn command at the location where your Java source code is located (usually src/main/java).

Step 3. Now you can chat with your agent using the textbox:

Step 4. You can also inspect individual function calls, responses and model responses by clicking on the actions:

Caution: ADK Web for development only

ADK Web is not meant for use in production deployments. You should use ADK Web for development and debugging purposes only.

With Maven, run the main() method of your Java class with the following command:

With Gradle, the build.gradle or build.gradle.kts build file should have the following Java plugin in its plugins section:

Then, elsewhere in the build file, at the top-level, create a new task to run the main() method of your agent:

Finally, on the command-line, run the following command:

You've successfully created and interacted with your first agent using ADK!

**Examples:**

Example 1 (markdown):
```markdown
# Create
python -m venv .venv
# Activate (each new terminal)
# macOS/Linux: source .venv/bin/activate
# Windows CMD: .venv\Scripts\activate.bat
# Windows PowerShell: .venv\Scripts\Activate.ps1
```

Example 2 (unknown):
```unknown
pip install google-adk
```

Example 3 (python):
```python
mkdir my-adk-agent
cd my-adk-agent
npm init -y
npm install @google/adk @google/adk-devtools
npm install -D typescript
```

Example 4 (json):
```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    // set to false to allow CommonJS module syntax:
    "verbatimModuleSyntax": false
  }
}
```

---
