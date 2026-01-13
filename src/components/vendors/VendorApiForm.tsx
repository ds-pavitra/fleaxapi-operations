import React, { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import { useAddApiMutation, useUpdateApiMutation } from "../../features/vendors/vendorsApi";

export default function VendorApiForm({ vendorId, api, onSuccess, onError, onCancel }: { vendorId: string; api?: any | null; onSuccess?: () => void; onError?: (msg: string) => void; onCancel?: () => void }) {
  const [form, setForm] = useState({ baseUrl: "", endpoint: "", apiKey: "", costPerCall: "0", dailyHitLimit: "0" });

  useEffect(() => {
    if (api) setForm({ baseUrl: api.baseUrl || "", endpoint: api.endpoint || "", apiKey: api.apiKey || "", costPerCall: String(api.costPerCall || 0), dailyHitLimit: String(api.dailyHitLimit || 0) });
  }, [api]);

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [addApi, { isLoading: adding }] = useAddApiMutation();
  const [updateApi, { isLoading: updating }] = useUpdateApiMutation();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.baseUrl) e.baseUrl = "Required";
    if (!form.endpoint) e.endpoint = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    try {
      const payload: any = {
        baseUrl: form.baseUrl,
        endpoint: form.endpoint,
        apiKey: form.apiKey || undefined,
        costPerCall: Number(form.costPerCall) || 0,
        dailyHitLimit: Number(form.dailyHitLimit) || 0,
      };

      if (api) {
        await updateApi({ id: vendorId, apiId: api.id, body: payload }).unwrap();
      } else {
        await addApi({ id: vendorId, body: payload }).unwrap();
      }

      onSuccess?.();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "Failed";
      onError?.(message);
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-medium mb-3 text-slate-900 dark:text-slate-50">{api ? "Edit API" : "Add API"}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-slate-500">Base URL</label>
          <Input value={form.baseUrl} onChange={(e) => update("baseUrl", e.target.value)} />
          {errors.baseUrl && <p className="text-sm text-error-500">{errors.baseUrl}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">Endpoint</label>
          <Input value={form.endpoint} onChange={(e) => update("endpoint", e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-slate-500">API Key</label>
          <Input value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-slate-500">Cost per call</label>
          <input type="number" step="0.0001" min={0} value={form.costPerCall} onChange={(e) => update("costPerCall", e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        </div>

        <div>
          <label className="text-sm text-slate-500">Daily hit limit</label>
          <input type="number" min={0} value={form.dailyHitLimit} onChange={(e) => update("dailyHitLimit", e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={adding || updating} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500">{adding || updating ? (api ? "Updating..." : "Creating...") : api ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}
