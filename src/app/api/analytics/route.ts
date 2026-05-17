import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET: Retrieves aggregated emotional analytics logs for the logged-in user over the last 30 days.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Fetch all emotion logs in the last 30 days
    const logs = await db.emotionLog.findMany({
      where: {
        userId,
        loggedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { loggedAt: 'asc' },
    });

    // 2. Aggregate: Emotional Distribution (Count per mood)
    const moodCounts: Record<string, number> = {
      Anxious: 0,
      Sad: 0,
      Grateful: 0,
      Tired: 0,
      Angry: 0,
      Calm: 0,
      Happy: 0,
    };

    logs.forEach((log) => {
      if (moodCounts[log.mood] !== undefined) {
        moodCounts[log.mood]++;
      }
    });

    const emotionalDistribution = Object.keys(moodCounts).map((mood) => ({
      name: mood,
      value: moodCounts[mood],
    }));

    // 3. Aggregate: Timeline Trend (Daily average intensity and primary mood)
    const dailyData: Record<string, { totalIntensity: number; count: number; moods: Record<string, number>; notes: string[] }> = {};

    logs.forEach((log) => {
      // Format date key as "May 17" or similar
      const dateKey = log.loggedAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          totalIntensity: 0,
          count: 0,
          moods: {},
          notes: [],
        };
      }

      dailyData[dateKey].totalIntensity += log.intensity;
      dailyData[dateKey].count++;

      // Track mood frequency for the day
      if (!dailyData[dateKey].moods[log.mood]) {
        dailyData[dateKey].moods[log.mood] = 0;
      }
      dailyData[dateKey].moods[log.mood]++;

      // Accumulate unique non-null notes
      if (log.notes && !dailyData[dateKey].notes.includes(log.notes)) {
        dailyData[dateKey].notes.push(log.notes);
      }
    });

    const emotionalTimeline = Object.keys(dailyData).map((date) => {
      const day = dailyData[date];
      const avgIntensity = parseFloat((day.totalIntensity / day.count).toFixed(2));

      // Find the dominant mood for the day
      let dominantMood = 'Calm';
      let maxCount = 0;
      Object.keys(day.moods).forEach((mood) => {
        if (day.moods[mood] > maxCount) {
          maxCount = day.moods[mood];
          dominantMood = mood;
        }
      });

      return {
        date,
        intensity: avgIntensity,
        mood: dominantMood,
        entriesCount: day.count,
        triggers: day.notes.slice(0, 3).join(', '), // List top 3 triggers for the day
      };
    });

    // 4. Extract recent highlights (Grateful / Happy entries) and triggers (Anxious / Angry entries)
    const emotionalHighlights = logs
      .filter((log) => ['Grateful', 'Happy', 'Calm'].includes(log.mood))
      .slice(-4)
      .map((log) => ({
        id: log.id,
        mood: log.mood,
        intensity: log.intensity,
        notes: log.notes || 'A moment of peace.',
        loggedAt: log.loggedAt,
      }));

    const primaryTriggers = logs
      .filter((log) => ['Anxious', 'Angry', 'Tired', 'Sad'].includes(log.mood) && log.notes)
      .slice(-4)
      .map((log) => ({
        id: log.id,
        mood: log.mood,
        intensity: log.intensity,
        notes: log.notes,
        loggedAt: log.loggedAt,
      }));

    return NextResponse.json({
      emotionalDistribution,
      emotionalTimeline,
      emotionalHighlights,
      primaryTriggers,
      totalLogs: logs.length,
    });
  } catch (error) {
    console.error('Error compiling emotional analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
