import type {
  AttendanceRecord,
  AuthStatus,
  OverviewPayload,
  RemovalAuditEntry,
  RemovalScope,
  Student,
} from '../types/attendance';

async function requestJson<T>(
  url: string,
  options: {
    method?: string;
    token?: string | null;
    body?: unknown;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export function fetchAuthStatus(token: string | null): Promise<AuthStatus> {
  return requestJson<AuthStatus>('/api/auth/status', { token });
}

export function setupInitialAdmin(email: string, password: string): Promise<{ token: string; adminEmail: string; envManaged: boolean }> {
  return requestJson('/api/auth/setup', {
    method: 'POST',
    body: { email, password },
  });
}

export function loginAdmin(email: string, password: string): Promise<{ token: string; adminEmail: string; envManaged: boolean }> {
  return requestJson('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function logoutAdmin(token: string): Promise<{ ok: boolean }> {
  return requestJson('/api/auth/logout', {
    method: 'POST',
    token,
  });
}

export function changeAdminPassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; token: string; adminEmail: string }> {
  return requestJson('/api/auth/change-password', {
    method: 'POST',
    token,
    body: { currentPassword, newPassword },
  });
}

export function fetchOverview(token: string | null): Promise<OverviewPayload> {
  return requestJson<OverviewPayload>('/api/public/overview', { token });
}

export function fetchAuditLogs(token: string): Promise<{ auditLogs: RemovalAuditEntry[] }> {
  return requestJson('/api/audit-logs', { token });
}

export function createStudent(
  token: string,
  payload: {
    fullName: string;
    studentId: string;
    gradeSection: string;
    rfidUid: string;
    registrationMode: 'rfid' | 'manual';
    guardianContact?: string;
  }
): Promise<{ student: Student }> {
  return requestJson('/api/students', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateStudent(
  token: string,
  id: string,
  payload: {
    fullName: string;
    studentId: string;
    gradeSection: string;
    rfidUid: string;
    registrationMode: 'rfid' | 'manual';
    guardianContact?: string;
  }
): Promise<{ student: Student }> {
  return requestJson(`/api/students/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function recordRfidTap(
  token: string,
  payload: { rfidUid: string; date?: string; time?: string }
): Promise<{ ok: true; action: 'time_in' | 'time_out'; student: Student; record: AttendanceRecord }> {
  return requestJson('/api/attendance/rfid-tap', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function recordManualAttendance(
  token: string,
  payload: {
    studentInternalId: string;
    date: string;
    timeIn: string | null;
    timeOut: string | null;
    notes?: string;
  }
): Promise<{ record: AttendanceRecord }> {
  return requestJson('/api/attendance/manual', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function quickLogTimeOut(
  token: string,
  recordId: string,
  timeOut?: string
): Promise<{ record: AttendanceRecord }> {
  return requestJson(`/api/attendance/${encodeURIComponent(recordId)}/timeout`, {
    method: 'PATCH',
    token,
    body: timeOut ? { timeOut } : {},
  });
}

export function removeAttendanceEntry(
  token: string,
  recordId: string,
  payload: { scope: RemovalScope; reason: string; notes?: string }
): Promise<{ ok: true; auditEntry: RemovalAuditEntry; remainingRecord: AttendanceRecord | null }> {
  return requestJson(`/api/attendance/${encodeURIComponent(recordId)}/remove`, {
    method: 'POST',
    token,
    body: payload,
  });
}
