export type WorkerStatus = 'active' | 'inactive';

export interface Worker {
  id: string;
  worker_name: string;
  employee_id?: string | null;
  department: string;
  status: WorkerStatus;
  created_at: string;
  updated_at?: string;
}

export type AttendanceStatus =
  | 'Present'
  | 'Off Day'
  | 'Sick Leave'
  | 'Emergency Leave'
  | 'Public Holiday'
  | 'Others';

export interface AttendanceDay {
  id?: string;
  worker_id: string;
  attendance_date: string; // YYYY-MM-DD
  month: number;
  year: number;
  attendance_status: AttendanceStatus;
  time_arrive: string | null; // HH:mm
  time_leave: string | null;  // HH:mm
  keterangan: string;
}

export type SubmissionStatus = 'Completed' | 'Incomplete' | 'Pending';

export interface Submission {
  id: string;
  worker_id: string;
  month: number;
  year: number;
  status: SubmissionStatus;
  submitted_at: string;
  updated_at: string;
}

export interface WorkerSubmissionOverview {
  worker: Worker;
  submission: Submission | null;
  status: SubmissionStatus;
  daysSubmitted: number;
  presentDays: number;
  offDays: number;
  leaveDays: number;
}

export interface DashboardStats {
  totalActiveWorkers: number;
  completedSubmissions: number;
  pendingSubmissions: number;
  incompleteSubmissions: number;
  completionRate: number;
  isLinkLocked: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor: string;
  details: Record<string, any> | null;
  created_at: string;
}
