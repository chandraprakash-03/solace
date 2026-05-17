# Project Description — AI Emotional Support Companion

# Vision

Build a private AI-powered emotional support companion designed to help users safely express emotions, vent frustrations, reflect on thoughts, and feel emotionally heard during difficult moments.

The application is not intended to replace therapy, clinical care, or real human relationships. Instead, it acts as a supportive conversational space that provides:
- emotional validation,
- reflective conversations,
- continuity through memory,
- and a calming, judgment-free interaction experience.

The system should prioritize:
- emotional safety,
- privacy,
- empathy,
- simplicity,
- and emotional consistency over entertainment or engagement manipulation.

The initial version is intended for personal use among close friends and trusted users.

---

# Core Philosophy

The application should:
- listen more than it speaks,
- avoid toxic positivity,
- avoid manipulative emotional attachment,
- avoid pretending to be human,
- avoid over-optimistic motivational behavior,
- avoid excessive advice unless explicitly requested.

The AI should behave like:
- a calm listener,
- a thoughtful companion,
- an emotionally intelligent reflective system.

The goal is to help users:
- feel lighter after expressing themselves,
- process emotions more clearly,
- recognize emotional patterns,
- and feel less alone during difficult moments.

---

# Primary Objectives

## Emotional Venting
Allow users to freely express:
- sadness,
- loneliness,
- frustration,
- burnout,
- confusion,
- anxiety,
- emotional exhaustion,
- relationship struggles,
- overthinking,
- or daily emotional stress.

The AI should respond in a supportive, grounded, and emotionally stable manner.

---

## Emotional Continuity
The system should remember meaningful emotional context across conversations.

Examples:
- recurring stress triggers,
- emotional patterns,
- difficult life events,
- repeated frustrations,
- burnout cycles,
- personal preferences,
- coping strategies previously discussed.

This memory system should create a feeling of continuity and understanding.

---

## Reflective Conversations
Instead of constantly giving solutions, the AI should:
- ask thoughtful questions,
- help users reflect,
- clarify emotional confusion,
- encourage emotional awareness.

The AI should avoid:
- aggressive problem-solving,
- lecture-style responses,
- robotic self-help language.

---

## Psychological Safety
The application should be emotionally safe.

It must:
- avoid dependency reinforcement,
- avoid manipulative emotional bonding,
- avoid harmful advice,
- avoid guilt-based interaction,
- avoid replacing real-world support systems.

If severe emotional distress or self-harm language is detected:
- encourage seeking human support,
- suggest professional help,
- recommend crisis resources when necessary.

---

# Target Users

Initial audience:
- the creator,
- close friends,
- trusted small private users.

Potential future audience:
- emotionally exhausted individuals,
- lonely users,
- overworked professionals,
- students under stress,
- people needing a safe reflective space.

---

# Technical Stack

## Frontend
- Next.js (App Router)
- Tailwind CSS
- Shadcn UI
- Framer Motion

---

## Backend
- Next.js API Routes / Server Actions
- TypeScript
- Node.js runtime

---

## Database
- PostgreSQL
- pgvector extension for semantic memory retrieval

---

## AI Layer
- Free Models from Google AI Studio

---

## ORM / Database Access
- Prisma ORM or Drizzle ORM

---

## Authentication
- JWT / Session-based auth
- Optional OAuth login later

---

# Core Features

# 1. Conversational Chat System

Users can:
- start conversations,
- vent emotions,
- continue long-term discussions,
- revisit previous conversations.

Features:
- realtime streaming responses,
- markdown-safe rendering,
- smooth conversational UI,
- typing indicators,
- dark mode optimized interface.

---

# 2. Emotional Memory System

The system should:
- extract meaningful emotional insights,
- summarize important emotional context,
- store vector embeddings,
- retrieve relevant memories during future chats.

Memory examples:
- recurring burnout,
- emotional triggers,
- important personal events,
- recurring emotional themes.

---

# 3. Conversation Modes

## Listener Mode
Minimal advice.
Mostly emotional validation and listening.

---

## Reflective Mode
Thoughtful questions and emotional clarification.

---

## Advice Mode
Only activated when users explicitly request suggestions or guidance.

---

# 4. Emotional Trend Tracking

The system should analyze:
- emotional tone,
- stress frequency,
- burnout indicators,
- loneliness patterns,
- emotional volatility.

Optional future visualization:
- mood timeline,
- emotional trends,
- recurring stress triggers.

---

# 5. Journaling System

Users can:
- write journal entries,
- save emotional reflections,
- track emotional progress over time.

Optional AI features:
- emotional summaries,
- recurring theme detection,
- gentle reflective insights.

---

# 6. Voice Support (Future Phase)

Potential future capabilities:
- speech-to-text,
- voice journaling,
- voice conversations,
- emotionally calm voice responses.

Possible integrations:
- Whisper,
- Gemini voice capabilities,
- TTS providers.

---

# 7. Safety Layer

The application must include:
- harmful response filtering,
- self-harm detection,
- crisis escalation logic,
- emotional safety prompts.

The AI should never:
- encourage self-harm,
- encourage isolation,
- emotionally manipulate users,
- reinforce hopelessness.

---

# Database Design

## Users
Stores:
- account info,
- preferences,
- personalization settings.

---

## Conversations
Stores:
- session metadata,
- timestamps,
- titles,
- conversation summaries.

---

## Messages
Stores:
- user messages,
- AI responses,
- timestamps,
- emotional metadata.

---

## Memories
Stores:
- summarized emotional memories,
- vector embeddings,
- relevance scores,
- retrieval metadata.

---

## Emotion Logs
Stores:
- mood estimations,
- emotional trends,
- daily emotional states.

---

# AI Workflow

## Step 1 — User Message
Receive user input.

---

## Step 2 — Emotion Analysis
Analyze:
- emotional tone,
- urgency,
- conversational intent,
- emotional intensity.

---

## Step 3 — Memory Retrieval
Retrieve relevant past emotional context using semantic search.

---

## Step 4 — Prompt Construction
Construct context-aware prompt containing:
- conversation history,
- emotional state,
- retrieved memories,
- active conversation mode,
- safety constraints.

---

## Step 5 — AI Response
Generate emotionally supportive response.

---

## Step 6 — Memory Extraction
Extract meaningful long-term emotional insights and store them.

---

# Security & Privacy Principles

The system should prioritize privacy by default.

Requirements:
- encrypted sensitive storage,
- secure session handling,
- sanitized prompts,
- protected API routes,
- rate limiting,
- prompt injection protection,
- memory deletion capability,
- minimal telemetry collection.

The system should never:
- sell user data,
- expose emotional conversations,
- use emotional data for advertising.

---

# UI / UX Direction

The interface should feel:
- emotionally calm,
- soft,
- warm,
- safe,
- non-corporate.

Design goals:
- low visual noise,
- smooth transitions,
- minimal distractions,
- comfortable reading experience,
- nighttime-friendly aesthetics.

---

# Development Philosophy

The project should prioritize:
- emotional quality over feature quantity,
- stable behavior over flashy AI tricks,
- privacy over analytics,
- supportive interaction over engagement addiction.

The AI should feel:
- emotionally stable,
- patient,
- thoughtful,
- consistent,
- grounded.

---

# MVP Scope

Initial MVP should include:
- authentication,
- chat interface,
- Gemini integration,
- emotional memory system,
- PostgreSQL storage,
- conversation modes,
- basic safety filtering,
- journaling,
- dark mode UI.

Everything else can evolve later.

---

# Long-Term Possibilities (Optional)

Potential future additions:
- voice companion mode,
- emotion visualization dashboard,
- sleep/mood tracking,
- wearable integrations,
- shared support spaces,
- AI-guided breathing or grounding exercises,
- local/offline privacy mode,
- end-to-end encrypted memory storage.

---

# Final Goal

Create a private emotional support companion that helps users:
- feel heard,
- emotionally process difficult experiences,
- reduce emotional isolation,
- and experience calmer, healthier reflection through supportive AI interaction.

The system should remain:
- ethical,
- emotionally safe,
- privacy-focused,
- and grounded in genuine emotional support rather than artificial emotional dependency.
