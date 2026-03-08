export default function FixDocumentationView({ bug }) {
  if (!bug) return null;

  const hasFixDocumentation =
    bug.fixStrategy ||
    bug.rootCauseAnalysis ||
    bug.fixNotes ||
    bug.fixDocumentation;

  if (!hasFixDocumentation) {
    return (
      <div className="bg-[var(--bg-elevated)] p-4 rounded-lg text-center">
        <p className="text-[var(--muted)]">No fix documentation yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Solution */}
      {bug.fixStrategy && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--muted)] block mb-2">
            Fix Strategy / Solution
          </h4>
          <div className="bg-[var(--bg-elevated)] p-3 rounded text-sm whitespace-pre-wrap">
            {bug.fixStrategy}
          </div>
        </div>
      )}

      {/* Root Cause */}
      {bug.rootCauseAnalysis && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--muted)] block mb-2">
            Root Cause Analysis
          </h4>
          <div className="bg-[var(--bg-elevated)] p-3 rounded text-sm whitespace-pre-wrap">
            {bug.rootCauseAnalysis}
          </div>
        </div>
      )}

      {/* Root Cause Category */}
      {bug.rootCauseCategory && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--muted)] block mb-2">
            Root Cause Category
          </h4>
          <div className="inline-block bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded text-sm font-medium">
            {bug.rootCauseCategory.replace(/_/g, ' ')}
          </div>
        </div>
      )}

      {/* Fix Notes / Documentation */}
      {(bug.fixNotes || bug.fixDocumentation) && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--muted)] block mb-2">
            Fix Notes
          </h4>
          <div className="bg-[var(--bg-elevated)] p-3 rounded text-sm whitespace-pre-wrap">
            {bug.fixNotes || bug.fixDocumentation}
          </div>
        </div>
      )}

      {/* Version & Timing */}
      {(bug.targetFixVersion || bug.fixedInVersion || bug.actualFixHours) && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--muted)] block mb-2">
            Version & Timeline
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {bug.targetFixVersion && (
              <div className="bg-[var(--bg-elevated)] p-3 rounded">
                <p className="text-xs text-[var(--muted)] mb-1">Target Version</p>
                <p className="font-mono text-sm">{bug.targetFixVersion}</p>
              </div>
            )}
            {bug.fixedInVersion && (
              <div className="bg-[var(--bg-elevated)] p-3 rounded">
                <p className="text-xs text-[var(--muted)] mb-1">Fixed In Version</p>
                <p className="font-mono text-sm">{bug.fixedInVersion}</p>
              </div>
            )}
            {bug.actualFixHours && (
              <div className="bg-[var(--bg-elevated)] p-3 rounded">
                <p className="text-xs text-[var(--muted)] mb-1">Fix Hours</p>
                <p className="font-mono text-sm">{bug.actualFixHours}h</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
