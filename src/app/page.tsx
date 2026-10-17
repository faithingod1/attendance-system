'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { MONTH_NAMES, DAY_NAMES } from '@/lib/translations';
import {
  getDaysInMonth,
  formatDateISO,
  getDayOfWeekIndex,
  isWeekend,
} from '@/lib/date-utils';
import { AttendanceDay, AttendanceStatus } from '@/lib/types';
import {
  Lock,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Send,
  User,
  RotateCcw,
  Info,
} from 'lucide-react';

export default function WorkerAttendancePage() {
  const { lang, t } = useLanguage();

  // ─── Bootstrap state ────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [workers, setWorkers] = useState<Array<{ id: string; worker_name: string; department: string }>>([]);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  // ─── Form selection state (all start EMPTY) ─────────────────────────
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(0);   // 0 = not chosen
  const [selectedYear, setSelectedYear] = useState<number>(0);     // 0 = not chosen

  // ─── Attendance data ─────────────────────────────────────────────────
  const [days, setDays] = useState<AttendanceDay[]>([]);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // ─── UI state ────────────────────────────────────────────────────────
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────
  const formReady = selectedWorkerId !== '' && selectedMonth !== 0 && selectedYear !== 0;
  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
  const availableYears = [2026, 2027, 2028];

  // ── 1. Bootstrap: fetch lock status + active workers ─────────────────
  useEffect(() => {
    async function loadBootstrap() {
      setLoading(true);
      setBootstrapError(null);
      try {
        const res = await fetch('/api/public/bootstrap', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load attendance system');
        }
        if (data.isLocked) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
          setWorkers(data.workers || []);
        }
      } catch (err: any) {
        setBootstrapError(err.message || 'Failed to connect to the attendance service.');
      } finally {
        setLoading(false);
      }
    }
    loadBootstrap();
  }, []);

  // ── 2. Generate blank day grid + load existing records when selection is complete ──
  useEffect(() => {
    // Don't do anything until the form is fully selected
    if (!formReady) {
      setDays([]);
      setHasExistingSubmission(false);
      return;
    }

    const totalDays = getDaysInMonth(selectedYear, selectedMonth);

    // Build a default blank grid (all Off Day, no times)
    const blankGrid: AttendanceDay[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = formatDateISO(selectedYear, selectedMonth, day);
      blankGrid.push({
        worker_id: selectedWorkerId,
        attendance_date: dateStr,
        month: selectedMonth,
        year: selectedYear,
        attendance_status: 'Off Day',
        time_arrive: null,
        time_leave: null,
        keterangan: '',
      });
    }

    // Fetch existing records from the server (to pre-fill if already submitted)
    async function fetchExisting() {
      setLoadingAttendance(true);
      setErrorMsg(null);
      setHasExistingSubmission(false);
      try {
        const res = await fetch(
          `/api/public/attendance?workerId=${selectedWorkerId}&month=${selectedMonth}&year=${selectedYear}`,
          { cache: 'no-store' }
        );

        if (res.status === 403) {
          // Link got locked between bootstrap and now
          setIsLocked(true);
          setDays([]);
          return;
        }

        const data = await res.json();

        if (res.ok && data.days && data.days.length > 0) {
          // Map server records onto the full blank grid so every date is represented
          const serverMap = new Map<string, any>();
          data.days.forEach((d: any) => serverMap.set(d.attendance_date, d));

          const merged = blankGrid.map((blankDay) => {
            const existing = serverMap.get(blankDay.attendance_date);
            if (existing) {
              return {
                ...blankDay,
                attendance_status: existing.attendance_status as AttendanceStatus,
                time_arrive: existing.time_arrive ? existing.time_arrive.slice(0, 5) : null,
                time_leave: existing.time_leave ? existing.time_leave.slice(0, 5) : null,
                keterangan: existing.keterangan || '',
              };
            }
            return blankDay;
          });

          setDays(merged);
          setHasExistingSubmission(data.hasSubmission === true);
        } else {
          // No previous records — show the blank grid
          setDays(blankGrid);
        }
      } catch (err) {
        // Network failure — show blank grid so the worker can still fill in
        setDays(blankGrid);
      } finally {
        setLoadingAttendance(false);
      }
    }

    fetchExisting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkerId, selectedMonth, selectedYear]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const updateDay = (index: number, field: keyof AttendanceDay, value: any) => {
    setDays((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };

      if (field === 'attendance_status') {
        if (value === 'Present') {
          if (!target.time_arrive) target.time_arrive = '09:00';
          if (!target.time_leave) target.time_leave = '18:00';
        } else {
          target.time_arrive = null;
          target.time_leave = null;
        }
      }

      next[index] = target;
      return next;
    });
  };

  const handleSetStandardHours = () => {
    setDays((prev) =>
      prev.map((d) =>
        d.attendance_status === 'Present'
          ? { ...d, time_arrive: '09:00', time_leave: '18:00' }
          : d
      )
    );
  };

  const handleMarkWeekdaysPresent = () => {
    setDays((prev) =>
      prev.map((d) => {
        const wknd = isWeekend(d.attendance_date);
        return {
          ...d,
          attendance_status: (wknd ? 'Off Day' : 'Present') as AttendanceStatus,
          time_arrive: wknd ? null : '09:00',
          time_leave: wknd ? null : '18:00',
        };
      })
    );
  };

  const validateAndOpenConfirm = () => {
    if (!selectedWorkerId) {
      setErrorMsg(t('workerRequired'));
      return;
    }

    for (const d of days) {
      if (d.attendance_status === 'Present') {
        if (!d.time_arrive || !d.time_leave) {
          setErrorMsg(`${t('missingTimesError')} (${d.attendance_date})`);
          return;
        }
      }
    }

    setErrorMsg(null);
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/public/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: selectedWorkerId,
          month: selectedMonth,
          year: selectedYear,
          days,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('serverError'));
      }

      setShowConfirmModal(false);
      setSubmittedSuccessfully(true);
    } catch (err: any) {
      setErrorMsg(err.message || t('serverError'));
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Summary counts ────────────────────────────────────────────────────
  const presentCount = days.filter((d) => d.attendance_status === 'Present').length;
  const offCount = days.filter((d) => d.attendance_status === 'Off Day').length;
  const leaveCount = days.length - presentCount - offCount;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-muted">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
            <p className="text-sm">Loading attendance system...</p>
          </div>
        )}

        {/* ── Bootstrap Error ── */}
        {!loading && bootstrapError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-danger mx-auto mb-4" />
            <p className="text-sm text-danger font-medium">{bootstrapError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Link Locked Notice ── */}
        {!loading && !bootstrapError && isLocked && (
          <div className="bg-white border border-red-200 rounded-2xl p-8 sm:p-12 text-center shadow-sm max-w-xl mx-auto my-12">
            <div className="w-16 h-16 bg-red-50 text-danger rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink mb-3">
              {t('linkLockedTitle')}
            </h2>
            <p className="text-muted leading-relaxed text-sm sm:text-base">
              {t('linkLockedAlert')}
            </p>
          </div>
        )}

        {/* ── Success Screen ── */}
        {!loading && !bootstrapError && !isLocked && submittedSuccessfully && (
          <div className="bg-white border border-[#c5dbcc] rounded-2xl p-8 sm:p-12 text-center shadow-sm max-w-lg mx-auto my-12">
            <div className="w-16 h-16 bg-soft text-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink mb-2">
              {t('submissionSuccessful')}
            </h2>
            <p className="text-muted text-sm sm:text-base mb-6">
              {t('submissionSuccessMsg')}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-xs sm:text-sm text-left border border-gray-100 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted">{t('employee')}:</span>
                <span className="font-semibold text-ink">{selectedWorker?.worker_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('month')}:</span>
                <span className="font-semibold text-ink">
                  {MONTH_NAMES[lang][selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('daysPresent')}:</span>
                <span className="font-semibold text-primary">{presentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('daysOff')}:</span>
                <span className="font-semibold text-muted">{offCount}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubmittedSuccessfully(false);
                setSelectedWorkerId('');
                setSelectedMonth(0);
                setSelectedYear(0);
                setDays([]);
              }}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('submitAnother')}
            </button>
          </div>
        )}

        {/* ── Main Attendance Form ── */}
        {!loading && !bootstrapError && !isLocked && !submittedSuccessfully && (
          <div className="space-y-6">

            {/* ── Selection Card ── */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-border shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Employee Select */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    {t('employee')} <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => {
                        setSelectedWorkerId(e.target.value);
                        setErrorMsg(null);
                      }}
                      className="w-full appearance-none bg-gray-50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all pr-10"
                    >
                      <option value="">{t('selectEmployee')}</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.worker_name}
                        </option>
                      ))}
                    </select>
                    <User className="w-4 h-4 text-muted absolute right-3 top-3 pointer-events-none" />
                  </div>
                  {selectedWorker && (
                    <p className="text-[11px] text-muted mt-1 pl-1">{selectedWorker.department}</p>
                  )}
                </div>

                {/* Month Select */}
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    {t('month')} <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(parseInt(e.target.value, 10));
                        setErrorMsg(null);
                      }}
                      className="w-full appearance-none bg-gray-50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all pr-10"
                    >
                      <option value={0}>-- {t('month')} --</option>
                      {MONTH_NAMES[lang].map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <Calendar className="w-4 h-4 text-muted absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Year Select */}
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    {t('year')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value, 10));
                      setErrorMsg(null);
                    }}
                    className="w-full bg-gray-50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  >
                    <option value={0}>-- {t('year')} --</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Fill Toolbar — only shown when form is ready */}
              {formReady && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMarkWeekdaysPresent}
                      className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg bg-soft text-primary hover:bg-[#d8e9dc] transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {t('markWeekdaysPresent')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSetStandardHours}
                      className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-ink hover:bg-gray-200 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-muted" />
                      {t('fillStandardHours')}
                    </button>
                  </div>

                  <div className="text-xs text-muted font-medium">
                    {presentCount} {t('Present')} · {offCount} {t('Off Day')}
                  </div>
                </div>
              )}
            </div>

            {/* ── Prompt when selection is incomplete ── */}
            {!formReady && (
              <div className="bg-white rounded-2xl p-8 border border-dashed border-border text-center text-muted">
                <Info className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">
                  {lang === 'ms'
                    ? 'Sila pilih nama, bulan, dan tahun anda untuk memaparkan borang kehadiran.'
                    : 'Please select your name, month, and year above to load the attendance form.'}
                </p>
              </div>
            )}

            {/* ── Existing Submission Notice ── */}
            {formReady && hasExistingSubmission && !loadingAttendance && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs flex items-start space-x-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  {lang === 'ms'
                    ? 'Anda telah menghantar kehadiran untuk bulan ini. Rekod lama anda telah dimuatkan. Anda boleh mengemaskini dan hantar semula.'
                    : 'You have already submitted attendance for this month. Your previous records are pre-loaded below — you can update and resubmit.'}
                </span>
              </div>
            )}

            {/* ── Error Banner ── */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-xl text-sm flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ── Attendance Days Table ── */}
            {formReady && (
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-[#fbfdfc] flex items-center justify-between">
                  <h3 className="font-bold text-ink text-sm sm:text-base">
                    {MONTH_NAMES[lang][selectedMonth - 1]} {selectedYear}
                    {days.length > 0 && <span className="text-muted font-normal ml-2 text-xs">({days.length} {t('totalDays')})</span>}
                  </h3>
                  {loadingAttendance && (
                    <span className="text-xs text-primary font-medium animate-pulse flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1.5" />
                      Loading records...
                    </span>
                  )}
                </div>

                {/* Column headers — desktop only */}
                <div className="hidden sm:grid grid-cols-[180px_180px_280px_1fr] gap-2 px-6 py-2 bg-gray-50 border-b border-border text-[10px] font-semibold text-muted uppercase tracking-wider">
                  <span>{t('date')} / {t('day')}</span>
                  <span>{t('status')}</span>
                  <span>{t('timeArrive')} — {t('timeLeave')}</span>
                  <span>{t('remarks')}</span>
                </div>

                <div className="divide-y divide-border">
                  {days.map((d, index) => {
                    const dayIdx = getDayOfWeekIndex(d.attendance_date);
                    const dayName = DAY_NAMES[lang][dayIdx];
                    const weekend = isWeekend(d.attendance_date);
                    const isPresent = d.attendance_status === 'Present';

                    return (
                      <div
                        key={d.attendance_date}
                        className={`p-4 sm:px-6 transition-colors ${
                          weekend ? 'bg-gray-50/70' : 'bg-white hover:bg-gray-50/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                          {/* Date & Day */}
                          <div className="flex items-center space-x-3 sm:w-44 flex-shrink-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs ${
                                weekend
                                  ? 'bg-gray-200 text-gray-600'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {d.attendance_date.slice(8, 10)}
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-ink">{dayName}</span>
                              <span className="block text-[11px] text-muted">{d.attendance_date}</span>
                            </div>
                          </div>

                          {/* Status Select */}
                          <div className="sm:w-44 flex-shrink-0">
                            <select
                              value={d.attendance_status}
                              onChange={(e) =>
                                updateDay(index, 'attendance_status', e.target.value as AttendanceStatus)
                              }
                              className={`w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 border transition-all focus:outline-none focus:ring-1 ${
                                isPresent
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 focus:ring-emerald-500'
                                  : d.attendance_status === 'Off Day'
                                  ? 'bg-gray-100 text-gray-700 border-gray-300 focus:ring-gray-400'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-400'
                              }`}
                            >
                              <option value="Present">{t('Present')}</option>
                              <option value="Off Day">{t('Off Day')}</option>
                            </select>
                          </div>

                          {/* Time In & Time Out */}
                          {isPresent ? (
                            <div className="flex items-center space-x-2 sm:w-64 flex-shrink-0">
                              <div className="flex-1">
                                <label className="block text-[10px] text-muted font-medium mb-0.5 sm:hidden">
                                  {t('timeArrive')}
                                </label>
                                <input
                                  type="time"
                                  value={d.time_arrive || ''}
                                  onChange={(e) => updateDay(index, 'time_arrive', e.target.value)}
                                  className="w-full text-xs bg-gray-50 border border-border rounded-lg px-2 py-1.5 text-ink font-mono focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                              </div>
                              <span className="text-muted text-xs">—</span>
                              <div className="flex-1">
                                <label className="block text-[10px] text-muted font-medium mb-0.5 sm:hidden">
                                  {t('timeLeave')}
                                </label>
                                <input
                                  type="time"
                                  value={d.time_leave || ''}
                                  onChange={(e) => updateDay(index, 'time_leave', e.target.value)}
                                  className="w-full text-xs bg-gray-50 border border-border rounded-lg px-2 py-1.5 text-ink font-mono focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="hidden sm:flex sm:w-64 items-center justify-center text-xs text-gray-300 italic">
                              —
                            </div>
                          )}

                          {/* Remarks */}
                          <div className="flex-1 min-w-[120px]">
                            <input
                              type="text"
                              placeholder={t('optionalRemarks')}
                              value={d.keterangan || ''}
                              onChange={(e) => updateDay(index, 'keterangan', e.target.value)}
                              className="w-full text-xs bg-transparent border-b border-dashed border-gray-300 hover:border-gray-400 focus:border-primary focus:outline-none py-1 text-ink placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Submit Action Bar — only shown when form is ready ── */}
            {formReady && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
                <div className="text-xs sm:text-sm text-ink font-medium">
                  <span className="text-muted">Submitting: </span>
                  <strong className="text-primary">{selectedWorker?.worker_name}</strong>
                  <span className="text-muted ml-2">
                    {MONTH_NAMES[lang][selectedMonth - 1]} {selectedYear}
                  </span>
                  {hasExistingSubmission && (
                    <span className="ml-2 text-amber-600 text-[11px]">(update)</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={validateAndOpenConfirm}
                  disabled={submitting || loadingAttendance}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {hasExistingSubmission ? 'Update Attendance' : t('submit')}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border">
            <h3 className="text-lg font-bold text-ink mb-1">
              {t('confirmSubmitTitle')}
            </h3>
            <p className="text-xs text-muted mb-5">{t('confirmSubmitMsg')}</p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs border border-gray-100 mb-6">
              <div className="flex justify-between">
                <span className="text-muted">{t('employee')}:</span>
                <span className="font-semibold text-ink">{selectedWorker?.worker_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('department')}:</span>
                <span className="font-semibold text-ink">{selectedWorker?.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('month')}:</span>
                <span className="font-semibold text-ink">
                  {MONTH_NAMES[lang][selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <div className="pt-1 border-t border-gray-100 flex justify-between">
                <span className="text-muted">{t('daysPresent')}:</span>
                <span className="font-semibold text-primary">{presentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('daysOff')}:</span>
                <span className="font-semibold text-muted">{offCount}</span>
              </div>
            </div>

            {hasExistingSubmission && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                {lang === 'ms'
                  ? 'Ini akan menggantikan rekod yang telah anda hantar sebelum ini.'
                  : 'This will replace your previously submitted records for this month.'}
              </p>
            )}

            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? t('submitting') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
