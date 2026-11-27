import { ShieldAlert } from 'lucide-react';
import type { RemovalAuditEntry } from '../types/attendance';
import { formatTimeDisplay } from '../utils/attendanceLogic';

interface RemovalAuditViewProps {
  auditLogs: RemovalAuditEntry[];
}

function formatScopeLabel(scope: RemovalAuditEntry['scope']): string {
  switch (scope) {
    case 'full':
      return 'Full Record Removed';
    case 'time_out':
      return 'Time Out Cleared';
    case 'time_in':
      return 'Time In Cleared';
  }
}

export function RemovalAuditView({ auditLogs }: RemovalAuditViewProps) {
  return (
    <section aria-label="Removed and voided attendance audit log" className="bg-white border border-slate-200 rounded-lg">
      <div className="p-4 sm:p-5 border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-900">
          Removed &amp; Voided Attendance Audit Log
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Permanent record of Time In or Time Out entries removed due to proxy tapping (absent student), card reader error, or accidental double-taps.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
              <th className="py-3 px-4 whitespace-nowrap">Attendance Date</th>
              <th className="py-3 px-4 whitespace-nowrap">Student</th>
              <th className="py-3 px-4 whitespace-nowrap">Action Scope</th>
              <th className="py-3 px-4 whitespace-nowrap">Removed Times</th>
              <th className="py-3 px-4 whitespace-nowrap">Reason &amp; Notes</th>
              <th className="py-3 px-4 whitespace-nowrap">Removed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-6 text-center">
                  <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-900">No removed attendance records yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    When the administrator removes a fraudulent or erroneous tap, it will be logged here.
                  </p>
                </td>
              </tr>
            ) : (
              auditLogs.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                    {entry.date}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="block font-medium text-slate-900">{entry.studentName}</span>
                    <span className="block text-xs text-slate-500">
                      <span className="font-mono tabular-nums">{entry.studentId}</span> · {entry.gradeSection}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-red-700 whitespace-nowrap">
                    {formatScopeLabel(entry.scope)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                    {entry.removedTimeIn ? `In: ${formatTimeDisplay(entry.removedTimeIn)}` : ''}
                    {entry.removedTimeIn && entry.removedTimeOut ? ' · ' : ''}
                    {entry.removedTimeOut ? `Out: ${formatTimeDisplay(entry.removedTimeOut)}` : ''}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700 max-w-xs">
                    <span className="block font-medium text-slate-900">{entry.reason}</span>
                    {entry.notes && <span className="block text-slate-500 mt-0.5">{entry.notes}</span>}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                    <span className="block">{entry.removedByEmail}</span>
                    <span className="block font-mono tabular-nums text-slate-400">
                      {entry.removedAt.slice(0, 16).replace('T', ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
