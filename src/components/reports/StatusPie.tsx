import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

export default function StatusPie({ label, active, inactive }: { label: string; active: number; inactive: number }) {
  const series = [active || 0, inactive || 0];
  const options: ApexOptions = {
    labels: ["Active", "Inactive"],
    colors: ["#06B6D4", "#EF4444"],
    chart: { fontFamily: "Outfit, sans-serif" },
    legend: { position: "bottom" },
    tooltip: { y: { formatter: (v: number) => `${v}` } },
    dataLabels: { enabled: false },
    responsive: [{ breakpoint: 640, options: { chart: { height: 140 } } }],
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900" aria-label={`${label} status chart`}>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-medium text-slate-900 dark:text-slate-50">{label}</h4>
        <div className="text-xs text-slate-500">A:{active} / I:{inactive}</div>
      </div>
      <Chart options={options} series={series} type="donut" height={150} />
    </div>
  );
}
