'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, Clock } from 'lucide-react';

function LoginFormContent({ onLogin }: { onLogin: () => void }) {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const isTimeout = searchParams.get('reason') === 'timeout';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('loginFailed'));
      }

      onLogin();
    } catch (err: any) {
      setErrorMsg(err.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-10 border border-border shadow-xl max-w-md w-full">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-soft text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#c5dbcc]">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">
          {t('adminLogin')}
        </h1>
        <p className="text-xs text-muted mt-1">
          Sign in to manage employee attendance and settings
        </p>
      </div>

      {isTimeout && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs flex items-center space-x-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>
            {lang === 'ms'
              ? 'Sesi anda telah tamat tempoh kerana tiada aktiviti. Sila log masuk semula.'
              : 'Your session timed out due to inactivity. Please sign in again.'}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 text-danger p-3.5 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-gray-50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            />
            <User className="w-4 h-4 text-muted absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            />
            <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          <span>{loading ? 'Signing in...' : t('adminLogin')}</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </form>
    </div>
  );
}

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <>
      <Navbar isAdmin />
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<div className="text-muted text-xs">Loading...</div>}>
          <LoginFormContent onLogin={onLogin} />
        </Suspense>
      </main>
    </>
  );
}
