'use client';

import { useEffect, useState } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';

export default function AdminPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const navigation = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;

    async function restoreOnRefresh() {
      try {
        // A saved cookie alone must not open the dashboard on a fresh visit.
        // The tab marker only allows restoration during a browser reload;
        // the server still verifies the signed session and its expiration.
        if (navigation?.type === 'reload' && sessionStorage.getItem('admin_tab_signed_in') === 'true') {
          const response = await fetch('/api/auth/session', { cache: 'no-store' });
          const session = await response.json();
          if (response.ok && session.authenticated === true) {
            if (!cancelled) setSignedIn(true);
            return;
          }
        }
        sessionStorage.removeItem('admin_tab_signed_in');
      } catch {
        // Storage or network failures leave the login form in place.
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    void restoreOnRefresh();
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setSignedIn(false);
        try { sessionStorage.removeItem('admin_tab_signed_in'); } catch {}
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  if (checkingSession) {
    return <main className="flex-1 flex items-center justify-center text-muted">Loading...</main>;
  }

  return signedIn ? (
    <AdminDashboard />
  ) : (
    <AdminLogin onLogin={() => {
      try { sessionStorage.setItem('admin_tab_signed_in', 'true'); } catch {}
      setSignedIn(true);
    }} />
  );
}
