// components/ROI.tsx
"use client";
import { useMemo, useState } from "react";

export default function ROI() {
  const [leadsPerMonth, setLeads] = useState(120);
  const [closeRate, setClose] = useState(0.15);
  const [avgDeal, setDeal] = useState(180);

  const revenue = useMemo(
    () => Math.round(leadsPerMonth * closeRate * avgDeal),
    [leadsPerMonth, closeRate, avgDeal]
  );

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold">ROI Calculator</h3>
      <p className="text-slate-600 text-sm">
        Estimate monthly revenue captured by automated chat.
      </p>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm">Leads / month</span>
          <input
            type="number"
            className="mt-1 block w-full rounded-xl border-slate-200"
            value={leadsPerMonth}
            onChange={(e) => setLeads(Number(e.target.value || 0))}
            min={0}
          />
        </label>
        <label className="block">
          <span className="text-sm">Close rate</span>
          <input
            type="number"
            step="0.01"
            min={0}
            max={1}
            className="mt-1 block w-full rounded-xl border-slate-200"
            value={closeRate}
            onChange={(e) => setClose(Math.min(1, Math.max(0, Number(e.target.value || 0))))}
          />
          <span className="text-xs text-slate-500">0–1 (e.g. 0.15 = 15%)</span>
        </label>
        <label className="block">
          <span className="text-sm">Average revenue / deal (€)</span>
          <input
            type="number"
            className="mt-1 block w-full rounded-xl border-slate-200"
            value={avgDeal}
            onChange={(e) => setDeal(Number(e.target.value || 0))}
            min={0}
          />
        </label>
      </div>

      <div className="mt-6 rounded-xl bg-white/80 border border-slate-200 p-4">
        <div className="text-sm text-slate-600">Estimated monthly revenue</div>
        <div className="text-3xl font-extrabold">€ {revenue.toLocaleString("nl-BE")}</div>
      </div>
    </div>
  );
}
