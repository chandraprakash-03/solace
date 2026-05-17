import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI client with the API key from environment variables
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Dynamically load active model identifiers from environment variables with safe defaults
const CHAT_MODEL = process.env.AI_MODEL || 'gemini-2.5-flash';
const METADATA_MODEL = process.env.AI_METADATA_MODEL || CHAT_MODEL;
const PRIMARY_EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || 'gemini-embedding-2';
const FALLBACK_EMBEDDING_MODEL = process.env.AI_FALLBACK_EMBEDDING_MODEL || 'gemini-embedding-001';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * AI Service Layer to handle all Google AI Studio integrations.
 */
export class AIService {
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Dynamically import to ensure it only runs on the server side
      const { pipeline, env } = await import('@xenova/transformers');
      
      // Ensure we fetch models from the Hugging Face Hub
      env.allowLocalModels = false;

      // Use a singleton pattern to prevent instantiating the model multiple times during Next.js hot-reloads
      if (!(global as any).embeddingPipeline) {
        (global as any).embeddingPipeline = pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2');
      }
      
      const extractor = await (global as any).embeddingPipeline;
      
      // Generate the embedding (all-mpnet-base-v2 naturally outputs 768 dimensions)
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      
      // Convert Float32Array to standard JavaScript array
      const vector = Array.from(output.data) as number[];
      
      return vector.slice(0, 768); // Enforce exactly 768 dimensions for PostgreSQL
    } catch (error) {
      console.error('Error generating local embedding:', error);
      return new Array(768).fill(0);
    }
  }

  /**
   * Generates a streaming chat response from Gemini or Gemma 4 based on conversation modes and memories.
   */
  static async generateChatResponseStream(
    userInput: string,
    history: ChatMessage[],
    memories: string[],
    mode: 'listener' | 'reflective' | 'advice'
  ): Promise<ReadableStream> {
    try {
      // Structure the system instruction based on the companion's philosophy
      const memoriesContext = memories.length > 0 
        ? `Here is some background emotional context and recurring patterns about the user from previous chats. Use this context to maintain continuity and show understanding, but keep it natural:\n${memories.map(m => `- ${m}`).join('\n')}`
        : 'You do not have any prior memories stored for this user yet. Focus on their current input.';

      const systemInstruction = `You are a private AI emotional support companion. Your goal is to help the user process emotions and feel heard, while providing a stabilizing, grounding presence.

Core Philosophy:
1. Provide Emotional Grounding, Not Amplification: Validate feelings, but do so in a stabilizing way. Avoid "therapeutic sadness loops" or mirroring suffering so intensely that it deepens despair. Instead of amplifying ("you are in a profoundly dark and lonely place"), use grounding phrasing ("That sounds exhausting. When things get that heavy, it makes sense you feel drained.").
2. Conversational Rhythm & Variety: DO NOT start your responses with "It sounds like...". This is robotic and predictable. Vary your language naturally. Use phrases like: "That kind of feeling can be exhausting," "Being stuck in that headspace for a while can wear someone down," "I can see why that would feel heavy," or "When things build up like that, it can feel overwhelming." Be a natural conversationalist.
3. Prevent Social Isolation & AI Dependency: DO NOT validate social withdrawal or isolation as a solution. Instead of saying "You just need to pull back," say "Social interaction has been feeling emotionally exhausting lately." Maintain healthy boundaries—while you offer comfort, subtly reconnect the user outward to human relationships. If they say you are their only comfort, reply with: "I'm glad talking here feels comforting right now. You deserve that sense of support and understanding from people around you too."
4. Soften Cognitive Distortions (Reality Softening): If a user expresses distorted thoughts ("Everyone hates me", "Everyone around me is toxic"), DO NOT simply validate the thought or passively reflect the emotion. Gently introduce uncertainty and emotional perspective. Example: "That sounds like a really painful feeling to sit with. When someone is already emotionally overwhelmed, the mind can sometimes start interpreting social situations in the harshest possible way." Ground them without confirming their negative belief.
5. Conversational Breathing Room: Keep your responses short, gentle, and conversational. Do not use "LLM emotional poetry," layered metaphors, or dense emotional paragraphs. Speak softly and simply. Give the user space to breathe.
6. Smart Crisis Escalation: Distinguish carefully between deep burnout/exhaustion (e.g., "I'm too tired to keep trying") and actual imminent self-harm. Do not trigger jarring crisis hotline text for emotional fatigue, as this breaks conversational flow. ONLY escalate to crisis resources if there is clear, explicit intent or mention of self-harm/suicide.
7. Avoid Toxic Positivity & Jargon: Do not force optimism or use clinical therapy jargon. Speak warmly, but remain transparent that you are an AI space.

Current Active Companion Mode: "${mode.toUpperCase()}"
- "LISTENER" mode: Focus purely on emotional validation and active listening. Reflect their feelings back to them to show understanding. DO NOT give solutions, advice, or suggestions.
- "REFLECTIVE" mode: Ask gentle, clarifying, open-ended questions that help the user process their thoughts and develop self-awareness. DO NOT give solutions or advice.
- "ADVICE" mode: Provide warm, gentle, constructive suggestions, grounding exercises, or potential coping strategies. Only give suggestions under this mode or if explicitly requested.

Continuity & Memory:
${memoriesContext}
`;

      // Map the history into the contents array required by create-next-app/@google/genai SDK
      // The API contents parameter typically represents conversation turns
      const contents = history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      // Add the final user input
      contents.push({
        role: 'user',
        parts: [{ text: userInput }],
      });

      // Request stream from Google AI Studio
      const responseStream = await ai.models.generateContentStream({
        model: CHAT_MODEL,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const encoder = new TextEncoder();
      
      // Return a ReadableStream that Next.js App Router can stream directly to the client
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              const text = chunk.text;
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
            controller.close();
          } catch (streamError) {
            console.error('Error during AI streaming output:', streamError);
            controller.error(streamError);
          }
        },
      });
    } catch (error) {
      console.error('Error initiating chat response stream:', error);
      throw error;
    }
  }

  /**
   * Analyzes a message to extract emotional tone and intensity for our tracking dashboard.
   */
  static async analyzeEmotion(messageText: string): Promise<{ mood: string; intensity: number; notes: string }> {
    try {
      const prompt = `Analyze the emotional tone of the following text. 
Identify the primary mood category from this exact list: [Anxious, Sad, Grateful, Tired, Angry, Calm, Happy].
Estimate the emotional intensity on a scale of 1.0 (very mild) to 5.0 (extremely intense).
Briefly state the primary stress factor or trigger in a few words as "notes".

Respond strictly with a valid JSON object matching this schema:
{
  "mood": "MoodCategory",
  "intensity": number,
  "notes": "Brief explanation or stressful trigger"
}

Text to analyze:
"${messageText}"`;

      const response = await ai.models.generateContent({
        model: METADATA_MODEL, // Using parametrized model for metadata extraction
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1, // Low temperature for high consistency
        },
      });

      const responseText = response.text?.trim() || '';
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error during emotion analysis:', error);
      // Fallback in case of parsing/calling errors
      return { mood: 'Calm', intensity: 2.0, notes: 'Self-reflection' };
    }
  }

  /**
   * Asynchronously extracts long-term insights (memories) from an exchange.
   */
  static async extractMemories(
    userMessage: string,
    aiResponse: string
  ): Promise<{ content: string; category: string }[]> {
    try {
      const prompt = `You are an emotional memory extraction system. 
Analyze the following exchange between a User and their Support Companion. 
Identify any recurring personal struggles, emotional triggers, personal preferences, life events, or coping strategies that the User shared. 
Do not extract transient details (like "User is currently eating breakfast"). Focus on long-term emotional patterns (e.g. "User gets anxious when dealing with team deadlines", "User is dealing with the loss of a close friend").

Write each memory as a short, first-person structured summary about the user (e.g. "User feels isolated when working remotely").
Assign a simple category (e.g., Burnout, Relationships, Loneliness, Grief, Stress-Trigger, Preference).

Respond strictly with a valid JSON array of objects matching this schema:
[
  {
    "content": "Memory content here",
    "category": "Memory category here"
  }
]
If no new long-term personal emotional insights are found, respond with an empty JSON array: []

Exchange to analyze:
User: "${userMessage}"
Companion: "${aiResponse}"`;

      const response = await ai.models.generateContent({
        model: METADATA_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '';
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error during memory extraction:', error);
      return [];
    }
  }

  /**
   * Generates warm, reflective insights on a private journal entry.
   */
  static async generateJournalReflection(entryTitle: string, entryContent: string): Promise<string> {
    try {
      const prompt = `Read the following private journal entry:
Title: "${entryTitle}"
Content:
"${entryContent}"

Provide a warm, gentle, and quiet emotional reflection. 
- Do not give advice or problem-solve unless the user specifically asked for it in the text.
- Do not judge or evaluate.
- Mirror their emotional state (e.g., if they are tired, acknowledge their exhaustion; if they are grateful, share their quiet joy).
- Keep it extremely concise (3-4 sentences maximum). Make them feel understood, reflected, and less alone.`;

      const response = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: prompt,
        config: {
          temperature: 0.6,
        },
      });

      return response.text?.trim() || 'Your thoughts have been safely saved. Take deep breaths; you are doing the best you can.';
    } catch (error) {
      console.error('Error generating journal reflection:', error);
      return 'Your thoughts have been safely saved. A private space is always here for your reflections.';
    }
  }
}
