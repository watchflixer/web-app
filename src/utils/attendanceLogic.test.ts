import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAttendanceStatus,
  computeDashboardMetrics,
  computeStudentSummary,
  filterAttendanceRecords,
  formatTimeDisplay,
  validateEmailFormat,
  validatePasswordStrength,
  validateStudentInput,
} from './attendanceLogic';
import type { AttendanceRecord, RemovalAuditEntry, Student } from '../types/attendance';

const sampleStudents: Student[] = [
  {
    id: 'stu-1',
    studentId: '2026-1001',
    fullName: 'Marco Santos',
    gradeSection: 'Grade 10 - Einstein',
    rfidUid: 'RF-8842-109A',
    registrationMode: 'rfid',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'stu-2',
    studentId: '2026-1002',
    fullName: 'Bianca Reyes',
    gradeSection: 'Grade 11 - Curie',
    rfidUid: null,
    registrationMode: 'manual',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
];

const sampleRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    studentInternalId: 'stu-1',
    date: '2026-11-26',
    timeIn: '07:18',
    timeOut: '16:05',
    timeInSource: 'RFID Tap',
    timeOutSource: 'RFID Tap',
    createdAt: '2026-11-26T07:18:00Z',
    updatedAt: '2026-11-26T16:05:00Z',
  },
  {
    id: 'att-2',
    studentInternalId: 'stu-2',
    date: '2026-11-26',
    timeIn: '07:49',
    timeOut: null,
    timeInSource: 'Manual Entry',
    timeOutSource: null,
    createdAt: '2026-11-26T07:49:00Z',
    updatedAt: '2026-11-26T07:49:00Z',
  },
  {
    id: 'att-3',
    studentInternalId: 'stu-1',
    date: '2026-11-25',
    timeIn: '07:42',
    timeOut: '15:55',
    timeInSource: 'RFID Tap',
    timeOutSource: 'RFID Tap',
    createdAt: '2026-11-25T07:42:00Z',
    updatedAt: '2026-11-25T15:55:00Z',
  },
];

test('computeAttendanceStatus classifies on-time, late, on-campus, and time-out-only properly', () => {
  assert.equal(computeAttendanceStatus('07:18', '16:05'), 'Completed');
  assert.equal(computeAttendanceStatus('07:42', '15:55'), 'Late');
  assert.equal(computeAttendanceStatus('07:15', null), 'On Campus');
  assert.equal(computeAttendanceStatus('07:49', null), 'On Campus (Late)');
  assert.equal(computeAttendanceStatus(null, '15:00'), 'Time Out Only');
});

test('formatTimeDisplay formats 24h strings to 12h AM/PM', () => {
  assert.equal(formatTimeDisplay('07:18'), '07:18 AM');
  assert.equal(formatTimeDisplay('12:05'), '12:05 PM');
  assert.equal(formatTimeDisplay('16:05'), '04:05 PM');
  assert.equal(formatTimeDisplay(null), '—');
});

test('filterAttendanceRecords filters by search, date, grade, and status', () => {
  const byId = new Map(sampleStudents.map((s) => [s.id, s]));

  const rfidSearch = filterAttendanceRecords(sampleRecords, byId, {
    search: 'RF-8842',
    date: 'all',
    status: 'all',
    gradeSection: 'all',
  });
  assert.equal(rfidSearch.length, 2);

  const onCampusToday = filterAttendanceRecords(sampleRecords, byId, {
    search: '',
    date: '2026-11-26',
    status: 'on_campus',
    gradeSection: 'all',
  });
  assert.equal(onCampusToday.length, 1);
  assert.equal(onCampusToday[0].id, 'att-2');

  const lateOnly = filterAttendanceRecords(sampleRecords, byId, {
    search: '',
    date: 'all',
    status: 'late',
    gradeSection: 'all',
  });
  assert.equal(lateOnly.length, 2);
});

test('computeStudentSummary computes totals, late count, average time in, and removed count', () => {
  const audits: RemovalAuditEntry[] = [
    {
      id: 'rem-1',
      recordId: 'att-old',
      studentInternalId: 'stu-1',
      studentId: '2026-1001',
      studentName: 'Marco Santos',
      gradeSection: 'Grade 10 - Einstein',
      date: '2026-11-24',
      scope: 'full',
      removedTimeIn: '07:10',
      removedTimeOut: null,
      reason: 'Proxy tap / Classmate tapped ID (Absent)',
      removedByEmail: 'admin@school.edu',
      removedAt: '2026-11-24T09:00:00Z',
    },
  ];

  const summary = computeStudentSummary(sampleRecords, 'stu-1', audits);
  assert.equal(summary.totalDaysLogged, 2);
  assert.equal(summary.completedDays, 2);
  assert.equal(summary.onCampusCount, 0);
  assert.equal(summary.lateCount, 1);
  assert.equal(summary.removedCount, 1);
  assert.equal(summary.averageTimeIn, '07:30');
});

test('computeDashboardMetrics calculates counts accurately', () => {
  const metrics = computeDashboardMetrics(sampleRecords, sampleStudents, 3, '2026-11-26');
  assert.equal(metrics.totalStudents, 2);
  assert.equal(metrics.rfidStudents, 1);
  assert.equal(metrics.loggedOnDate, 2);
  assert.equal(metrics.currentlyOnCampus, 1);
  assert.equal(metrics.removedLogsCount, 3);
});

test('validateStudentInput prevents duplicate Student IDs and RFID UIDs', () => {
  const dupIdErr = validateStudentInput(
    {
      fullName: 'New Student',
      studentId: '2026-1001',
      gradeSection: 'Grade 10 - Einstein',
      rfidUid: 'RF-9999-1111',
      registrationMode: 'rfid',
    },
    sampleStudents
  );
  assert.ok(dupIdErr?.includes('already assigned'));

  const dupRfidErr = validateStudentInput(
    {
      fullName: 'New Student',
      studentId: '2026-9999',
      gradeSection: 'Grade 10 - Einstein',
      rfidUid: 'rf-8842-109a',
      registrationMode: 'rfid',
    },
    sampleStudents
  );
  assert.ok(dupRfidErr?.includes('already assigned'));

  const validManual = validateStudentInput(
    {
      fullName: 'Elena Cruz',
      studentId: '2026-1003',
      gradeSection: 'Grade 9 - Newton',
      rfidUid: '',
      registrationMode: 'manual',
    },
    sampleStudents
  );
  assert.equal(validManual, null);
});

test('validateEmailFormat and validatePasswordStrength enforce security rules', () => {
  assert.equal(validateEmailFormat('principal@school.edu'), true);
  assert.equal(validateEmailFormat('not-an-email'), false);
  assert.ok(validatePasswordStrength('short') !== null);
  assert.equal(validatePasswordStrength('SchoolAdmin2026!'), null);
});
