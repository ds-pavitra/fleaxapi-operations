import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetMerchantQuery } from "../../features/merchants/merchantsApi";
import { Modal } from "../../components/ui/modal";
import ChannelPartnerForm from "../../components/channelPartners/ChannelPartnerForm";

import { useAppDispatch } from "../../hooks";
import { addNotification } from "../../features/notifications/notificationsSlice";

export default function ChannelPartnerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: partner } = useGetMerchantQuery(id || "");

  const [editing, setEditing] = useState(false);

  const handleFormError = (msg: string) => dispatch(addNotification({ variant: 'error', title: 'Operation failed', message: msg }));

  if (!partner) return <div>Channel partner not found</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Channel Partner Details</h3>
          <div>
            <button onClick={() => navigate(-1)} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Back</button>
            <button onClick={() => setEditing(true)} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-medium text-white ml-2">Edit</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-slate-500">Name</div>
            <div className="text-sm text-slate-700">{partner.firstName} {partner.lastName}</div>

            <div className="text-sm text-slate-500">Email</div>
            <div className="text-sm text-slate-700">{partner.email}</div>

            <div className="text-sm text-slate-500">Mobile</div>
            <div className="text-sm text-slate-700">{partner.mobile}</div>

            <div className="text-sm text-slate-500">Business name</div>
            <div className="text-sm text-slate-700">{partner.businessName}</div>

            <div className="text-sm text-slate-500">Commission %</div>
            <div className="text-sm text-slate-700">{partner.commissionPercentage != null ? `${partner.commissionPercentage}%` : '-'}</div>

            <div className="text-sm text-slate-500">Status</div>
            <div className="text-sm text-slate-700">{partner.status}</div>
          </div>

          <div className="space-y-2">
            <div>
              <div className="text-sm text-slate-500">Subscription Plan</div>
              <div className="text-sm text-slate-700">{partner.subscriptionPlan ? partner.subscriptionPlan.name || JSON.stringify(partner.subscriptionPlan) : '-'}</div>

              <div className="text-sm text-slate-500 mt-4">Onboarded Customers / Sub-users</div>
              <div className="mt-2">
                {partner.subUsers && partner.subUsers.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {partner.subUsers.map((s: any) => (
                      <li key={s.id} className="text-sm text-slate-700">{s.firstName} {s.lastName} — {s.email}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">No sub-users found</div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      <Modal isOpen={editing} onClose={() => setEditing(false)} className="max-w-md lg:max-w-lg m-4">
        <ChannelPartnerForm partner={partner}
          onSuccess={() => { setEditing(false); dispatch(addNotification({ variant: 'success', title: 'Channel partner updated', message: 'Channel partner updated successfully' })); }}
          onCancel={() => setEditing(false)}
          onError={handleFormError}
        />
      </Modal>
    </div>
  );
}
