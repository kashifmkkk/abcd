const kpis = [
  { label: "Revenue", value: "$142k", trend: "+12.4%", up: true },
  { label: "Users", value: "8,391", trend: "+6.1%", up: true },
  { label: "Churn", value: "2.3%", trend: "-0.8%", up: false },
];

const bars = [
  "h-[65%]",
  "h-[82%]",
  "h-[54%]",
  "h-[90%]",
  "h-[73%]",
  "h-[88%]",
  "h-[60%]",
  "h-[95%]",
  "h-[78%]",
  "h-[84%]",
];

const tableRows = [
  { name: "Product A", sales: "1,284", revenue: "$48.2k" },
  { name: "Product B", sales: "943", revenue: "$31.7k" },
  { name: "Product C", sales: "721", revenue: "$24.1k" },
];

export function MockDashboard() {
  return (
    <div className="landing-bg-card rounded-2xl border border-white/8 p-4 text-white shadow-2xl w-full space-y-3">
      {/* Window chrome */}
      <div className="flex items-center justify-between pb-2 border-b border-white/6">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[10px] text-gray-500 font-medium">Sales Overview</span>
        <span className="w-8" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-white/6 bg-white/3 p-3"
          >
            <p className="text-[9px] text-gray-500 mb-1 uppercase tracking-wide">{kpi.label}</p>
            <p className="text-sm font-bold leading-none">{kpi.value}</p>
            <p className={`text-[9px] font-medium mt-1.5 ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>
              {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-white/6 bg-white/3 p-3">
        <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-3">Monthly Revenue</p>
        <div className="flex items-end gap-0.75 h-14">
          {bars.map((hClass, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${hClass} ${i === 7 ? "mock-bar-active" : "mock-bar-inactive"}`}
            />
          ))}
        </div>
      </div>

      {/* Mini table */}
      <div className="rounded-xl border border-white/6 bg-white/3 p-3">
        <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-2">Top Products</p>
        <div className="space-y-1.5">
          {tableRows.map((row) => (
            <div key={row.name} className="flex items-center justify-between">
              <span className="text-[10px] text-gray-300">{row.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500">{row.sales}</span>
                <span className="text-[10px] text-amber-400 font-medium">{row.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
