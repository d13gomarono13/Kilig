# Capacity Judgement: Groq Llama 3.3-70b

## Executive Summary
Using the **llama-3.3-70b-versatile** model on Groq Cloud (Developer Plan), your current capacity for testing scientific papers is **less than 1 paper per day**.

The primary bottleneck is not the speed (Requests Per Minute) but the **Daily Token Quota (TPD)**.

---

## 📊 Detailed Breakdown

### 1. Token Footprint per Paper
Based on the current multi-agent flow (`root` -> `scientist` -> `narrative` -> `designer` -> `validator`):

| Agent Interaction | Activity | Est. Tokens (Input) | Est. Tokens (Output) |
| :--- | :--- | :--- | :--- |
| **Scientist (Discovery)** | Searching ArXiv/MCP | 2,000 | 500 |
| **Scientist (Ingestion)** | Reading + Embedding Paper | **12,000** | 1,000 |
| **Narrative (Scripting)** | Processing Analysis | 15,000 (History) | 2,000 |
| **Designer (SceneGraph)**| Generating JSON | 18,000 (History) | 4,000 |
| **Validator (QC)** | Analysis of JSON | 22,000 (History) | 1,000 |
| **Total per Pipeline** | | **~70,000 - 100,000+** | **~8,500** |

> [!CAUTION]
> **Token Bloat**: Because the ADK framework maintains conversation history, the "Prompt" for each subsequent turn includes all previous findings. Reading a 6,000-word paper once adds ~8,000 tokens to *every* following turn in that session.

### 2. Groq Rate Limits (Developer Plan)
| Metric | Limit | Usage per Paper | Daily Capacity |
| :--- | :--- | :--- | :--- |
| **RPM** (Req. per Min) | 30 | ~10-15 | High |
| **TPM** (Tokens per Min) | 12,000 - 300,000* | ~12,000+ | Variable |
| **TPD** (Tokens per Day) | **100,000** | ~100k - 150k | **< 1 Paper** |

*\*RPM/TPM limits vary by account activity, but TPD is a strict daily ceiling for the Developer tier.*

---

## 🛠️ Recommendations for Optimization

To increase testing capacity from `<1` to `5-10` papers per day, I recommend the following changes:

### 1. Implement Strict History Pruning
Currently, the full text of the paper stays in the conversation history even after the `Scientist` agent is done.
- **Fix**: Clear the `messages` array in the session after the `Scientist` transfers back to `root`, or only pass the *Synthesis* (not the raw text) to the next agents.

### 2. Move Ingestion to Specialized Service
Instead of the Agent "reading" the paper content via tool results (which adds it to memory), use a pre-processing script to populate the Supabase RAG store.
- **Fix**: The Agent should only see the **top 3-5 relevant snippets** via RAG search, not the whole paper.

### 3. Use Batch API for Non-Interactive Steps
Groq's **Batch API** offers 25% cost reduction and higher limits for non-real-time tasks.
- **Fix**: Use Batch for the `Designer` and `Validator` steps.

---

## 🔮 Conclusion
With the current **"Agent reads whole paper"** architecture, you will hit your daily quota within minutes of starting your first test run. Shifting to a **RAG-First** approach (where agents only see extracted context) could reduce token usage by 90%, allowing for **~10 papers per day**.
