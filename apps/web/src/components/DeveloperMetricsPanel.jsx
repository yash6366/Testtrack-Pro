import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { logError } from '@/lib/errorLogger';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Calendar,
} from 'lucide-react';

/**
 * Developer Metrics Panel Component
 * Displays key performance metrics for assigned bugs
 */
export default function DeveloperMetricsPanel() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(dateRange));

      const response = await apiClient.get('/api/developer/metrics', {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      });

      setMetrics(response);
    } catch (err) {
      logError(err, 'Failed to load developer metrics');
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tt-card animate-pulse">
        <div className="space-y-4">
          <div className="h-8 bg-[var(--bg-elevated)] rounded w-40"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--bg-elevated)] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tt-card border-[var(--error)]/20 bg-red-500/5">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-300">Error Loading Metrics</h3>
            <p className="text-sm text-[var(--muted)]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const {
    summary = {},
    breakdown = {},
  } = metrics;

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Performance Metrics</h2>
        <div className="flex gap-2">
          {[
            { label: '7 days', value: '7' },
            { label: '30 days', value: '30' },
            { label: '90 days', value: '90' },
            { label: 'All time', value: '365' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`px-3 py-1.5 text-sm rounded font-medium transition ${
                dateRange === option.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--foreground)] hover:bg-[var(--bg-elevated)]/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div className="tt-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--muted)] mb-1">Assigned Bugs</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {summary.totalAssigned ?? 0}
              </p>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-3">Issues under your control</p>
        </div>

        {/* Resolved Bugs */}
        <div className="tt-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--muted)] mb-1">Resolved</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {summary.resolved ?? 0}
              </p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-3">
            {summary.totalAssigned > 0
              ? `${((summary.resolved / summary.totalAssigned) * 100).toFixed(1)}% resolution rate`
              : 'No bugs resolved'}
          </p>
        </div>

        {/* In Progress */}
        <div className="tt-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--muted)] mb-1">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {summary.inProgress ?? 0}
              </p>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded">
              <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-3">Currently being fixed</p>
        </div>

        {/* Verification Pending */}
        <div className="tt-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--muted)] mb-1">Awaiting Test</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {summary.verificationPending ?? 0}
              </p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-3">Waiting for verification</p>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resolution Time */}
        <div className="tt-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-indigo-500" />
            <h3 className="font-semibold">Avg Resolution Time</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {(summary.avgResolutionTimeHours ?? 0).toFixed(1)} <span className="text-sm text-[var(--muted)]">hours</span>
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Time from assignment to resolution
              </p>
            </div>
          </div>
        </div>

        {/* Documentation Rate */}
        <div className="tt-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold">Documented Fixes</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {summary.bugsWithFixDocumentation ?? 0} <span className="text-sm text-[var(--muted)]">bugs</span>
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                With detailed fix documentation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      {breakdown.byStatus && Object.keys(breakdown.byStatus).length > 0 && (
        <div className="tt-card p-5">
          <h3 className="font-semibold mb-4">Bug Status Distribution</h3>
          <div className="space-y-3">
            {Object.entries(breakdown.byStatus).map(([status, count]) => {
              const total = summary.totalAssigned || 1;
              const percentage = ((count / total) * 100).toFixed(1);
              
              const statusColors = {
                'NEW': 'bg-blue-500',
                'OPEN': 'bg-blue-400',
                'IN_PROGRESS': 'bg-yellow-500',
                'FIXED': 'bg-emerald-500',
                'VERIFIED': 'bg-emerald-600',
                'CLOSED': 'bg-gray-500',
              };

              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{status}</span>
                    <span className="text-[var(--muted)]">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-[var(--bg-elevated)] rounded-full h-2">
                    <div
                      className={`${statusColors[status] || 'bg-indigo-500'} h-2 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Priority Breakdown */}
      {breakdown.byPriority && Object.keys(breakdown.byPriority).length > 0 && (
        <div className="tt-card p-5">
          <h3 className="font-semibold mb-4">Bug Priority Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(breakdown.byPriority).map(([priority, count]) => (
              <div key={priority} className="text-center p-3 rounded bg-[var(--bg-elevated)]">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{count}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{priority}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
