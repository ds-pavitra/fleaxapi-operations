
export default function PerVendorTable({ perVendor }: { perVendor: any[] }) {
  const downloadCsv = () => {
    const header = ["Vendor", "Calls", "Revenue", "Cost", "Profit", "Balance"];
    const rows = perVendor.map((p) => [p.name, p.calls, p.revenue.toFixed(2), p.cost.toFixed(2), p.profit.toFixed(2), p.balance.toFixed(2)]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `per-vendor-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Per Vendor</h3>
        <button onClick={downloadCsv} className="inline-flex h-8 items-center justify-center rounded-full bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-500">Download CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="text-xs text-slate-500">Vendor</th>
              <th className="text-xs text-slate-500">Calls</th>
              <th className="text-xs text-slate-500">Revenue (₹)</th>
              <th className="text-xs text-slate-500">Cost (₹)</th>
              <th className="text-xs text-slate-500">Profit (₹)</th>
              <th className="text-xs text-slate-500">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {perVendor.map((p) => (
              <tr key={p.vendorId} className="border-t border-slate-100 dark:border-slate-700">
                <td className="py-2 text-sm text-slate-800 dark:text-slate-100">{p.name}</td>
                <td className="py-2 text-sm text-slate-700">{p.calls}</td>
                <td className="py-2 text-sm text-slate-700">{p.revenue.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td className="py-2 text-sm text-slate-700">{p.cost.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td className="py-2 text-sm text-slate-700">{p.profit.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td className="py-2 text-sm text-slate-700">{p.balance.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
