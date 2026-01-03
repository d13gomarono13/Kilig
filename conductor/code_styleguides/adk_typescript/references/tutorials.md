# Adk_Typescript - Tutorials

**Pages:** 2

---

## Build your agent with ADK¶

**URL:** https://google.github.io/adk-docs/tutorials/

**Contents:**
- Build your agent with ADK¶

Get started with the Agent Development Kit (ADK) through our collection of practical guides. These tutorials are designed in a simple, progressive, step-by-step fashion, introducing you to different ADK features and capabilities.

This approach allows you to learn and build incrementally – starting with foundational concepts and gradually tackling more advanced agent development techniques. You'll explore how to apply these features effectively across various use cases, equipping you to build your own sophisticated agentic applications with ADK. Explore our collection below and happy building:

Create a workflow that uses multiple tools.

Build a multi-tool agent

Build an multi-agent workflow including agent delegation, session management, and safety callbacks.

Create an agent for handling streamed content.

Build a streaming agent

Discover sample agents

Discover sample agents for retail, travel, customer service, and more!

---

## Build Your First Intelligent Agent Team: A Progressive Weather Bot with ADK¶

**URL:** https://google.github.io/adk-docs/tutorials/agent-team/

**Contents:**
- Build Your First Intelligent Agent Team: A Progressive Weather Bot with ADK¶
- Step 1: Your First Agent - Basic Weather Lookup¶
- Step 2: Going Multi-Model with LiteLLM [Optional]¶
- Step 3: Building an Agent Team - Delegation for Greetings & Farewells¶
- Step 4: Adding Memory and Personalization with Session State¶
- Step 5: Adding Safety - Input Guardrail with before_model_callback¶
- Step 6: Adding Safety - Tool Argument Guardrail (before_tool_callback)¶
- Conclusion: Your Agent Team is Ready!¶

This tutorial extends from the Quickstart example for Agent Development Kit. Now, you're ready to dive deeper and construct a more sophisticated, multi-agent system.

We'll embark on building a Weather Bot agent team, progressively layering advanced features onto a simple foundation. Starting with a single agent that can look up weather, we will incrementally add capabilities like:

Why a Weather Bot Team?

This use case, while seemingly simple, provides a practical and relatable canvas to explore core ADK concepts essential for building complex, real-world agentic applications. You'll learn how to structure interactions, manage state, ensure safety, and orchestrate multiple AI "brains" working together.

As a reminder, ADK is a Python framework designed to streamline the development of applications powered by Large Language Models (LLMs). It offers robust building blocks for creating agents that can reason, plan, utilize tools, interact dynamically with users, and collaborate effectively within a team.

In this advanced tutorial, you will master:

End State Expectation:

By completing this tutorial, you will have built a functional multi-agent Weather Bot system. This system will not only provide weather information but also handle conversational niceties, remember the last city checked, and operate within defined safety boundaries, all orchestrated using ADK.

Note on Execution Environment:

This tutorial is structured for interactive notebook environments like Google Colab, Colab Enterprise, or Jupyter notebooks. Please keep the following in mind:

Alternative: Using ADK's Built-in Tools (Web UI / CLI / API Server)

If you prefer a setup that handles the runner and session management automatically using ADK's standard tools, you can find the equivalent code structured for that purpose here. That version is designed to be run directly with commands like adk web (for a web UI), adk run (for CLI interaction), or adk api_server (to expose an API). Please follow the README.md instructions provided in that alternative resource.

Ready to build your agent team? Let's dive in!

Note: This tutorial works with adk version 1.0.0 and above

Let's begin by building the fundamental component of our Weather Bot: a single agent capable of performing a specific task – looking up weather information. This involves creating two core pieces:

1. Define the Tool (get_weather)

In ADK, Tools are the building blocks that give agents concrete capabilities beyond just text generation. They are typically regular Python functions that perform specific actions, like calling an API, querying a database, or performing calculations.

Our first tool will provide a mock weather report. This allows us to focus on the agent structure without needing external API keys yet. Later, you could easily swap this mock function with one that calls a real weather service.

Key Concept: Docstrings are Crucial! The agent's LLM relies heavily on the function's docstring to understand:

Best Practice: Write clear, descriptive, and accurate docstrings for your tools. This is essential for the LLM to use the tool correctly.

2. Define the Agent (weather_agent)

Now, let's create the Agent itself. An Agent in ADK orchestrates the interaction between the user, the LLM, and the available tools.

We configure it with several key parameters:

Best Practice: Provide clear and specific instruction prompts. The more detailed the instructions, the better the LLM can understand its role and how to use its tools effectively. Be explicit about error handling if needed.

Best Practice: Choose descriptive name and description values. These are used internally by ADK and are vital for features like automatic delegation (covered later).

3. Setup Runner and Session Service

To manage conversations and execute the agent, we need two more components:

4. Interact with the Agent

We need a way to send messages to our agent and receive its responses. Since LLM calls and tool executions can take time, ADK's Runner operates asynchronously.

We'll define an async helper function (call_agent_async) that:

Why async? Interactions with LLMs and potentially tools (like external APIs) are I/O-bound operations. Using asyncio allows the program to handle these operations efficiently without blocking execution.

5. Run the Conversation

Finally, let's test our setup by sending a few queries to the agent. We wrap our async calls in a main async function and run it using await.

Congratulations! You've successfully built and interacted with your first ADK agent. It understands the user's request, uses a tool to find information, and responds appropriately based on the tool's result.

In the next step, we'll explore how to easily switch the underlying Language Model powering this agent.

In Step 1, we built a functional Weather Agent powered by a specific Gemini model. While effective, real-world applications often benefit from the flexibility to use different Large Language Models (LLMs). Why?

ADK makes switching between models seamless through its integration with the LiteLLM library. LiteLLM acts as a consistent interface to over 100 different LLMs.

In this step, we will:

We imported this during the initial setup (Step 0), but it's the key component for multi-model support:

2. Define and Test Multi-Model Agents

Instead of passing only a model name string (which defaults to Google's Gemini models), we wrap the desired model identifier string within the LiteLlm class.

Make sure you have configured the necessary API keys for OpenAI and Anthropic in Step 0. We'll use the call_agent_async function (defined earlier, which now accepts runner, user_id, and session_id) to interact with each agent immediately after its setup.

Each block below will:

Best Practice: Use constants for model names (like MODEL_GPT_4O, MODEL_CLAUDE_SONNET defined in Step 0) to avoid typos and make code easier to manage.

Error Handling: We wrap the agent definitions in try...except blocks. This prevents the entire code cell from failing if an API key for a specific provider is missing or invalid, allowing the tutorial to proceed with the models that are configured.

First, let's create and test the agent using OpenAI's GPT-4o.

Next, we'll do the same for Anthropic's Claude Sonnet.

Observe the output carefully from both code blocks. You should see:

This step demonstrates the power and flexibility ADK + LiteLLM provide. You can easily experiment with and deploy agents using various LLMs while keeping your core application logic (tools, fundamental agent structure) consistent.

In the next step, we'll move beyond a single agent and build a small team where agents can delegate tasks to each other!

In Steps 1 and 2, we built and experimented with a single agent focused solely on weather lookups. While effective for its specific task, real-world applications often involve handling a wider variety of user interactions. We could keep adding more tools and complex instructions to our single weather agent, but this can quickly become unmanageable and less efficient.

A more robust approach is to build an Agent Team. This involves:

Why build an Agent Team?

In this step, we will:

1. Define Tools for Sub-Agents

First, let's create the simple Python functions that will serve as tools for our new specialist agents. Remember, clear docstrings are vital for the agents that will use them.

2. Define the Sub-Agents (Greeting & Farewell)

Now, create the Agent instances for our specialists. Notice their highly focused instruction and, critically, their clear description. The description is the primary information the root agent uses to decide when to delegate to these sub-agents.

Best Practice: Sub-agent description fields should accurately and concisely summarize their specific capability. This is crucial for effective automatic delegation.

Best Practice: Sub-agent instruction fields should be tailored to their limited scope, telling them exactly what to do and what not to do (e.g., "Your only task is...").

3. Define the Root Agent (Weather Agent v2) with Sub-Agents

Now, we upgrade our weather_agent. The key changes are:

Key Concept: Automatic Delegation (Auto Flow) By providing the sub_agents list, ADK enables automatic delegation. When the root agent receives a user query, its LLM considers not only its own instructions and tools but also the description of each sub-agent. If the LLM determines that a query aligns better with a sub-agent's described capability (e.g., "Handles simple greetings"), it will automatically generate a special internal action to transfer control to that sub-agent for that turn. The sub-agent then processes the query using its own model, instructions, and tools.

Best Practice: Ensure the root agent's instructions clearly guide its delegation decisions. Mention the sub-agents by name and describe the conditions under which delegation should occur.

4. Interact with the Agent Team

Now that we've defined our root agent (weather_agent_team - Note: Ensure this variable name matches the one defined in the previous code block, likely # @title Define the Root Agent with Sub-Agents, which might have named it root_agent) with its specialized sub-agents, let's test the delegation mechanism.

The following code block will:

We expect the following flow:

Look closely at the output logs, especially the --- Tool: ... called --- messages. You should observe:

This confirms successful automatic delegation! The root agent, guided by its instructions and the descriptions of its sub_agents, correctly routed user requests to the appropriate specialist agent within the team.

You've now structured your application with multiple collaborating agents. This modular design is fundamental for building more complex and capable agent systems. In the next step, we'll give our agents the ability to remember information across turns using session state.

So far, our agent team can handle different tasks through delegation, but each interaction starts fresh – the agents have no memory of past conversations or user preferences within a session. To create more sophisticated and context-aware experiences, agents need memory. ADK provides this through Session State.

What is Session State?

How Agents Interact with State:

In this step, we will enhance our Weather Bot team by:

1. Initialize New Session Service and State

To clearly demonstrate state management without interference from prior steps, we'll instantiate a new InMemorySessionService. We'll also create a session with an initial state defining the user's preferred temperature unit.

2. Create State-Aware Weather Tool (get_weather_stateful)

Now, we create a new version of the weather tool. Its key feature is accepting tool_context: ToolContext which allows it to access tool_context.state. It will read the user_preference_temperature_unit and format the temperature accordingly.

Key Concept: ToolContext This object is the bridge allowing your tool logic to interact with the session's context, including reading and writing state variables. ADK injects it automatically if defined as the last parameter of your tool function.

Best Practice: When reading from state, use dictionary.get('key', default_value) to handle cases where the key might not exist yet, ensuring your tool doesn't crash.

3. Redefine Sub-Agents and Update Root Agent

To ensure this step is self-contained and builds correctly, we first redefine the greeting_agent and farewell_agent exactly as they were in Step 3. Then, we define our new root agent (weather_agent_v4_stateful):

4. Interact and Test State Flow

Now, let's execute a conversation designed to test the state interactions using the runner_root_stateful (associated with our stateful agent and the session_service_stateful). We'll use the call_agent_async function defined earlier, ensuring we pass the correct runner, user ID (USER_ID_STATEFUL), and session ID (SESSION_ID_STATEFUL).

The conversation flow will be:

By reviewing the conversation flow and the final session state printout, you can confirm:

You've now successfully integrated session state to personalize agent behavior using ToolContext, manually manipulated state for testing InMemorySessionService, and observed how output_key provides a simple mechanism for saving the agent's last response to state. This foundational understanding of state management is key as we proceed to implement safety guardrails using callbacks in the next steps.

Our agent team is becoming more capable, remembering preferences and using tools effectively. However, in real-world scenarios, we often need safety mechanisms to control the agent's behavior before potentially problematic requests even reach the core Large Language Model (LLM).

ADK provides Callbacks – functions that allow you to hook into specific points in the agent's execution lifecycle. The before_model_callback is particularly useful for input safety.

What is before_model_callback?

Define a function accepting callback_context: CallbackContext and llm_request: LlmRequest.

In this step, we will:

1. Define the Guardrail Callback Function

This function will inspect the last user message within the llm_request content. If it finds "BLOCK" (case-insensitive), it constructs and returns an LlmResponse to block the flow; otherwise, it returns None.

2. Update Root Agent to Use the Callback

We redefine the root agent, adding the before_model_callback parameter and pointing it to our new guardrail function. We'll give it a new version name for clarity.

Important: We need to redefine the sub-agents (greeting_agent, farewell_agent) and the stateful tool (get_weather_stateful) within this context if they are not already available from previous steps, ensuring the root agent definition has access to all its components.

3. Interact to Test the Guardrail

Let's test the guardrail's behavior. We'll use the same session (SESSION_ID_STATEFUL) as in Step 4 to show that state persists across these changes.

Observe the execution flow:

You have successfully implemented an input safety layer! The before_model_callback provides a powerful mechanism to enforce rules and control agent behavior before expensive or potentially risky LLM calls are made. Next, we'll apply a similar concept to add guardrails around tool usage itself.

In Step 5, we added a guardrail to inspect and potentially block user input before it reached the LLM. Now, we'll add another layer of control after the LLM has decided to use a tool but before that tool actually executes. This is useful for validating the arguments the LLM wants to pass to the tool.

ADK provides the before_tool_callback for this precise purpose.

What is before_tool_callback?

Define a function accepting tool: BaseTool, args: Dict[str, Any], and tool_context: ToolContext.

In this step, we will:

1. Define the Tool Guardrail Callback Function

This function targets the get_weather_stateful tool. It checks the city argument. If it's "Paris", it returns an error dictionary that looks like the tool's own error response. Otherwise, it allows the tool to run by returning None.

2. Update Root Agent to Use Both Callbacks

We redefine the root agent again (weather_agent_v6_tool_guardrail), this time adding the before_tool_callback parameter alongside the before_model_callback from Step 5.

Self-Contained Execution Note: Similar to Step 5, ensure all prerequisites (sub-agents, tools, before_model_callback) are defined or available in the execution context before defining this agent.

3. Interact to Test the Tool Guardrail

Let's test the interaction flow, again using the same stateful session (SESSION_ID_STATEFUL) from the previous steps.

You've now added a crucial safety layer controlling not just what reaches the LLM, but also how the agent's tools can be used based on the specific arguments generated by the LLM. Callbacks like before_model_callback and before_tool_callback are essential for building robust, safe, and policy-compliant agent applications.

Congratulations! You've successfully journeyed from building a single, basic weather agent to constructing a sophisticated, multi-agent team using the Agent Development Kit (ADK).

Let's recap what you've accomplished:

Through building this progressive Weather Bot team, you've gained hands-on experience with core ADK concepts essential for developing complex, intelligent applications.

Your Weather Bot team is a great starting point. Here are some ideas to further explore ADK and enhance your application:

The Agent Development Kit provides a robust foundation for building sophisticated LLM-powered applications. By mastering the concepts covered in this tutorial – tools, state, delegation, and callbacks – you are well-equipped to tackle increasingly complex agentic systems.

**Examples:**

Example 1 (python):
```python
# @title Step 0: Setup and Installation
# Install ADK and LiteLLM for multi-model support

!pip install google-adk -q
!pip install litellm -q

print("Installation complete.")
```

Example 2 (python):
```python
# @title Import necessary libraries
import os
import asyncio
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm # For multi-model support
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types # For creating message Content/Parts

import warnings
# Ignore all warnings
warnings.filterwarnings("ignore")

import logging
logging.basicConfig(level=logging.ERROR)

print("Libraries imported.")
```

Example 3 (r):
```r
# @title Configure API Keys (Replace with your actual keys!)

# --- IMPORTANT: Replace placeholders with your real API keys ---

# Gemini API Key (Get from Google AI Studio: https://aistudio.google.com/app/apikey)
os.environ["GOOGLE_API_KEY"] = "YOUR_GOOGLE_API_KEY" # <--- REPLACE

# [Optional]
# OpenAI API Key (Get from OpenAI Platform: https://platform.openai.com/api-keys)
os.environ['OPENAI_API_KEY'] = 'YOUR_OPENAI_API_KEY' # <--- REPLACE

# [Optional]
# Anthropic API Key (Get from Anthropic Console: https://console.anthropic.com/settings/keys)
os.environ['ANTHROPIC_API_KEY'] = 'YOUR_ANTHROPIC_API_KEY' # <--- REPLACE

# --- Verify Keys (Optional Check) ---
print("API Keys Set:")
print(f"Google API Key set: {'Yes' if os.environ.get('GOOGLE_API_KEY') and os.environ['GOOGLE_API_KEY'] != 'YOUR_GOOGLE_API_KEY' else 'No (REPLACE PLACEHOLDER!)'}")
print(f"OpenAI API Key set: {'Yes' if os.environ.get('OPENAI_API_KEY') and os.environ['OPENAI_API_KEY'] != 'YOUR_OPENAI_API_KEY' else 'No (REPLACE PLACEHOLDER!)'}")
print(f"Anthropic API Key set: {'Yes' if os.environ.get('ANTHROPIC_API_KEY') and os.environ['ANTHROPIC_API_KEY'] != 'YOUR_ANTHROPIC_API_KEY' else 'No (REPLACE PLACEHOLDER!)'}")

# Configure ADK to use API keys directly (not Vertex AI for this multi-model setup)
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"


# @markdown **Security Note:** It's best practice to manage API keys securely (e.g., using Colab Secrets or environment variables) rather than hardcoding them directly in the notebook. Replace the placeholder strings above.
```

Example 4 (markdown):
```markdown
# --- Define Model Constants for easier use ---

# More supported models can be referenced here: https://ai.google.dev/gemini-api/docs/models#model-variations
MODEL_GEMINI_2_0_FLASH = "gemini-2.0-flash"

# More supported models can be referenced here: https://docs.litellm.ai/docs/providers/openai#openai-chat-completion-models
MODEL_GPT_4O = "openai/gpt-4.1" # You can also try: gpt-4.1-mini, gpt-4o etc.

# More supported models can be referenced here: https://docs.litellm.ai/docs/providers/anthropic
MODEL_CLAUDE_SONNET = "anthropic/claude-sonnet-4-20250514" # You can also try: claude-opus-4-20250514 , claude-3-7-sonnet-20250219 etc

print("\nEnvironment configured.")
```

---
