'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { MONTH_NAMES, DAY_NAMES } from '@/lib/translations';
import { getCurrentYearMonthInKL, getDayOfWeekIndex, isWeekend } from '@/lib/date-utils';
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
  Printer,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  RotateCcw,
  UserCheck,
  UserX,
  X,
  Save,
  Trash2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
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

  // Modals state
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);

  // Worker Modal state
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerNameInput, setWorkerNameInput] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [empIdInput, setEmpIdInput] = useState('');
  const [workerStatusInput, setWorkerStatusInput] = useState<'active' | 'inactive'>('active');
  const [savingWorker, setSavingWorker] = useState(false);

  // Attendance Detail & Correction Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOverview, setSelectedOverview] = useState<WorkerSubmissionOverview | null>(null);
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [correctionReason, setCorrectionReason] = useState('');
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch Dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/dashboard?month=${selectedMonth}&year=${selectedYear}`
      );
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setOverviews(data.workerOverviews || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth, selectedYear]);

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
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

  // Open Worker Modal (Add or Edit)
  const openWorkerModal = (worker?: Worker) => {
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
    try {
      if (editingWorker) {
        await fetch('/api/admin/workers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingWorker.id,
            worker_name: workerNameInput,
            department: deptInput,
            employee_id: empIdInput,
            status: workerStatusInput,
          }),
        });
      } else {
        await fetch('/api/admin/workers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worker_name: workerNameInput,
            department: deptInput,
            employee_id: empIdInput,
          }),
        });
      }
      setWorkerModalOpen(false);
      loadDashboardData();
    } catch (err) {
      console.error('Save worker error:', err);
    } finally {
      setSavingWorker(false);
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
        `/api/admin/attendance?workerId=${overview.worker.id}&month=${selectedMonth}&year=${selectedYear}`
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
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center px-3 py-2 rounded-xl bg-white border border-border text-xs font-medium text-ink hover:bg-gray-50 shadow-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
          </div>
        </div>

        {/* Link Lock & Quick Actions Banner */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                Public Worker Link Status
              </span>
              <span className="text-base font-bold text-ink block">
                {stats?.isLinkLocked ? t('linkIsLocked') : t('linkIsUnlocked')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Lock/Unlock Toggle */}
            <button
              onClick={() => setLockModalOpen(true)}
              className={`flex-1 md:flex-initial inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                stats?.isLinkLocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {stats?.isLinkLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 mr-1.5" />
                  {t('unlockLink')}
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  {t('lockLink')}
                </>
              )}
            </button>

            {/* Add Worker Button */}
            <button
              onClick={() => openWorkerModal()}
              className="flex-1 md:flex-initial inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {t('addWorker')}
            </button>

            {/* Export Excel Button */}
            <a
              href={`/api/admin/export/excel?month=${selectedMonth}&year=${selectedYear}`}
              download
              className="flex-1 md:flex-initial inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              {t('exportExcel')}
            </a>
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

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchWorker')}
              className="w-full bg-gray-50 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-ink placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
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
        </div>

        {/* Workers & Submissions Table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fbfdfc] border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">{t('employee')}</th>
                  <th className="py-3.5 px-4">{t('department')}</th>
                  <th className="py-3.5 px-4">{t('status')}</th>
                  <th className="py-3.5 px-4 text-center">{t('daysPresent')}</th>
                  <th className="py-3.5 px-4 text-center">{t('daysOff')}</th>
                  <th className="py-3.5 px-4 text-center">{t('daysLeave')}</th>
                  <th className="py-3.5 px-5 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOverviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted">
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
                      <td className="py-3.5 px-4 text-muted">{item.worker.department}</td>

                      {/* Submission Status */}
                      <td className="py-3.5 px-4">
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

                      {/* Counts */}
                      <td className="py-3.5 px-4 text-center font-medium text-emerald-700">
                        {item.status === 'Pending' ? '-' : item.presentDays}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-muted">
                        {item.status === 'Pending' ? '-' : item.offDays}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-amber-700">
                        {item.status === 'Pending' ? '-' : item.leaveDays}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
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
                              className="p-1.5 rounded-lg text-danger hover:bg-red-50 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Lock/Unlock Confirmation Modal */}
      {lockModalOpen && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-in fade-in">
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

      {/* Worker Add / Edit Modal */}
      {workerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-in fade-in">
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

      {/* Monthly Attendance Review & Correction Modal */}
      {detailModalOpen && selectedOverview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border animate-in fade-in">
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

            {/* Days Table List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
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
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border bg-gray-50/50 hover:bg-gray-50 gap-2 text-xs"
                      >
                        <div className="sm:w-36 flex items-center space-x-2">
                          <span className="font-bold text-ink">{d.attendance_date.slice(8, 10)}</span>
                          <span className="text-muted">({dayName})</span>
                        </div>

                        <div className="sm:w-44">
                          <select
                            value={d.attendance_status}
                            onChange={(e) => {
                              const next = [...attendanceDays];
                              next[index] = {
                                ...next[index],
                                attendance_status: e.target.value as AttendanceStatus,
                              };
                              setAttendanceDays(next);
                            }}
                            className="w-full text-xs font-medium rounded-lg px-2 py-1 bg-white border border-border"
                          >
                            <option value="Present">{t('Present')}</option>
                            <option value="Off Day">{t('Off Day')}</option>
                            <option value="Sick Leave">{t('Sick Leave')}</option>
                            <option value="Emergency Leave">{t('Emergency Leave')}</option>
                            <option value="Public Holiday">{t('Public Holiday')}</option>
                            <option value="Others">{t('Others')}</option>
                          </select>
                        </div>

                        {isPresent ? (
                          <div className="flex items-center space-x-2 sm:w-56">
                            <input
                              type="time"
                              value={d.time_arrive?.slice(0, 5) || ''}
                              onChange={(e) => {
                                const next = [...attendanceDays];
                                next[index] = { ...next[index], time_arrive: e.target.value };
                                setAttendanceDays(next);
                              }}
                              className="w-24 bg-white border border-border rounded-lg px-2 py-1 text-ink"
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
                              className="w-24 bg-white border border-border rounded-lg px-2 py-1 text-ink"
                            />
                          </div>
                        ) : (
                          <div className="sm:w-56 text-muted italic">-</div>
                        )}

                        <div className="flex-1">
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

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
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
