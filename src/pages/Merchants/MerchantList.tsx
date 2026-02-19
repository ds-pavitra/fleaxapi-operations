import { useMemo, useState, useEffect } from "react";
import { useListMerchantsQuery, useGetMerchantQuery } from "../../features/merchants/merchantsApi";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import MerchantForm from "../../components/merchants/MerchantForm";
import { useAppDispatch } from "../../hooks";
import { addNotification } from "../../features/notifications/notificationsSlice";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function MerchantList() {
  const [page, setPage] = useState(1);
  // debug: help trace render when navigating to /customers
  // eslint-disable-next-line no-console
  console.debug('MerchantList render', { page });
  const [pageSize, setPageSize] = useState<number>(50);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { data, isLoading } = useListMerchantsQuery({ page, pageSize, search, status });

  const { isOpen, openModal, closeModal } = useModal();
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const { data: editingMerchant, isLoading: isEditingMerchantLoading, error: editingMerchantError } = useGetMerchantQuery(editingMerchantId || "", { skip: !editingMerchantId });
  // ensure linter sees this variable as used (JSX usage may sometimes be missed by analyzer)
  if (isEditingMerchantLoading) { /* noop */ }
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname.endsWith("/new")) { setEditingMerchantId(null); openModal(); }
  }, [location.pathname]);

  const closeAndNavigate = () => { closeModal(); navigate("/customers"); };

  const handleCreateOrUpdateSuccess = () => {
    const wasEdit = !!editingMerchant;
    closeAndNavigate();
    setEditingMerchantId(null);
    dispatch(addNotification({ variant: 'success', title: wasEdit ? 'Customer updated' : 'Customer created', message: wasEdit ? 'Customer updated successfully' : 'Customer created successfully' }));
  };


  const total = data?.total || 0;
  const merchants = data?.data || [];
  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  // Helper to render pagination items with ellipsis
  const getPageItems = (current: number, totalPages: number) => {
    const items: Array<number | string> = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }

    items.push(1);
    if (current > 4) items.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);

    for (let i = start; i <= end; i++) items.push(i);

    if (current < totalPages - 3) items.push("...");
    items.push(totalPages);
    return items;
  };

  useEffect(() => {
    if (editingMerchantError) {
      const err: any = editingMerchantError as any;
      dispatch(addNotification({ variant: 'error', title: 'Failed to load merchant', message: err?.data?.message || err?.message || 'Failed to fetch merchant details' }));
      setEditingMerchantId(null);
      closeAndNavigate();
    }
  }, [editingMerchantError]);

  const [importedRows, setImportedRows] = useState<any[]>([]);

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((ln) => {
      const cols = ln.split(",").map((c) => c.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = cols[i] === undefined ? "" : cols[i]; });
      return obj;
    });
    return rows;
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      const rows = parseCsv(text);
      setImportedRows(rows);
    };
    reader.readAsText(file);
  };

  const downloadSampleCsv = () => {
    const sample = "firstName,lastName,email,mobile,businessName,customerType,modeOfPayment,paymentReceived,walletAmount";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 items-center">
            <input className="h-9 rounded-md border border-slate-300 bg-transparent px-3 text-sm text-slate-800 dark:text-slate-100 dark:border-slate-600" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />

            <select className="h-9 rounded-full border border-slate-300 bg-transparent px-3 text-xs text-slate-800 dark:text-slate-100 dark:border-slate-600" value={status || ""} onChange={(e) => setStatus(e.target.value || undefined)}>
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <input id="merchant-csv-input" type="file" accept="text/csv" onChange={(e) => handleCsvUpload(e)} className="hidden" />
            <button onClick={() => document.getElementById('merchant-csv-input')?.click()} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-xs">Import CSV</button>
            <button onClick={downloadSampleCsv} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-xs">Sample CSV</button>

            <label className="text-sm">Rows</label>
            <select
              className="h-9 rounded-full border border-slate-300 bg-transparent px-3 text-xs text-slate-800 dark:text-slate-100 dark:border-slate-600"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>


          </div>

        {importedRows.length > 0 && (
          <div className="mb-4 rounded-md border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium mb-2">Imported CSV Preview</div>
            <div className="overflow-auto max-h-48">
              <table className="w-full">
                <thead>
                  <tr>
                    {Object.keys(importedRows[0] || {}).map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-slate-700 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importedRows.map((r, i) => (
                    <tr key={i} className="border-t">
                      {Object.keys(r).map((k) => (
                        <td key={k} className="text-sm text-slate-700 pr-4">{r[k]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>

        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="py-2 text-sm font-medium text-slate-900 dark:text-slate-50">Name</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Email</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Mobile</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Business</th>                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Customer Type</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Mode of Payment</th>                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Payment Received</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Wallet token</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Status</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (<tr><td colSpan={10}>Loading...</td></tr>)}
              {!isLoading && merchants.length === 0 && (<tr><td colSpan={10}>No customers</td></tr>)}
              {merchants.map((m: any) => (
                <tr key={m.id} className="border-t">
                  <td className="py-3 text-sm text-slate-800 dark:text-slate-100"><Link to={`/customers/${m.id}`} className="text-brand-500 hover:underline">{m.firstName} {m.lastName}</Link></td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{m.email}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{m.mobile}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{m.businessName}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{m.customerType ? (m.customerType === 'DIRECT' ? 'Direct' : 'Organization') : '-'}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{(m.modeOfPayment || m.paymentMode) ? ((m.modeOfPayment || m.paymentMode).toString().toUpperCase() === 'PREPAID' ? 'Prepaid' : 'Postpaid') : '-'}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{m.paymentReceived ? "Yes" : "No"}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{m.walletAmount != null ? m.walletAmount : '-'}</td>
                  <td className="text-sm">
                    <button className="text-sm text-brand-500" onClick={() => { setEditingMerchantId(String(m.id)); openModal(); }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-700 dark:text-slate-200">Page {page} of {pages}</div>

          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>

            {getPageItems(page, pages).map((it, idx) => (
              <button
                key={String(it) + idx}
                onClick={() => typeof it === "number" && setPage(it)}
                disabled={typeof it !== "number"}
                className={`px-2 py-1 border rounded ${it === page ? 'bg-slate-100' : ''}`}
              >
                {it}
              </button>
            ))}

            <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-2 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>



      <Modal isOpen={isOpen} onClose={() => { closeAndNavigate(); setEditingMerchantId(null); }} className="max-w-md lg:max-w-lg m-4">
        {isEditingMerchantLoading ? (
          <div className="p-4">Loading merchant details...</div>
        ) : (
          <MerchantForm merchant={editingMerchantId ? (editingMerchant || null) : null}
            onSuccess={handleCreateOrUpdateSuccess}
            onCancel={() => { closeAndNavigate(); setEditingMerchantId(null); }}
            onError={(msg) => dispatch(addNotification({ variant: 'error', title: 'Operation failed', message: msg }))}
          />
        )}
      </Modal>
    </div>
  );
}