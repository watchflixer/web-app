import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AttendanceRecord,
  RemovalAuditEntry,
  RemovalScope,
  Student,
} from '../types/attendance.ts';
import { getEnvAdminConfig, hashPassword, timingSafeEqualString, verifyPassword } from './auth.ts';

export interface AdminAccount {
  email: string;
  passwordHash: string;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseState {
  adminAccount: AdminAccount | null;
  envTokenVersion: number;
  students: Student[];
  records: AttendanceRecord[];
  auditLogs: RemovalAuditEntry[];
}

export function getLocalDateString(dateObj: Date = new Date()): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalTimeString(dateObj: Date = new Date()): string {
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function shiftDateString(baseDate: Date, deltaDays: number): string {
  const copy = new Date(baseDate.getTime());
  copy.setDate(copy.getDate() + deltaDays);
  return getLocalDateString(copy);
}

export function createSeedData(now: Date = new Date()): DatabaseState {
  const today = getLocalDateString(now);
  const yesterday = shiftDateString(now, -1);
  const twoDaysAgo = shiftDateString(now, -2);
  const createdTs = now.toISOString();

  const students: Student[] = [
    {
      id: 'stu-01',
      studentId: '2026-1001',
      fullName: 'Marco Santos',
      gradeSection: 'Grade 10 - Einstein',
      rfidUid: 'RF-8842-109A',
      registrationMode: 'rfid',
      guardianContact: '0917-555-0142',
      createdAt: createdTs,
      updatedAt: createdTs,
    },
    {
      id: 'stu-02',
      studentId: '2026-1002',
      fullName: 'Bianca Reyes',
      gradeSection: 'Grade 10 - Einstein',
      rfidUid: 'RF-8842-109B',
      registrationMode: 'rfid',
      guardianContact: '0917-555-0188',
      createdAt: createdTs,
      updatedAt: createdTs,
    },
    {
      id: 'stu-03',
      studentId: '2026-1003',
      fullName: 'Rafael Mendoza',
      gradeSection: 'Grade 11 - Curie',
      rfidUid: 'RF-7731-442C',
      registrationMode: 'rfid',
      guardianContact: '0918-555-0124',
      createdAt: createdTs,
      updatedAt: createdTs,
    },
    {
      id: 'stu-04',
      studentId: '2026-1004',
      fullName: 'Clarisse Bautista',
      gradeSection: 'Grade 11 - Curie',
      rfidUid: null,
      registrationMode: 'manual',
      guardianContact: '0919-555-0190',
      createdAt: createdTs,
      updatedAt: createdTs,
    },
    {
      id: 'stu-05',
      studentId: '2026-1005',
      fullName: 'Gabriel Navarro',
      gradeSection: 'Grade 12 - Rizal',
      rfidUid: 'RF-5519-903D',
      registrationMode: 'rfid',
      guardianContact: '0920-555-0155',
      createdAt: createdTs,
      updatedAt: createdTs,
    },
    {
      id: 'stu-06',
      studentId: '2026-1006',
      fullName: 'Sofia Villanueva',
      gradeSection: 'Grade 12 - Rizal',
      rfidUid: 'RF-5519-904E',
      registrationMode: 'rfid',
      guardianContact: '0917-555-0167',
      createdAt: createdTs,
      updatedAt: createdTs,
    },
    {
      id: 'stu-07',
      studentId: '2026-1007',
      fullName: 'Daniela Aquino',
      gradeSection: 'Grade 9 - Newton',
      rfidUid: 'RF-3310-218F',
      registrationMode: 'rfid',
      guardianContact: '0921-555-0112',
      createdAt: createdTs,
      updatedAt: createdTs,
    },
    {
      id: 'stu-08',
      studentId: '2026-1008',
      fullName: 'Joshua Castillo',
      gradeSection: 'Grade 9 - Newton',
      rfidUid: null,
      registrationMode: 'manual',
      guardianContact: '0916-555-0133',
      createdAt: createdTs,
      updatedAt: createdTs,
    },
  ];

  const records: AttendanceRecord[] = [
    {
      id: 'att-01',
      studentInternalId: 'stu-01',
      date: today,
      timeIn: '07:14',
      timeOut: null,
      timeInSource: 'RFID Tap',
      timeOutSource: null,
      createdAt: `${today}T07:14:00Z`,
      updatedAt: `${today}T07:14:00Z`,
    },
    {
      id: 'att-02',
      studentInternalId: 'stu-02',
      date: today,
      timeIn: '07:22',
      timeOut: null,
      timeInSource: 'RFID Tap',
      timeOutSource: null,
      createdAt: `${today}T07:22:00Z`,
      updatedAt: `${today}T07:22:00Z`,
    },
    {
      id: 'att-03',
      studentInternalId: 'stu-03',
      date: today,
      timeIn: '07:41',
      timeOut: null,
      timeInSource: 'RFID Tap',
      timeOutSource: null,
      createdAt: `${today}T07:41:00Z`,
      updatedAt: `${today}T07:41:00Z`,
    },
    {
      id: 'att-04',
      studentInternalId: 'stu-04',
      date: today,
      timeIn: '07:27',
      timeOut: null,
      timeInSource: 'Manual Entry',
      timeOutSource: null,
      notes: 'Temporary pass at Gate 1 (card pending)',
      createdAt: `${today}T07:27:00Z`,
      updatedAt: `${today}T07:27:00Z`,
    },
    {
      id: 'att-05',
      studentInternalId: 'stu-05',
      date: today,
      timeIn: '07:08',
      timeOut: '12:15',
      timeInSource: 'RFID Tap',
      timeOutSource: 'RFID Tap',
      notes: 'Early dismissal with parent permit',
      createdAt: `${today}T07:08:00Z`,
      updatedAt: `${today}T12:15:00Z`,
    },
    {
      id: 'att-06',
      studentInternalId: 'stu-07',
      date: today,
      timeIn: '07:36',
      timeOut: null,
      timeInSource: 'RFID Tap',
      timeOutSource: null,
      createdAt: `${today}T07:36:00Z`,
      updatedAt: `${today}T07:36:00Z`,
    },
    {
      id: 'att-07',
      studentInternalId: 'stu-01',
      date: yesterday,
      timeIn: '07:19',
      timeOut: '16:04',
      timeInSource: 'RFID Tap',
      timeOutSource: 'RFID Tap',
      createdAt: `${yesterday}T07:19:00Z`,
      updatedAt: `${yesterday}T16:04:00Z`,
    },
    {
      id: 'att-08',
      studentInternalId: 'stu-02',
      date: yesterday,
      timeIn: '07:25',
      timeOut: '16:08',
      timeInSource: 'RFID Tap',
      timeOutSource: 'RFID Tap',
      createdAt: `${yesterday}T07:25:00Z`,
      updatedAt: `${yesterday}T16:08:00Z`,
    },
    {
      id: 'att-09',
      studentInternalId: 'stu-03',
      date: yesterday,
      timeIn: '07:48',
      timeOut: '16:12',
      timeInSource: 'RFID Tap',
      timeOutSource: 'RFID Tap',
      createdAt: `${yesterday}T07:48:00Z`,
      updatedAt: `${yesterday}T16:12:00Z`,
    },
    {
      id: 'att-10',
      studentInternalId: 'stu-05',
      date: yesterday,
      timeIn: '07:12',
      timeOut: '16:30',
      timeInSource: 'RFID Tap',
      timeOutSource: 'RFID Tap',
      createdAt: `${yesterday}T07:12:00Z`,
      updatedAt: `${yesterday}T16:30:00Z`,
    },
    {
      id: 'att-11',
      studentInternalId: 'stu-06',
      date: yesterday,
      timeIn: '07:29',
      timeOut: '16:02',
      timeInSource: 'RFID Tap',
      timeOutSource: 'RFID Tap',
      createdAt: `${yesterday}T07:29:00Z`,
      updatedAt: `${yesterday}T16:02:00Z`,
    },
    {
      id: 'att-12',
      studentInternalId: 'stu-08',
      date: yesterday,
      timeIn: '07:34',
      timeOut: '15:58',
      timeInSource: 'Manual Entry',
      timeOutSource: 'Manual Entry',
      createdAt: `${yesterday}T07:34:00Z`,
      updatedAt: `${yesterday}T15:58:00Z`,
    },
    {
      id: 'att-13',
      studentInternalId: 'stu-01',
      date: twoDaysAgo,
      timeIn: '07:16',
      timeOut: '16:01',
      timeInSource: 'RFID Tap',
      timeOutSource: 'RFID Tap',
      createdAt: `${twoDaysAgo}T07:16:00Z`,
      updatedAt: `${twoDaysAgo}T16:01:00Z`,
    },
    {
      id: 'att-14',
      studentInternalId: 'stu-04',
      date: twoDaysAgo,
      timeIn: '07:24',
      timeOut: '16:00',
      timeInSource: 'Manual Entry',
      timeOutSource: 'Manual Entry',
      createdAt: `${twoDaysAgo}T07:24:00Z`,
      updatedAt: `${twoDaysAgo}T16:00:00Z`,
    },
  ];

  const auditLogs: RemovalAuditEntry[] = [
    {
      id: 'rem-seed-01',
      recordId: 'att-void-01',
      studentInternalId: 'stu-06',
      studentId: '2026-1006',
      studentName: 'Sofia Villanueva',
      gradeSection: 'Grade 12 - Rizal',
      date: twoDaysAgo,
      scope: 'full',
      removedTimeIn: '07:11',
      removedTimeOut: null,
      reason: 'Proxy tap / Classmate tapped ID (Absent)',
      notes: 'Verified absent in homeroom roll call; classmate tapped card at Main Gate.',
      removedByEmail: 'school-admin',
      removedAt: `${twoDaysAgo}T08:45:00Z`,
    },
  ];

  return {
    adminAccount: null,
    envTokenVersion: 1,
    students,
    records,
    auditLogs,
  };
}

export class AttendanceStore {
  private readonly filePath: string;
  private state: DatabaseState;

  constructor(filePath: string = path.resolve(process.cwd(), 'data', 'school-attendance.json')) {
    this.filePath = filePath;
    this.state = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseState {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw) as DatabaseState;
        if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.records)) {
          return {
            adminAccount: parsed.adminAccount ?? null,
            envTokenVersion: typeof parsed.envTokenVersion === 'number' ? parsed.envTokenVersion : 1,
            students: parsed.students,
            records: parsed.records,
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
          };
        }
      } catch {
        // Fall through to re-seed if file is corrupted
      }
    }
    const seeded = createSeedData();
    this.persist(seeded);
    return seeded;
  }

  private persist(nextState: DatabaseState = this.state): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${this.filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(nextState, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.filePath);
  }

  getAuthMetadata(): {
    envManaged: boolean;
    needsSetup: boolean;
    adminEmail: string | null;
    tokenVersion: number;
  } {
    const envCfg = getEnvAdminConfig();
    if (envCfg) {
      return {
        envManaged: true,
        needsSetup: false,
        adminEmail: envCfg.email,
        tokenVersion: this.state.envTokenVersion,
      };
    }
    if (this.state.adminAccount) {
      return {
        envManaged: false,
        needsSetup: false,
        adminEmail: this.state.adminAccount.email,
        tokenVersion: this.state.adminAccount.tokenVersion,
      };
    }
    return {
      envManaged: false,
      needsSetup: true,
      adminEmail: null,
      tokenVersion: 1,
    };
  }

  setupInitialAdmin(email: string, password: string): { ok: true; email: string; tokenVersion: number } | { ok: false; status: number; error: string } {
    const envCfg = getEnvAdminConfig();
    if (envCfg || this.state.adminAccount) {
      return {
        ok: false,
        status: 403,
        error: 'Administrator account is already configured. Public registration is disabled.',
      };
    }
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();
    this.state.adminAccount = {
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      tokenVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.persist();
    return { ok: true, email: normalizedEmail, tokenVersion: 1 };
  }

  verifyAdminCredentials(email: string, password: string): { ok: true; email: string; tokenVersion: number } | { ok: false; error: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const envCfg = getEnvAdminConfig();

    if (envCfg) {
      const emailMatch = timingSafeEqualString(normalizedEmail, envCfg.email);
      const passMatch = timingSafeEqualString(password, envCfg.password);
      if (!emailMatch || !passMatch) {
        return { ok: false, error: 'Invalid administrator email or password.' };
      }
      return { ok: true, email: envCfg.email, tokenVersion: this.state.envTokenVersion };
    }

    if (!this.state.adminAccount) {
      return { ok: false, error: 'Administrator account has not been initialized yet.' };
    }

    const emailMatch = timingSafeEqualString(normalizedEmail, this.state.adminAccount.email);
    const passMatch = verifyPassword(password, this.state.adminAccount.passwordHash);
    if (!emailMatch || !passMatch) {
      return { ok: false, error: 'Invalid administrator email or password.' };
    }
    return {
      ok: true,
      email: this.state.adminAccount.email,
      tokenVersion: this.state.adminAccount.tokenVersion,
    };
  }

  changeAdminPassword(currentPassword: string, newPassword: string): { ok: true; email: string; tokenVersion: number } | { ok: false; status: number; error: string } {
    const envCfg = getEnvAdminConfig();
    if (envCfg) {
      return {
        ok: false,
        status: 400,
        error: 'Password is managed via server environment variables (ADMIN_PASSWORD). Update it in your deployment secrets.',
      };
    }
    if (!this.state.adminAccount) {
      return { ok: false, status: 400, error: 'Administrator account is not configured.' };
    }
    if (!verifyPassword(currentPassword, this.state.adminAccount.passwordHash)) {
      return { ok: false, status: 401, error: 'Current password is incorrect.' };
    }
    this.state.adminAccount.passwordHash = hashPassword(newPassword);
    this.state.adminAccount.tokenVersion += 1;
    this.state.adminAccount.updatedAt = new Date().toISOString();
    this.persist();
    return {
      ok: true,
      email: this.state.adminAccount.email,
      tokenVersion: this.state.adminAccount.tokenVersion,
    };
  }

  invalidateAllTokens(): void {
    const envCfg = getEnvAdminConfig();
    if (envCfg) {
      this.state.envTokenVersion += 1;
      this.persist();
      return;
    }
    if (this.state.adminAccount) {
      this.state.adminAccount.tokenVersion += 1;
      this.persist();
    }
  }

  getOverview(isAuthenticated: boolean) {
    const publicStudents: Student[] = this.state.students.map((s) =>
      isAuthenticated
        ? s
        : {
            ...s,
            guardianContact: undefined,
          }
    );
    return {
      students: publicStudents,
      records: this.state.records,
      removalCount: this.state.auditLogs.length,
      auditLogs: isAuthenticated ? this.state.auditLogs : undefined,
      todayDate: getLocalDateString(),
    };
  }

  getAuditLogs(): RemovalAuditEntry[] {
    return [...this.state.auditLogs].sort((a, b) => b.removedAt.localeCompare(a.removedAt));
  }

  getStudents(): Student[] {
    return this.state.students;
  }

  addStudent(input: {
    studentId: string;
    fullName: string;
    gradeSection: string;
    rfidUid: string | null;
    registrationMode: 'rfid' | 'manual';
    guardianContact?: string;
  }): Student {
    const now = new Date().toISOString();
    const student: Student = {
      id: `stu-${crypto.randomUUID().slice(0, 8)}`,
      studentId: input.studentId.trim(),
      fullName: input.fullName.trim(),
      gradeSection: input.gradeSection.trim(),
      rfidUid: input.rfidUid ? input.rfidUid.trim().toUpperCase() : null,
      registrationMode: input.registrationMode,
      guardianContact: input.guardianContact?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.state.students.push(student);
    this.persist();
    return student;
  }

  updateStudent(
    id: string,
    input: {
      studentId: string;
      fullName: string;
      gradeSection: string;
      rfidUid: string | null;
      registrationMode: 'rfid' | 'manual';
      guardianContact?: string;
    }
  ): Student | null {
    const idx = this.state.students.findIndex((s) => s.id === id);
    if (idx === -1) {
      return null;
    }
    const existing = this.state.students[idx];
    const updated: Student = {
      ...existing,
      studentId: input.studentId.trim(),
      fullName: input.fullName.trim(),
      gradeSection: input.gradeSection.trim(),
      rfidUid: input.rfidUid ? input.rfidUid.trim().toUpperCase() : null,
      registrationMode: input.registrationMode,
      guardianContact: input.guardianContact?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    this.state.students[idx] = updated;
    this.persist();
    return updated;
  }

  recordRfidTap(input: {
    rfidUid: string;
    date?: string;
    time?: string;
  }): { ok: true; action: 'time_in' | 'time_out'; student: Student; record: AttendanceRecord } | { ok: false; status: number; error: string } {
    const normalizedUid = input.rfidUid.trim().toUpperCase();
    const student = this.state.students.find(
      (s) => s.rfidUid && s.rfidUid.toUpperCase() === normalizedUid
    );
    if (!student) {
      return {
        ok: false,
        status: 404,
        error: `No registered student matches RFID card "${normalizedUid}".`,
      };
    }

    const now = new Date();
    const date = input.date?.trim() || getLocalDateString(now);
    const time = input.time?.trim() || getLocalTimeString(now);
    const nowIso = now.toISOString();

    const existing = this.state.records.find(
      (r) => r.studentInternalId === student.id && r.date === date
    );

    if (!existing) {
      const created: AttendanceRecord = {
        id: `att-${crypto.randomUUID().slice(0, 8)}`,
        studentInternalId: student.id,
        date,
        timeIn: time,
        timeOut: null,
        timeInSource: 'RFID Tap',
        timeOutSource: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      this.state.records.unshift(created);
      this.persist();
      return { ok: true, action: 'time_in', student, record: created };
    }

    if (!existing.timeIn) {
      existing.timeIn = time;
      existing.timeInSource = 'RFID Tap';
      existing.updatedAt = nowIso;
      this.persist();
      return { ok: true, action: 'time_in', student, record: existing };
    }

    if (!existing.timeOut) {
      existing.timeOut = time;
      existing.timeOutSource = 'RFID Tap';
      existing.updatedAt = nowIso;
      this.persist();
      return { ok: true, action: 'time_out', student, record: existing };
    }

    return {
      ok: false,
      status: 409,
      error: `${student.fullName} already has both Time In (${existing.timeIn}) and Time Out (${existing.timeOut}) logged for ${date}.`,
    };
  }

  recordManualAttendance(input: {
    studentInternalId: string;
    date: string;
    timeIn: string | null;
    timeOut: string | null;
    notes?: string;
  }): { ok: true; record: AttendanceRecord } | { ok: false; status: number; error: string } {
    const student = this.state.students.find((s) => s.id === input.studentInternalId);
    if (!student) {
      return { ok: false, status: 404, error: 'Selected student not found.' };
    }
    if (!input.timeIn && !input.timeOut) {
      return { ok: false, status: 400, error: 'Provide at least a Time In or Time Out value.' };
    }

    const nowIso = new Date().toISOString();
    const existing = this.state.records.find(
      (r) => r.studentInternalId === student.id && r.date === input.date
    );

    if (existing) {
      if (input.timeIn) {
        existing.timeIn = input.timeIn;
        existing.timeInSource = 'Manual Entry';
      }
      if (input.timeOut) {
        existing.timeOut = input.timeOut;
        existing.timeOutSource = 'Manual Entry';
      }
      if (input.notes?.trim()) {
        existing.notes = input.notes.trim();
      }
      existing.updatedAt = nowIso;
      this.persist();
      return { ok: true, record: existing };
    }

    const created: AttendanceRecord = {
      id: `att-${crypto.randomUUID().slice(0, 8)}`,
      studentInternalId: student.id,
      date: input.date,
      timeIn: input.timeIn,
      timeOut: input.timeOut,
      timeInSource: input.timeIn ? 'Manual Entry' : null,
      timeOutSource: input.timeOut ? 'Manual Entry' : null,
      notes: input.notes?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.state.records.unshift(created);
    this.persist();
    return { ok: true, record: created };
  }

  logQuickTimeOut(recordId: string, timeOut: string): AttendanceRecord | null {
    const record = this.state.records.find((r) => r.id === recordId);
    if (!record) {
      return null;
    }
    record.timeOut = timeOut;
    record.timeOutSource = 'Manual Entry';
    record.updatedAt = new Date().toISOString();
    this.persist();
    return record;
  }

  removeAttendanceRecord(input: {
    recordId: string;
    scope: RemovalScope;
    reason: string;
    notes?: string;
    removedByEmail: string;
  }): { ok: true; auditEntry: RemovalAuditEntry; remainingRecord: AttendanceRecord | null } | { ok: false; status: number; error: string } {
    const idx = this.state.records.findIndex((r) => r.id === input.recordId);
    if (idx === -1) {
      return { ok: false, status: 404, error: 'Attendance record not found.' };
    }
    const record = this.state.records[idx];
    const student = this.state.students.find((s) => s.id === record.studentInternalId);
    const nowIso = new Date().toISOString();

    let removedTimeIn: string | null = null;
    let removedTimeOut: string | null = null;
    let remainingRecord: AttendanceRecord | null = null;

    if (input.scope === 'full') {
      removedTimeIn = record.timeIn;
      removedTimeOut = record.timeOut;
      this.state.records.splice(idx, 1);
    } else if (input.scope === 'time_out') {
      if (!record.timeOut) {
        return { ok: false, status: 400, error: 'This record does not have a Time Out value to remove.' };
      }
      removedTimeOut = record.timeOut;
      record.timeOut = null;
      record.timeOutSource = null;
      record.updatedAt = nowIso;
      if (!record.timeIn) {
        this.state.records.splice(idx, 1);
      } else {
        remainingRecord = record;
      }
    } else if (input.scope === 'time_in') {
      if (!record.timeIn) {
        return { ok: false, status: 400, error: 'This record does not have a Time In value to remove.' };
      }
      removedTimeIn = record.timeIn;
      record.timeIn = null;
      record.timeInSource = null;
      record.updatedAt = nowIso;
      if (!record.timeOut) {
        this.state.records.splice(idx, 1);
      } else {
        remainingRecord = record;
      }
    }

    const auditEntry: RemovalAuditEntry = {
      id: `rem-${crypto.randomUUID().slice(0, 8)}`,
      recordId: record.id,
      studentInternalId: record.studentInternalId,
      studentId: student?.studentId ?? 'Unknown',
      studentName: student?.fullName ?? 'Unknown Student',
      gradeSection: student?.gradeSection ?? '—',
      date: record.date,
      scope: input.scope,
      removedTimeIn,
      removedTimeOut,
      reason: input.reason.trim(),
      notes: input.notes?.trim() || undefined,
      removedByEmail: input.removedByEmail,
      removedAt: nowIso,
    };

    this.state.auditLogs.unshift(auditEntry);
    this.persist();
    return { ok: true, auditEntry, remainingRecord };
  }
}
