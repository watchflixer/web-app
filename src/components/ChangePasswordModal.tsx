import { useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound, X } from 'lucide-react';
import { changeAdminPassword } from '../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  token: string | null;
  adminEmail: string | null;
  onClose: () => void;
  onSuccess: (nextToken: string) => void;
}

export function ChangePasswordModal({
  isOpen,
  token,
  adminEmail,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !token) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await changeAdminPassword(token!, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <h2 id="change-password-title" className="text-base font-semibold text-slate-900">
              Change Administrator Password
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close change password modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Updating password for <span className="font-medium text-slate-900">{adminEmail}</span>. Previous sessions will be invalidated automatically.
          </p>

          {error && (
            <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="current-password-input" className="block text-xs font-medium text-slate-700 mb-1.5">
              Current Password
            </label>
            <input
              id="current-password-input"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label htmlFor="new-password-input" className="block text-xs font-medium text-slate-700 mb-1.5">
              New Password
            </label>
            <input
              id="new-password-input"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label htmlFor="confirm-new-password-input" className="block text-xs font-medium text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="confirm-new-password-input"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 min-h-[40px] text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
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
              className="px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
