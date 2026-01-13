import React from "react";

export default function VendorApis({ apis }: { apis?: any[] }) {
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const total = (apis || []).length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = (apis || []).slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50">APIs</h4>
      </div>

      <div className="mt-2 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="py-2 text-sm font-medium text-slate-900 dark:text-slate-50">Base URL</th>
              <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Endpoint</th>
              <th className="text-sm font-medium text-slate-900 dark:text-slate-50">API Key</th>
              <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Cost</th>
            </tr>
          </thead>
          <tbody>
            {(!pageItems || pageItems.length === 0) && <tr><td colSpan={4}>No APIs</td></tr>}
            {pageItems && pageItems.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="py-3 text-sm text-slate-800 dark:text-slate-100">{a.baseUrl}</td>
                <td className="text-sm text-slate-700 dark:text-slate-200">{a.endpoint}</td>
                <td className="text-sm text-slate-700 dark:text-slate-200">{a.apiKey}</td>
                <td className="text-sm text-slate-700 dark:text-slate-200">{a.costPerCall !== undefined ? Number(a.costPerCall).toLocaleString(undefined, {minimumFractionDigits:4, maximumFractionDigits:4}) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-slate-700 dark:text-slate-200">Page {page} of {pages}</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
          <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-2 py-1 border rounded">Next</button>
        </div>
      </div>
    </div>
  );
}
