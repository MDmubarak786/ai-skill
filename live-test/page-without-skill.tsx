// ============================================================================
// Live Test 1: Page Without Any Skill (Raw AI Output)
// Prompt: "Build an AI Agent Fleet Monitoring & Usage Dashboard in React + Tailwind"
// ============================================================================

import React, { useState } from "react";

export default function AgentFleetDashboardRaw({ agents, usageStats }) {
  const [selectedAgent, setSelectedAgent] = useState("agent-01");

  return (
    <div className="h-screen w-[1100px] bg-[#ffffff] p-8 font-sans text-[#000000]">
      {/* Hero Header with typical AI purple-indigo gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold">AI Agent Fleet Command</h1>
        <p className="mt-2 text-purple-200">
          Autonomous LLM execution nodes, rate-limit monitors, and active cluster telemetry.
        </p>
      </div>

      {/* Cliché Icon Tiles above Heading (repeated 4 cards) */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b5cf6] text-white">
            🤖
          </div>
          <h3 className="mt-2 text-sm font-bold">Active Agents</h3>
          {/* Missing tabular-nums */}
          <span className="text-2xl font-bold text-gray-900">48 Nodes</span>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b5cf6] text-white">
            ⚡️
          </div>
          <h3 className="mt-2 text-sm font-bold">Avg Latency</h3>
          <span className="text-2xl font-bold text-gray-900">142 ms</span>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b5cf6] text-white">
            🪙
          </div>
          <h3 className="mt-2 text-sm font-bold">Tokens / Sec</h3>
          <span className="text-2xl font-bold text-gray-900">14,290 t/s</span>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b5cf6] text-white">
            💰
          </div>
          <h3 className="mt-2 text-sm font-bold">Monthly Spend</h3>
          <span className="text-2xl font-bold text-gray-900">$2,480.50</span>
        </div>
      </div>

      {/* Outer Card containing nested inner cards */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
        <div className="flex justify-between items-center pb-4">
          <h2 className="text-2xl font-semibold">Active Fleet Instances</h2>
          {/* div onClick without accessibility attributes */}
          <div
            onClick={() => alert("Refreshed")}
            className="cursor-pointer rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-semibold text-white transition-all duration-500 ease-in hover:bg-[#7c3aed]"
          >
            Deploy New Agent
          </div>
        </div>

        {/* Nested cards inside card without empty state guard */}
        <div className="mt-4 space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm transition-all duration-500 ease-in hover:shadow-lg"
            >
              {/* Flex child without min-w-0: will overflow on long agent name */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-[#6366f1]">{agent.name}</h4>
                  <p className="text-xs text-gray-600">{agent.endpointUrl}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {agent.tokenUsage} tokens
                  </span>
                  <span className="block text-xs text-green-600">
                    Status: {agent.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
