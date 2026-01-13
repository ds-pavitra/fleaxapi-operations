import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetMerchantQuery, useRemoveAssignedApiMutation, useAssignApisMutation, useUpdateMerchantMutation, useUpdateAssignedApiMutation } from "../../features/merchants/merchantsApi";
import { useListApisQuery } from "../../features/apis/apisApi";
import { Modal } from "../../components/ui/modal";
import MerchantForm from "../../components/merchants/MerchantForm";

import { useAppDispatch } from "../../hooks";
import { addNotification } from "../../features/notifications/notificationsSlice";

export default function MerchantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: merchant } = useGetMerchantQuery(id || "");
  const { data: apisData } = useListApisQuery({ page: 1, pageSize: 100 });

  const [editing, setEditing] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedApiIds, setSelectedApiIds] = useState<Record<string, boolean>>({});
  // per-assigned api edit state
  const [editingAssigned, setEditingAssigned] = useState<null | { apiId: string; apiName?: string; perApiCost?: number; dailyHitLimit?: number }>(null);
  const [perApiCostEdit, setPerApiCostEdit] = useState<string>("");
  const [dailyHitLimitEdit, setDailyHitLimitEdit] = useState<string>("");
  const [assignedErrors, setAssignedErrors] = useState<Record<string, string>>({});

  // confirm & undo state for bulk assign
  const [isConfirmAssignOpen, setIsConfirmAssignOpen] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<null | { id: string; apiIds: string[] }>(null);
  const [lastAssign, setLastAssign] = useState<null | { prevAssignedIds: string[]; addedCount: number }>(null);
  const [undoAssignTimer, setUndoAssignTimer] = useState<any | null>(null);



  const [assignApis] = useAssignApisMutation();
  const [removeAssignedApi] = useRemoveAssignedApiMutation();
  const [updateAssignedApi] = useUpdateAssignedApiMutation();
  const [updateMerchant] = useUpdateMerchantMutation();

  const apis = apisData?.data || [];

  const openAssign = () => {
    setSelectedApiIds({});
    setIsAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!merchant) return;
    const ids = Object.keys(selectedApiIds).filter((k) => selectedApiIds[k]);
    if (ids.length === 0) {
      dispatch(addNotification({ variant: "error", title: "No APIs selected", message: "Please select APIs to assign." }));
      return;
    }

    // collect previous assigned ids for undo
    const prevAssigned = (merchant.assignedApis || []).map((a) => a.apiId);

    // if bulk (threshold >5) ask for confirmation
    if (ids.length > 5) {
      setPendingAssign({ id: merchant.id, apiIds: ids });
      setIsConfirmAssignOpen(true);
      return;
    }

    try {
      const res = await assignApis({ id: merchant.id, apiIds: ids }).unwrap();
      // compute added count
      const newAssigned = (res.assignedApis || []).map((a: any) => a.apiId);
      const added = newAssigned.filter((x: string) => !prevAssigned.includes(x)).length;
      dispatch(addNotification({ variant: "success", title: "Assigned", message: `Assigned ${added} APIs` }));

      // store undo info
      setLastAssign({ prevAssignedIds: prevAssigned, addedCount: added });
      if (undoAssignTimer) clearTimeout(undoAssignTimer);
      const t = setTimeout(() => setLastAssign(null), 15000);
      setUndoAssignTimer(t);

      setIsAssignOpen(false);
    } catch (err: any) {
      const msg = (err && (err.data || err.error || err.message)) || "Failed to assign";
      dispatch(addNotification({ variant: "error", title: "Assign failed", message: msg }));
    }
  };

  const handleRemoveAssigned = async (apiId: string) => {
    if (!merchant) return;
    try {
      await removeAssignedApi({ id: merchant.id, apiId }).unwrap();
      dispatch(addNotification({ variant: "success", title: "Removed", message: `API removed` }));
    } catch (err: any) {
      const msg = (err && (err.data || err.error || err.message)) || "Failed to remove";
      dispatch(addNotification({ variant: "error", title: "Remove failed", message: msg }));
    }
  };

  const performPendingAssign = async () => {
    if (!pendingAssign) return;
    setIsConfirmAssignOpen(false);
    const { id, apiIds } = pendingAssign;
    const prevAssigned = (merchant?.assignedApis || []).map((a) => a.apiId);
    try {
      const res = await assignApis({ id, apiIds }).unwrap();
      const newAssigned = (res.assignedApis || []).map((a: any) => a.apiId);
      const added = newAssigned.filter((x: string) => !prevAssigned.includes(x)).length;
      dispatch(addNotification({ variant: "success", title: "Assigned", message: `Assigned ${added} APIs` }));

      setLastAssign({ prevAssignedIds: prevAssigned, addedCount: added });
      if (undoAssignTimer) clearTimeout(undoAssignTimer);
      const t = setTimeout(() => setLastAssign(null), 15000);
      setUndoAssignTimer(t);

      setIsAssignOpen(false);
      setPendingAssign(null);
    } catch (err: any) {
      const msg = (err && (err.data || err.error || err.message)) || "Failed to assign";
      dispatch(addNotification({ variant: "error", title: "Assign failed", message: msg }));
      setPendingAssign(null);
    }
  };

  const undoAssign = async () => {
    if (!merchant || !lastAssign) return;
    try {
      // revert assigned list to previous state
      await updateMerchant({ id: merchant.id, body: { assignedApis: lastAssign.prevAssignedIds.map((id) => ({ apiId: id })) } }).unwrap();
      dispatch(addNotification({ variant: "success", title: "Undo complete", message: `Reverted ${lastAssign.addedCount} assigned APIs` }));
    } catch (err: any) {
      const msg = (err && (err.data || err.error || err.message)) || "Failed to undo";
      dispatch(addNotification({ variant: "error", title: "Undo failed", message: msg }));
    } finally {
      setLastAssign(null);
      if (undoAssignTimer) { clearTimeout(undoAssignTimer); setUndoAssignTimer(null); }
    }
  };

//   const handleAddWallet = async () => {
//     if (!merchant) return;
//     // const amount = Number(amountToAdd);
//     if (isNaN(amount) || amount <= 0) {
//       dispatch(addNotification({ variant: "error", title: "Invalid", message: "Enter valid amount" }));
//       return;
//     }
//     try {
//       await addWallet({ id: merchant.id, amount }).unwrap();
//       dispatch(addNotification({ variant: "success", title: "Wallet updated", message: `Added ${amount.toFixed(2)}` }));
//     //   setIsAddWalletOpen(false);
//     //   setAmountToAdd("");
//     } catch (err: any) {
//       const msg = (err && (err.data || err.error || err.message)) || "Failed to add wallet";
//       dispatch(addNotification({ variant: "error", title: "Failed", message: msg }));
//     }
//   };



  if (!merchant) return <div>Customer not found</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Customer Details</h3>
          <div>
            <button onClick={() => navigate(-1)} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Back</button>
            <button onClick={() => setEditing(true)} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-medium text-white ml-2">Edit</button>
            {/* <button onClick={() => setIsAddWalletOpen(true)} className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-600 px-4 text-sm font-medium text-white ml-2">Add Wallet</button> */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-slate-500">Name</div>
            <div className="text-sm text-slate-700">{merchant.firstName} {merchant.lastName}</div>

            <div className="text-sm text-slate-500">Email</div>
            <div className="text-sm text-slate-700">{merchant.email}</div>

            <div className="text-sm text-slate-500">Mobile</div>
            <div className="text-sm text-slate-700">{merchant.mobile}</div>

            <div className="text-sm text-slate-500">Business name</div>
            <div className="text-sm text-slate-700">{merchant.businessName}</div>

            <div className="text-sm text-slate-500">Business type</div>
            <div className="text-sm text-slate-700">{merchant.businessType}</div>

            <div className="text-sm text-slate-500">Registration</div>
            <div className="text-sm text-slate-700">{merchant.registrationType}</div>
          </div>

          <div className="space-y-2">
<div>
              <div className="text-sm text-slate-500">Wallet balance</div>
              <div className="text-sm text-slate-700">{merchant.walletAmount != null ? merchant.walletAmount : '-'}</div>

              <div className="text-sm text-slate-500">Payment received</div>
              <div className="text-sm text-slate-700">{merchant.paymentReceived ? "Yes" : "No"}</div>

              <div className="text-sm text-slate-500">Status</div>
              <div className="text-sm text-slate-700">{merchant.status}</div>
            </div>


          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Assigned APIs</h4>
            <div>
              <button onClick={openAssign} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white">Add APIs</button>
            </div>
          </div>

          {/* Undo banner for assignments */}
          {lastAssign && (
            <div className="mb-4 rounded-md border border-slate-200 bg-yellow-50 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">Assigned {lastAssign.addedCount} APIs. <button onClick={undoAssign} className="underline text-sm">Undo</button></div>
                <div className="text-xs text-slate-500">This option expires in 15s</div>
              </div>
            </div>
          )}

          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="text-sm font-medium">Base URL</th>
                  <th className="text-sm font-medium">Endpoint</th>
                  <th className="text-sm font-medium">Cost</th>
                  <th className="text-sm font-medium">Status</th>
                  <th className="text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {((merchant.assignedApis || []).map((a) => {
                  // merge latest api data (if available) so changes reflect in merchant details
                  const live = apis.find((p) => p.id === a.apiId);
                  return ({
                    apiId: a.apiId,
                    apiName: a.apiName || live?.vendorName,
                    baseUrl: a.baseUrl || live?.baseUrl,
                    endpoint: a.endpoint || live?.endpoint,
                    perApiCost: a.perApiCost !== undefined ? a.perApiCost : live?.perApiCost,
                    dailyHitLimit: a.dailyHitLimit !== undefined ? a.dailyHitLimit : live?.dailyHitLimit,
                  });
                })).map((a: any) => (
                  <tr key={a.apiId} className="border-t">
                      <td className="text-sm text-slate-700">{a.baseUrl || "-"}</td>
                    <td className="text-sm text-slate-700">{a.endpoint || "-"}</td>
                    <td className="text-sm text-slate-700">{a.perApiCost !== undefined ? a.perApiCost.toFixed(2) : "-"}</td>
                    <td className="text-sm text-slate-700">{a.apiId ? "Active" : "-"}</td>
                    <td>
                      <button onClick={() => navigate('/apis', { state: { editApiId: a.apiId } })} className="mr-2 text-sm text-brand-500">Edit</button>
                      <button onClick={() => handleRemoveAssigned(a.apiId)} className="text-sm text-error-500">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign modal */}
      <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} className="max-w-lg m-4">
        <div className="p-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">Assign APIs</h3>
          <p className="text-sm text-slate-600 mt-2">Select APIs to assign to the merchant</p>

          <div className="mt-4">
            <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto">
              {apis.map((api) => (
                <label key={api.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!selectedApiIds[api.id]} onChange={(e) => setSelectedApiIds((s) => ({ ...s, [api.id]: e.target.checked }))} />
                  <span className="text-sm">{api.vendorName} — {api.endpoint}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setIsAssignOpen(false)} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Cancel</button>
              <button onClick={handleAssign} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm text-white">Assign</button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isConfirmAssignOpen} onClose={() => { setIsConfirmAssignOpen(false); setPendingAssign(null); }} className="max-w-sm m-4">
        <div className="p-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">Confirm bulk assign</h3>
          <p className="text-sm text-slate-600 mt-2">You are about to assign {pendingAssign?.apiIds.length || 0} APIs to this merchant. This operation can be impactful. Are you sure you want to proceed?</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { setIsConfirmAssignOpen(false); setPendingAssign(null); }} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Cancel</button>
            <button onClick={performPendingAssign} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm text-white">Confirm</button>
          </div>
        </div>
      </Modal>

      {/* Edit merchant modal */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} className="max-w-md lg:max-w-lg m-4">
        <MerchantForm merchant={merchant}
          onSuccess={() => { setEditing(false); dispatch(addNotification({ variant: 'success', title: 'Customer updated', message: 'Customer updated successfully' })); }}
          onCancel={() => setEditing(false)}
          onError={(msg) => dispatch(addNotification({ variant: 'error', title: 'Operation failed', message: msg }))}
        />
      </Modal>



      {/* Add wallet modal */}
      {/* Edit assigned API modal */}
      <Modal isOpen={!!editingAssigned} onClose={() => setEditingAssigned(null)} className="max-w-sm m-4">
        <div className="p-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">Edit assigned API</h3>
          <p className="text-sm text-slate-600 mt-2">Edit per-merchant API settings (cost / limit)</p>
          <div className="mt-4">
            <div>
              <label className="text-sm text-slate-500">API</label>
              <div className="text-sm text-slate-700">{editingAssigned?.apiName || editingAssigned?.apiId}</div>
            </div>

            <div className="mt-3">
              <label className="text-sm text-slate-500">Per API Cost</label>
              <input type="number" step="0.01" min={0} value={perApiCostEdit} onChange={(e) => setPerApiCostEdit(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
              {assignedErrors.perApiCost && <p className="text-sm text-error-500">{assignedErrors.perApiCost}</p>}
            </div>

            <div className="mt-3">
              <label className="text-sm text-slate-500">Daily Hit Limit</label>
              <input type="number" min={0} value={dailyHitLimitEdit} onChange={(e) => setDailyHitLimitEdit(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
              {assignedErrors.dailyHitLimit && <p className="text-sm text-error-500">{assignedErrors.dailyHitLimit}</p>}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditingAssigned(null)} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Cancel</button>
              <button onClick={async () => {
                if (!editingAssigned || !merchant) return;
                const errs: Record<string, string> = {};
                const c = perApiCostEdit === "" ? undefined : Number(perApiCostEdit);
                const l = dailyHitLimitEdit === "" ? undefined : Number(dailyHitLimitEdit);
                if (c !== undefined && (isNaN(c) || c < 0)) errs.perApiCost = "Enter valid cost (>=0)";
                if (l !== undefined && (isNaN(l) || l < 0)) errs.dailyHitLimit = "Enter valid limit (>=0)";
                setAssignedErrors(errs);
                if (Object.keys(errs).length) return;
                try {
                  const body: any = {};
                  if (c !== undefined) body.perApiCost = c;
                  if (l !== undefined) body.dailyHitLimit = l;
                  await updateAssignedApi({ id: merchant.id, apiId: editingAssigned.apiId, body }).unwrap();
                  dispatch(addNotification({ variant: 'success', title: 'Updated', message: 'Assigned API updated' }));
                  setEditingAssigned(null);
                } catch (err: any) {
                  const msg = (err && (err.data || err.error || err.message)) || 'Failed to update assigned api';
                  dispatch(addNotification({ variant: 'error', title: 'Update failed', message: msg }));
                }
              }} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm text-white">Save</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}