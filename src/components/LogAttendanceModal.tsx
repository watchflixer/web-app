import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CreditCard, X } from 'lucide-react';
import type { Student } from '../types/attendance';
import { recordManualAttendance, recordRfidTap } from '../services/api';

interface LogAttendanceModalProps {
  isOpen: boolean;
  token: string | null;
  students: Student[];
  todayDate: string;
  onClose: () => void;
  onLogged: (message: string) => void;
}

function getCurrentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function LogAttendanceModal({
  isOpen,
  token,
  students,
  todayDate,
  onClose,
  onLogged,
}: LogAttendanceModalProps) {
  const [mode, setMode] = useState<'rfid' | 'manual'>('rfid');
  const [rfidUid, setRfidUid] = useState('');
  const [tapDate, setTapDate] = useState(todayDate);
  const [tapTime, setTapTime] = useState(getCurrentTimeHHMM());

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [manualDate, setManualDate] = useState(todayDate);
  const [manualTimeIn, setManualTimeIn] = useState(getCurrentTimeHHMM());
  const [manualTimeOut, setManualTimeOut] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setRfidUid('');
    setTapDate(todayDate);
    setTapTime(getCurrentTimeHHMM());
    setManualDate(todayDate);
    setManualTimeIn(getCurrentTimeHHMM());
    setManualTimeOut('');
    setManualNotes('');
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [isOpen, todayDate, students, selectedStudentId]);

  if (!isOpen || !token) return null;

  const rfidStudents = students.filter((s) => Boolean(s.rfidUid));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'rfid') {
        const res = await recordRfidTap(token!, {
          rfidUid: rfidUid.trim().toUpperCase(),
          date: tapDate,
          time: tapTime,
        });
        const label = res.action === 'time_in' ? 'Time In' : 'Time Out';
        onLogged(`Recorded ${label} via RFID for ${res.student.fullName}.`);
      } else {
        if (!selectedStudentId) {
          setError('Please select a student.');
          setSubmitting(false);
          return;
        }
        await recordManualAttendance(token!, {
          studentInternalId: selectedStudentId,
          date: manualDate,
          timeIn: manualTimeIn || null,
          timeOut: manualTimeOut || null,
          notes: manualNotes.trim() || undefined,
        });
        const studentName = students.find((s) => s.id === selectedStudentId)?.fullName ?? 'student';
        onLogged(`Saved manual attendance entry for ${studentName}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record attendance.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-attendance-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <h2 id="log-attendance-title" className="text-base font-semibold text-slate-900">
              Record Time In / Time Out
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close record attendance modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('rfid');
                setError(null);
              }}
              className={`py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                mode === 'rfid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RFID Card Reader Tap
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('manual');
                setError(null);
              }}
              className={`py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                mode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manual Student Entry
            </button>
          </div>

          {error && (
            <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {mode === 'rfid' ? (
            <>
              <p className="text-xs text-slate-600">
                Scan an RFID card UID (or select a registered card below). First tap logs Time In; second tap on the same date logs Time Out.
              </p>

              <div>
                <label htmlFor="rfid-tap-input" className="block text-xs font-medium text-slate-700 mb-1.5">
                  RFID Card UID
                </label>
                <input
                  id="rfid-tap-input"
                  type="text"
                  required
                  value={rfidUid}
                  onChange={(e) => setRfidUid(e.target.value.toUpperCase())}
                  placeholder="Scan or enter e.g. RF-8842-109A"
                  className="w-full px-3 py-2 min-h-[40px] text-sm font-mono tabular-nums uppercase bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                />
                {rfidStudents.length > 0 && (
                  <div className="mt-2">
                    <label htmlFor="rfid-quick-pick" className="block text-xs text-slate-500 mb-1">
                      Or quick-pick a registered RFID card:
                    </label>
                    <select
                      id="rfid-quick-pick"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setRfidUid(e.target.value);
                      }}
                      className="w-full px-3 py-2 min-h-[38px] text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-700"
                    >
                      <option value="">Select student RFID card...</option>
                      {rfidStudents.map((s) => (
                        <option key={s.id} value={s.rfidUid ?? ''}>
                          {s.rfidUid} — {s.fullName} ({s.gradeSection})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rfid-tap-date" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Date
                  </label>
                  <input
                    id="rfid-tap-date"
                    type="date"
                    required
                    value={tapDate}
                    onChange={(e) => setTapDate(e.target.value)}
                    className="w-full px-3 py-2 min-h-[40px] text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label htmlFor="rfid-tap-time" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Tap Time
                  </label>
                  <input
                    id="rfid-tap-time"
                    type="time"
                    required
                    value={tapTime}
                    onChange={(e) => setTapTime(e.target.value)}
                    className="w-full px-3 py-2 min-h-[40px] text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="manual-student-select" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Student
                </label>
                <select
                  id="manual-student-select"
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentId} · {s.gradeSection})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="manual-date" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Date
                  </label>
                  <input
                    id="manual-date"
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 min-h-[40px] text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label htmlFor="manual-time-in" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Time In
                  </label>
                  <input
                    id="manual-time-in"
                    type="time"
                    value={manualTimeIn}
                    onChange={(e) => setManualTimeIn(e.target.value)}
                    className="w-full px-3 py-2 min-h-[40px] text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label htmlFor="manual-time-out" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Time Out (Optional)
                  </label>
                  <input
                    id="manual-time-out"
                    type="time"
                    value={manualTimeOut}
                    onChange={(e) => setManualTimeOut(e.target.value)}
                    className="w-full px-3 py-2 min-h-[40px] text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="manual-notes" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Admin Note (Optional)
                </label>
                <input
                  id="manual-notes"
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Forgot RFID card, verified at gate"
                  className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>
            </>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[40px] text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
            >
              {submitting ? 'Recording...' : mode === 'rfid' ? 'Record RFID Tap' : 'Save Manual Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
