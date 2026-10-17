export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function formatDateISO(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function getDayOfWeekIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function isWeekend(dateStr: string): boolean {
  const day = getDayOfWeekIndex(dateStr);
  return day === 0 || day === 6; // Sunday or Saturday
}

export function getCurrentYearMonthInKL(): { year: number; month: number } {
  // Asia/Kuala_Lumpur is UTC+8
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const klTime = new Date(utc + 8 * 3600000);
  return {
    year: klTime.getFullYear(),
    month: klTime.getMonth() + 1,
  };
}

export function formatTimeDisplay(timeStr: string | null): string {
  if (!timeStr) return '-';
  // If format is HH:mm:ss, strip seconds
  return timeStr.slice(0, 5);
}
