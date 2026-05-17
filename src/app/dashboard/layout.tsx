'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, BookOpen, BarChart3, LogOut, Menu, X, Heart, User, Sun, Moon } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  preferredMode: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('solace-theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('solace-theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Fetch session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth');
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        // Redirection handled by middleware, but fallback here
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const navItems = [
    {
      name: 'Conversational Workspace',
      href: '/dashboard/chat',
      icon: MessageSquare,
      description: 'Quiet support space',
    },
    {
      name: 'Reflective Journal',
      href: '/dashboard/journal',
      icon: BookOpen,
      description: 'Empathetic diary notes',
    },
    {
      name: 'Visual Solace',
      href: '/dashboard/analytics',
      icon: BarChart3,
      description: 'Your emotional charts',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-accent rounded-full animate-spin" />
          <span className="text-text-muted text-sm tracking-wide">Securing quiet space...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glass-panel border-b border-card-border z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <Heart size={20} className="text-amber-accent fill-amber-accent/20" />
          <span className="font-bold text-lg text-foreground">Solace</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            className="p-2 rounded-lg border border-card-border text-text-muted hover:text-foreground transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* SIDEBAR PANEL (Desktop / Collapsed Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-card-border flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static md:h-screen shrink-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col gap-8 py-6 px-4">

          {/* Brand Logo */}
          <div className="hidden md:flex items-center gap-2.5 px-3">
            <Heart size={22} className="text-amber-accent fill-amber-accent/20" />
            <div>
              <span className="font-bold text-lg tracking-tight text-foreground">Solace</span>
              <span className="block text-[9px] text-text-muted mt-0.5 tracking-wider uppercase font-semibold">Private Space</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${isActive
                      ? 'bg-indigo-accent/10 border border-indigo-accent/20 text-foreground'
                      : 'text-text-muted hover:text-foreground border border-transparent hover:bg-white/3'
                    }`}
                >
                  <Icon
                    size={20}
                    className={`transition-colors ${isActive ? 'text-indigo-accent' : 'text-text-muted group-hover:text-foreground'
                      }`}
                  />
                  <div>
                    <span className="text-sm font-medium block">{item.name}</span>
                    <span className="text-[10px] text-text-muted/75 block mt-0.5 font-light">
                      {item.description}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-amber-accent" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Identity & Theme switcher */}
        <div className="p-4 border-t border-card-border space-y-3">

          <div className="flex items-center justify-between gap-3 px-1 py-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-accent/10 border border-card-border text-indigo-accent flex items-center justify-center shrink-0">
                <User size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-foreground block truncate">
                  {user?.name || 'Solace User'}
                </span>
                <span className="text-[10px] text-text-muted block truncate">
                  {user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              className="p-1.5 rounded-lg border border-card-border hover:bg-foreground/5 text-text-muted hover:text-foreground transition-all cursor-pointer shrink-0"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          {/* Sign Out Trigger */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 hover:text-red-300 text-[11px] font-semibold tracking-wide transition-all cursor-pointer"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* MAIN SCREEN CONTAINER */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {children}
        </div>
      </main>

    </div>
  );
}
