// ============================================================================
// Scenario B: Generic Community Skill (Markdown Advice Only, No Verification)
// Represents typical community skills that provide prompt tips but lack
// deterministic enforcement, 5-state completeness, and motion constraints.
// ============================================================================

import React, { useState } from "react";

export default function SubscriptionBillingCardGenericSkill({ plans, activePlanId, onUpdate }) {
  const [selected, setSelected] = useState(activePlanId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 font-sans shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        {/* Missing tracking-tight on display header */}
        <h2 className="text-2xl font-bold text-slate-900">Subscription & Billing</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your plan tier and seat allocations.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {/* Missing empty state fallback on .map() */}
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            // Violations: transition-all, duration-500, missing motion-reduce
            className={`w-full rounded-lg border p-4 text-left transition-all duration-500 hover:border-slate-400 ${
              selected === p.id ? "border-slate-900 bg-slate-50" : "border-slate-200"
            }`}
          >
            {/* Flex child missing min-w-0: will overflow on long text */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-900">{p.name}</span>
                <p className="text-xs text-slate-500">{p.summary}</p>
              </div>
              {/* Missing tabular-nums on currency */}
              <span className="text-lg font-semibold text-slate-900">
                ${p.price}/mo
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Button with duration-500 and missing focus-visible */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => onUpdate(selected)}
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all duration-500 hover:bg-slate-800"
        >
          {isSubmitting ? "Updating..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
