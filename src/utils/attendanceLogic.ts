import type {
  AttendanceFilters,
  AttendanceRecord,
  AttendanceStatus,
  DashboardMetrics,
  RemovalAuditEntry,
  Student,
  StudentSummary,
} from '../types/attendance';

export const DEFAULT_LATE_THRESHOLD = '07:30';

export function normalizeTimeToMinutes(time: string | null): number | null {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatTimeDisplay(time: string | null): string {
  const mins = normalizeTimeToMinutes(time);
  if (mins === null) {
    return '—';
  }
  const hours24 = Math.floor(mins / 60);
  const minutes = mins % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function computeAttendanceStatus(
  timeIn: string | null,
  timeOut: string | null,
  lateThreshold: string = DEFAULT_LATE_THRESHOLD
): AttendanceStatus {
  const inMins = normalizeTimeToMinutes(timeIn);
  const thresholdMins = normalizeTimeToMinutes(lateThreshold) ?? 7 * 60 + 30;
  const isLate = inMins !== null && inMins > thresholdMins;

  if (timeIn && timeOut) {
    return isLate ? 'Late' : 'Completed';
  }
  if (timeIn && !timeOut) {
    return isLate ? 'On Campus (Late)' : 'On Campus';
  }
  return 'Time Out Only';
}

export function filterAttendanceRecords(
  records: AttendanceRecord[],
  studentsById: Map<string, Student>,
  filters: AttendanceFilters,
  lateThreshold: string = DEFAULT_LATE_THRESHOLD
): AttendanceRecord[] {
  const query = filters.search.trim().toLowerCase();

  return records
    .filter((record) => {
      const student = studentsById.get(record.studentInternalId);
      if (!student) {
        return false;
      }

      if (filters.date !== 'all' && record.date !== filters.date) {
        return false;
      }

      if (filters.gradeSection !== 'all' && student.gradeSection !== filters.gradeSection) {
        return false;
      }

      const status = computeAttendanceStatus(record.timeIn, record.timeOut, lateThreshold);
      if (filters.status === 'on_campus' && status !== 'On Campus' && status !== 'On Campus (Late)') {
        return false;
      }
      if (filters.status === 'completed' && status !== 'Completed' && status !== 'Late') {
        return false;
      }
      if (filters.status === 'late' && status !== 'Late' && status !== 'On Campus (Late)') {
        return false;
      }

      if (query.length > 0) {
        const matchesName = student.fullName.toLowerCase().includes(query);
        const matchesStudentId = student.studentId.toLowerCase().includes(query);
        const matchesRfid = (student.rfidUid ?? '').toLowerCase().includes(query);
        const matchesSection = student.gradeSection.toLowerCase().includes(query);
        if (!matchesName && !matchesStudentId && !matchesRfid && !matchesSection) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      const aTime = a.timeOut ?? a.timeIn ?? '00:00';
      const bTime = b.timeOut ?? b.timeIn ?? '00:00';
      return bTime.localeCompare(aTime);
    });
}

export function computeStudentSummary(
  records: AttendanceRecord[],
  studentInternalId: string,
  removalLogs: RemovalAuditEntry[] = [],
  lateThreshold: string = DEFAULT_LATE_THRESHOLD
): StudentSummary {
  const studentRecords = records.filter((r) => r.studentInternalId === studentInternalId);
  let completedDays = 0;
  let onCampusCount = 0;
  let lateCount = 0;
  let timeInSum = 0;
  let timeInCount = 0;

  for (const record of studentRecords) {
    const status = computeAttendanceStatus(record.timeIn, record.timeOut, lateThreshold);
    if (status === 'Completed' || status === 'Late') {
      completedDays += 1;
    }
    if (status === 'On Campus' || status === 'On Campus (Late)') {
      onCampusCount += 1;
    }
    if (status === 'Late' || status === 'On Campus (Late)') {
      lateCount += 1;
    }
    const inMins = normalizeTimeToMinutes(record.timeIn);
    if (inMins !== null) {
      timeInSum += inMins;
      timeInCount += 1;
    }
  }

  const removedCount = removalLogs.filter((l) => l.studentInternalId === studentInternalId).length;

  return {
    totalDaysLogged: studentRecords.length,
    completedDays,
    onCampusCount,
    lateCount,
    removedCount,
    averageTimeIn: timeInCount > 0 ? formatMinutesToTime(timeInSum / timeInCount) : null,
  };
}

export function computeDashboardMetrics(
  records: AttendanceRecord[],
  students: Student[],
  removalCount: number,
  targetDate: string
): DashboardMetrics {
  const dateRecords = records.filter((r) => r.date === targetDate);
  const currentlyOnCampus = dateRecords.filter((r) => Boolean(r.timeIn) && !r.timeOut).length;

  return {
    totalStudents: students.length,
    rfidStudents: students.filter((s) => Boolean(s.rfidUid && s.rfidUid.trim().length > 0)).length,
    loggedOnDate: dateRecords.length,
    currentlyOnCampus,
    removedLogsCount: removalCount,
  };
}

export interface StudentValidationInput {
  fullName: string;
  studentId: string;
  gradeSection: string;
  rfidUid: string;
  registrationMode: 'rfid' | 'manual';
}

export function validateStudentInput(
  input: StudentValidationInput,
  existingStudents: Student[],
  editingId?: string
): string | null {
  const fullName = input.fullName.trim();
  const studentId = input.studentId.trim();
  const gradeSection = input.gradeSection.trim();
  const rfidUid = input.rfidUid.trim().toUpperCase();

  if (fullName.length < 2 || fullName.length > 80) {
    return 'Student full name must be between 2 and 80 characters.';
  }
  if (!/^[A-Za-z0-9-]{3,32}$/.test(studentId)) {
    return 'Student ID / LRN must be 3 to 32 alphanumeric or hyphen characters.';
  }
  if (gradeSection.length < 2 || gradeSection.length > 50) {
    return 'Grade and section must be between 2 and 50 characters.';
  }

  if (input.registrationMode === 'rfid') {
    if (!/^[A-Za-z0-9:-]{4,32}$/.test(rfidUid)) {
      return 'RFID Card UID must be 4 to 32 characters (letters, digits, colons, or hyphens).';
    }
  } else if (rfidUid.length > 0 && !/^[A-Za-z0-9:-]{4,32}$/.test(rfidUid)) {
    return 'RFID Card UID must be 4 to 32 characters if provided.';
  }

  const duplicateId = existingStudents.find(
    (s) => s.id !== editingId && s.studentId.toLowerCase() === studentId.toLowerCase()
  );
  if (duplicateId) {
    return `Student ID "${studentId}" is already assigned to ${duplicateId.fullName}.`;
  }

  if (rfidUid.length > 0) {
    const duplicateRfid = existingStudents.find(
      (s) => s.id !== editingId && s.rfidUid && s.rfidUid.toUpperCase() === rfidUid
    );
    if (duplicateRfid) {
      return `RFID Card "${rfidUid}" is already assigned to ${duplicateRfid.fullName}.`;
    }
  }

  return null;
}

export function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (password.length > 128) {
    return 'Password must not exceed 128 characters.';
  }
  return null;
}
