// ============================================================================
// Scenario A: Raw AI Output (No Skill Active)
// Typical LLM generation for: "Build a modern SaaS subscription billing card"
// ============================================================================

import React, { useState } from "react";

export default function SubscriptionBillingCard({ user, plans }) {
  const [selectedPlan, setSelectedPlan] = useState("pro");

  return (
    <div className="h-screen w-[780px] bg-[#ffffff] p-8 font-sans text-[#000000]">
      {/* Hero Header with typical AI purple gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold">Manage Your Subscription</h1>
        <p className="mt-2 text-purple-200">
          Upgrade, downgrade, or cancel your active workspace billing tier at any time.
        </p>
      </div>

      {/* Outer Card */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
        <h2 className="text-2xl font-semibold">Available Plans</h2>

        {/* Cliché Icon Tiles above Heading */}
        <div className="mt-6 grid grid-cols-3 gap-6">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b5cf6] text-white">
              ⚡️
            </div>
            <h3 className="mt-2 text-lg font-bold">Starter</h3>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b5cf6] text-white">
              🚀
            </div>
            <h3 className="mt-2 text-lg font-bold">Pro Tier</h3>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b5cf6] text-white">
              🏢
            </div>
            <h3 className="mt-2 text-lg font-bold">Enterprise</h3>
          </div>
        </div>

        {/* Nested Cards inside Card */}
        <div className="mt-8 space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm transition-all duration-500 ease-in hover:shadow-lg"
            >
              <div className="flex justify-between">
                <div>
                  <h4 className="font-bold text-[#6366f1]">{plan.name}</h4>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                {/* Numeric price missing tabular-nums */}
                <div className="text-xl font-bold text-gray-900">
                  ${plan.price}.00 / month
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button using div onClick and transition-all duration-700 */}
        <div
          onClick={() => alert("Updated")}
          className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-[#8b5cf6] font-semibold text-white shadow-md transition-all duration-700 hover:bg-[#7c3aed]"
        >
          Confirm Plan Changes
        </div>
      </div>
    </div>
  );
}
