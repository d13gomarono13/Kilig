# Product Guidelines: Project Kilig

## Prose Style & Voice
- **Professional and Authoritative:** All user-facing text, including AI-generated scripts and UI labels, must be clear, direct, and academic. 
- **Skeptical & Scientific:** The voice of the Scientist Agent should be rigorous, favoring data over conjecture and identifying methodology limitations clearly.
- **Narrative Flow:** Scripts should follow a "Mystery to Discovery" arc—start with a scientific question and build towards the core breakthrough.

## Brand Messaging
- **Clarity over Complexity:** Prioritize simple yet powerful visualizations that distill complex scientific ideas into understandable narratives.
- **Empowering the Researcher:** Focus on how Kilig amplifies the researcher's voice and ability to communicate their findings to a broader audience.
- **Data-Backed Visuals:** Every visual element must correspond to a specific finding or metric from the source paper.

## Visual Identity: "Digital Museum"
- **Neo-Brutalist Frame:** Use thick borders (4px), high contrast colors, and unblurred shadows to create a tactical, impactful feel.
- **Dynamic Motion:** Animations must feature smooth, intentional transitions. Every movement should serve a narrative purpose, guiding the viewer's eye through the logical flow of the scientific argument.
- **Micro-Interactions:** Agent turns and artifact updates should be accompanied by subtle visual cues (staggered reveals, pulse effects) to make the autonomous process feel "alive."

## AI & Agent Interaction
- **Autonomous Factory:** The AI (Google ADK) operates as a background factory. The UI should emphasize the *outputs* and *logic* (Search hits, grading results) rather than chat interfaces.
- **Visible Logic:** When the AI makes a decision (e.g., rejecting a document chunk or rewriting a query), the *reasoning* should be transparently visible in the Studio interface.
- **Session Continuity:** Agent conversations are persistent sessions, allowing users to "pick up where they left off" or review the derivation of a specific scene.

## Output Standards
- **Component Fidelity:** SceneGraph components (Charts, Flowcharts, Speech Bubbles) must be rendered with perfect alignment and clear, readable Space Mono typography.
- **Visual Accuracy:** Data points in charts must accurately reflect the values extracted during the RAG phase. No arbitrary "placeholder" data is allowed in final outputs.
