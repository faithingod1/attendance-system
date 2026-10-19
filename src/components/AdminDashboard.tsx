'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { MONTH_NAMES, DAY_NAMES } from '@/lib/translations';
import { getCurrentYearMonthInKL, getDayOfWeekIndex } from '@/lib/date-utils';
import {
  DashboardStats,
  WorkerSubmissionOverview,
  Worker,
  AttendanceDay,
  AttendanceStatus,
} from '@/lib/types';
import {
  Lock,
  Unlock,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Eye,
  RotateCcw,
  X,
  Save,
  Trash2,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';

export default function AdminDashboard() {
  const { lang, t } = useLanguage();

  const currentKL = getCurrentYearMonthInKL();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentKL.month);
  const [selectedYear, setSelectedYear] = useState<number>(currentKL.year);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overviews, setOverviews] = useState<WorkerSubmissionOverview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Submission link URL state
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Modals state
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);

  // Change Password Modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Worker Modal state (Add or Edit)
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerNameInput, setWorkerNameInput] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [empIdInput, setEmpIdInput] = useState('');
  const [workerStatusInput, setWorkerStatusInput] = useState<'active' | 'inactive'>('active');
  const [savingWorker, setSavingWorker] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // Worker Delete Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState(false);

  // Attendance Detail & Correction Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOverview, setSelectedOverview] = useState<WorkerSubmissionOverview | null>(null);
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [correctionReason, setCorrectionReason] = useState('');
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ─── 1. Inactivity Timeout Auto-Logout (15 minutes) ────────────────────────
  useEffect(() => {
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 mins
    let timeoutId: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {}
        window.location.replace('/admin?reason=timeout');
      }, INACTIVITY_TIMEOUT_MS);
    };

    resetInactivityTimer();
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, resetInactivityTimer, { passive: true })
    );

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, []);

  // ─── 2. Fetch Dashboard & Settings Data ─────────────────────────────────────
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/dashboard?month=${selectedMonth}&year=${selectedYear}`, {
          cache: 'no-store',
        }),
        fetch('/api/admin/settings', { cache: 'no-store' }),
      ]);

      if (dashRes.status === 401) {
        window.location.replace('/admin');
        return;
      }

      const dashData = await dashRes.json();
      setStats(dashData.stats);
      setOverviews(dashData.workerOverviews || []);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        const savedUrl = settingsData.submissionLinkUrl || baseOrigin;
        setSubmissionUrl(savedUrl);
        setUrlInput(savedUrl);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.replace('/admin');
  };

  // Toggle Link Lock
  const handleToggleLock = async () => {
    if (!stats) return;
    setTogglingLock(true);
    try {
      const nextState = !stats.isLinkLocked;
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: nextState }),
      });
      if (res.ok) {
        setStats({ ...stats, isLinkLocked: nextState });
        setLockModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    } finally {
      setTogglingLock(false);
    }
  };

  // Save Custom Submission URL
  const handleSaveUrl = async () => {
    setSavingUrl(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionLinkUrl: urlInput }),
      });
      if (res.ok) {
        setSubmissionUrl(urlInput);
        setEditingUrl(false);
      }
    } catch (err) {
      console.error('Failed to save submission link URL:', err);
    } finally {
      setSavingUrl(false);
    }
  };

  // Copy Submission Link
  const handleCopyLink = () => {
    const urlToCopy = submissionUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    navigator.clipboard.writeText(urlToCopy);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPasswordInput.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordSuccess(true);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  // Open Worker Modal (Add or Edit)
  const openWorkerModal = (worker?: Worker) => {
    setWorkerError(null);
    if (worker) {
      setEditingWorker(worker);
      setWorkerNameInput(worker.worker_name);
      setDeptInput(worker.department);
      setEmpIdInput(worker.employee_id || '');
      setWorkerStatusInput(worker.status);
    } else {
      setEditingWorker(null);
      setWorkerNameInput('');
      setDeptInput('');
      setEmpIdInput('');
      setWorkerStatusInput('active');
    }
    setWorkerModalOpen(true);
  };

  // Save Worker
  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWorker(true);
    setWorkerError(null);
    try {
      const res = editingWorker
        ? await fetch('/api/admin/workers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingWorker.id,
              worker_name: workerNameInput,
              department: deptInput,
              employee_id: empIdInput,
              status: workerStatusInput,
            }),
          })
        : await fetch('/api/admin/workers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              worker_name: workerNameInput,
              department: deptInput,
              employee_id: empIdInput,
            }),
          });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save worker');
      }

      setWorkerModalOpen(false);
      loadDashboardData();
    } catch (err: any) {
      console.error('Save worker error:', err);
      setWorkerError(err.message || 'Failed to save worker');
    } finally {
      setSavingWorker(false);
    }
  };

  // Delete Worker
  const confirmDeleteWorker = (worker: Worker) => {
    setWorkerToDelete(worker);
    setDeleteModalOpen(true);
  };

  const handleDeleteWorker = async () => {
    if (!workerToDelete) return;
    setDeletingWorker(true);
    try {
      const res = await fetch(`/api/admin/workers?id=${workerToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete worker');
      }
      setDeleteModalOpen(false);
      setWorkerToDelete(null);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete worker');
    } finally {
      setDeletingWorker(false);
    }
  };

  // Open Attendance Detail Modal
  const openDetailModal = async (overview: WorkerSubmissionOverview) => {
    setSelectedOverview(overview);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    setCorrectionReason('');
    try {
      const res = await fetch(
        `/api/admin/attendance?workerId=${overview.worker.id}&month=${selectedMonth}&year=${selectedYear}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      setAttendanceDays(data.days || []);
    } catch (err) {
      console.error('Failed to load worker attendance:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Save Attendance Correction
  const handleSaveCorrection = async () => {
    if (!selectedOverview) return;
    setSavingAttendance(true);
    try {
      await fetch('/api/admin/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: selectedOverview.worker.id,
          month: selectedMonth,
          year: selectedYear,
          days: attendanceDays,
          reason: correctionReason || 'Admin correction',
        }),
      });
      setDetailModalOpen(false);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to save correction:', err);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Reopen submission
  const handleReopenSubmission = async (workerId: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await fetch(
        `/api/admin/attendance?workerId=${workerId}&month=${selectedMonth}&year=${selectedYear}`,
        { method: 'DELETE' }
      );
      if (detailModalOpen) setDetailModalOpen(false);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to reopen submission:', err);
    }
  };

  // Filtered list
  const departments = Array.from(new Set(overviews.map((o) => o.worker.department))).filter(Boolean);

  const filteredOverviews = overviews.filter((item) => {
    const matchesSearch =
      item.worker.worker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.worker.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || item.worker.department === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <>
      <Navbar isAdmin={true} onLogout={handleLogout} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Header & Period Control */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              {t('adminDashboard')}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Monthly review, verification, and employee attendance configuration
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Month & Year Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-white border border-border text-ink rounded-xl px-3 py-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {MONTH_NAMES[lang].map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-white border border-border text-ink rounded-xl px-3 py-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadDashboardData}
              title={t('refresh')}
              className="inline-flex items-center px-3 py-2 rounded-xl bg-white border border-border text-xs font-medium text-ink hover:bg-gray-50 shadow-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>

            {/* Change Password Button */}
            <button
              onClick={() => {
                setPasswordError(null);
                setPasswordSuccess(false);
                setPasswordModalOpen(true);
              }}
              title="Change Password"
              className="inline-flex items-center px-3 py-2 rounded-xl bg-white border border-border text-xs font-medium text-ink hover:bg-gray-50 shadow-sm transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5 text-primary" />
              <span>Password</span>
            </button>
          </div>
        </div>

        {/* ── Submission Link Place & Lock Control Card ── */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  stats?.isLinkLocked
                    ? 'bg-red-50 text-danger border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {stats?.isLinkLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider block text-muted">
                  Employee Submission Link Status
                </span>
                <span className="text-base font-bold text-ink block">
                  {stats?.isLinkLocked ? t('linkIsLocked') : t('linkIsUnlocked')}
                </span>
              </div>
            </div>

            {/* Lock/Unlock Toggle Button */}
            <button
              onClick={() => setLockModalOpen(true)}
              className={`w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                stats?.isLinkLocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {stats?.isLinkLocked ? (
                <>
                  <Unlock className="w-4 h-4 mr-1.5" />
                  {t('unlockLink')}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-1.5" />
                  {t('lockLink')}
                </>
              )}
            </button>
          </div>

          {/* Submission URL Config & Copy Bar */}
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0 flex items-center space-x-2 bg-gray-50 border border-border rounded-xl px-3 py-2 text-xs">
              <LinkIcon className="w-4 h-4 text-muted flex-shrink-0" />
              {editingUrl ? (
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://your-domain.com"
                  className="w-full bg-white border border-border rounded px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <span className="font-mono text-ink truncate select-all">
                  {submissionUrl || 'https://...'}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {editingUrl ? (
                <>
                  <button
                    onClick={handleSaveUrl}
                    disabled={savingUrl}
                    className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    {savingUrl ? 'Saving...' : 'Save URL'}
                  </button>
                  <button
                    onClick={() => {
                      setUrlInput(submissionUrl);
                      setEditingUrl(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-gray-100 text-muted hover:text-ink text-xs font-medium"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditingUrl(true)}
                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-ink text-xs font-medium transition-colors"
                  >
                    Edit URL
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                      copiedUrl
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary hover:bg-primary-hover text-white'
                    }`}
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy Link
                      </>
                    )}
                  </button>
                  <a
                    href={submissionUrl || '/'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-muted hover:text-ink transition-colors"
                    title="Open Submission Form in New Tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overview Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Active Workers */}
            <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">{t('totalWorkers')}</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-2xl font-bold text-ink">{stats.totalActiveWorkers}</span>
            </div>

            {/* Completed */}
            <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">{t('completedCount')}</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-emerald-600">{stats.completedSubmissions}</span>
            </div>

            {/* Pending */}
            <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">{t('pendingCount')}</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-amber-600">{stats.pendingSubmissions}</span>
            </div>

            {/* Incomplete */}
            <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">{t('incompleteCount')}</span>
                <AlertTriangle className="w-4 h-4 text-danger" />
              </div>
              <span className="text-2xl font-bold text-danger">{stats.incompleteSubmissions}</span>
            </div>

            {/* Completion Rate */}
            <div className="bg-white p-4 rounded-2xl border border-border shadow-sm col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">{t('completionRate')}</span>
                <span className="text-xs font-bold text-primary">{stats.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Employee Record Table & Top Action Bar ── */}
        <div className="space-y-3">
          {/* Action Bar at the top of Employee Table */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchWorker')}
                  className="w-full bg-gray-50 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-ink placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Search className="w-4 h-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
              </div>

              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-gray-50 border border-border text-ink rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">{t('filterDepartment')}</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-border text-ink rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">{t('filterStatus')}</option>
                <option value="Completed">{t('Completed')}</option>
                <option value="Pending">{t('Pending')}</option>
                <option value="Incomplete">{t('Incomplete')}</option>
              </select>
            </div>

            {/* Buttons: Add Employee & Export .xlsx MOVED HERE */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                onClick={() => openWorkerModal()}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {t('addWorker')}
              </button>

              <a
                href={`/api/admin/export/excel?month=${selectedMonth}&year=${selectedYear}`}
                download
                className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                {t('exportExcel')}
              </a>
            </div>
          </div>

          {/* Workers & Submissions Table */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="employee-table w-full text-left text-xs">
                <thead className="bg-[#fbfdfc] border-b border-border text-muted font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">{t('employee')}</th>
                    <th className="py-3.5 px-4">{t('department')}</th>
                    <th className="py-3.5 px-4">{t('status')}</th>
                    <th className="py-3.5 px-4 text-center">{t('daysPresent')}</th>
                    <th className="py-3.5 px-4 text-center">{t('daysOff')}</th>
                    <th className="py-3.5 px-5 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOverviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted">
                        No employee records found.
                      </td>
                    </tr>
                  ) : (
                    filteredOverviews.map((item) => (
                      <tr key={item.worker.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Name & Badge */}
                        <td className="py-3.5 px-5 font-semibold text-ink">
                          <div className="flex items-center space-x-2">
                            <span>{item.worker.worker_name}</span>
                            {item.worker.status === 'inactive' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-normal">
                                Inactive
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Department */}
                        <td data-label={t('department')} className="py-3.5 px-4 text-muted">{item.worker.department}</td>

                        {/* Submission Status */}
                        <td data-label={t('status')} className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              item.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'Incomplete'
                                ? 'bg-red-50 text-danger border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {t(item.status)}
                          </span>
                        </td>

                        {/* Counts (Present & Off Day only) */}
                        <td data-label={t('daysPresent')} className="py-3.5 px-4 text-center font-medium text-emerald-700">
                          {item.status === 'Pending' ? '-' : item.presentDays}
                        </td>
                        <td data-label={t('daysOff')} className="py-3.5 px-4 text-center font-medium text-muted">
                          {item.status === 'Pending' ? '-' : item.offDays}
                        </td>

                        {/* Actions (View, Edit, Reopen, Delete) */}
                        <td data-label={t('actions')} className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => openDetailModal(item)}
                              title={t('viewDetails')}
                              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-gray-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openWorkerModal(item.worker)}
                              title={t('editWorker')}
                              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-gray-100 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {item.submission && (
                              <button
                                onClick={() => handleReopenSubmission(item.worker.id)}
                                title={t('reopenSubmission')}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => confirmDeleteWorker(item.worker)}
                              title="Delete Employee"
                              className="p-1.5 rounded-lg text-danger hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ── Change Password Modal ── */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-border animate-in fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-ink">Change Admin Password</h3>
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-danger px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Current Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-border rounded-xl px-3.5 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  New Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-gray-50 border border-border rounded-xl px-3.5 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Confirm New Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-gray-50 border border-border rounded-xl px-3.5 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink bg-gray-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm disabled:opacity-50"
                >
                  {savingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lock/Unlock Confirmation Modal ── */}
      {lockModalOpen && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-border animate-in fade-in">
            <h3 className="text-lg font-bold text-ink mb-2">
              {stats.isLinkLocked ? t('unlockConfirmTitle') : t('lockConfirmTitle')}
            </h3>
            <p className="text-xs text-muted mb-6">
              {stats.isLinkLocked ? t('unlockConfirmDesc') : t('lockConfirmDesc')}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink bg-gray-100 rounded-xl"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleToggleLock}
                disabled={togglingLock}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm ${
                  stats.isLinkLocked
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {togglingLock ? 'Updating...' : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Worker Delete Confirmation Modal ── */}
      {deleteModalOpen && workerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-border animate-in fade-in">
            <div className="flex items-center space-x-3 text-danger mb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-ink">Delete Employee?</h3>
            </div>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              Are you sure you want to delete <strong>{workerToDelete.worker_name}</strong> ({workerToDelete.department})?
              This will permanently delete the employee and all their attendance history.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setWorkerToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink bg-gray-100 rounded-xl"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteWorker}
                disabled={deletingWorker}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50"
              >
                {deletingWorker ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Worker Add / Edit Modal ── */}
      {workerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-border animate-in fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink">
                {editingWorker ? t('editWorker') : t('addWorker')}
              </h3>
              <button
                onClick={() => setWorkerModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {workerError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-danger px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{workerError}</span>
              </div>
            )}

            <form onSubmit={handleSaveWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  {t('workerName')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={workerNameInput}
                  onChange={(e) => setWorkerNameInput(e.target.value)}
                  placeholder="e.g. Ahmad bin Zulkifli"
                  className="w-full bg-gray-50 border border-border rounded-xl px-3.5 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  {t('department')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value)}
                  placeholder="e.g. Operations"
                  className="w-full bg-gray-50 border border-border rounded-xl px-3.5 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Employee ID (Optional)
                </label>
                <input
                  type="text"
                  value={empIdInput}
                  onChange={(e) => setEmpIdInput(e.target.value)}
                  placeholder="e.g. EMP001"
                  className="w-full bg-gray-50 border border-border rounded-xl px-3.5 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {editingWorker && (
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    {t('status')}
                  </label>
                  <select
                    value={workerStatusInput}
                    onChange={(e) => setWorkerStatusInput(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-gray-50 border border-border rounded-xl px-3.5 py-2 text-xs text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">{t('Active')}</option>
                    <option value="inactive">{t('Inactive')}</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setWorkerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink bg-gray-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingWorker}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm disabled:opacity-50"
                >
                  {savingWorker ? t('saving') : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Monthly Attendance Review & Correction Modal (2 OPTIONS ONLY) ── */}
      {detailModalOpen && selectedOverview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[calc(100dvh-2rem)] flex flex-col shadow-2xl border border-border animate-in fade-in">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between bg-[#fbfdfc] rounded-t-3xl">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  {selectedOverview.worker.worker_name}
                </h3>
                <p className="text-xs text-muted">
                  {selectedOverview.worker.department} · {MONTH_NAMES[lang][selectedMonth - 1]}{' '}
                  {selectedYear}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`/api/admin/export/excel?month=${selectedMonth}&year=${selectedYear}&workerId=${selectedOverview.worker.id}`}
                  download
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                  Excel
                </a>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 rounded-lg text-muted hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Days Table List (PRESENT and OFF DAY ONLY) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-2">
              {loadingDetail ? (
                <div className="text-center py-12 text-muted">Loading attendance...</div>
              ) : attendanceDays.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  No attendance submitted yet for this month.
                </div>
              ) : (
                <div className="space-y-2">
                  {attendanceDays.map((d, index) => {
                    const dayIdx = getDayOfWeekIndex(d.attendance_date);
                    const dayName = DAY_NAMES[lang][dayIdx];
                    const isPresent = d.attendance_status === 'Present';

                    return (
                      <div
                        key={d.attendance_date}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[100px_140px_220px_minmax(0,1fr)] lg:items-center p-3 rounded-xl border border-border bg-gray-50/50 hover:bg-gray-50 gap-2 text-xs"
                      >
                        <div className="min-w-0 flex items-center space-x-2">
                          <span className="font-bold text-ink">{d.attendance_date.slice(8, 10)}</span>
                          <span className="text-muted">({dayName})</span>
                        </div>

                        {/* Status Select: ONLY 2 OPTIONS */}
                        <div className="min-w-0">
                          <select
                            value={d.attendance_status}
                            onChange={(e) => {
                              const next = [...attendanceDays];
                              const newStatus = e.target.value as AttendanceStatus;
                              next[index] = {
                                ...next[index],
                                attendance_status: newStatus,
                                time_arrive: newStatus === 'Present' ? (next[index].time_arrive || '08:00') : null,
                                time_leave: newStatus === 'Present' ? (next[index].time_leave || '17:00') : null,
                              };
                              setAttendanceDays(next);
                            }}
                            className={`w-full text-xs font-medium rounded-lg px-2.5 py-1.5 border transition-all ${
                              isPresent
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            <option value="Present">{t('Present')}</option>
                            <option value="Off Day">{t('Off Day')}</option>
                          </select>
                        </div>

                        {isPresent ? (
                          <div className="flex items-center space-x-2 min-w-0">
                            <input
                              type="time"
                              value={d.time_arrive?.slice(0, 5) || ''}
                              onChange={(e) => {
                                const next = [...attendanceDays];
                                next[index] = { ...next[index], time_arrive: e.target.value };
                                setAttendanceDays(next);
                              }}
                              className="w-full min-w-0 bg-white border border-border rounded-lg px-2 py-1 text-ink"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={d.time_leave?.slice(0, 5) || ''}
                              onChange={(e) => {
                                const next = [...attendanceDays];
                                next[index] = { ...next[index], time_leave: e.target.value };
                                setAttendanceDays(next);
                              }}
                              className="w-full min-w-0 bg-white border border-border rounded-lg px-2 py-1 text-ink"
                            />
                          </div>
                        ) : (
                          <div className="min-w-0 text-muted italic">-</div>
                        )}

                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            placeholder="Remarks"
                            value={d.keterangan || ''}
                            onChange={(e) => {
                              const next = [...attendanceDays];
                              next[index] = { ...next[index], keterangan: e.target.value };
                              setAttendanceDays(next);
                            }}
                            className="w-full bg-white border border-border rounded-lg px-2 py-1 text-ink"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer with Correction Reason and Actions */}
            <div className="p-4 sm:p-5 border-t border-border bg-[#fbfdfc] rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Reason for correction (audit log)..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full text-xs bg-white border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {selectedOverview.submission && (
                  <button
                    onClick={() => handleReopenSubmission(selectedOverview.worker.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-danger hover:bg-red-50 rounded-xl transition-colors"
                  >
                    {t('reopenSubmission')}
                  </button>
                )}
                <button
                  onClick={handleSaveCorrection}
                  disabled={savingAttendance || attendanceDays.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-colors disabled:opacity-50 inline-flex items-center"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {savingAttendance ? t('saving') : t('saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
