import * as mockVendors from "../vendors/mockVendorsStore";
import * as mockMerchants from "../merchants/mockMerchantsStore";

function formatDateISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type FinancialReportOptions = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
};

// Generate synthetic time series for the range (inclusive)
function makeTimeSeries(from: Date, to: Date) {
  const days: Array<{ date: string; revenue: number; vendorCost: number; profit: number }> = [];
  const cur = new Date(from);
  while (cur <= to) {
    // synthetic numbers: base + noise
    const revenue = Number((Math.max(0, 800 + Math.round(Math.random() * 600)) / 1).toFixed(2));
    const vendorCost = Number((revenue * (0.3 + Math.random() * 0.4)).toFixed(2)); // ~30-70% cost
    const profit = Number((revenue - vendorCost).toFixed(2));
    days.push({ date: formatDateISO(new Date(cur)), revenue, vendorCost, profit });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function generateFinancialReport(opts: FinancialReportOptions = {}) {
  // default to last 7 days
  const to = opts.to ? new Date(opts.to) : new Date();
  const from = opts.from ? new Date(opts.from) : new Date(new Date().setDate(to.getDate() - 6));
  const vendors = mockVendors.listAllVendors();
  const merchants = mockMerchants.listAllMerchants();

  const timeSeries = makeTimeSeries(from, to);

  const totalRevenue = timeSeries.reduce((s, d) => s + d.revenue, 0);
  const totalVendorCost = timeSeries.reduce((s, d) => s + d.vendorCost, 0);
  const netProfit = Number((totalRevenue - totalVendorCost).toFixed(2));

  // per-vendor and per-api synthetic breakdowns
  const perVendor = vendors.map((v) => {
    const calls = Math.round(100 + Math.random() * 2000);
    const cost = Number(((calls / 1000) * (v.balance ? 0.01 : 0.02)).toFixed(2));
    const revenue = Number((cost * (1.1 + Math.random() * 1.5)).toFixed(2));
    return {
      vendorId: v.id,
      name: v.name,
      calls,
      cost,
      balance: v.balance || 0,
      revenue,
      profit: Number((revenue - cost).toFixed(2)),
    };
  });

  const apis = mockVendors.listVendorApisShort();
  const perApi = apis.map((a: any) => {
    const calls = Math.round(500 + Math.random() * 5000);
    const revenue = Number((calls * (a.perApiCost || a.costPerCall || 0.01)).toFixed(2));
    const vendorCost = Number((revenue * (0.4 + Math.random() * 0.3)).toFixed(2));
    return {
      apiId: a.id,
      label: a.endpoint || a.apiId || a.baseUrl,
      calls,
      revenue,
      vendorCost,
      profit: Number((revenue - vendorCost).toFixed(2)),
    };
  });

  const summary = {
    totalVendors: vendors.length,
    totalMerchants: merchants.length,
    activeVendors: vendors.filter((v) => v.status === "ACTIVE").length,
    inactiveVendors: vendors.filter((v) => v.status !== "ACTIVE").length,
    activeMerchants: merchants.filter((m) => m.status === "ACTIVE").length,
    inactiveMerchants: merchants.filter((m) => m.status !== "ACTIVE").length,
    vendorWalletTotal: Number(vendors.reduce((s, v) => s + (v.balance || 0), 0).toFixed(2)),
    merchantWalletTotal: Number(merchants.reduce((s, m) => s + (m.walletAmount || 0), 0).toFixed(2)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalVendorCost: Number(totalVendorCost.toFixed(2)),
    netProfit,
    estimatedProfit: Number((netProfit * 1.1).toFixed(2)),
  };

  return { summary, perVendor, perApi, timeSeries };
}

// Expose for tests
export default { generateFinancialReport };
