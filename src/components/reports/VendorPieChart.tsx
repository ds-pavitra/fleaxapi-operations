import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

export default function VendorPieChart({ perVendor }: { perVendor: any[] }) {
  const labels = (perVendor || []).map((p) => p.name);
  const series = (perVendor || []).map((p) => Number(p.revenue || 0));

  const options: ApexOptions = {
    labels,
    colors: ["#101828", "#344054", "#475467", "#667085", "#98a2b3", "#d0d5dd"],
    legend: { position: "bottom" },
    chart: { fontFamily: "Outfit, sans-serif" },
    tooltip: {
      y: {
        formatter: (v: number) =>
          v.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
          }),
      },
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-50">
        Vendor revenue share
      </h3>
      <Chart options={options} series={series} type="donut" height={260} />
    </div>
  );
}
