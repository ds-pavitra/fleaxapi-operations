import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetMerchantQuery } from "../../features/merchants/merchantsApi";
import { Modal } from "../../components/ui/modal";
import CustomerForm from "../../components/customers/CustomerForm";

import { useAppDispatch } from "../../hooks";
import { addNotification } from "../../features/notifications/notificationsSlice";

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: customer } = useGetMerchantQuery(id || "");

  const [editing, setEditing] = useState(false);

  const handleFormError = (msg: string) => dispatch(addNotification({ variant: 'error', title: 'Operation failed', message: msg }));

  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Customer Details</h3>
          <div>
            <button onClick={() => navigate(-1)} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Back</button>
            <button onClick={() => setEditing(true)} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-medium text-white ml-2">Edit</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-slate-500">Name</div>
            <div className="text-sm text-slate-700">{customer.firstName} {customer.lastName}</div>

            <div className="text-sm text-slate-500">Email</div>
            <div className="text-sm text-slate-700">{customer.email}</div>

            <div className="text-sm text-slate-500">Mobile</div>
            <div className="text-sm text-slate-700">{customer.mobile}</div>

            <div className="text-sm text-slate-500">Business name</div>
            <div className="text-sm text-slate-700">{customer.businessName}</div>

          </div>

          <div className="space-y-2">
            <div>
              <div className="text-sm text-slate-500">Status</div>
              <div className="text-sm text-slate-700">{customer.status}</div>
            </div>

          </div>
        </div>

      </div>

      <Modal isOpen={editing} onClose={() => setEditing(false)} className="max-w-md lg:max-w-lg m-4">
        <CustomerForm customer={customer}
          onSuccess={() => { setEditing(false); dispatch(addNotification({ variant: 'success', title: 'Customer updated', message: 'Customer updated successfully' })); }}
          onCancel={() => setEditing(false)}
          onError={handleFormError}
        />
      </Modal>
    </div>
  );
}
