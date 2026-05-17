'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Sparkles, Send, Plus, Trash2, Heart,
  HelpCircle, Compass, Shield, User, AlertCircle
} from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  intensity?: number;
}

interface Conversation {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Companion mode: listener, reflective, advice
  const [mode, setMode] = useState<'listener' | 'reflective' | 'advice'>('listener');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming]);

  // Load threads on load
  useEffect(() => {
    loadThreads();
  }, []);

  // Removed activeId useEffect to prevent stream wiping. 
  // Message loading is now handled explicitly by onClick in the sidebar.
  // Auto-grow input text area
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  async function loadThreads() {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    }
  }

  async function loadMessages(conversationId: string) {
    setThreadLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chat`);
      if (res.ok) {
        // Fetch specific thread messages by loading the conversation
        // Note: To keep the API route extremely unified, we load the messages for activeId
        // by making a GET request. However, to keep it simple we can just pull all messages
        // in our database for that thread. 
        // Let's create an endpoint or pull from a separate query. Wait, in our GET api/chat we listed threads.
        // Let's make sure we have a way to pull the messages. Oh! Our GET api/chat returns conversations and their summary, 
        // but we can query messages by appending `/api/chat?conversationId=...` in a GET call.
        // Wait, did we implement that filter in GET /api/chat? Let's check:
        // No, in GET /api/chat we only retrieved the list of conversations.
        // Let's see: how do we retrieve the messages for a specific conversation?
        // Ah! We can easily fetch them by adding a check in the GET route, or let's check what we did.
        // Wait, we can fetch them using a query in GET /api/chat if `conversationId` parameter is provided!
        // Let's check our GET /api/chat implementation: it does NOT currently check for `conversationId`.
        // Let's edit `src/app/api/chat/route.ts` to support fetching messages if `conversationId` is provided!
        // This is extremely simple and clean. But first let's see how the page will handle it.
        // Yes, let's write a GET call that queries: `fetch('/api/chat?conversationId=' + conversationId)`
        // And we will edit the GET route in `src/app/api/chat/route.ts` shortly to support it perfectly.
        const msgRes = await fetch(`/api/chat?conversationId=${conversationId}`);
        if (msgRes.ok) {
          const data = await msgRes.json();
          // If it is a thread fetch, it will return the array of messages!
          if (Array.isArray(data)) {
            setMessages(data);
          } else if (data.messages) {
            setMessages(data.messages);
          }
        }
      }
    } catch (err) {
      setError('Could not restore thread history.');
    } finally {
      setThreadLoading(false);
    }
  }

  const handleStartNewConversation = () => {
    setActiveId(null);
    setMessages([]);
    setInputValue('');
    setError('');
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation? It cannot be restored.')) return;

    try {
      const res = await fetch(`/api/chat?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeId === id) {
          handleStartNewConversation();
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading || streaming) return;

    const userText = inputValue.trim();
    setInputValue('');
    setError('');
    setLoading(true);

    // Append user message immediately to the UI
    const tempUserMsg: Message = { role: 'user', content: userText };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // Initiate streaming request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          conversationId: activeId,
          mode: mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to companion.');
      }

      // Read new conversation ID from custom header
      const headerConvId = response.headers.get('X-Conversation-Id');
      if (headerConvId && activeId !== headerConvId) {
        setActiveId(headerConvId);
        loadThreads(); // Refresh thread list in sidebar
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming failed.');
      }

      setLoading(false);
      setStreaming(true);

      // Append temporary empty assistant response
      const tempAiMsg: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, tempAiMsg]);

      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        assistantText += chunkText;

        // Update the last message in array (which is our assistant message)
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            last.content = assistantText;
          }
          return next;
        });
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Empathetic stream was interrupted. Try again.');
      setLoading(false);
    } finally {
      setStreaming(false);
    }
  };

  // Listen to Enter key inside textarea (Submit without Shift key)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Setup mode cards descriptions
  const modeSettings = {
    listener: {
      title: 'Listener',
      desc: 'Pure emotional validation & active listening. No advice.',
      glowClass: 'bg-indigo-accent/[0.02]',
      textColor: 'text-indigo-accent',
    },
    reflective: {
      title: 'Reflective',
      desc: 'Thoughtful, open-ended questions to clarify emotional clouds.',
      glowClass: 'bg-card-bg/[0.01]',
      textColor: 'text-foreground',
    },
    advice: {
      title: 'Advice',
      desc: 'Gentle constructive suggestions, tools, and coping guidelines.',
      glowClass: 'bg-amber-accent/[0.02]',
      textColor: 'text-amber-accent',
    },
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 h-full overflow-hidden relative z-10 bg-transparent">

      {/* 1. THREAD SIDEBAR */}
      <div className="hidden lg:flex w-72 flex-col gap-4 shrink-0 glass-panel p-4 rounded-2xl border border-card-border h-full overflow-y-auto">
        <button
          onClick={handleStartNewConversation}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-accent/15 border border-indigo-accent/20 hover:border-indigo-accent/40 text-foreground font-semibold text-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New Reflection</span>
        </button>

        <div className="flex-1 space-y-2 mt-2">
          <span className="block text-[10px] font-semibold text-text-muted tracking-wider uppercase pl-2">
            Recent Reflections
          </span>

          <div className="space-y-1">
            {conversations.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-8">No previous reflections saved.</p>
            ) : (
              conversations.map((thread) => {
                const isActive = activeId === thread.id;
                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      if (activeId !== thread.id) {
                        setActiveId(thread.id);
                        loadMessages(thread.id);
                      }
                    }}
                    className={`group w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all cursor-pointer text-left ${isActive
                        ? 'bg-foreground/[0.04] border border-card-border'
                        : 'border border-transparent hover:bg-foreground/[0.02]'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium block truncate text-foreground">
                        {thread.title}
                      </span>
                      <span className="text-[10px] text-text-muted block mt-0.5">
                        {new Date(thread.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConversation(thread.id, e)}
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

      {/* 2. CHAT PANEL */}
      <div className="flex-1 flex flex-col justify-between glass-panel rounded-2xl border border-card-border overflow-hidden relative h-full">

        {/* TOP BAR: Mode Selection */}
        <div className="border-b border-card-border px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-background/20 relative z-20">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-indigo-accent fill-indigo-accent/15" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Solace Companion</h2>
              <p className="text-[10px] text-text-muted mt-0.5 hidden sm:block">A judgment-free space to release weight.</p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 p-1.5 rounded-full bg-foreground/[0.02] border border-card-border/20 shrink-0">
            {(['listener', 'reflective', 'advice'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${mode === m
                    ? 'bg-amber-accent text-background shadow-md'
                    : 'text-text-muted hover:text-foreground hover:bg-foreground/[0.04]'
                  }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Mode Helper Description */}
        <div className={`px-6 py-2.5 text-[11px] text-text-muted flex gap-2 items-center bg-foreground/[0.01] relative z-10 transition-all ${modeSettings[mode].glowClass}`}>
          <Sparkles size={12} className={`${modeSettings[mode].textColor} shrink-0`} />
          <span className="leading-normal truncate">
            <strong>Active Mode:</strong> {modeSettings[mode].desc}
          </span>
        </div>

        {/* CHAT BUBBLES WINDOW */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 relative z-10">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2 items-center">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {threadLoading ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            /* Calming Empty State */
            <div className="h-full flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto space-y-6">
              <div className="p-4 rounded-full bg-indigo-accent/5 border border-indigo-accent/15 text-indigo-accent">
                <Heart size={28} className="fill-indigo-accent/10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Welcome to your Solace</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  How are you holding up today? You can express whatever you are feeling, vent about work exhaustion, or process difficult thoughts.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button
                  onClick={() => setInputValue('I am feeling incredibly exhausted and burned out by work lately...')}
                  className="p-3 text-left rounded-xl border border-card-border bg-foreground/[0.01] hover:bg-foreground/[0.03] transition-all text-xs text-text-warm-dim leading-relaxed cursor-pointer"
                >
                  "I am feeling incredibly exhausted and burned out..."
                </button>
                <button
                  onClick={() => setInputValue('I have some relationship worries that are keeping me awake...')}
                  className="p-3 text-left rounded-xl border border-card-border bg-foreground/[0.01] hover:bg-foreground/[0.03] transition-all text-xs text-text-warm-dim leading-relaxed cursor-pointer"
                >
                  "I have some relationship worries keeping me awake..."
                </button>
              </div>
            </div>
          ) : (
            /* Render active messages list */
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div
                    key={index}
                    className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isAI
                          ? 'bg-foreground/[0.02] border border-card-border text-foreground rounded-tl-sm'
                          : 'bg-indigo-accent/10 border border-indigo-accent/20 text-foreground rounded-tr-sm'
                        }`}
                    >
                      {isAI ? (
                        /* AI Response Markdown Renderer */
                        <div className="markdown-content whitespace-pre-wrap">
                          {msg.content || (
                            <span className="text-text-muted italic select-none">Quiet reflection forming...</span>
                          )}
                        </div>
                      ) : (
                        /* User Content text */
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}

                      {/* Emotion Tag for User message (if analyzed in DB) */}
                      {!isAI && msg.emotion && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-accent/10 border border-indigo-accent/15 text-[10px] text-indigo-accent font-medium">
                          <span>{msg.emotion} ({msg.intensity || 2})</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Bouncing Typing indicator */}
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-foreground/[0.02] border border-card-border rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-accent typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-accent typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-accent typing-dot" />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* FOOTER INPUT CONTAINER */}
        <div className="border-t border-card-border px-6 py-4 bg-background/40 relative z-20">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <div className="flex-1 relative glass-panel rounded-xl border border-card-border overflow-hidden">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts... (Shift+Enter for newline)"
                disabled={loading || streaming}
                className="w-full bg-transparent px-4 py-3 border-0 text-sm focus:outline-none focus:ring-0 resize-none text-foreground leading-relaxed placeholder:text-text-muted max-h-[180px] min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || streaming || !inputValue.trim()}
              className="p-3 rounded-xl bg-indigo-accent hover:opacity-90 text-background font-medium transition-all shadow-sm active:scale-[0.96] disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
            >
              <Send size={18} />
            </button>
          </form>

          {/* Privacy reminder */}
          <div className="mt-2 text-center text-[10px] text-text-muted flex items-center justify-center gap-1">
            <Shield size={10} className="text-indigo-accent/70" />
            <span>Encrypted local session. No third-party data tracking.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
