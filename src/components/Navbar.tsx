'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { CalendarCheck, LogOut } from 'lucide-react';

interface NavbarProps {
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function Navbar({ isAdmin = false, onLogout }: NavbarProps) {
  const { lang, setLang, t } = useLanguage();
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md group-hover:bg-primary-hover transition-colors">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg text-ink tracking-tight block leading-tight">
                  {t('appName')}
                </span>
                <span className="text-xs text-muted block">
                  {isAdmin ? t('adminDashboard') : t('workerForm')}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher */}
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-gray-50 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md transition-all ${
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
                className={`px-2.5 py-1 rounded-md transition-all ${
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
                  className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium text-muted hover:text-ink bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {t('workerForm')}
                </Link>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-danger bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    {t('signOut')}
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
