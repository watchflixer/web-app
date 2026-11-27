import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, UserPlus } from 'lucide-react';
import type {
  AttendanceFilters,
  AttendanceRecord,
  RemovalAuditEntry,
  Student,
} from './types/attendance';
import {
  computeDashboardMetrics,
  filterAttendanceRecords,
} from './utils/attendanceLogic';
import {
  fetchAuditLogs,
  fetchAuthStatus,
  fetchOverview,
  logoutAdmin,
  quickLogTimeOut,
} from './services/api';
import { TopBar, type ActiveTab } from './components/TopBar';
import { MetricsStrip } from './components/MetricsStrip';
import { AttendanceTable } from './components/AttendanceTable';
import { StudentDirectory } from './components/StudentDirectory';
import { RemovalAuditView } from './components/RemovalAuditView';
import { StudentHistoryDrawer } from './components/StudentHistoryDrawer';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { StudentFormModal } from './components/StudentFormModal';
import { LogAttendanceModal } from './components/LogAttendanceModal';
import { RemoveAttendanceModal } from './components/RemoveAttendanceModal';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);
  const [envManaged, setEnvManaged] = useState<boolean>(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [removalCount, setRemovalCount] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<RemovalAuditEntry[]>([]);
  const [todayDate, setTodayDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('logs');
  const [filters, setFilters] = useState<AttendanceFilters>({
    search: '',
    date: 'all',
    status: 'all',
    gradeSection: 'all',
  });

  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showLogAttendanceModal, setShowLogAttendanceModal] = useState<boolean>(false);
  const [removeTarget, setRemoveTarget] = useState<{ record: AttendanceRecord; student: Student } | null>(null);

  const isAuthenticated = Boolean(token);

  const loadData = useCallback(async (activeToken: string | null) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [authRes, overviewRes] = await Promise.all([
        fetchAuthStatus(activeToken),
        fetchOverview(activeToken),
      ]);

      setNeedsSetup(authRes.needsSetup);
      setEnvManaged(authRes.envManaged);
      if (authRes.authenticated && authRes.adminEmail) {
        setAdminEmail(authRes.adminEmail);
      } else if (!activeToken) {
        setAdminEmail(null);
      }

      setStudents(overviewRes.students);
      setRecords(overviewRes.records);
      setRemovalCount(overviewRes.removalCount);
      setTodayDate(overviewRes.todayDate);
      if (overviewRes.auditLogs) {
        setAuditLogs(overviewRes.auditLogs);
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load attendance records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(token);
  }, [loadData, token]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const studentsById = useMemo(() => {
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);

  const gradeSections = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.gradeSection))).sort();
  }, [students]);

  const filteredRecords = useMemo(() => {
    return filterAttendanceRecords(records, studentsById, filters);
  }, [records, studentsById, filters]);

  const metricDate = filters.date === 'all' ? todayDate : filters.date;
  const metrics = useMemo(() => {
    return computeDashboardMetrics(records, students, removalCount, metricDate);
  }, [records, students, removalCount, metricDate]);

  async function handleLogout() {
    if (token) {
      try {
        await logoutAdmin(token);
      } catch {
        // Clear local session state even if network call fails
      }
    }
    setToken(null);
    setAdminEmail(null);
    setAuditLogs([]);
    if (activeTab === 'audit') {
      setActiveTab('logs');
    }
    setFeedback({ type: 'success', text: 'Signed out of administrator session.' });
  }

  async function handleQuickTimeOut(record: AttendanceRecord) {
    if (!token) return;
    try {
      const res = await quickLogTimeOut(token, record.id);
      setRecords((prev) => prev.map((r) => (r.id === res.record.id ? res.record : r)));
      const stu = studentsById.get(record.studentInternalId);
      setFeedback({
        type: 'success',
        text: `Logged Time Out for ${stu?.fullName ?? 'student'} at ${res.record.timeOut}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to log Time Out.',
      });
    }
  }

  async function handleRefreshAfterMutation(message: string) {
    setFeedback({ type: 'success', text: message });
    await loadData(token);
    if (token) {
      try {
        const auditRes = await fetchAuditLogs(token);
        setAuditLogs(auditRes.auditLogs);
      } catch {
        // Ignore secondary audit refresh failure
      }
    }
  }

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isAuthenticated={isAuthenticated}
        adminEmail={adminEmail}
        envManaged={envManaged}
        onOpenLogin={() => setShowAuthModal(true)}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
        onLogout={() => void handleLogout()}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Page Header + Admin Primary Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              School Attendance &amp; RFID Log Viewer
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
              {isAuthenticated
                ? 'Administrator mode active. Register student RFID cards, log manual entries, and remove erroneous or proxy-tapped records.'
                : 'Read-only school viewing platform for recorded Time In and Time Out logs. Sign in as administrator to manage students and attendance records.'}
            </p>
          </div>

          {isAuthenticated && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setShowStudentModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>Add Student</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLogAttendanceModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                <CreditCard className="w-4 h-4" aria-hidden="true" />
                <span>Record Time In / Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Feedback / Error Banner */}
        {feedback && (
          <div
            role="status"
            className={`px-4 py-3 text-sm rounded-lg border flex items-center justify-between gap-4 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-medium underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {loadError && (
          <div role="alert" className="px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center justify-between">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void loadData(token)}
              className="text-xs font-medium underline"
            >
              Retry
            </button>
          </div>
        )}

        <MetricsStrip
          metrics={metrics}
          activeDateLabel={filters.date === 'all' ? `Today (${todayDate})` : filters.date}
        />

        {activeTab === 'logs' && (
          <AttendanceTable
            records={filteredRecords}
            studentsById={studentsById}
            gradeSections={gradeSections}
            filters={filters}
            todayDate={todayDate}
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            onChangeFilters={setFilters}
            onSelectStudentHistory={(student) => setHistoryStudent(student)}
            onQuickTimeOut={(rec) => void handleQuickTimeOut(rec)}
            onRequestRemove={(record, student) => setRemoveTarget({ record, student })}
            onOpenLogAttendance={() => setShowLogAttendanceModal(true)}
          />
        )}

        {activeTab === 'students' && (
          <StudentDirectory
            students={students}
            records={records}
            isAuthenticated={isAuthenticated}
            onSelectStudentHistory={(student) => setHistoryStudent(student)}
            onOpenAddStudent={() => {
              setEditingStudent(null);
              setShowStudentModal(true);
            }}
            onOpenEditStudent={(student) => {
              setEditingStudent(student);
              setShowStudentModal(true);
            }}
          />
        )}

        {activeTab === 'audit' && isAuthenticated && (
          <RemovalAuditView auditLogs={auditLogs} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>CampusGate School Attendance Viewing Platform</span>
          <span>Single-Admin Restricted Access · No Public Registration</span>
        </div>
      </footer>

      <StudentHistoryDrawer
        student={historyStudent}
        records={records}
        auditLogs={auditLogs}
        isAuthenticated={isAuthenticated}
        onClose={() => setHistoryStudent(null)}
        onRequestRemove={(record, student) => setRemoveTarget({ record, student })}
      />

      <AdminAuthModal
        isOpen={showAuthModal}
        needsSetup={needsSetup}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(res) => {
          setToken(res.token);
          setAdminEmail(res.adminEmail);
          setNeedsSetup(false);
          setEnvManaged(res.envManaged);
          setShowAuthModal(false);
          setFeedback({
            type: 'success',
            text: `Signed in as ${res.adminEmail}.`,
          });
        }}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        token={token}
        adminEmail={adminEmail}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={(nextToken) => {
          setToken(nextToken);
          setShowChangePasswordModal(false);
          setFeedback({
            type: 'success',
            text: 'Administrator password updated successfully.',
          });
        }}
      />

      <StudentFormModal
        isOpen={showStudentModal}
        token={token}
        editingStudent={editingStudent}
        onClose={() => {
          setShowStudentModal(false);
          setEditingStudent(null);
        }}
        onSaved={(student, isEdit) => {
          setShowStudentModal(false);
          setEditingStudent(null);
          void handleRefreshAfterMutation(
            isEdit
              ? `Updated student record for ${student.fullName}.`
              : `Registered student ${student.fullName}${student.rfidUid ? ` (RFID ${student.rfidUid})` : ' (Manual)'}.`
          );
        }}
      />

      <LogAttendanceModal
        isOpen={showLogAttendanceModal}
        token={token}
        students={students}
        todayDate={todayDate}
        onClose={() => setShowLogAttendanceModal(false)}
        onLogged={(msg) => {
          setShowLogAttendanceModal(false);
          void handleRefreshAfterMutation(msg);
        }}
      />

      <RemoveAttendanceModal
        target={removeTarget}
        token={token}
        onClose={() => setRemoveTarget(null)}
        onRemoved={(msg) => {
          setRemoveTarget(null);
          void handleRefreshAfterMutation(msg);
        }}
      />
    </div>
  );
}
