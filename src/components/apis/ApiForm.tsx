import React, { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import { useCreateApiMutation, useUpdateApiMutation } from "../../features/apis/apisApi";
import type { ApiItem } from "../../features/apis/types";

export default function ApiForm({ onSuccess, onError, onCancel, api }: { onSuccess?: () => void; onError?: (msg: string) => void; onCancel?: () => void; api?: ApiItem | null }) {
  // when used in places where we want to dispatch global notifications directly, you can add a dispatch prop; keeping this component simple and using onSuccess/onError callbacks to allow parent to show toasts.
  const [form, setForm] = useState({
    baseUrl: "",
    endpoint: "",
    apiKey: "",
    vendorName: "",
    dailyHitLimit: "",
    perApiCost: "",
  });

  useEffect(() => {
    if (api) setForm({ baseUrl: api.baseUrl || "", endpoint: api.endpoint || "", apiKey: api.apiKey || "", vendorName: api.vendorName || "", dailyHitLimit: String(api.dailyHitLimit || ""), perApiCost: String(api.perApiCost || "") });
  }, [api]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createApi, { isLoading: creating }] = useCreateApiMutation();
  const [updateApi, { isLoading: updating }] = useUpdateApiMutation();

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.baseUrl) e.baseUrl = "Required";
    if (!form.endpoint) e.endpoint = "Required";

    if (!form.apiKey) e.apiKey = "Required";
    if (!form.vendorName) e.vendorName = "Required";
    if (!form.dailyHitLimit || Number.isNaN(Number(form.dailyHitLimit)) || Number(form.dailyHitLimit) <= 0) e.dailyHitLimit = "Enter valid daily hit limit (>0)";
    if (!form.perApiCost || Number.isNaN(Number(form.perApiCost)) || Number(form.perApiCost) < 0) e.perApiCost = "Enter valid cost (>=0)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload: any = {
        baseUrl: form.baseUrl,
        endpoint: form.endpoint,
        apiKey: form.apiKey,
        vendorName: form.vendorName,
        dailyHitLimit: Number(form.dailyHitLimit),
        perApiCost: Number(form.perApiCost),
      };

      if (api) {
        await updateApi({ id: api.id, body: payload }).unwrap();
      } else {
        await createApi(payload).unwrap();
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
          {errors.endpoint && <p className="text-sm text-error-500">{errors.endpoint}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">API Key</label>
          <Input value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} />
          {errors.apiKey && <p className="text-sm text-error-500">{errors.apiKey}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">Vendor Name</label>
          <Input value={form.vendorName} onChange={(e) => update("vendorName", e.target.value)} />
          {errors.vendorName && <p className="text-sm text-error-500">{errors.vendorName}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">Daily Hit Limit</label>
          <input type="number" min={1} value={form.dailyHitLimit} onChange={(e) => update("dailyHitLimit", e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          {errors.dailyHitLimit && <p className="text-sm text-error-500">{errors.dailyHitLimit}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">Per API Cost</label>
          <input type="number" step="0.01" min={0} value={form.perApiCost} onChange={(e) => update("perApiCost", e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          {errors.perApiCost && <p className="text-sm text-error-500">{errors.perApiCost}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onCancel?.()} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={creating || updating} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500">{creating || updating ? (api ? "Updating..." : "Creating...") : api ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}
