import { useState } from 'react';
import { CreditCard, History, Pencil, Plus, Search } from 'lucide-react';
import type { AttendanceRecord, Student } from '../types/attendance';

interface StudentDirectoryProps {
  students: Student[];
  records: AttendanceRecord[];
  isAuthenticated: boolean;
  onSelectStudentHistory: (student: Student) => void;
  onOpenAddStudent: () => void;
  onOpenEditStudent: (student: Student) => void;
}

export function StudentDirectory({
  students,
  records,
  isAuthenticated,
  onSelectStudentHistory,
  onOpenAddStudent,
  onOpenEditStudent,
}: StudentDirectoryProps) {
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'rfid' | 'manual'>('all');

  const filtered = students.filter((s) => {
    if (modeFilter === 'rfid' && !s.rfidUid) return false;
    if (modeFilter === 'manual' && s.rfidUid) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.gradeSection.toLowerCase().includes(q) ||
      (s.rfidUid ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <section aria-label="Registered students directory" className="bg-white border border-slate-200 rounded-lg">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="directory-search" className="sr-only">
              Search registered students
            </label>
            <input
              id="directory-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student name, ID, section, or RFID..."
              className="w-full pl-9 pr-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
            role="group"
            aria-label="Filter by card registration type"
          >
            {(
              [
                { id: 'all', label: 'All Students' },
                { id: 'rfid', label: 'RFID Linked' },
                { id: 'manual', label: 'Manual Only' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModeFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  modeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={onOpenAddStudent}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Student</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
              <th className="py-3 px-4 whitespace-nowrap">Student ID / LRN</th>
              <th className="py-3 px-4 whitespace-nowrap">Full Name</th>
              <th className="py-3 px-4 whitespace-nowrap">Grade &amp; Section</th>
              <th className="py-3 px-4 whitespace-nowrap">RFID Card UID</th>
              <th className="py-3 px-4 whitespace-nowrap">Registration</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Logged Days</th>
              {isAuthenticated && <th className="py-3 px-4 whitespace-nowrap">Guardian Contact</th>}
              <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAuthenticated ? 8 : 7} className="py-12 px-6 text-center">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-900">No students match your search</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Register a new student with an RFID card or as a manual-entry record.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((student) => {
                const loggedDays = records.filter((r) => r.studentInternalId === student.id).length;
                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                      {student.studentId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {student.fullName}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {student.gradeSection}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {student.rfidUid ? (
                        <span className="font-mono tabular-nums text-xs text-slate-900">
                          {student.rfidUid}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {student.rfidUid ? 'RFID Card' : 'Manual Record'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                      {loggedDays}
                    </td>
                    {isAuthenticated && (
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {student.guardianContact || '—'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectStudentHistory(student)}
                          aria-label={`View history for ${student.fullName}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          <History className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>History</span>
                        </button>
                        {isAuthenticated && (
                          <button
                            type="button"
                            onClick={() => onOpenEditStudent(student)}
                            aria-label={`Edit or bind RFID card for ${student.fullName}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 whitespace-nowrap shrink-0"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{student.rfidUid ? 'Edit' : 'Bind RFID'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
