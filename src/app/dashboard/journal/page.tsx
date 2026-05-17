'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Trash2, Heart, Sparkles, Save, Edit3,
  Calendar, Check, ShieldCheck, FileText, ArrowLeft
} from 'lucide-react';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  aiInsight: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Calm');
  const [isEditing, setIsEditing] = useState(false);
  const [isNew, setIsNew] = useState(true);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const moodsList = ['Calm', 'Happy', 'Grateful', 'Tired', 'Anxious', 'Sad', 'Angry'];

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setListLoading(true);
    try {
      const res = await fetch('/api/journal');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
        // Automatically select first entry if list is not empty
        if (data.length > 0 && !selectedEntry) {
          setSelectedEntry(data[0]);
          setIsNew(false);
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    } finally {
      setListLoading(false);
    }
  }

  // Populate form fields when selected entry changes
  useEffect(() => {
    if (selectedEntry) {
      setTitle(selectedEntry.title);
      setContent(selectedEntry.content);
      setMood(selectedEntry.mood || 'Calm');
    } else {
      handleNewEntryClick();
    }
  }, [selectedEntry]);

  const handleNewEntryClick = () => {
    setSelectedEntry(null);
    setTitle('');
    setContent('');
    setMood('Calm');
    setIsNew(true);
    setIsEditing(true);
    setError('');
  };

  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      const res = await fetch(`/api/journal?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEntries(prev => prev.filter(item => item.id !== id));
        if (selectedEntry?.id === id) {
          setSelectedEntry(null);
          handleNewEntryClick();
        }
      }
    } catch (err) {
      console.error('Error deleting journal entry:', err);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const url = '/api/journal';
      const method = isNew ? 'POST' : 'PUT';
      const bodyPayload = isNew
        ? { title: title || 'Untitled Entry', content, mood }
        : { id: selectedEntry?.id, title: title || 'Untitled Entry', content, mood, regenerateReflection: true };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save journal entry.');
      }

      setSuccess(true);

      // Update list
      if (isNew) {
        setEntries(prev => [data, ...prev]);
        setSelectedEntry(data);
        setIsNew(false);
      } else {
        setEntries(prev => prev.map(item => item.id === data.id ? data : item));
        setSelectedEntry(data);
      }

      setIsEditing(false);

      // Hide success notification after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      setError(err.message || 'Error occurred while saving entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 h-full overflow-hidden relative z-10 bg-transparent">

      {/* 1. SIDEBAR: DIARY LOG */}
      <div className="w-full md:w-72 flex flex-col gap-4 shrink-0 glass-panel p-4 rounded-2xl border border-card-border h-full overflow-y-auto">
        <button
          onClick={handleNewEntryClick}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-accent/15 border border-indigo-accent/20 hover:border-indigo-accent/40 text-foreground font-semibold text-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New Journal</span>
        </button>

        <div className="flex-1 space-y-2 mt-2">
          <span className="block text-[10px] font-semibold text-text-muted tracking-wider uppercase pl-2">
            Your Journals
          </span>

          <div className="space-y-1">
            {listLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-8">No journals saved yet.</p>
            ) : (
              entries.map((item) => {
                const isSelected = selectedEntry?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedEntry(item);
                      setIsEditing(false);
                      setIsNew(false);
                    }}
                    className={`group w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all cursor-pointer text-left ${isSelected
                      ? 'bg-foreground/[0.04] border border-card-border'
                      : 'border border-transparent hover:bg-foreground/[0.02]'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium block truncate text-foreground">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-text-muted">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        {item.mood && (
                          <span className="text-[8px] px-1.5 py-0.2 bg-foreground/[0.04] border border-card-border rounded-full text-amber-accent font-medium">
                            {item.mood}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteEntry(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all ml-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. EDITOR CANVAS & AI INSIGHT AREA */}
      <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">

        {/* Main Content Card */}
        <div className="flex-1 glass-panel rounded-2xl border border-card-border p-6 md:p-8 flex flex-col justify-between overflow-y-auto">

          <form onSubmit={handleSaveEntry} className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">

              {/* Form Title Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-card-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} className="text-indigo-accent" />
                  <h2 className="text-base font-semibold text-foreground">
                    {isNew ? 'New Journal Entry' : 'Reflecting on Journal'}
                  </h2>
                </div>

                {/* Header Buttons */}
                {!isEditing && selectedEntry && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-foreground/[0.02] hover:bg-foreground/[0.05] border border-card-border text-xs font-semibold transition-all cursor-pointer text-text-warm-dim"
                  >
                    <Edit3 size={12} />
                    <span>Edit Entry</span>
                  </button>
                )}
              </div>

              {/* Title & Mood Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8 space-y-1">
                  <label className="text-[10px] font-semibold text-text-muted tracking-wider uppercase pl-1">
                    Entry Title
                  </label>
                  <input
                    type="text"
                    placeholder="Reflections on today..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isEditing}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-sm disabled:opacity-75 disabled:pointer-events-none"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[10px] font-semibold text-text-muted tracking-wider uppercase pl-1">
                    Current Mood
                  </label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    disabled={!isEditing}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-75 disabled:pointer-events-none appearance-none"
                  >
                    {moodsList.map((m) => (
                      <option key={m} value={m} className="bg-background text-foreground">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editor Textarea */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text-muted tracking-wider uppercase pl-1">
                  Diary Notes
                </label>
                <textarea
                  placeholder="Today, I noticed..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!isEditing}
                  required
                  rows={isEditing ? 8 : 6}
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm leading-relaxed focus:ring-0 resize-none disabled:opacity-85 disabled:border-transparent disabled:bg-transparent disabled:px-1 disabled:py-0 disabled:shadow-none min-h-[120px]"
                />
              </div>

            </div>

            {/* Error notifications */}
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            {/* Form Footer */}
            {isEditing && (
              <div className="pt-4 border-t border-card-border/50 flex justify-end gap-3 mt-6">
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/3 text-text-muted transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-accent hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md hover:shadow-indigo-500/10 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save and Reflect</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* AI SUPPORT INSIGHT (Static presentation of AI Reflection if active) */}
          {!isEditing && selectedEntry?.aiInsight && (
            <div className="mt-6 pt-6 border-t border-card-border/50 animate-fade-in">
              <div className="p-5 rounded-xl bg-amber-accent/[0.04] border border-amber-accent/20 relative overflow-hidden">

                <div className="flex items-center gap-2 text-amber-accent mb-2">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Solace Reflection</span>
                </div>

                <p className="text-text-warm-dim text-sm italic leading-relaxed font-light pl-1">
                  "{selectedEntry.aiInsight}"
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Security / Privacy reassurance footer */}
        <div className="text-center text-[10px] text-text-muted flex items-center justify-center gap-1.5 py-1">
          <ShieldCheck size={12} className="text-indigo-400" />
          <span>Local journal database secured with secure session validation.</span>
        </div>

      </div>

    </div>
  );
}
