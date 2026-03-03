import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { apiClient } from '@/lib/apiClient';
import { logError } from '@/lib/errorLogger';
import {
  BarChart3,
  Download,
  TrendingUp,
  FileText,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const STATUS_COLORS = {
  NEW: '#3b82f6',
  IN_PROGRESS: '#eab308',
  FIXED: '#22c55e',
  AWAITING_VERIFICATION: '#a855f7',
  VERIFIED_FIXED: '#10b981',
  REOPENED: '#ef4444',
  CLOSED: '#6b7280',
};
const PRIORITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
};

export default function DeveloperReports() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [performanceReport, setPerformanceReport] = useState(null);
  const [bugAnalytics, setBugAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadReports = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(dateRange));

      const [perfData, analyticsData] = await Promise.all([
        apiClient.get(`/api/developer/reports/performance?startDate=${startDate.toISOString()}`),
        apiClient.get(`/api/developer/reports/bug-analytics?startDate=${startDate.toISOString()}`),
      ]);

      setPerformanceReport(perfData);
      setBugAnalytics(analyticsData);
    } catch (error) {
      logError(error, 'Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBugs = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/developer/reports/bugs/export', {
        headers: authHeaders,
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'developer-bugs.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      logError(error, 'Error exporting bugs');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPerformance = async () => {
    setExporting(true);
    try {
      const weeks = Math.ceil(Number(dateRange) / 7);
      const res = await fetch(
        `/api/developer/reports/performance/export?weeks=${weeks}`,
        { headers: authHeaders },
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `developer-performance-${weeks}w.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      logError(error, 'Error exporting performance');
    } finally {
      setExporting(false);
    }
  };

  const handleExportAnalytics = async () => {
    setExporting(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(dateRange));

      const res = await fetch(
        `/api/developer/reports/bug-analytics/export?startDate=${startDate.toISOString()}`,
        { headers: authHeaders },
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bug-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      logError(error, 'Error exporting analytics');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-500" />
            Developer Reports & Analytics
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            View performance metrics and export detailed reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      {performanceReport && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Target className="h-5 w-5" />}
              label="Total Assigned"
              value={performanceReport.metrics.summary.totalAssigned}
              color="blue"
            />
            <MetricCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Resolved Bugs"
              value={performanceReport.metrics.summary.resolved}
              color="green"
              subtitle={`${performanceReport.metrics.summary.resolutionRate}% rate`}
            />
            <MetricCard
              icon={<Clock className="h-5 w-5" />}
              label="Avg Resolution Time"
              value={`${performanceReport.metrics.summary.avgResolutionTimeHours.toFixed(1)}h`}
              color="purple"
            />
            <MetricCard
              icon={<AlertCircle className="h-5 w-5" />}
              label="Reopened"
              value={performanceReport.metrics.summary.reopened}
              color="red"
              subtitle={`${performanceReport.metrics.summary.reopenRate}% rate`}
            />
          </div>

          {/* Performance Overview Chart */}
          <div className="tt-card p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: 'Total Assigned',
                    value: performanceReport.metrics.summary.totalAssigned,
                    fill: '#6366f1',
                  },
                  {
                    name: 'Resolved',
                    value: performanceReport.metrics.summary.resolved,
                    fill: '#22c55e',
                  },
                  {
                    name: 'Reopened',
                    value: performanceReport.metrics.summary.reopened,
                    fill: '#ef4444',
                  },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted)' }} />
                <YAxis tick={{ fill: 'var(--muted)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[
                    { name: 'Total Assigned', fill: '#6366f1' },
                    { name: 'Resolved', fill: '#22c55e' },
                    { name: 'Reopened', fill: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Export Actions */}
      <div className="tt-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-indigo-500" />
          Export Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ExportButton
            label="Export Assigned Bugs"
            description="Download list of all assigned bugs"
            onClick={handleExportBugs}
            disabled={exporting}
            icon={<FileText className="h-4 w-4" />}
          />
          <ExportButton
            label="Export Performance Report"
            description="Detailed performance metrics"
            onClick={handleExportPerformance}
            disabled={exporting}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <ExportButton
            label="Export Bug Analytics"
            description="In-depth bug analysis"
            onClick={handleExportAnalytics}
            disabled={exporting}
            icon={<Activity className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Status Breakdown */}
      {performanceReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="tt-card p-6">
            <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
            {performanceReport.metrics.summary.totalAssigned > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={Object.entries(performanceReport.metrics.breakdown.byStatus)
                      .filter(([, count]) => count > 0)
                      .map(([status, count]) => ({
                        name: status.toLowerCase().replace(/_/g, ' '),
                        value: count,
                        fill: STATUS_COLORS[status] || '#6b7280',
                      }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {Object.entries(performanceReport.metrics.breakdown.byStatus)
                      .filter(([, count]) => count > 0)
                      .map(([status], index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[status] || '#6b7280'} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-[var(--muted)]">
                No data available
              </div>
            )}
          </div>

          <div className="tt-card p-6">
            <h3 className="text-lg font-semibold mb-4">Priority Distribution</h3>
            {performanceReport.metrics.summary.totalAssigned > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={Object.entries(performanceReport.metrics.breakdown.byPriority)
                      .filter(([, count]) => count > 0)
                      .map(([priority, count]) => ({
                        name: priority.toLowerCase(),
                        value: count,
                        fill: PRIORITY_COLORS[priority] || '#6b7280',
                      }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {Object.entries(performanceReport.metrics.breakdown.byPriority)
                      .filter(([, count]) => count > 0)
                      .map(([priority], index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[priority] || '#6b7280'} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-[var(--muted)]">
                No data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bug Analytics */}
      {bugAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Trends */}
          <div className="tt-card p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Trends</h3>
            {bugAnalytics.weeklyTrends && bugAnalytics.weeklyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={bugAnalytics.weeklyTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="assigned"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', strokeWidth: 2 }}
                    name="Assigned"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2 }}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-[var(--muted)]">
                No trend data available
              </div>
            )}
          </div>

          {/* Resolution Time Distribution */}
          <div className="tt-card p-6">
            <h3 className="text-lg font-semibold mb-4">Resolution Time Distribution</h3>
            {bugAnalytics.resolutionTimeAnalysis && Object.keys(bugAnalytics.resolutionTimeAnalysis.buckets).length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={Object.entries(bugAnalytics.resolutionTimeAnalysis.buckets).map(
                    ([bucket, count]) => ({
                      name: bucket,
                      bugs: count,
                    })
                  )}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="bugs" fill="#6366f1" radius={[4, 4, 0, 0]} name="Bugs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-[var(--muted)]">
                No resolution time data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fix Quality Metrics */}
      {performanceReport && performanceReport.fixQuality && (
        <div className="tt-card p-6">
          <h3 className="text-lg font-semibold mb-4">Fix Quality Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold text-indigo-500">
                {performanceReport.fixQuality.documentationRate}%
              </div>
              <div className="text-sm text-[var(--muted)]">Documentation Rate</div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Bugs with fix documentation
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">
                {performanceReport.fixQuality.avgFixHours}h
              </div>
              <div className="text-sm text-[var(--muted)]">Avg Fix Time</div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Average hours to fix a bug
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">Root Cause Categories</div>
              <div className="space-y-1">
                {Object.entries(performanceReport.fixQuality.rootCauseBreakdown || {})
                  .slice(0, 3)
                  .map(([category, count]) => (
                    <div key={category} className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">{category}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color, subtitle }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    red: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="tt-card p-4">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-[var(--muted)]">{label}</div>
      {subtitle && <div className="text-xs text-[var(--muted)] mt-1">{subtitle}</div>}
    </div>
  );
}

function ExportButton({ label, description, onClick, disabled, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start p-4 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-2 mb-2 text-indigo-500">
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </div>
      <p className="text-xs text-[var(--muted)] text-left">{description}</p>
    </button>
  );
}
