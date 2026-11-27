import { useState } from 'react';
import type { FormEvent } from 'react';
import { Lock, X } from 'lucide-react';
import { loginAdmin, setupInitialAdmin } from '../services/api';

interface AdminAuthModalProps {
  isOpen: boolean;
  needsSetup: boolean;
  onClose: () => void;
  onSuccess: (payload: { token: string; adminEmail: string; envManaged: boolean }) => void;
}

export function AdminAuthModal({
  isOpen,
  needsSetup,
  onClose,
  onSuccess,
}: AdminAuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (needsSetup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const result = needsSetup
        ? await setupInitialAdmin(email.trim(), password)
        : await loginAdmin(email.trim(), password);
      setPassword('');
      setConfirmPassword('');
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-auth-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <h2 id="admin-auth-title" className="text-base font-semibold text-slate-900">
              {needsSetup ? 'Initialize School Admin Account' : 'School Administrator Login'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close login modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {needsSetup
              ? 'Set the single authorized school administrator email and password. Once configured, public sign-up is permanently locked for school security.'
              : 'Sign in with the single authorized school administrator email and password. Public registration is disabled.'}
          </p>

          {error && (
            <div
              role="alert"
              className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="admin-email-input" className="block text-xs font-medium text-slate-700 mb-1.5">
              Administrator Email
            </label>
            <input
              id="admin-email-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@school.edu"
              className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label htmlFor="admin-password-input" className="block text-xs font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="admin-password-input"
              type="password"
              required
              minLength={needsSetup ? 8 : 1}
              autoComplete={needsSetup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={needsSetup ? 'Minimum 8 characters' : 'Enter password'}
              className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          {needsSetup && (
            <div>
              <label htmlFor="admin-confirm-password-input" className="block text-xs font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                id="admin-confirm-password-input"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
              />
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
              className="px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting
                ? 'Verifying...'
                : needsSetup
                  ? 'Save Admin Account'
                  : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
