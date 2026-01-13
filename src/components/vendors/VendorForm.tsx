import React, { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import { useCreateVendorMutation, useUpdateVendorMutation } from "../../features/vendors/vendorsApi";
import type { Vendor } from "../../features/vendors/types";

export default function VendorForm({ onSuccess, onError, onCancel, vendor }: { onSuccess?: () => void; onError?: (msg: string) => void; onCancel?: () => void; vendor?: Vendor | null }) {
  const [form, setForm] = useState({ name: "", baseUrl: "", apiKey: "", email: "", mobile: "" , status: "ACTIVE"});

  useEffect(() => {
    if (vendor) setForm({ name: vendor.name || "", baseUrl: vendor.baseUrl || "", apiKey: vendor.apiKey || "", email: vendor.email || "", mobile: vendor.mobile || "" , status: vendor.status || "ACTIVE"});
  }, [vendor]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name) e.name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const payload: any = {
        name: form.name,
        baseUrl: form.baseUrl || undefined,
        apiKey: form.apiKey || undefined,
        email: form.email || undefined,
        mobile: form.mobile || undefined,
      };
      if (vendor) {
        await updateVendor({ id: vendor.id, body: payload }).unwrap();
      } else {
        await createVendor(payload).unwrap();
      }
      onSuccess?.();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "Failed";
      onError?.(message);
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-medium mb-3 text-slate-900 dark:text-slate-50">{vendor ? "Edit Vendor" : "Add Vendor"}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-slate-500">Vendor name</label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          {errors.name && <p className="text-sm text-error-500">{errors.name}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">Base URL</label>
          <Input value={form.baseUrl} onChange={(e) => update("baseUrl", e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-slate-500">API Key</label>
          <Input value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-slate-500">Status</label>
          <select className="h-9 rounded-full border border-slate-300 bg-transparent px-3 text-xs text-slate-800" value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-500">Contact</label>
          <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onCancel?.()} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={creating || updating} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500">{creating || updating ? (vendor ? "Updating..." : "Creating...") : vendor ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}
