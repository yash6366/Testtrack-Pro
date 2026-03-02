import { useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function RequestRetestModal({ bugId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    note: '',
    expectedOutcome: '',
    testEnvironment: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.note.trim()) {
      setError('Please provide a note about the fix');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/developer/bugs/${bugId}/request-retest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request retest');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[var(--bg)] rounded-lg shadow-lg w-full max-w-md mx-4 text-center p-8">
          <div className="mb-4">
            <div className="inline-flex p-3 bg-emerald-500/10 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Retest Requested!</h2>
          <p className="text-[var(--muted)] mb-6">
            The tester has been notified and will verify your fix shortly.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg)] rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Request Bug Retest</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Ask the tester to verify your fix
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[var(--muted)] hover:text-[var(--text)] transition text-2xl leading-none disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-[var(--foreground)]">
              <strong>Tip:</strong> Provide clear details about what you fixed and how to verify it. 
              This helps the tester understand the fix and test it accurately.
            </p>
          </div>

          {/* Fix Summary */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              What Did You Fix? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Describe the fix, root cause, and changes made..."
              rows="4"
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              {formData.note.length}/500 characters
            </p>
          </div>

          {/* Expected Outcome */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              Expected Behavior After Fix
            </label>
            <textarea
              value={formData.expectedOutcome}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedOutcome: e.target.value }))}
              placeholder="Describe what should work correctly now..."
              rows="3"
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Test Environment */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              Recommended Test Environment
            </label>
            <select
              value={formData.testEnvironment}
              onChange={(e) => setFormData(prev => ({ ...prev, testEnvironment: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">Select environment...</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="STAGING">Staging</option>
              <option value="PRODUCTION">Production</option>
              <option value="UAT">UAT</option>
            </select>
          </div>

          {/* Test Steps Info */}
          <div className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
            <h4 className="text-sm font-semibold mb-2">Testing Checklist</h4>
            <ul className="text-xs text-[var(--muted)] space-y-1">
              <li>✓ Execute the original failing test case</li>
              <li>✓ Verify the bug no longer reproduces</li>
              <li>✓ Check for any side effects or regressions</li>
              <li>✓ Review the fix documentation and commit</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 bg-[var(--bg-elevated)] text-[var(--text)] rounded-lg hover:bg-[var(--bg-elevated-hover)] transition disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Requesting...
                </>
              ) : (
                <>
                  Request Retest
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
