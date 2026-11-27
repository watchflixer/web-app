import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CreditCard, UserPlus, X } from 'lucide-react';
import type { RegistrationMode, Student } from '../types/attendance';
import { createStudent, updateStudent } from '../services/api';

interface StudentFormModalProps {
  isOpen: boolean;
  token: string | null;
  editingStudent: Student | null;
  onClose: () => void;
  onSaved: (student: Student, isEdit: boolean) => void;
}

export function StudentFormModal({
  isOpen,
  token,
  editingStudent,
  onClose,
  onSaved,
}: StudentFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gradeSection, setGradeSection] = useState('');
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>('rfid');
  const [rfidUid, setRfidUid] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingStudent) {
      setFullName(editingStudent.fullName);
      setStudentId(editingStudent.studentId);
      setGradeSection(editingStudent.gradeSection);
      setRegistrationMode(editingStudent.rfidUid ? 'rfid' : editingStudent.registrationMode);
      setRfidUid(editingStudent.rfidUid ?? '');
      setGuardianContact(editingStudent.guardianContact ?? '');
    } else {
      setFullName('');
      setStudentId('');
      setGradeSection('');
      setRegistrationMode('rfid');
      setRfidUid('');
      setGuardianContact('');
    }
  }, [isOpen, editingStudent]);

  if (!isOpen || !token) return null;

  function generateSampleCardUid() {
    const hex = Math.random().toString(16).slice(2, 6).toUpperCase();
    const tail = Math.random().toString(16).slice(2, 6).toUpperCase();
    setRfidUid(`RF-${hex}-${tail}`);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        gradeSection: gradeSection.trim(),
        registrationMode,
        rfidUid: registrationMode === 'rfid' ? rfidUid.trim().toUpperCase() : '',
        guardianContact: guardianContact.trim() || undefined,
      };
      if (editingStudent) {
        const res = await updateStudent(token!, editingStudent.id, payload);
        onSaved(res.student, true);
      } else {
        const res = await createStudent(token!, payload);
        onSaved(res.student, false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student record.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-form-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <h2 id="student-form-title" className="text-base font-semibold text-slate-900">
              {editingStudent ? 'Edit Student & RFID Card' : 'Add Student Information'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close student form"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student-fullname-input" className="block text-xs font-medium text-slate-700 mb-1.5">
                Student Full Name
              </label>
              <input
                id="student-fullname-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Elena Cruz"
                className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label htmlFor="student-id-input" className="block text-xs font-medium text-slate-700 mb-1.5">
                Student ID / LRN
              </label>
              <input
                id="student-id-input"
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 2026-1009"
                className="w-full px-3 py-2 min-h-[40px] text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student-grade-input" className="block text-xs font-medium text-slate-700 mb-1.5">
                Grade &amp; Section
              </label>
              <input
                id="student-grade-input"
                type="text"
                required
                value={gradeSection}
                onChange={(e) => setGradeSection(e.target.value)}
                placeholder="e.g. Grade 10 - Einstein"
                className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label htmlFor="student-guardian-input" className="block text-xs font-medium text-slate-700 mb-1.5">
                Guardian Contact (Optional)
              </label>
              <input
                id="student-guardian-input"
                type="text"
                value={guardianContact}
                onChange={(e) => setGuardianContact(e.target.value)}
                placeholder="e.g. 0917-555-0199"
                className="w-full px-3 py-2 min-h-[40px] text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              Registration Mode
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setRegistrationMode('rfid')}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                  registrationMode === 'rfid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assign RFID Card
              </button>
              <button
                type="button"
                onClick={() => setRegistrationMode('manual')}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                  registrationMode === 'manual'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manual Only (No Card)
              </button>
            </div>
          </div>

          {registrationMode === 'rfid' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="student-rfid-input" className="text-xs font-medium text-slate-700">
                  RFID Card UID (Tap USB Reader or Enter Manually)
                </label>
                <button
                  type="button"
                  onClick={generateSampleCardUid}
                  className="text-xs font-medium text-blue-700 hover:underline"
                >
                  Generate Card UID
                </button>
              </div>
              <div className="relative">
                <CreditCard
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="student-rfid-input"
                  type="text"
                  required
                  value={rfidUid}
                  onChange={(e) => setRfidUid(e.target.value.toUpperCase())}
                  placeholder="e.g. RF-8842-109A"
                  className="w-full pl-9 pr-3 py-2 min-h-[40px] text-sm font-mono tabular-nums uppercase bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>
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
              {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
