import { Clock, History, LogOut, Search, Trash2 } from 'lucide-react';
import type { AttendanceFilters, AttendanceRecord, AttendanceStatus, Student } from '../types/attendance';
import { computeAttendanceStatus, formatTimeDisplay } from '../utils/attendanceLogic';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  studentsById: Map<string, Student>;
  gradeSections: string[];
  filters: AttendanceFilters;
  todayDate: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  onChangeFilters: (next: AttendanceFilters) => void;
  onSelectStudentHistory: (student: Student) => void;
  onQuickTimeOut: (record: AttendanceRecord) => void;
  onRequestRemove: (record: AttendanceRecord, student: Student) => void;
  onOpenLogAttendance: () => void;
}

function getStatusTextClass(status: AttendanceStatus): string {
  switch (status) {
    case 'Completed':
      return 'text-emerald-700 font-medium';
    case 'On Campus':
      return 'text-blue-700 font-medium';
    case 'On Campus (Late)':
    case 'Late':
      return 'text-amber-700 font-medium';
    case 'Time Out Only':
      return 'text-slate-600 font-medium';
  }
}

export function AttendanceTable({
  records,
  studentsById,
  gradeSections,
  filters,
  todayDate,
  isLoading,
  isAuthenticated,
  onChangeFilters,
  onSelectStudentHistory,
  onQuickTimeOut,
  onRequestRemove,
  onOpenLogAttendance,
}: AttendanceTableProps) {
  return (
    <section aria-label="Student attendance logs" className="bg-white border border-slate-200 rounded-lg">
      {/* Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="attendance-search" className="sr-only">
              Search student name, ID, or RFID UID
            </label>
            <input
              id="attendance-search"
              type="search"
              value={filters.search}
              onChange={(e) => onChangeFilters({ ...filters, search: e.target.value })}
              placeholder="Search name, Student ID, or RFID UID..."
              className="w-full pl-9 pr-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="attendance-date-filter" className="sr-only">
              Filter by date
            </label>
            <select
              id="attendance-date-filter"
              value={filters.date === 'all' || filters.date === todayDate ? filters.date : 'custom'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  onChangeFilters({ ...filters, date: 'all' });
                } else if (val === todayDate) {
                  onChangeFilters({ ...filters, date: todayDate });
                }
              }}
              className="px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-700"
            >
              <option value={todayDate}>Today ({todayDate})</option>
              <option value="all">All Dates</option>
              {filters.date !== 'all' && filters.date !== todayDate && (
                <option value="custom">{filters.date}</option>
              )}
            </select>

            <label htmlFor="attendance-date-picker" className="sr-only">
              Specific date
            </label>
            <input
              id="attendance-date-picker"
              type="date"
              value={filters.date === 'all' ? '' : filters.date}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  date: e.target.value ? e.target.value : 'all',
                })
              }
              aria-label="Select specific date"
              className="px-3 py-2 min-h-[40px] text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="flex items-center">
            <label htmlFor="grade-filter" className="sr-only">
              Filter by grade and section
            </label>
            <select
              id="grade-filter"
              value={filters.gradeSection}
              onChange={(e) => onChangeFilters({ ...filters, gradeSection: e.target.value })}
              className="px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-700"
            >
              <option value="all">All Sections</option>
              {gradeSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start lg:self-auto"
          role="group"
          aria-label="Filter by attendance status"
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'on_campus', label: 'On Campus' },
              { id: 'completed', label: 'Timed Out' },
              { id: 'late', label: 'Late' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeFilters({ ...filters, status: item.id })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filters.status === item.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
              <th className="py-3 px-3.5 whitespace-nowrap">Student</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Grade &amp; Section</th>
              <th className="py-3 px-3.5 whitespace-nowrap">RFID Card</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Date</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Time In</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Time Out</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
              <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-3.5" colSpan={8}>
                    <div className="h-5 bg-slate-100 rounded animate-pulse w-full" />
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 px-6 text-center">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-900">No attendance logs match these filters</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try clearing the search query or switching the date filter to All Dates.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeFilters({
                          search: '',
                          date: 'all',
                          status: 'all',
                          gradeSection: 'all',
                        })
                      }
                      className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      Show All Dates
                    </button>
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={onOpenLogAttendance}
                        className="px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
                      >
                        Log Time In / Out
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const student = studentsById.get(record.studentInternalId);
                if (!student) return null;
                const status = computeAttendanceStatus(record.timeIn, record.timeOut);

                return (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectStudentHistory(student)}
                        className="text-left group focus-visible:outline-2 focus-visible:outline-blue-700 rounded"
                      >
                        <span className="block font-medium text-slate-900 whitespace-nowrap group-hover:text-blue-700 group-hover:underline">
                          {student.fullName}
                        </span>
                        <span className="block text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                          ID {student.studentId}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                      {student.gradeSection}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {student.rfidUid ? (
                        <span className="font-mono tabular-nums text-xs text-slate-700">
                          {student.rfidUid}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Manual Only</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                      {record.date}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="block font-mono tabular-nums text-slate-900">
                        {formatTimeDisplay(record.timeIn)}
                      </span>
                      {record.timeInSource && (
                        <span className="block text-xs text-slate-500">{record.timeInSource}</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="block font-mono tabular-nums text-slate-900">
                        {formatTimeDisplay(record.timeOut)}
                      </span>
                      {record.timeOutSource && (
                        <span className="block text-xs text-slate-500">{record.timeOutSource}</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className={`text-xs ${getStatusTextClass(status)}`}>{status}</span>
                      {record.notes && (
                        <span className="block text-xs text-slate-500 max-w-[160px] truncate" title={record.notes}>
                          {record.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
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

                        {isAuthenticated && record.timeIn && !record.timeOut && (
                          <button
                            type="button"
                            onClick={() => onQuickTimeOut(record)}
                            aria-label={`Log time out for ${student.fullName}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 whitespace-nowrap shrink-0"
                          >
                            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Time Out</span>
                          </button>
                        )}

                        {isAuthenticated && (
                          <button
                            type="button"
                            onClick={() => onRequestRemove(record, student)}
                            aria-label={`Remove or delete log for ${student.fullName} on ${record.date}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 whitespace-nowrap shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Remove</span>
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
