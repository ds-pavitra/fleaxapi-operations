import { useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

export default function RevenueProfitChart({
  timeSeries,
}: {
  timeSeries: Array<{
    date: string;
    revenue: number;
    vendorCost?: number;
    profit: number;
  }>;
}) {
  const categories = useMemo(() => timeSeries.map((d) => d.date), [timeSeries]);
  const series = [
    { name: "Revenue", data: timeSeries.map((d) => d.revenue) },
    { name: "Vendor Cost", data: timeSeries.map((d) => d.vendorCost || 0) },
    { name: "Profit", data: timeSeries.map((d) => d.profit) },
  ];

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#101828", "#475467", "#667085"],
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    legend: { show: true, position: "top", horizontalAlign: "right" },
    xaxis: { categories, labels: { style: { colors: "#6B7280" } } },
    yaxis: {
      labels: { style: { colors: "#6B7280" } },
      title: {
        text: "Amount (INR)",
        style: { fontSize: "12px", color: "#6B7280" },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
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
        Revenue / Cost / Profit
      </h3>
      <Chart
        options={options}
        series={series as any}
        type="area"
        height={300}
      />
    </div>
  );
}
