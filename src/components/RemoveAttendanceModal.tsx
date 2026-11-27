import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Trash2, X } from 'lucide-react';
import type { AttendanceRecord, RemovalScope, Student } from '../types/attendance';
import { formatTimeDisplay } from '../utils/attendanceLogic';
import { removeAttendanceEntry } from '../services/api';

interface RemoveAttendanceModalProps {
  target: { record: AttendanceRecord; student: Student } | null;
  token: string | null;
  onClose: () => void;
  onRemoved: (message: string) => void;
}

const REMOVAL_REASONS = [
  'Proxy tap / Classmate tapped ID (Absent)',
  'Accidental / Duplicate card tap',
  'Card reader malfunction / Wrong student',
  'Administrative correction',
];

export function RemoveAttendanceModal({
  target,
  token,
  onClose,
  onRemoved,
}: RemoveAttendanceModalProps) {
  const [scope, setScope] = useState<RemovalScope>('full');
  const [reason, setReason] = useState(REMOVAL_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!target) return;
    setScope('full');
    setReason(REMOVAL_REASONS[0]);
    setNotes('');
    setError(null);
  }, [target]);

  if (!target || !token) return null;

  const { record, student } = target;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await removeAttendanceEntry(token!, record.id, {
        scope,
        reason,
        notes: notes.trim() || undefined,
      });
      onRemoved(`Removed attendance entry for ${student.fullName} (${record.date}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove attendance record.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-attendance-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-700" aria-hidden="true" />
            <h2 id="remove-attendance-title" className="text-base font-semibold text-slate-900">
              Remove Time In / Time Out Record
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close remove record modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <p className="font-semibold text-slate-900">{student.fullName}</p>
            <p className="mt-1 text-slate-600 font-mono tabular-nums">
              {record.date} · In: {formatTimeDisplay(record.timeIn)} · Out: {formatTimeDisplay(record.timeOut)}
            </p>
          </div>

          {error && (
            <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-slate-700 mb-1">
              What should be removed?
            </legend>

            <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="radio"
                name="removal-scope"
                value="full"
                checked={scope === 'full'}
                onChange={() => setScope('full')}
                className="mt-0.5"
              />
              <span className="text-xs">
                <span className="block font-medium text-slate-900">
                  Delete Entire Record (Student was Absent / Proxy Tap)
                </span>
                <span className="block text-slate-500">
                  Removes both Time In and Time Out so the student is not marked present.
                </span>
              </span>
            </label>

            {record.timeOut && (
              <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="removal-scope"
                  value="time_out"
                  checked={scope === 'time_out'}
                  onChange={() => setScope('time_out')}
                  className="mt-0.5"
                />
                <span className="text-xs">
                  <span className="block font-medium text-slate-900">
                    Clear Time Out Only ({formatTimeDisplay(record.timeOut)})
                  </span>
                  <span className="block text-slate-500">
                    Keeps Time In and reverts student status back to On Campus.
                  </span>
                </span>
              </label>
            )}

            {record.timeIn && (
              <label className="flex items-start gap-2.5 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="removal-scope"
                  value="time_in"
                  checked={scope === 'time_in'}
                  onChange={() => setScope('time_in')}
                  className="mt-0.5"
                />
                <span className="text-xs">
                  <span className="block font-medium text-slate-900">
                    Clear Time In Only ({formatTimeDisplay(record.timeIn)})
                  </span>
                  <span className="block text-slate-500">
                    Removes only the Time In entry if it was tapped erroneously.
                  </span>
                </span>
              </label>
            )}
          </fieldset>

          <div>
            <label htmlFor="removal-reason-select" className="block text-xs font-medium text-slate-700 mb-1.5">
              Reason for Removal
            </label>
            <select
              id="removal-reason-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
            >
              {REMOVAL_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="removal-notes-input" className="block text-xs font-medium text-slate-700 mb-1.5">
              Verification Note (Optional)
            </label>
            <textarea
              id="removal-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Teacher confirmed student was absent; classmate tapped ID."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

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
              className="px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-60"
            >
              {submitting ? 'Removing...' : 'Confirm Removal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
