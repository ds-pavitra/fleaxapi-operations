import { useMemo, useState, useEffect } from "react";
import { useListApisQuery, useDeleteApiMutation, useUpdateApiMutation } from "../../features/apis/apisApi";
import { useListVendorsQuery } from "../../features/vendors/vendorsApi";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import ApiForm from "../../components/apis/ApiForm";
import { useAppDispatch } from "../../hooks";
import { addNotification } from "../../features/notifications/notificationsSlice";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function ApisList() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { data: allVendorsData } = useListVendorsQuery({ page: 1, pageSize: 1000 });
  const vendorOptions = allVendorsData?.data || [];
  const [selectedVendorName, setSelectedVendorName] = useState("");
  const [importedRows, setImportedRows] = useState<any[]>([]);

  const { data, isLoading } = useListApisQuery({ page, pageSize, search, status, vendorName: selectedVendorName });
  const { data: vendorAllApisData } = useListApisQuery({ page: 1, pageSize: 1000, search: '', status: undefined, vendorName: selectedVendorName });

  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isConfirmOpen, openModal: openConfirmModal, closeModal: closeConfirmModal } = useModal();
  const [editingApi, setEditingApi] = useState<any | null>(null);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [deleteApi] = useDeleteApiMutation();
  // const [vendorStatusTarget, setVendorStatusTarget] = useState("");
  const [isApplyingStatus, setIsApplyingStatus] = useState(false);
  const dispatch = useAppDispatch();

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteApi(toDelete.id).unwrap();
      dispatch(addNotification({ variant: "success", title: "API deleted", message: `${toDelete.endpoint} deleted` }));
    } catch (err: any) {
      dispatch(addNotification({ variant: "error", title: "Delete failed", message: err?.data?.message || err?.message || "Failed to delete api" }));
    } finally {
      setToDelete(null);
      closeDeleteModal();
    }
  };

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // open create modal when route is /apis/new
    if (location.pathname.endsWith("/new")) {
      setEditingApi(null);
      openModal();
    }
  }, [location.pathname]);

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
    const sample = "vendorName,baseUrl,endpoint,apiKey,dailyHitLimit,perApiCost,status";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apis-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };



  const closeAndNavigate = () => {
    closeModal();
    navigate("/apis");
  };

  // selection / exceptions
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [excludeSelected, setExcludeSelected] = useState(false);

  // undo / bulk state
  const [lastBulk, setLastBulk] = useState<null | {
    prevValues: Array<{ id: string; dailyHitLimit: number; perApiCost: number }>;
    count: number;
    appliedType: "hit" | "cost" | "both";
  }>(null);
  const [undoTimer, setUndoTimer] = useState<any | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
    };
  }, [undoTimer]);


  const total = data?.total || 0;
  const apis = data?.data || [];

  // if navigated from merchant details to edit a specific API, open edit modal with that API (if present in list)
  useEffect(() => {
    const state: any = (location as any).state;
    const editId = state?.editApiId;
    if (!editId) return;
    const found = apis.find((p: any) => p.id === editId);
    if (found) {
      setEditingApi(found);
      openModal();
      // clear navigation state so it doesn't reopen again
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      // API not found on this page — no details page exists; let user search or navigate manually.
    }
  }, [location, apis]);

  const [updateApi] = useUpdateApiMutation();

  const [globalHitValue, setGlobalHitValue] = useState("");
  const [hitMode, setHitMode] = useState<"set" | "inc" | "dec">("set");
  const [isApplyingHits, setIsApplyingHits] = useState(false);

  const [globalCostValue, setGlobalCostValue] = useState("");
  const [costMode, setCostMode] = useState<"set" | "inc" | "dec">("set");
  const [isApplyingCost, setIsApplyingCost] = useState(false);

  // pending bulk (used when confirmation modal shown)
  const [pendingBulkAction, setPendingBulkAction] = useState<null | {
    type: "hit" | "cost";
    value: number;
    mode: "set" | "inc" | "dec";
    targets: Array<any>;
  }>(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const applyHitLimitAll = async () => {
    const v = Number(globalHitValue);
    if (!v || isNaN(v) || v <= 0) {
      dispatch(addNotification({ variant: "error", title: "Invalid value", message: "Enter a valid hit limit (>0)" }));
      return;
    }

    // compute targets respecting excludeSelected
    const targets = apis.filter((a: any) => !(excludeSelected && selectedIds[a.id]));

    if (targets.length === 0) {
      dispatch(addNotification({ variant: "error", title: "No APIs selected", message: "No API eligible to update (check exclude selected)." }));
      return;
    }

    // collect previous values
    const prevValues = targets.map((a: any) => ({ id: a.id, dailyHitLimit: a.dailyHitLimit, perApiCost: a.perApiCost }));

    // if this touches many APIs, ask for confirmation
    if (targets.length > 5) {
      setPendingBulkAction({ type: "hit", value: v, mode: hitMode, targets });
      openConfirmModal();
      return;
    }

    setIsApplyingHits(true);
    try {
      const results = await Promise.allSettled(
        targets.map((a: any) => {
          let next = a.dailyHitLimit;
          if (hitMode === "set") next = v;
          if (hitMode === "inc") next = a.dailyHitLimit + v;
          if (hitMode === "dec") next = Math.max(0, a.dailyHitLimit - v);
          return updateApi({ id: a.id, body: { dailyHitLimit: next } }).unwrap();
        })
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - successCount;
      dispatch(addNotification({ variant: "success", title: "Applied hit limit", message: `Updated ${successCount} APIs${failCount ? `, ${failCount} failed` : ""}` }));

      // store undo info for quick rollback
      setLastBulk({ prevValues, count: successCount, appliedType: "hit" });
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
      const t = setTimeout(() => setLastBulk(null), 15000);
      setUndoTimer(t);

    } catch (err: any) {
      dispatch(addNotification({ variant: "error", title: "Apply failed", message: err?.message || "Failed to apply hit limit" }));
    } finally {
      setIsApplyingHits(false);
    }
  };

  const applyCostAll = async () => {
    const v = Number(globalCostValue);
    if (isNaN(v) || v < 0) {
      dispatch(addNotification({ variant: "error", title: "Invalid value", message: "Enter a valid cost (>=0)" }));
      return;
    }

    // compute targets respecting excludeSelected
    const targets = apis.filter((a: any) => !(excludeSelected && selectedIds[a.id]));

    if (targets.length === 0) {
      dispatch(addNotification({ variant: "error", title: "No APIs selected", message: "No API eligible to update (check exclude selected)." }));
      return;
    }

    // collect previous values
    const prevValues = targets.map((a: any) => ({ id: a.id, dailyHitLimit: a.dailyHitLimit, perApiCost: a.perApiCost }));

    // if this touches many APIs, ask for confirmation
    if (targets.length > 5) {
      setPendingBulkAction({ type: "cost", value: v, mode: costMode, targets });
      openConfirmModal();
      return;
    }

    setIsApplyingCost(true);
    try {
      const results = await Promise.allSettled(
        targets.map((a: any) => {
          let next = a.perApiCost;
          if (costMode === "set") next = Number((v).toFixed(2));
          if (costMode === "inc") next = Number((a.perApiCost + v).toFixed(2));
          if (costMode === "dec") next = Number(Math.max(0, a.perApiCost - v).toFixed(2));
          return updateApi({ id: a.id, body: { perApiCost: next } }).unwrap();
        })
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - successCount;
      dispatch(addNotification({ variant: "success", title: "Applied cost", message: `Updated ${successCount} APIs${failCount ? `, ${failCount} failed` : ""}` }));

      // store undo info for quick rollback
      setLastBulk({ prevValues, count: successCount, appliedType: "cost" });
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
      const t = setTimeout(() => setLastBulk(null), 15000);
      setUndoTimer(t);

    } catch (err: any) {
      dispatch(addNotification({ variant: "error", title: "Apply failed", message: err?.message || "Failed to apply cost" }));
    } finally {
      setIsApplyingCost(false);
    }
  };

  const setStatusForVendor = async (statusToSet: 'ACTIVE' | 'INACTIVE') => {
    if (!selectedVendorName) {
      dispatch(addNotification({ variant: 'error', title: 'No vendor selected', message: 'Choose a vendor to apply status' }));
      return;
    }

    const targets = (vendorAllApisData?.data || []).filter((a: any) => a.vendorName === selectedVendorName);

    if (targets.length === 0) {
      dispatch(addNotification({ variant: 'error', title: 'No APIs', message: 'No APIs found for the selected vendor' }));
      return;
    }

    if (targets.length > 5) {
      // ask user to confirm large changes
      const proceed = window.confirm(`About to set status ${statusToSet} for ${targets.length} APIs for vendor ${selectedVendorName}. Proceed?`);
      if (!proceed) return;
    }

    setIsApplyingStatus(true);
    try {
      const results = await Promise.allSettled(targets.map((a: any) => updateApi({ id: a.id, body: { status: statusToSet } }).unwrap()));
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;
      dispatch(addNotification({ variant: 'success', title: 'Status updated', message: `Updated ${successCount} APIs${failCount ? `, ${failCount} failed` : ''}` }));
    } catch (err: any) {
      dispatch(addNotification({ variant: 'error', title: 'Update failed', message: err?.message || 'Failed to update status' }));
    } finally {
      setIsApplyingStatus(false);
    }
  };



  const toggleStatus = async (row: any) => {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateApi({ id: row.id, body: { status: next } }).unwrap();
      dispatch(addNotification({ variant: "success", title: "Status updated", message: `${row.vendorName} is now ${next}` }));
    } catch (err: any) {
      dispatch(addNotification({ variant: "error", title: "Update failed", message: err?.data?.message || err?.message || "Failed to update status" }));
    }
  };

  const performPendingBulkAction = async () => {
    if (!pendingBulkAction) return;
    const { type, value, mode, targets } = pendingBulkAction;
    closeConfirmModal();
    setPendingBulkAction(null);

    if (type === "hit") {
      setIsApplyingHits(true);
    } else {
      setIsApplyingCost(true);
    }

    const prevValues = targets.map((a:any) => ({ id: a.id, dailyHitLimit: a.dailyHitLimit, perApiCost: a.perApiCost }));

    try {
      const results = await Promise.allSettled(
        targets.map((a:any) => {
          if (type === "hit") {
            let next = a.dailyHitLimit;
            if (mode === "set") next = value;
            if (mode === "inc") next = a.dailyHitLimit + value;
            if (mode === "dec") next = Math.max(0, a.dailyHitLimit - value);
            return updateApi({ id: a.id, body: { dailyHitLimit: next } }).unwrap();
          } else {
            let next = a.perApiCost;
            if (mode === "set") next = Number((value).toFixed(2));
            if (mode === "inc") next = Number((a.perApiCost + value).toFixed(2));
            if (mode === "dec") next = Number(Math.max(0, a.perApiCost - value).toFixed(2));
            return updateApi({ id: a.id, body: { perApiCost: next } }).unwrap();
          }
        })
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - successCount;
      dispatch(addNotification({ variant: "success", title: "Applied bulk update", message: `Updated ${successCount} APIs${failCount ? `, ${failCount} failed` : ""}` }));

      // store undo info
      setLastBulk({ prevValues, count: successCount, appliedType: type });
      if (undoTimer) { clearTimeout(undoTimer); }
      const t = setTimeout(() => setLastBulk(null), 15000);
      setUndoTimer(t);

    } catch (err:any) {
      dispatch(addNotification({ variant: "error", title: "Bulk failed", message: err?.message || "Bulk update failed" }));
    } finally {
      if (type === "hit") setIsApplyingHits(false);
      else setIsApplyingCost(false);
    }
  };

  const undoBulk = async () => {
    if (!lastBulk) return;
    const prev = lastBulk.prevValues;
    try {
      const res = await Promise.allSettled(prev.map((p) => updateApi({ id: p.id, body: { dailyHitLimit: p.dailyHitLimit, perApiCost: p.perApiCost } }).unwrap()));
      const s = res.filter(r => r.status === 'fulfilled').length;
      const f = res.length - s;
      dispatch(addNotification({ variant: 'success', title: 'Undo complete', message: `Reverted ${s} APIs${f ? `, ${f} failed` : ''}` }));
    } catch (err: any) {
      dispatch(addNotification({ variant: 'error', title: 'Undo failed', message: err?.message || 'Failed to undo' }));
    } finally {
      setLastBulk(null);
      if (undoTimer) { clearTimeout(undoTimer); setUndoTimer(null); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 items-center">
            <input
              className="h-9 rounded-md border border-slate-300 bg-transparent px-3 text-sm text-slate-800 dark:text-slate-100 dark:border-slate-600"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="h-9 rounded-full border border-slate-300 bg-transparent px-3 text-xs text-slate-800 dark:text-slate-100 dark:border-slate-600"
              value={status || ""}
              onChange={(e) => setStatus(e.target.value || undefined)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select className="h-9 rounded-md border border-slate-300 bg-transparent px-3 text-sm" value={selectedVendorName} onChange={(e) => { setSelectedVendorName(e.target.value); setPage(1); }}>
              <option value="">All Vendors</option>
              {vendorOptions.map((v: any) => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <input id="apis-csv-input" type="file" accept="text/csv" onChange={(e) => handleCsvUpload(e)} className="hidden" />
            <button onClick={() => document.getElementById('apis-csv-input')?.click()} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-xs mr-2">Import CSV</button>
            <button onClick={downloadSampleCsv} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-xs mr-2">Sample CSV</button>
            <Link to="/apis/new" className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500">Add API</Link>
          </div>
        </div>

        {/* Show CSV preview if uploaded */}
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

        {/* Global settings: apply to all APIs */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">Global API settings (apply to all APIs)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm text-slate-500">Daily Hit Limit</label>
              <div className="flex gap-2">
                <select value={hitMode} onChange={(e) => setHitMode(e.target.value as any)} className="h-9 rounded-md border border-slate-300 bg-transparent px-3 text-sm text-slate-800">
                  <option value="set">Set absolute</option>
                  <option value="inc">Increase by</option>
                  <option value="dec">Decrease by</option>
                </select>
                <input type="number" min={1} value={globalHitValue} onChange={(e) => setGlobalHitValue(e.target.value)} placeholder="e.g. 1000" className="h-9 rounded-md border border-slate-300 px-3 text-sm w-full" />
                <button onClick={applyHitLimitAll} disabled={isApplyingHits} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500">{isApplyingHits ? "Applying..." : "Apply"}</button>
              </div>
              <p className="text-xs text-slate-500">Set or adjust daily hit limit for all APIs</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-500">Per API Cost</label>
              <div className="flex gap-2">
                <select value={costMode} onChange={(e) => setCostMode(e.target.value as any)} className="h-9 rounded-md border border-slate-300 bg-transparent px-3 text-sm text-slate-800">
                  <option value="set">Set absolute</option>
                  <option value="inc">Increase by</option>
                  <option value="dec">Decrease by</option>
                </select>
                <input type="number" step="0.01" min={0} value={globalCostValue} onChange={(e) => setGlobalCostValue(e.target.value)} placeholder="e.g. 0.50" className="h-9 rounded-md border border-slate-300 px-3 text-sm w-full" />
                <button onClick={applyCostAll} disabled={isApplyingCost} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500">{isApplyingCost ? "Applying..." : "Apply"}</button>
              </div>
              <p className="text-xs text-slate-500">Set or adjust per-call cost for all APIs</p>
            </div>
          </div>

          <div className="mt-4 border-t pt-3">
            <label className="text-sm text-slate-500">Set Status for Vendor APIs</label>
            <div className="flex gap-2 items-center mt-2">
              <select className="h-9 rounded-md border border-slate-300 bg-transparent px-3 text-sm" value={selectedVendorName} onChange={(e) => setSelectedVendorName(e.target.value)}>
                <option value="">Select vendor</option>
                {vendorOptions.map((v: any) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
              <button disabled={!selectedVendorName || isApplyingStatus} onClick={() => setStatusForVendor('ACTIVE')} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500">{isApplyingStatus ? 'Applying...' : 'Set Active'}</button>
              <button disabled={!selectedVendorName || isApplyingStatus} onClick={() => setStatusForVendor('INACTIVE')} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-3 text-xs">{isApplyingStatus ? 'Applying...' : 'Set Inactive'}</button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Set status for all APIs belonging to selected vendor.</p>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <label className="text-sm text-slate-500 flex items-center gap-2"><input type="checkbox" checked={excludeSelected} onChange={(e) => setExcludeSelected(e.target.checked)} /> Exclude selected vendors ({Object.keys(selectedIds).filter((id) => selectedIds[id]).length})</label>
            <p className="text-xs text-slate-500">Select vendor rows below to exclude them from the bulk operation.</p>
          </div>
        </div>

        {/* Undo banner */}
        {lastBulk && (
          <div className="mb-4 rounded-md border border-slate-200 bg-yellow-50 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">Updated {lastBulk.count} APIs. <button onClick={undoBulk} className="underline text-sm">Undo</button></div>
              <div className="text-xs text-slate-500">This option expires in 15s</div>
            </div>
          </div>
        )}

        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="py-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                  <input type="checkbox" checked={selectAll} onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAll(checked);
                    if (checked) {
                      const m: Record<string, boolean> = {};
                      apis.forEach((a:any) => { m[a.id] = true; });
                      setSelectedIds(m);
                    } else {
                      setSelectedIds({});
                    }
                  }} />
                </th>
                <th className="py-2 text-sm font-medium text-slate-900 dark:text-slate-50">Vendor</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Endpoint</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Base URL</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">API Key</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Daily Limit</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Per Call</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Status</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9}>Loading...</td></tr>
              )}
              {!isLoading && apis.length === 0 && (
                <tr><td colSpan={9}>No APIs</td></tr>
              )}
              {apis.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td><input type="checkbox" checked={!!selectedIds[a.id]} onChange={(e) => { setSelectedIds((s) => ({ ...s, [a.id]: e.target.checked })); if (!e.target.checked) setSelectAll(false); }} /></td>
                  <td className="py-3 text-sm text-slate-800 dark:text-slate-100">{a.vendorName}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{a.endpoint}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{a.baseUrl}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{a.apiKey}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{a.dailyHitLimit.toLocaleString()}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{a.perApiCost.toFixed(2)}</td>
                  <td className="text-sm">
                    <button
                      type="button"
                      aria-pressed={a.status === "ACTIVE"}
                      disabled={isApplyingStatus}
                      onClick={() => toggleStatus(a)}
                      className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors ${a.status === "ACTIVE" ? 'bg-indigo-600' : 'bg-slate-200'} ${isApplyingStatus ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform bg-white rounded-full transition-transform ${a.status === "ACTIVE" ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td>
                    <button className="mr-2 text-sm text-brand-500" onClick={() => { setEditingApi(a); openModal(); }}>Edit</button>

                    <button className="text-sm text-error-500" onClick={() => { setToDelete(a); openDeleteModal(); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">Delete API</h3>
          <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete {toDelete?.endpoint}? This action cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { closeDeleteModal(); setToDelete(null); }} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Cancel</button>
            <button onClick={confirmDelete} className="inline-flex h-9 items-center justify-center rounded-full bg-rose-600 px-4 text-sm text-white">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isConfirmOpen} onClose={() => { closeConfirmModal(); setPendingBulkAction(null); }} className="max-w-sm m-4">
        <div className="p-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">Confirm bulk update</h3>
          <p className="text-sm text-slate-600 mt-2">You are about to apply this change to {pendingBulkAction?.targets.length || 0} APIs. This operation can be impactful. Are you sure you want to proceed?</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { closeConfirmModal(); setPendingBulkAction(null); }} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Cancel</button>
            <button onClick={performPendingBulkAction} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm text-white">Confirm</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isOpen} onClose={() => { closeAndNavigate(); setEditingApi(null); }} className="max-w-md lg:max-w-lg m-4">
        <ApiForm api={editingApi}
          onSuccess={() => { const wasEdit = !!editingApi; closeAndNavigate(); setEditingApi(null); dispatch(addNotification({ variant: 'success', title: wasEdit ? 'API updated' : 'API created', message: wasEdit ? 'API updated successfully' : 'API created successfully' })); }}
          onCancel={() => { closeAndNavigate(); setEditingApi(null); }}
          onError={(msg) => dispatch(addNotification({ variant: 'error', title: 'Operation failed', message: msg }))}
        />
      </Modal>
    </div>
  );
}