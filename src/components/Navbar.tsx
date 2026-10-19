'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { CalendarCheck, LogOut } from 'lucide-react';

interface NavbarProps {
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function Navbar({ isAdmin = false, onLogout }: NavbarProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-nowrap justify-between items-center gap-1.5 sm:gap-3 min-h-16 py-2">
          {/* Logo & Title */}
          <div className="flex min-w-0 items-center">
            <Link href="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2.5 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center text-white shadow-md group-hover:bg-primary-hover transition-colors">
                <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className={`font-bold ${isAdmin ? 'text-xs' : 'text-sm'} sm:text-lg text-ink tracking-tight block leading-tight whitespace-nowrap`}>
                  {t(isAdmin ? 'dashboardName' : 'appName')}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {/* Language Switcher */}
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-gray-50 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`!min-w-9 sm:!min-w-11 px-1.5 sm:px-2.5 py-1 rounded-md transition-all ${
                  lang === 'en'
                    ? 'bg-primary text-white shadow-sm font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('ms')}
                className={`!min-w-9 sm:!min-w-11 px-1.5 sm:px-2.5 py-1 rounded-md transition-all ${
                  lang === 'ms'
                    ? 'bg-primary text-white shadow-sm font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                BM
              </button>
            </div>

            {/* Admin Navigation (only shown on admin pages) */}
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Link
                  href="/"
                  className="hidden md:inline-flex items-center px-3 py-1.5 text-xs font-medium text-muted hover:text-ink bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {t('workerForm')}
                </Link>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    aria-label={t('signOut')}
                    title={t('signOut')}
                    className="inline-flex !min-w-8 items-center justify-center px-2 sm:px-3 py-1.5 text-xs font-medium text-danger bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t('signOut')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
