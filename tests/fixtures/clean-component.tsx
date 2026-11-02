import React, { useState } from "react";

// ---------- Types ----------
interface Metric {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: number;
}

interface MetricsDashboardProps {
  metrics: Metric[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onMetricSelect: (id: string) => void;
}

// ---------- Sub-components ----------
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6" role="status" aria-label="Loading metrics">
      <div className="h-6 w-1/3 rounded bg-[var(--bg-muted)]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-lg bg-[var(--bg-muted)]" />
        <div className="h-28 rounded-lg bg-[var(--bg-muted)]" />
        <div className="h-28 rounded-lg bg-[var(--bg-muted)]" />
      </div>
    </div>
  );
}

function ErrorRecovery({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center" role="alert">
      <p className="min-w-0 truncate text-sm text-[var(--text-secondary)]">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-transform duration-150 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] motion-reduce:transition-none"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="py-12 text-center text-sm text-[var(--text-secondary)]">
      No metrics available yet.
    </p>
  );
}

// ---------- Main component ----------
export default function MetricsDashboard({
  metrics,
  isLoading,
  error,
  onRetry,
  onMetricSelect,
}: MetricsDashboardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Loading state
  if (isLoading) return <Skeleton />;

  // Error state
  if (error) return <ErrorRecovery message={error.message} onRetry={onRetry} />;

  function handleSelect(id: string) {
    setActiveId(id);
    onMetricSelect(id);
  }

  return (
    <section
      aria-label="Key metrics"
      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
    >
      {/* Heading with tracking-tight and text-balance */}
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] text-balance">
        Performance overview
      </h2>

      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Real-time metrics across all active services.
      </p>

      {/* Conditional rendering with empty-state check */}
      {metrics.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => {
            const isActive = activeId === m.id;
            const trend = m.change >= 0 ? "↑" : "↓";

            return (
              <li key={m.id}>
                <button
                  onClick={() => handleSelect(m.id)}
                  aria-pressed={isActive}
                  className={[
                    "w-full rounded-lg border border-[var(--border-subtle)] p-4 text-left",
                    "transition-transform duration-150 ease-out motion-reduce:transition-none",
                    "hover:border-[var(--accent-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]",
                    isActive ? "ring-2 ring-[var(--accent-primary)]" : "",
                  ].join(" ")}
                >
                  {/* Label with min-w-0 + truncate for safe flex overflow */}
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 truncate text-sm text-[var(--text-secondary)]">
                      {m.label}
                    </span>
                  </div>

                  {/* Numeric value — tabular-nums for aligned digits */}
                  <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)]">
                    {m.value.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-[var(--text-secondary)]">
                      {m.unit}
                    </span>
                  </p>

                  {/* Change indicator — also tabular-nums */}
                  <span
                    className="mt-1 inline-block text-xs tabular-nums text-[var(--text-secondary)]"
                    aria-label={`Change: ${m.change}%`}
                  >
                    {trend} {Math.abs(m.change)}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
