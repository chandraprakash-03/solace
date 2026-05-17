'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Activity, Sparkles, AlertTriangle, TrendingUp,
  Heart, Calendar, BarChart3, HelpCircle
} from 'lucide-react';

interface DistributionItem {
  name: string;
  value: number;
}

interface TimelineItem {
  date: string;
  intensity: number;
  mood: string;
  entriesCount: number;
  triggers: string;
}

interface HighlightItem {
  id: string;
  mood: string;
  intensity: number;
  notes: string;
  loggedAt: string;
}

export default function AnalyticsPage() {
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [triggers, setTriggers] = useState<HighlightItem[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) {
        throw new Error('Failed to load emotional data.');
      }
      const data = await res.json();

      setDistribution(data.emotionalDistribution);
      setTimeline(data.emotionalTimeline);
      setHighlights(data.emotionalHighlights);
      setTriggers(data.primaryTriggers);
      setTotalLogs(data.totalLogs);
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading analytics.');
    } finally {
      setLoading(false);
    }
  }

  // Premium, unified HSL color tokens mapping for moods
  // Soothing, unified HSL color tokens mapping for moods
  const MOOD_COLORS: Record<string, string> = {
    Calm: '#7e9285',      // Soft Sage
    Happy: '#cfa47b',     // Warm Sand
    Grateful: '#9caaa0',  // Grey-Sage
    Tired: '#8c949c',     // Quiet Slate
    Anxious: '#d0966a',   // Muted Terracotta Ochre
    Sad: '#8b9cb0',       // Soft Dusty Blue
    Angry: '#d38c82',     // Muted Rose Clay
  };

  const getMoodColor = (moodName: string): string => {
    return MOOD_COLORS[moodName] || 'var(--text-muted)';
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-accent rounded-full animate-spin" />
        <span className="text-text-muted text-sm">Aggregating visual solace logs...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 animate-fade-in relative z-10 h-full max-h-screen">

      {/* 1. TOP HEADER SUMMARY */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-card-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-accent/5 border border-amber-accent/15 text-amber-accent">
            <BarChart3 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Visual Solace</h1>
            <p className="text-sm text-text-muted mt-0.5">Visualize emotional volatility patterns, highlights, and burnout triggers.</p>
          </div>
        </div>

        <div className="flex gap-4 shrink-0">
          <div className="glass-panel px-4 py-2.5 rounded-xl border border-card-border text-center">
            <span className="block text-[10px] font-bold text-text-muted tracking-wider uppercase">Logs Compiled</span>
            <span className="text-lg font-bold text-foreground mt-0.5">{totalLogs} Journals</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {totalLogs === 0 ? (
        /* Empty State */
        <div className="glass-panel p-12 rounded-2xl text-center max-w-md mx-auto space-y-6 mt-12">
          <div className="p-4 rounded-full bg-indigo-accent/5 border border-indigo-accent/15 text-indigo-accent w-fit mx-auto">
            <Activity size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Emotional Sandbox Empty</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Your visual charts will compile here once you start chatting or logging private diary reflections. Have a brief conversation with your companion to trigger your first data log!
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 2. MAIN VISUALIZATION PANELS */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* PANEL A: Emotional Waves Volatility Timeline */}
            <div className="xl:col-span-8 glass-panel p-6 rounded-2xl border border-card-border flex flex-col justify-between h-[420px]">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-indigo-accent" />
                <h3 className="text-sm font-bold tracking-wide text-foreground">Emotional Volatility Waves</h3>
              </div>

              <div className="flex-1 w-full relative z-10">
                <ResponsiveContainer width="100%" height="95%">
                  <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-indigo)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--accent-indigo)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as TimelineItem;
                          return (
                            <div className="glass-panel p-3 rounded-xl border border-card-border text-xs space-y-1.5 shadow-xl">
                              <p className="font-semibold text-foreground border-b border-card-border/50 pb-1">{data.date}</p>
                              <p className="text-text-muted">
                                Avg Intensity: <strong className="text-foreground">{data.intensity} / 5</strong>
                              </p>
                              <p className="text-text-muted">
                                Dominant Mood: <strong className="text-indigo-accent">{data.mood}</strong>
                              </p>
                              {data.triggers && (
                                <p className="text-text-muted mt-1 leading-normal max-w-[180px]">
                                  Triggers: <strong className="text-amber-accent/90">{data.triggers}</strong>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="intensity"
                      stroke="var(--accent-indigo)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIntensity)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PANEL B: Mood distribution (Pie Chart) */}
            <div className="xl:col-span-4 glass-panel p-6 rounded-2xl border border-card-border flex flex-col justify-between h-[420px]">
              <div className="flex items-center gap-2 mb-4">
                <Heart size={16} className="text-amber-accent" />
                <h3 className="text-sm font-bold tracking-wide text-foreground">Dominant Mood Distribution</h3>
              </div>

              <div className="flex-1 w-full flex items-center justify-center relative z-10">
                <ResponsiveContainer width="100%" height="95%">
                  <PieChart>
                    <Pie
                      data={distribution.filter(d => d.value > 0)}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getMoodColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="glass-panel px-3 py-1.5 rounded-lg border border-card-border text-xs shadow-md">
                              <span className="font-medium text-foreground">{data.name}: </span>
                              <strong className="text-indigo-accent">{data.value} logs</strong>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={40}
                      iconSize={8}
                      iconType="circle"
                      formatter={(value) => <span className="text-[10px] text-text-muted font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* 3. LOG HIGHLIGHTS AND BURNOUT TRIGGERS LISTINGS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

            {/* GRID 1: Moments of Quiet Peace (Highlights) */}
            <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Sparkles size={16} />
                <h3 className="text-sm font-bold tracking-wide text-foreground">Moments of Peace & Gratitude</h3>
              </div>

              <div className="space-y-3">
                {highlights.length === 0 ? (
                  <p className="text-text-muted text-xs py-6 text-center">No quiet/happy moments logged recently.</p>
                ) : (
                  highlights.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-indigo-accent/[0.03] border border-card-border hover:border-indigo-accent/20 transition-all text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-indigo-accent uppercase tracking-wider text-[10px]">
                          {log.mood} (Intensity {log.intensity})
                        </span>
                        <span className="text-[9px] text-text-muted">
                          {new Date(log.loggedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-text-warm-dim leading-relaxed italic">
                        "{log.notes}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* GRID 2: Burnout & Stress triggers */}
            <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
              <div className="flex items-center gap-2 text-amber-accent mb-2">
                <AlertTriangle size={16} />
                <h3 className="text-sm font-bold tracking-wide text-foreground">Monitored Burnout & Stress Triggers</h3>
              </div>

              <div className="space-y-3">
                {triggers.length === 0 ? (
                  <p className="text-text-muted text-xs py-6 text-center">No stress triggers logged recently.</p>
                ) : (
                  triggers.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-amber-accent/[0.03] border border-card-border hover:border-amber-accent/25 transition-all text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-amber-accent uppercase tracking-wider text-[10px]">
                          {log.mood} (Intensity {log.intensity})
                        </span>
                        <span className="text-[9px] text-text-muted">
                          {new Date(log.loggedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-text-warm-dim leading-relaxed italic">
                        "{log.notes}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
