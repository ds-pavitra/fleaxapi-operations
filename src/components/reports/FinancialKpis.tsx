
export default function FinancialKpis({ summary }: { summary: any }) {
  const fmt = (n: number) =>
    n === undefined
      ? "-"
      : n.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Row 1 */}
      {/* <div className="h-full flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="text-xs text-slate-500">Merchant Wallets</div>
        <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{fmt(summary.merchantWalletTotal)}</div>
      </div>

      <div className="h-full flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="text-xs text-slate-500">Vendor Wallets</div>
        <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{fmt(summary.vendorWalletTotal)}</div>
      </div> */}

      {/* Row 2 */}
      <div className="h-full flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="text-xs text-slate-500">Revenue</div>
        <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{fmt(summary.totalRevenue)}</div>
      </div>

      <div className="h-full flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="text-xs text-slate-500">Vendor Cost</div>
        <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{fmt(summary.totalVendorCost)}</div>
      </div>

      {/* Row 3 */}
      <div className="col-span-2 h-full flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="text-xs text-slate-500">Net Profit</div>
        <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{fmt(summary.netProfit)}</div>
      </div>
    </div>
  );
}
