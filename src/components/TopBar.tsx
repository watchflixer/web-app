import { KeyRound, LogIn, LogOut } from 'lucide-react';

export type ActiveTab = 'logs' | 'students' | 'audit';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isAuthenticated: boolean;
  adminEmail: string | null;
  envManaged: boolean;
  onOpenLogin: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export function TopBar({
  activeTab,
  onSelectTab,
  isAuthenticated,
  adminEmail,
  envManaged,
  onOpenLogin,
  onOpenChangePassword,
  onLogout,
}: TopBarProps) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('logs');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 rounded"
        >
          CampusGate
        </a>

        <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
          <button
            type="button"
            onClick={() => onSelectTab('logs')}
            className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'logs'
                ? 'border-blue-700 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Logs
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('students')}
            className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'students'
                ? 'border-blue-700 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Directory
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => onSelectTab('audit')}
              className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700 ${
                activeTab === 'audit'
                  ? 'border-blue-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Removal Audit
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Admin Login</span>
            </button>
          ) : (
            <>
              <span className="hidden lg:inline text-xs font-medium text-slate-500 max-w-[190px] truncate">
                {adminEmail}
              </span>
              {!envManaged && (
                <button
                  type="button"
                  onClick={onOpenChangePassword}
                  aria-label="Change Password"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sm:hidden">Password</span>
                  <span className="hidden sm:inline">Change Password</span>
                </button>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Log Out</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile navigation strip */}
      <nav
        className="flex md:hidden items-center gap-4 px-4 border-t border-slate-100 overflow-x-auto"
        aria-label="Mobile navigation"
      >
        <button
          type="button"
          onClick={() => onSelectTab('logs')}
          className={`py-3 text-xs font-medium border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === 'logs' ? 'border-blue-700 text-slate-900' : 'border-transparent text-slate-600'
          }`}
        >
          Attendance Logs
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('students')}
          className={`py-3 text-xs font-medium border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === 'students' ? 'border-blue-700 text-slate-900' : 'border-transparent text-slate-600'
          }`}
        >
          Student Directory
        </button>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => onSelectTab('audit')}
            className={`py-3 text-xs font-medium border-b-2 whitespace-nowrap shrink-0 ${
              activeTab === 'audit' ? 'border-blue-700 text-slate-900' : 'border-transparent text-slate-600'
            }`}
          >
            Removal Audit
          </button>
        )}
      </nav>
    </header>
  );
}
