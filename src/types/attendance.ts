export type AttendanceStatus =
  | 'On Campus'
  | 'On Campus (Late)'
  | 'Completed'
  | 'Late'
  | 'Time Out Only';

export type EntrySource = 'RFID Tap' | 'Manual Entry';

export type RegistrationMode = 'rfid' | 'manual';

export type RemovalScope = 'full' | 'time_out' | 'time_in';

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  gradeSection: string;
  rfidUid: string | null;
  registrationMode: RegistrationMode;
  guardianContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentInternalId: string;
  date: string; // YYYY-MM-DD
  timeIn: string | null; // HH:mm
  timeOut: string | null; // HH:mm
  timeInSource: EntrySource | null;
  timeOutSource: EntrySource | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemovalAuditEntry {
  id: string;
  recordId: string;
  studentInternalId: string;
  studentId: string;
  studentName: string;
  gradeSection: string;
  date: string;
  scope: RemovalScope;
  removedTimeIn: string | null;
  removedTimeOut: string | null;
  reason: string;
  notes?: string;
  removedByEmail: string;
  removedAt: string;
}

export interface AuthStatus {
  authenticated: boolean;
  adminEmail: string | null;
  needsSetup: boolean;
  envManaged: boolean;
}

export interface OverviewPayload {
  students: Student[];
  records: AttendanceRecord[];
  removalCount: number;
  auditLogs?: RemovalAuditEntry[];
  todayDate: string;
}

export interface AttendanceFilters {
  search: string;
  date: string; // 'all' or YYYY-MM-DD
  status: 'all' | 'on_campus' | 'completed' | 'late';
  gradeSection: string; // 'all' or specific gradeSection
}

export interface StudentSummary {
  totalDaysLogged: number;
  completedDays: number;
  onCampusCount: number;
  lateCount: number;
  removedCount: number;
  averageTimeIn: string | null;
}

export interface DashboardMetrics {
  totalStudents: number;
  rfidStudents: number;
  loggedOnDate: number;
  currentlyOnCampus: number;
  removedLogsCount: number;
}
