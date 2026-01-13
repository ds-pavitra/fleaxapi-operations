import React, { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import { useCreateMerchantMutation, useUpdateMerchantMutation } from "../../features/merchants/merchantsApi";
import type { Merchant } from "../../features/merchants/types";

export default function MerchantForm({ onSuccess, onError, onCancel, merchant }: { onSuccess?: () => void; onError?: (msg: string) => void; onCancel?: () => void; merchant?: Merchant | null }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    businessName: "",
    businessType: "",
    registrationType: "",
    customerType: "",
    modeOfPayment: "",
    commissionPercentage: "",
    paymentReceived: false,
    walletAmount: "",
  });

  useEffect(() => {
    if (merchant) setForm({
      firstName: merchant.firstName || "",
      lastName: merchant.lastName || "",
      email: merchant.email || "",
      mobile: merchant.mobile || "",
      password: "",
      businessName: merchant.businessName || "",
      businessType: merchant.businessType || "",
      registrationType: merchant.registrationType || "",
      customerType: merchant.customerType || "",
      modeOfPayment: merchant.modeOfPayment || merchant.paymentMode || "",
      commissionPercentage: merchant.commissionPercentage != null ? String(merchant.commissionPercentage) : "",
      paymentReceived: !!merchant.paymentReceived,
      walletAmount: merchant.walletAmount != null ? String(merchant.walletAmount) : "",
    });
  }, [merchant]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createMerchant, { isLoading: creating }] = useCreateMerchantMutation();
  const [updateMerchant, { isLoading: updating }] = useUpdateMerchantMutation();

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName) e.firstName = "Required";
    if (!form.lastName) e.lastName = "Required";
    if (!form.email) e.email = "Required";
    if (!form.mobile) e.mobile = "Required";
    // password required on create; optional on edit
    if (!merchant && (!form.password || form.password.length < 8)) e.password = "Password min 8 chars";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const payload: any = {
        "firstName": form.firstName,
        "lastName": form.lastName,
        "email": form.email,
        "mobile": form.mobile,
        "businessName": form.businessName || undefined,
        "businessType": form.businessType || undefined,
        "registrationType": form.registrationType || undefined,
        "customerType": form.customerType || undefined,
        "modeOfPayment": form.modeOfPayment || undefined,
        "commissionPercentage": form.commissionPercentage === "" ? undefined : Number(form.commissionPercentage),
        "paymentReceived": !!form.paymentReceived,
        "walletAmount": form.walletAmount === "" ? undefined : Number(form.walletAmount),
      };

      if (!merchant) {
        // include password only on create
        payload["password"] = form.password;
        await createMerchant(payload).unwrap();
      } else {
        await updateMerchant({ id: merchant.id, body: payload }).unwrap();
      }
      onSuccess?.();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "Failed";
      onError?.(message);
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-medium mb-3 text-slate-900 dark:text-slate-50">{merchant ? "Edit Customer" : "Add Customer"}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-slate-500">First name</label>
          <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          {errors.firstName && <p className="text-sm text-error-500">{errors.firstName}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">Last name</label>
          <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          {errors.lastName && <p className="text-sm text-error-500">{errors.lastName}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">Email</label>
          <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
          {errors.email && <p className="text-sm text-error-500">{errors.email}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">Mobile</label>
          <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value)} />
          {errors.mobile && <p className="text-sm text-error-500">{errors.mobile}</p>}
        </div>

        {!merchant && (
          <div>
            <label className="text-sm text-slate-500">Password</label>
            <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
            {errors.password && <p className="text-sm text-error-500">{errors.password}</p>}
          </div>
        )}

        <div>
          <label className="text-sm text-slate-500">Business name</label>
          <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-slate-500">Business type</label>
          <Input value={form.businessType} onChange={(e) => update("businessType", e.target.value)} />
        </div>

        <div>
          <label className="text-sm">Gumasta / MSME / GST (optional)</label>
          <Input value={form.registrationType} onChange={(e) => update("registrationType", e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-slate-500">Customer Type</label>
          <select value={form.customerType} onChange={(e) => update("customerType", e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Select</option>
            <option value="DIRECT">Direct</option>
            <option value="ORGANIZATION">Organization</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-500">Mode of Payment</label>
          <select value={form.modeOfPayment} onChange={(e) => update("modeOfPayment", e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
            <option value="">Select</option>
            <option value="PREPAID">Prepaid</option>
            <option value="POSTPAID">Postpaid</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-500">Commission %</label>
          <Input type="number" value={form.commissionPercentage} onChange={(e) => update("commissionPercentage", e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-slate-500">Payment received</label>
          <div className="flex items-center gap-4 mt-2">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="paymentReceived" checked={form.paymentReceived === true} onChange={() => update("paymentReceived", true)} />
              <span className="text-sm">Yes</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="paymentReceived" checked={form.paymentReceived === false} onChange={() => update("paymentReceived", false)} />
              <span className="text-sm">No</span>
            </label>
          </div>
        </div>

        {form.paymentReceived && (
          <div>
            <label className="text-sm text-slate-500">Wallet token</label>
            <Input value={form.walletAmount} onChange={(e) => update("walletAmount", e.target.value)} />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onCancel?.()} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={creating || updating} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500">{creating || updating ? (merchant ? "Updating..." : "Creating...") : merchant ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}