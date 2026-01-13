import React, { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { useCreateUserMutation, useUpdateUserMutation } from "../../features/users/usersApi";
import type { User } from "../../features/users/types";
import { Role } from "../../features/users/types";

export default function UserForm({ onSuccess, onError, onCancel, user }: { onSuccess?: () => void; onError?: (msg: string) => void; onCancel?: () => void; user?: User | null }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    role: "Operations" as Role,
  });

  const ROLE_MAP: Record<string, number> = { Operations: 2, Finance: 3, IT: 4 };


  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        mobile: user.mobile || "",
        password: "",
        role: user.role || ("Operations" as Role),
      });
    }
  }, [user]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();


  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName) e.firstName = "Required";
    if (!form.lastName) e.lastName = "Required";
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = "Enter valid 10-digit mobile starting with 6-9";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter valid email";
    // password required on create; optional on edit
    if (!user && (!form.password || form.password.length < 8)) e.password = "Password min 8 chars";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (user) {
        // update
        const body: any = {
          "firstName": form.firstName,
          "lastName": form.lastName,
          "email": form.email,
          "mobile": form.mobile,
          "roleId": ROLE_MAP[form.role] || undefined,
        };
        if (form.password) body["password"] = form.password; // only send password if provided
        await updateUser({ id: user.id, body }).unwrap();
      } else {
        // create
        const createPayload: any = {
          "firstName": form.firstName,
          "lastName": form.lastName,
          "email": form.email,
          "mobile": form.mobile,
          "password": form.password,
          "roleId": ROLE_MAP[form.role] || undefined,
        };
        await createUser(createPayload as any).unwrap();
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      const message = err?.data?.message || err?.message || (user ? "Failed to update" : "Failed to create");
      if (onError) onError(message);
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-medium mb-3 text-slate-900 dark:text-slate-50">{user ? "Edit User" : "Create User"}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm text-slate-500">First Name</label>
            <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
            {errors.firstName && <p className="text-sm text-error-500">{errors.firstName}</p>}
          </div>
          <div>
            <label className="text-sm text-slate-500">Last Name</label>
            <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
            {errors.lastName && <p className="text-sm text-error-500">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-500">Mobile</label>
          <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} />
          {errors.mobile && <p className="text-sm text-error-500">{errors.mobile}</p>}
        </div>

        <div>
          <label className="text-sm text-slate-500">Email</label>
          <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
          {errors.email && <p className="text-sm text-error-500">{errors.email}</p>}
        </div>

        {!user && (
          <div>
            <label className="text-sm text-slate-500">Password</label>
            <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
            {errors.password && <p className="text-sm text-error-500">{errors.password}</p>}
          </div>
        )}

        <div>
          <label className="text-sm text-slate-500">Role</label>
          <Select
            defaultValue={form.role}
            options={[{ value: "Operations", label: "Operations" }, { value: "Finance", label: "Finance" }, { value: "IT", label: "IT" }]}
            onChange={(v) => update("role", v)}
          />
        </div>



        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onCancel && onCancel()} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700">Cancel</button>
          <button type="submit" disabled={creating || updating} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500">{creating || updating ? (user ? "Updating..." : "Creating...") : user ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}
