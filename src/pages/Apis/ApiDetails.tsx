import { useParams } from "react-router";
import { useGetApiQuery } from "../../features/apis/apisApi";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function ApiDetails() {
  const { id } = useParams();
  const { data: api, isLoading } = useGetApiQuery(id || "");

  if (isLoading) return <div>Loading...</div>;
  if (!api) return <div>API not found</div>;

  return (
    <>
      <PageMeta title={`API: ${api.vendorName}`} description={`Details for API: ${api.vendorName}`} />
      <PageBreadcrumb pageTitle={`API: ${api.vendorName}`} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">{api.vendorName}</h3>
        <div className="mt-2 text-sm text-slate-600">Vendor ID: {api.vendorId}</div>
        <div className="mt-2 text-sm text-slate-600">Base URL: <span className="font-mono">{api.baseUrl}</span></div>
        <div className="mt-2 text-sm text-slate-600">Endpoint: <span className="font-mono">{api.endpoint}</span></div>
        <div className="mt-2 text-sm text-slate-600">API Key: <span className="font-mono">{api.apiKey}</span></div>
        <div className="mt-2 text-sm text-slate-600">Daily Hit Limit: <span className="font-mono">{api.dailyHitLimit.toLocaleString()}</span></div>
        <div className="mt-2 text-sm text-slate-600">Per API Cost: <span className="font-mono">{api.perApiCost.toFixed(2)}</span></div>
        <div className="mt-2 text-sm text-slate-600">Status: {api.status}</div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50">Logs / Usage</h4>
          <p className="mt-2 text-sm text-slate-500">(No real logs in mock store — extend here to show sample recent requests)</p>
        </div>
      </div>
    </>
  );
}
