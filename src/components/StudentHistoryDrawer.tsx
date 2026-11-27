import { Trash2, X } from 'lucide-react';
import type { AttendanceRecord, RemovalAuditEntry, Student } from '../types/attendance';
import {
  computeAttendanceStatus,
  computeStudentSummary,
  formatTimeDisplay,
} from '../utils/attendanceLogic';

interface StudentHistoryDrawerProps {
  student: Student | null;
  records: AttendanceRecord[];
  auditLogs: RemovalAuditEntry[];
  isAuthenticated: boolean;
  onClose: () => void;
  onRequestRemove: (record: AttendanceRecord, student: Student) => void;
}

export function StudentHistoryDrawer({
  student,
  records,
  auditLogs,
  isAuthenticated,
  onClose,
  onRequestRemove,
}: StudentHistoryDrawerProps) {
  if (!student) return null;

  const studentRecords = records
    .filter((r) => r.studentInternalId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const studentAudits = auditLogs
    .filter((a) => a.studentInternalId === student.id)
    .sort((a, b) => b.removedAt.localeCompare(a.removedAt));

  const summary = computeStudentSummary(records, student.id, auditLogs);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
    >
      <div className="w-full max-w-xl bg-white h-full border-l border-slate-200 flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h2 id="history-drawer-title" className="text-lg font-semibold text-slate-900">
              {student.fullName}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-mono tabular-nums">ID {student.studentId}</span>
              <span aria-hidden="true"> · </span>
              <span>{student.gradeSection}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono tabular-nums">
                {student.rfidUid ? `RFID ${student.rfidUid}` : 'Manual Registration'}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close student history"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Student Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="p-3">
              <p className="text-xs text-slate-500">Days Logged</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 font-mono tabular-nums">
                {summary.totalDaysLogged}
              </p>
            </div>
            <div className="p-3 border-l border-slate-200 sm:border-l-0">
              <p className="text-xs text-slate-500">Avg. Time In</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 font-mono tabular-nums">
                {summary.averageTimeIn ? formatTimeDisplay(summary.averageTimeIn) : '—'}
              </p>
            </div>
            <div className="p-3">
              <p className="text-xs text-slate-500">Late Entries</p>
              <p className="mt-1 text-lg font-semibold text-amber-700 font-mono tabular-nums">
                {summary.lateCount}
              </p>
            </div>
            <div className="p-3 border-l border-slate-200 sm:border-l-0">
              <p className="text-xs text-slate-500">Voided Logs</p>
              <p className="mt-1 text-lg font-semibold text-red-700 font-mono tabular-nums">
                {summary.removedCount}
              </p>
            </div>
          </div>

          {/* Chronological Attendance History */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Time In &amp; Time Out History
            </h3>
            {studentRecords.length === 0 ? (
              <div className="border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-500">
                No active attendance records found for this student.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {studentRecords.map((rec) => {
                  const status = computeAttendanceStatus(rec.timeIn, rec.timeOut);
                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono tabular-nums font-semibold text-slate-900">
                            {rec.date}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-slate-600 font-medium">{status}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
                          <span>In: {formatTimeDisplay(rec.timeIn)}</span>
                          {rec.timeInSource && (
                            <span className="font-sans text-slate-400"> ({rec.timeInSource})</span>
                          )}
                          <span aria-hidden="true" className="mx-2 text-slate-300">/</span>
                          <span>Out: {formatTimeDisplay(rec.timeOut)}</span>
                          {rec.timeOutSource && (
                            <span className="font-sans text-slate-400"> ({rec.timeOutSource})</span>
                          )}
                        </div>
                        {rec.notes && (
                          <p className="mt-1 text-xs text-slate-500">{rec.notes}</p>
                        )}
                      </div>

                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => onRequestRemove(rec, student)}
                          aria-label={`Remove entry on ${rec.date} for ${student.fullName}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 whitespace-nowrap shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Removed/Voided entries for this student (visible when Admin is signed in) */}
          {isAuthenticated && studentAudits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Removed / Voided Entries
              </h3>
              <div className="border border-red-200 rounded-lg divide-y divide-red-100 bg-red-50/30">
                {studentAudits.map((audit) => (
                  <div key={audit.id} className="p-3.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        {audit.date}
                      </span>
                      <span className="text-red-700 font-medium">{audit.reason}</span>
                    </div>
                    <p className="mt-1 font-mono tabular-nums text-slate-600">
                      {audit.removedTimeIn ? `Removed In: ${formatTimeDisplay(audit.removedTimeIn)}` : ''}
                      {audit.removedTimeIn && audit.removedTimeOut ? ' · ' : ''}
                      {audit.removedTimeOut ? `Removed Out: ${formatTimeDisplay(audit.removedTimeOut)}` : ''}
                    </p>
                    {audit.notes && <p className="mt-1 text-slate-500">{audit.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
