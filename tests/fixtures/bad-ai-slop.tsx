import React, { useEffect, useState } from "react";
import { Sparkles, Zap, Shield, Check, ArrowRight } from "lucide-react";

// ---------- Types ----------
interface PricingTier {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

// ---------- Component ----------
export default function PricingSection() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);

  // ❌ useEffect with fetch — no loading state, no error handling
  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json())
      .then((data) => setTiers(data));
  }, []);

  return (
    // ❌ h-screen without dvh fallback
    <div className="h-screen w-full" style={{ background: "#ffffff" }}>
      {/* ❌ Hero gradient: from-purple-500 via-purple-600 to-indigo-700 */}
      <section
        className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-700 py-24"
        // ❌ Inline linear-gradient with hardcoded hex
        style={{
          backgroundImage: "linear-gradient(to right, #8b5cf6, #6366f1)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 text-center">
          {/* ❌ text-5xl without tracking-tight */}
          <h1
            className="text-5xl font-bold text-white font-sans"
            style={{ color: "#000000" }}
          >
            Simple, transparent pricing
          </h1>
          {/* ❌ text-4xl without text-balance */}
          <p className="text-4xl mt-4 text-[#6366f1]">
            Choose the plan that works for your team
          </p>
        </div>
      </section>

      {/* ❌ w-[800px] fixed width without responsive */}
      <div className="w-[800px] mx-auto py-16">
        {/* ❌ 3+ icon-tile-above-heading siblings */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-[#8b5cf6] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">AI-Powered</h3>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-[#8b5cf6] flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">Lightning Fast</h3>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-[#8b5cf6] flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">Enterprise Secure</h3>
          </div>
        </div>

        {/* ❌ Cards inside cards */}
        <div className="rounded-xl border shadow-lg p-6 bg-white">
          {/* ❌ .map() without empty array check */}
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="rounded-lg border shadow p-4 mb-4 last:mb-0"
            >
              {/* ❌ Flex children without min-w-0 */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-semibold">{tier.name}</span>
                </div>
                <div>
                  {/* ❌ Price without tabular-nums */}
                  <span className="text-3xl font-bold">$49.99/mo</span>
                </div>
              </div>

              {/* ❌ Deeply nested divs (5+ levels) */}
              <div className="mt-4">
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <div className="px-2 py-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-[#6366f1]" />
                        {tier.features?.[0]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ❌ transition-all duration-500 on button */}
              {/* ❌ ease-in on hover (not ease-in-out) */}
              {/* ❌ hover: without focus-visible: */}
              {/* ❌ No motion-reduce */}
              <button
                className="mt-4 w-full rounded-lg bg-[#8b5cf6] px-4 py-2 text-white transition-all duration-500 ease-in hover:bg-purple-700"
              >
                Get started
              </button>
            </div>
          ))}
        </div>

        {/* ❌ div onClick without role/tabIndex/keyboard */}
        {/* ❌ duration-700 on card hover */}
        <div
          onClick={() => window.location.href = "/enterprise"}
          className="mt-12 rounded-xl border p-8 text-center transition-all duration-700 hover:shadow-xl"
        >
          <h2 className="text-4xl font-bold mb-4">Need more?</h2>
          <p className="text-gray-600 mb-6">
            Our enterprise plan scales with your organisation.
          </p>
          <span className="inline-flex items-center gap-2 text-[#6366f1] font-semibold">
            Contact Sales <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
