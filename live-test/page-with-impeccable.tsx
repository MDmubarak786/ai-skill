// ============================================================================
// Live Test 2: Page Built with "impeccable" Skill (pbakaus/impeccable)
// Clean design context via Stitch, but misses 5-state completeness,
// flex min-w-0 truncation, and reduced motion accessibility.
// ============================================================================

import React, { useState } from "react";

export default function AgentFleetDashboardImpeccable({ agents, usageStats, onDeploy }) {
  const [selectedAgent, setSelectedAgent] = useState("agent-01");

  return (
    <div className="w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-6 font-sans shadow-sm">
      {/* Stitch Design System Header */}
      <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
        <div>
          {/* Missing tracking-tight and text-balance */}
          <h1 className="text-2xl font-bold text-slate-900">
            Agent Fleet Orchestrator
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time inference telemetry and cluster node utilization.
          </p>
        </div>
        <button
          type="button"
          onClick={onDeploy}
          // Violation: transition-all duration-300, missing motion-reduce
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-slate-800"
        >
          Provision Node
        </button>
      </div>

      {/* Metrics Row */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500 uppercase">Active Nodes</span>
          {/* Missing tabular-nums */}
          <p className="mt-1 text-2xl font-bold text-slate-900">48 / 64</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500 uppercase">Latency (p95)</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">142 ms</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500 uppercase">Throughput</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">14,290 t/s</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500 uppercase">Usage Cost</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">$2,480.50</p>
        </div>
      </div>

      {/* Fleet List: missing empty state check on .map() */}
      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Registered Instances</h3>
        {agents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => setSelectedAgent(agent.id)}
            // Violation: transition-all duration-300, missing motion-reduce
            className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all duration-300 hover:border-slate-400 ${
              selectedAgent === agent.id ? "border-slate-900 bg-slate-50" : "border-slate-200"
            }`}
          >
            {/* Flex child missing min-w-0: vulnerable to unbroken endpoint URLs */}
            <div className="flex-1 pr-4">
              <span className="font-medium text-slate-900">{agent.name}</span>
              <p className="text-xs text-slate-500">{agent.endpointUrl}</p>
            </div>
            <div className="text-right">
              {/* Numeric without tabular-nums */}
              <span className="text-sm font-semibold text-slate-900">
                {agent.tokenUsage} tokens
              </span>
              <span className="block text-xs text-emerald-600">
                {agent.status}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
