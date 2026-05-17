import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { AIService, ChatMessage } from '@/lib/ai-service';
import { VectorService } from '@/lib/vector';

/**
 * GET: Lists all conversations for the logged-in user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    // If conversationId is provided, return all messages for that thread
    if (conversationId) {
      const messages = await db.message.findMany({
        where: {
          conversationId,
          conversation: { userId: session.userId }, // Security: Verify conversation belongs to logged-in user
        },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json(messages);
    }

    // Otherwise, return the list of user conversations
    const conversations = await db.conversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true },
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations or messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Handles message streaming, memory retrieval, and background log generation.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, mode = 'listener' } = body;
    let { conversationId } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const userId = session.userId;

    // 1. Thread Management: If no conversation ID, create a new conversation
    if (!conversationId) {
      // Create a nice default title from the first 4 words of the message
      const words = message.trim().split(/\s+/);
      const title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');

      const conversation = await db.conversation.create({
        data: {
          userId,
          title: title || 'New Reflection',
        },
      });
      conversationId = conversation.id;
    }

    // 2. Fetch Chat History (take last 10 messages)
    const dbMessages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    const history: ChatMessage[] = dbMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 3. Semantic Memory Retrieval (Native pgvector Cosine Distance Search)
    let memoryTexts: string[] = [];
    try {
      // Generate query text embedding
      const queryEmbedding = await AIService.generateEmbedding(message);
      // Query PostgreSQL vector memories (returns nearest memories)
      const matchingMemories = await VectorService.searchMemories(userId, queryEmbedding, 4, 0.65);
      memoryTexts = matchingMemories.map((m) => m.content);
    } catch (vectorError) {
      console.error('Vector memory search omitted for this turn:', vectorError);
    }

    // 4. Save User Message immediately in the database
    await db.message.create({
      data: {
        conversationId,
        role: 'user',
        content: message,
      },
    });

    // 5. Initiate Streaming Chat Response
    const aiStream = await AIService.generateChatResponseStream(
      message,
      history,
      memoryTexts,
      mode
    );

    const encoder = new TextEncoder();
    let accumulatedResponse = '';

    // Wrap the response in a Custom Stream to capture full text for background saves
    const customStream = new ReadableStream({
      async start(controller) {
        const reader = aiStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            controller.enqueue(value);
            
            // Accumulate response text
            const chunkText = new TextDecoder().decode(value);
            accumulatedResponse += chunkText;
          }
          
          controller.close();

          // 6. Fire Asynchronous Background Tasks after stream finishes
          // Executes in background, keeping HTTP response super fast and responsive
          triggerBackgroundJobs(userId, conversationId, message, accumulatedResponse).catch(
            (backgroundError) => console.error('Background execution failed:', backgroundError)
          );
        } catch (streamError) {
          console.error('Error during AI streaming pipeline:', streamError);
          controller.error(streamError);
        }
      },
    });

    // Return the response stream with custom header detailing the active conversationId
    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Conversation-Id': conversationId,
      },
    });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Deletes an entire conversation thread.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify conversation belongs to logged-in user
    const conversation = await db.conversation.findFirst({
      where: { id, userId: session.userId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    await db.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Helper to run Asynchronous Background Analysis and Memory Extraction.
 */
async function triggerBackgroundJobs(
  userId: string,
  conversationId: string,
  userMessage: string,
  assistantMessage: string
) {
  try {
    // 1. Save completed AI assistant response to the database
    const assistantMsg = await db.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: assistantMessage,
      },
    });

    // Update conversation's last-active timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 2. Perform Emotion Tone Analysis in background (Parallel)
    const emotionPromise = AIService.analyzeEmotion(userMessage)
      .then(async (analysis) => {
        // Save detected emotion metadata to the User message record
        const userMsg = await db.message.findFirst({
          where: { conversationId, role: 'user' },
          orderBy: { createdAt: 'desc' },
        });

        if (userMsg) {
          await db.message.update({
            where: { id: userMsg.id },
            data: {
              emotion: analysis.mood,
              intensity: analysis.intensity,
            },
          });
        }

        // Write to user's daily Analytics Log
        await db.emotionLog.create({
          data: {
            userId,
            conversationId,
            mood: analysis.mood,
            intensity: analysis.intensity,
            notes: analysis.notes || null,
          },
        });
      })
      .catch((err) => console.error('Emotion analysis background job failed:', err));

    // 3. Perform Long-Term Semantic Memory Extraction in background (Parallel)
    const memoryPromise = AIService.extractMemories(userMessage, assistantMessage)
      .then(async (extractedMemories) => {
        for (const memory of extractedMemories) {
          if (!memory.content || memory.content.trim() === '') continue;
          
          // Generate 768-dimension text embedding for the extracted memory
          const embeddingValues = await AIService.generateEmbedding(memory.content);
          
          // Save embedding values and content natively using vector service
          await VectorService.saveMemory(userId, memory.content, memory.category, embeddingValues);
        }
      })
      .catch((err) => console.error('Memory extraction background job failed:', err));

    // Wait for jobs to settle quietly
    await Promise.allSettled([emotionPromise, memoryPromise]);
  } catch (backgroundError) {
    console.error('Error executing background jobs pipeline:', backgroundError);
  }
}
