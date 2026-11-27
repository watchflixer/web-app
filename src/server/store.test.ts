import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AttendanceStore } from './store.ts';
import { createSessionToken, verifySessionToken } from './auth.ts';

function makeTempDbPath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'campusgate-test-'));
  return path.join(dir, 'db.json');
}

test('single-admin setup locks after first claim, supports login, password change, and token revocation', () => {
  const dbPath = makeTempDbPath();
  const store = new AttendanceStore(dbPath);

  assert.equal(store.getAuthMetadata().needsSetup, true);

  const claim1 = store.setupInitialAdmin('admin@school.edu', 'InitialPass2026!');
  assert.equal(claim1.ok, true);

  // Second registration attempt must be rejected
  const claim2 = store.setupInitialAdmin('intruder@school.edu', 'HackerPass123!');
  assert.equal(claim2.ok, false);
  if (!claim2.ok) {
    assert.equal(claim2.status, 403);
  }

  // Verify credentials
  const badLogin = store.verifyAdminCredentials('admin@school.edu', 'WrongPass');
  assert.equal(badLogin.ok, false);

  const goodLogin = store.verifyAdminCredentials('admin@school.edu', 'InitialPass2026!');
  assert.equal(goodLogin.ok, true);

  if (goodLogin.ok) {
    const tokenV1 = createSessionToken(goodLogin.email, goodLogin.tokenVersion);
    assert.ok(verifySessionToken(tokenV1, 'admin@school.edu', store.getAuthMetadata().tokenVersion));

    // Change password rotates tokenVersion and invalidates old token
    const changed = store.changeAdminPassword('InitialPass2026!', 'NewSchoolPass2026!');
    assert.equal(changed.ok, true);
    assert.equal(
      verifySessionToken(tokenV1, 'admin@school.edu', store.getAuthMetadata().tokenVersion),
      null
    );

    const oldPassCheck = store.verifyAdminCredentials('admin@school.edu', 'InitialPass2026!');
    assert.equal(oldPassCheck.ok, false);

    const newPassCheck = store.verifyAdminCredentials('admin@school.edu', 'NewSchoolPass2026!');
    assert.equal(newPassCheck.ok, true);
  }
});

test('RFID tap records Time In then Time Out, and removal scopes handle proxy taps cleanly', () => {
  const dbPath = makeTempDbPath();
  const store = new AttendanceStore(dbPath);

  const student = store.addStudent({
    studentId: '2026-8801',
    fullName: 'Paolo Fernandez',
    gradeSection: 'Grade 10 - Galileo',
    rfidUid: 'RF-9900-1122',
    registrationMode: 'rfid',
  });

  // First RFID tap -> Time In
  const tapIn = store.recordRfidTap({ rfidUid: 'rf-9900-1122', date: '2026-11-26', time: '07:15' });
  assert.equal(tapIn.ok, true);
  if (tapIn.ok) {
    assert.equal(tapIn.action, 'time_in');
    assert.equal(tapIn.record.timeIn, '07:15');
    assert.equal(tapIn.record.timeOut, null);
  }

  // Second RFID tap -> Time Out
  const tapOut = store.recordRfidTap({ rfidUid: 'RF-9900-1122', date: '2026-11-26', time: '16:00' });
  assert.equal(tapOut.ok, true);
  if (tapOut.ok) {
    assert.equal(tapOut.action, 'time_out');
    assert.equal(tapOut.record.timeOut, '16:00');

    // Clear only Time Out
    const clearOut = store.removeAttendanceRecord({
      recordId: tapOut.record.id,
      scope: 'time_out',
      reason: 'Accidental / Duplicate tap',
      removedByEmail: 'admin@school.edu',
    });
    assert.equal(clearOut.ok, true);
    if (clearOut.ok) {
      assert.equal(clearOut.remainingRecord?.timeOut, null);
      assert.equal(clearOut.remainingRecord?.timeIn, '07:15');
    }

    // Remove entire record (fraudulent proxy tap when student was absent)
    const removeFull = store.removeAttendanceRecord({
      recordId: tapOut.record.id,
      scope: 'full',
      reason: 'Proxy tap / Classmate tapped ID (Absent)',
      notes: 'Student was confirmed absent in class.',
      removedByEmail: 'admin@school.edu',
    });
    assert.equal(removeFull.ok, true);
    if (removeFull.ok) {
      assert.equal(removeFull.remainingRecord, null);
      assert.equal(removeFull.auditEntry.studentInternalId, student.id);
      assert.equal(removeFull.auditEntry.removedTimeIn, '07:15');
    }
  }
});
