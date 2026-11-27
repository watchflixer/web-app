import type { DashboardMetrics } from '../types/attendance';

interface MetricsStripProps {
  metrics: DashboardMetrics;
  activeDateLabel: string;
}

export function MetricsStrip({ metrics, activeDateLabel }: MetricsStripProps) {
  return (
    <section aria-label="Attendance summary metrics" className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500">Registered Students</p>
        <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
          {metrics.totalStudents}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {metrics.rfidStudents} with RFID card
        </p>
      </div>

      <div className="p-4 sm:p-5 border-l border-slate-200 lg:border-l-0">
        <p className="text-xs font-medium text-slate-500">Logs on {activeDateLabel}</p>
        <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
          {metrics.loggedOnDate}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Recorded entries
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500">Currently On Campus</p>
        <p className="mt-1.5 text-2xl font-semibold text-blue-700 font-mono tabular-nums">
          {metrics.currentlyOnCampus}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Awaiting Time Out
        </p>
      </div>

      <div className="p-4 sm:p-5 border-l border-slate-200 lg:border-l-0">
        <p className="text-xs font-medium text-slate-500">Removed / Voided Logs</p>
        <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
          {metrics.removedLogsCount}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Proxy or erroneous taps
        </p>
      </div>
    </section>
  );
}
