import PageMeta from "../../components/common/PageMeta";
import ApiStatusMetrics from "../../components/api/ApiStatusMetrics";
import ApiLast7DaysChart from "../../components/api/ApiLast7DaysChart";
import ApiMonthlyTarget from "../../components/api/ApiMonthlyTarget";
// import ApiVelocityBar from "../../components/api/ApiVelocityBar";
import ApiCostSummary from "../../components/api/ApiCostSummary";
import ApiCacheUsage from "../../components/api/ApiCacheUsage";
// import TokenWalletOverview from "../../components/api/TokenWalletOverview";
import FinancialKpis from "../../components/reports/FinancialKpis";
import RevenueProfitChart from "../../components/reports/RevenueProfitChart";
// import StatusPie from "../../components/reports/StatusPie";
import { useGetFinancialReportQuery } from "../../features/reports/reportsApi";

export default function Home() {
  const today = new Date();
  const from = new Date(new Date().setDate(today.getDate() - 6));
  const frFromISO = `${from.getFullYear()}-${String(from.getMonth()+1).padStart(2,'0')}-${String(from.getDate()).padStart(2,'0')}`;
  const frToISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const { data: financial } = useGetFinancialReportQuery({ from: frFromISO, to: frToISO });

  return (
    <>
      <PageMeta
        title="API Monitoring Dashboard | FlexAPI - React.js Admin Dashboard Template"
        description="API calls overview: counts, success/failure breakdown, last 7 days activity, velocity, cost and cache usage."
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">

        {/* <div className="col-span-12 space-y-6 xl:col-span-12 d-flex">
          <TokenWalletOverview />
        </div> */}

        {financial && (
          <div className="col-span-12 space-y-6 xl:col-span-12">
            <FinancialKpis summary={financial.summary} />

            {/* <div className="mt-4 grid grid-cols-2 gap-4">
              <StatusPie label="Merchants" active={financial.summary.activeMerchants} inactive={financial.summary.inactiveMerchants} />
              <StatusPie label="Vendors" active={financial.summary.activeVendors} inactive={financial.summary.inactiveVendors} />
            </div> */}

          </div>
        )}

        {/* Left: status + last 7 days + velocity */}
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <ApiStatusMetrics />
          <ApiLast7DaysChart />
          {financial && <div className="mt-4"><RevenueProfitChart timeSeries={financial.timeSeries} /></div> }
        </div>

        {/* Right: monthly target */}
        <div className="col-span-12 xl:col-span-5">
          <ApiMonthlyTarget />
        </div>

        {/* <div className="col-span-12 xl:col-span-12">
          <ApiVelocityBar />
        </div> */}

        {/* Bottom row: cost & cache cards */}
        <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <ApiCostSummary />
          <ApiCacheUsage />
        </div>
      </div>
    </>
  );
}
