// ============================================================================
// Scenario C: Vanguard UI Engineered Component
// Built strictly adhering to the Vanguard UI 4-Gate Workflow:
// Gate 1: OKLCH Token Lock | Gate 2: 5-State Completeness
// Gate 3: Motion Physics   | Gate 4: Deterministic Slop Verification (Grade S)
// ============================================================================

import React, { useState } from "react";

export interface PlanTier {
  id: string;
  name: string;
  summary: string;
  price: number;
  interval: "month" | "year";
  featuresCount: number;
}

export interface SubscriptionBillingProps {
  plans: PlanTier[];
  activePlanId: string | null;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onSelectPlan?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// 5-State Completeness Sub-views
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div
      className="w-full max-w-2xl border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
      role="status"
      aria-label="Loading subscription tiers"
      aria-busy="true"
    >
      <div className="h-7 w-48 rounded bg-[var(--bg-surface-raised)] animate-pulse" />
      <div className="mt-2 h-4 w-72 rounded bg-[var(--bg-surface-raised)] animate-pulse" />

      <div className="mt-6 space-y-3">
        <div className="h-16 w-full rounded-md bg-[var(--bg-surface-raised)] animate-pulse" />
        <div className="h-16 w-full rounded-md bg-[var(--bg-surface-raised)] animate-pulse" />
        <div className="h-16 w-full rounded-md bg-[var(--bg-surface-raised)] animate-pulse" />
      </div>
    </div>
  );
}

function ErrorRecovery({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex w-full max-w-2xl flex-col items-center justify-center p-8 text-center"
      role="alert"
    >
      <p className="min-w-0 truncate text-sm font-medium text-[var(--text-secondary)]">
        {message || "Unable to retrieve subscription options."}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-transform duration-150 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] motion-reduce:transition-none"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}

function EmptyZeroState({ onContactSupport }: { onContactSupport?: () => void }) {
  return (
    <div className="py-10 text-center">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">
        No subscription tiers configured
      </h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Your organization workspace has custom enterprise provisioning.
      </p>
      {onContactSupport && (
        <button
          type="button"
          onClick={onContactSupport}
          className="mt-4 rounded-md bg-[var(--bg-surface-raised)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-transform duration-150 ease-out hover:border-[var(--accent-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] motion-reduce:transition-none"
        >
          Contact Account Executive
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component (Populated State + Overflow Protection)
// ---------------------------------------------------------------------------

export default function SubscriptionBillingCardVanguard({
  plans,
  activePlanId,
  isLoading = false,
  error = null,
  onRetry,
  onSelectPlan,
}: SubscriptionBillingProps) {
  const [selected, setSelected] = useState<string | null>(activePlanId);

  // State Gate 1: Loading
  if (isLoading) return <LoadingSkeleton />;

  // State Gate 2: Error
  if (error) return <ErrorRecovery message={error.message} onRetry={onRetry} />;

  function handleSelect(id: string) {
    setSelected(id);
    onSelectPlan?.(id);
  }

  return (
    <section
      aria-label="Subscription management"
      className="w-full max-w-2xl rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
    >
      {/* Header with typography bounds */}
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] text-balance">
          Subscription & Billing Tier
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage your plan tier and billing allocations with real-time scaling.
        </p>
      </div>

      {/* State Gate 3: Empty Fallback vs Populated List */}
      <div className="mt-6">
        {plans.length > 0 ? (
          <ul className="divide-y divide-[var(--border-subtle)] overflow-hidden rounded-lg border border-[var(--border-subtle)]" role="radiogroup" aria-label="Available tiers">
            {plans.map((plan) => {
              const isSelected = selected === plan.id;

              return (
                <li key={plan.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelect(plan.id)}
                    className={[
                      "group flex w-full items-center justify-between p-4 text-left",
                      "transition-transform duration-150 ease-out motion-reduce:transition-none",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]",
                      isSelected
                        ? "bg-[var(--bg-surface-raised)]"
                        : "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)]",
                    ].join(" ")}
                  >
                    {/* Safe Flex child with min-w-0 for long text strings */}
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 truncate text-base font-medium text-[var(--text-primary)]">
                          {plan.name}
                        </span>
                        {isSelected && (
                          <span className="rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-primary)]">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 min-w-0 truncate text-xs text-[var(--text-secondary)]">
                        {plan.summary}
                      </p>
                    </div>

                    {/* Numeric display with tabular-nums for vertical alignment */}
                    <div className="shrink-0 text-right">
                      <span className="text-xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)]">
                        ${plan.price.toLocaleString()}
                      </span>
                      <span className="block text-xs tabular-nums text-[var(--text-secondary)]">
                        /{plan.interval}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyZeroState />
        )}
      </div>

      {/* Footer controls */}
      <div className="mt-6 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
        <span className="min-w-0 truncate text-xs text-[var(--text-secondary)]">
          Invoices are billed in USD on the 1st of each month.
        </span>
        <button
          type="button"
          onClick={() => selected && onSelectPlan?.(selected)}
          className="rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-transform duration-150 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] motion-reduce:transition-none"
        >
          Confirm Plan
        </button>
      </div>
    </section>
  );
}
