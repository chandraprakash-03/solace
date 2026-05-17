'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Lock, ShieldAlert, Sparkles, User, Mail, Eye, EyeOff } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email,
          password,
          name: isLogin ? undefined : name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred during authentication.');
      }

      // Secure session cookie is set, redirect to chat dashboard
      router.push('/dashboard/chat');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden animate-fade-in">
      {/* Decorative calm background elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[350px] h-[350px] bg-amber-500/3 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[1000px] grid md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Product Intro */}
        <div className="md:col-span-7 space-y-6 text-left pr-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-sm">
            <Heart size={14} className="fill-indigo-400/20" />
            <span>Private Emotional Solace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            A quiet space to <br />
            <span className="text-amber-accent text-glow-amber">unburden your mind</span>
          </h1>

          <p className="text-text-warm-dim text-lg leading-relaxed max-w-lg">
            Solace is a secure, judgment-free AI companion designed to help you safely express emotions, reflect on difficult moments, recognize stress patterns, and feel truly heard.
          </p>

          {/* Privacy Value Props */}
          <div className="space-y-4 pt-4 max-w-md">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Absolute Data Privacy</h3>
                <p className="text-text-muted text-sm mt-0.5">Your conversations are stored securely. No commercial tracking or third-party telemetry.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-amber-accent/5 border border-amber-accent/10 text-amber-accent shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Dynamic Memory Continuity</h3>
                <p className="text-text-muted text-sm mt-0.5">Understands recurring burnout cycles, relationship triggers, and coping tools across separate sessions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="md:col-span-5">
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl border border-card-border shadow-2xl relative">
            
            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {isLogin ? 'Welcome Back' : 'Begin New Journey'}
              </h2>
              <p className="text-text-muted text-sm">
                {isLogin 
                  ? 'Enter your private solace credentials.' 
                  : 'Establish a secure and private support account.'}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2 items-center">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name field for Register */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-text-muted text-xs font-medium pl-1">
                    Your Name (Optional)
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      id="name"
                      type="text"
                      placeholder="e.g., Alex"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full glass-input pl-10 pr-4 py-2.5 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-text-muted text-xs font-medium pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input pl-10 pr-4 py-2.5 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-text-muted text-xs font-medium pl-1">
                  Security Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input pl-10 pr-10 py-2.5 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-accent hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? (
                  'Access Solace'
                ) : (
                  'Create Solace Account'
                )}
              </button>
            </form>

            {/* Toggle State Footer */}
            <div className="mt-6 pt-4 border-t border-indigo-500/10 text-center text-xs">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium cursor-pointer"
              >
                {isLogin 
                  ? 'First time here? Begin a new journey' 
                  : 'Already have a secure account? Access here'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Landing Footer */}
      <footer className="mt-16 text-text-muted text-xs text-center z-10 max-w-sm leading-relaxed">
        <p>This application is a reflective AI space. It does not replace clinical therapy or emergency psychiatric services.</p>
      </footer>
    </main>
  );
}
