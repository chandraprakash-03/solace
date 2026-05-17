import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { AIService } from '@/lib/ai-service';
import { VectorService } from '@/lib/vector';

/**
 * GET: Lists all journal entries for the logged-in user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const journals = await db.journalEntry.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(journals);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Creates a new journal entry and generates an empathetic AI reflection.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, mood } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    const userId = session.userId;
    const entryTitle = title || 'Untitled Entry';

    // 1. Generate gentle, reflective AI insight
    const aiInsight = await AIService.generateJournalReflection(entryTitle, content);

    // 2. Save the journal entry
    const journal = await db.journalEntry.create({
      data: {
        userId,
        title: entryTitle,
        content,
        mood: mood || null,
        aiInsight,
      },
    });

    // 3. Background Job: Sync journal insight to vector memories so chatbot remembers it!
    triggerJournalMemorySync(userId, entryTitle, content, aiInsight).catch((err) =>
      console.error('Failed to sync journal insight to vector memories:', err)
    );

    return NextResponse.json(journal);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT: Updates an existing journal entry.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, content, mood, regenerateReflection = false } = body;

    if (!id) {
      return NextResponse.json({ error: 'Journal ID is required' }, { status: 400 });
    }

    const existingJournal = await db.journalEntry.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingJournal) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    const updatedTitle = title || existingJournal.title;
    const updatedContent = content || existingJournal.content;
    const updatedMood = mood !== undefined ? mood : existingJournal.mood;
    
    let updatedInsight = existingJournal.aiInsight;

    // Regenerate AI reflection if requested or if content changed significantly
    if (regenerateReflection && content && content !== existingJournal.content) {
      updatedInsight = await AIService.generateJournalReflection(updatedTitle, updatedContent);
    }

    const updatedJournal = await db.journalEntry.update({
      where: { id },
      data: {
        title: updatedTitle,
        content: updatedContent,
        mood: updatedMood,
        aiInsight: updatedInsight,
      },
    });

    return NextResponse.json(updatedJournal);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Deletes a journal entry.
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
      return NextResponse.json({ error: 'Journal entry ID required' }, { status: 400 });
    }

    const journal = await db.journalEntry.findFirst({
      where: { id, userId: session.userId },
    });

    if (!journal) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    await db.journalEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Asynchronously logs a summary of the journal entry as a vector memory for chatbot continuity.
 */
async function triggerJournalMemorySync(
  userId: string,
  title: string,
  content: string,
  reflection: string
) {
  try {
    // 1. Summarize the core personal insight from the journal
    const prompt = `Read this private journal entry written by a user:
Title: "${title}"
Content: "${content}"

Extract a single, concise third-person summary of the user's emotional state, a personal struggle, or a major life event described in this journal (e.g., "User is processing feelings of intense loneliness after moving to a new city").
Respond with strictly the summary text, nothing else.`;

    const summaryResponse = await AIService.generateJournalReflection(
      'Journal Memory Summary Task',
      prompt
    );

    const memoryContent = summaryResponse.trim();
    if (!memoryContent || memoryContent.length < 5) return;

    // 2. Generate 768-dimension text embedding for the extracted memory
    const embedding = await AIService.generateEmbedding(memoryContent);

    // 3. Save to User's Memories natively using pgvector
    await VectorService.saveMemory(userId, memoryContent, 'Journal-Reflection', embedding);
  } catch (error) {
    console.error('Failed executing background journal memory synchronization:', error);
  }
}
