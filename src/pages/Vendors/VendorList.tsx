import { useMemo, useState, useEffect } from "react";
import { useListVendorsQuery, useDeleteVendorMutation, useUpdateVendorMutation } from "../../features/vendors/vendorsApi";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import VendorForm from "../../components/vendors/VendorForm";
import { useAppDispatch } from "../../hooks";
import { addNotification } from "../../features/notifications/notificationsSlice";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function VendorList() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { data, isLoading } = useListVendorsQuery({ page, pageSize, search, status });
  const [deleteVendor] = useDeleteVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname.endsWith("/new")) { setEditingVendor(null); openModal(); }
  }, [location.pathname]);

  const closeAndNavigate = () => { closeModal(); navigate("/vendors"); };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteVendor(toDelete.id).unwrap();
      dispatch(addNotification({ variant: "success", title: "Vendor deleted", message: `${toDelete.name} deleted` }));
    } catch (err: any) {
      dispatch(addNotification({ variant: "error", title: "Delete failed", message: err?.data?.message || err?.message || "Failed to delete vendor" }));
    } finally {
      setToDelete(null);
      closeDeleteModal();
    }
  };

  const total = data?.total || 0;
  const vendors = data?.data || [];
  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const [importedRows, setImportedRows] = useState<any[]>([]);
  const { data: allVendorsData } = useListVendorsQuery({ page: 1, pageSize: 1000 });
  const vendorOptions = allVendorsData?.data || [];
  const [selectedVendorName, setSelectedVendorName] = useState("");

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
    const sample = "name,baseUrl,apiKey,email,mobile,status";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendors-sample.csv";
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

            <select className="h-9 rounded-md border border-slate-300 bg-transparent px-3 text-sm" value={selectedVendorName} onChange={(e) => { setSelectedVendorName(e.target.value); setSearch(e.target.value || ""); }}>
              <option value="">All Names</option>
              {vendorOptions.map((v: any) => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input id="vendor-csv-input" type="file" accept="text/csv" onChange={(e) => handleCsvUpload(e)} className="hidden" />
            <button onClick={() => document.getElementById('vendor-csv-input')?.click()} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-xs">Import CSV</button>
            <button onClick={downloadSampleCsv} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-xs">Sample CSV</button>
            <Link to="/vendors/new" className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500">Add Vendor</Link>
          </div>
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
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="py-2 text-sm font-medium text-slate-900 dark:text-slate-50">Name</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Balance</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Total Used</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Pending</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Status</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (<tr><td colSpan={6}>Loading...</td></tr>)}
              {!isLoading && vendors.length === 0 && (<tr><td colSpan={6}>No vendors</td></tr>)}
              {vendors.map((v: any) => (
                <tr key={v.id} className="border-t">
                  <td className="py-3 text-sm text-slate-800 dark:text-slate-100"><Link to={`/vendors/${v.id}`} className="text-brand-500 hover:underline">{v.name}</Link></td>
                  <td className="text-sm text-slate-700 dark:text-slate-200" title={`${(v.balance || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`}>{(v.balance || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{v.totalUsed || 0}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{v.pending || 0}</td>
                  <td className="text-sm">
                    <button
                      type="button"
                      aria-pressed={v.status === "ACTIVE"}
                      disabled={updatingId === String(v.id)}
                      onClick={async () => {
                        const next = v.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                        try {
                          setUpdatingId(String(v.id));
                          await updateVendor({ id: String(v.id), body: { status: next } }).unwrap();
                          dispatch(addNotification({ variant: 'success', title: 'Status updated', message: `${v.name} is now ${next}` }));
                        } catch (err: any) {
                          dispatch(addNotification({ variant: 'error', title: 'Update failed', message: err?.data?.message || err?.message || 'Failed to update status' }));
                        } finally {
                          setUpdatingId(null);
                        }
                      }}
                      className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors ${v.status === "ACTIVE" ? 'bg-indigo-600' : 'bg-slate-200'} ${updatingId === String(v.id) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform bg-white rounded-full transition-transform ${v.status === "ACTIVE" ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td>
                    <button className="mr-2 text-sm text-brand-500" onClick={() => { setEditingVendor(v); openModal(); }}>Edit</button>
                    <button className="text-sm text-error-500" onClick={() => { setToDelete(v); openDeleteModal(); }}>Delete</button>
                  </td>
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

      <Modal isOpen={isDeleteOpen} onClose={() => { closeDeleteModal(); setToDelete(null); }} className="max-w-sm m-4">
        <div className="p-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">Delete Vendor</h3>
          <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete {toDelete?.name}? This action cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { closeDeleteModal(); setToDelete(null); }} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Cancel</button>
            <button onClick={confirmDelete} className="inline-flex h-9 items-center justify-center rounded-full bg-rose-600 px-4 text-sm text-white">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isOpen} onClose={() => { closeAndNavigate(); setEditingVendor(null); }} className="max-w-md lg:max-w-lg m-4">
        <VendorForm vendor={editingVendor}
          onSuccess={() => { const wasEdit = !!editingVendor; closeAndNavigate(); setEditingVendor(null); dispatch(addNotification({ variant: 'success', title: wasEdit ? 'Vendor updated' : 'Vendor created', message: wasEdit ? 'Vendor updated successfully' : 'Vendor created successfully' })); }}
          onCancel={() => { closeAndNavigate(); setEditingVendor(null); }}
          onError={(msg) => dispatch(addNotification({ variant: 'error', title: 'Operation failed', message: msg }))}
        />
      </Modal>
    </div>
  );
}
