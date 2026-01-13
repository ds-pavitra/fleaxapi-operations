import { useState } from "react";
import { useGetVendorQuery } from "../../features/vendors/vendorsApi";
import { useNavigate, useParams } from "react-router-dom";
import VendorApis from "../../components/vendors/VendorApis";
import VendorForm from "../../components/vendors/VendorForm";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import { useAppDispatch } from "../../hooks";
import { addNotification } from "../../features/notifications/notificationsSlice"; 
export default function VendorDetails() {
  const { id } = useParams();
  const { data: vendor, isLoading } = useGetVendorQuery(id || "");
  const navigate = useNavigate();

  const { isOpen: isEditOpen, openModal: openEdit, closeModal: closeEdit } = useModal();
  const [editing, setEditing] = useState<any | null>(null);
  const dispatch = useAppDispatch();

  if (isLoading) return <div>Loading...</div>;  if (!vendor) return <div>Vendor not found</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-2">
              <div className="text-sm text-slate-500">Name</div>
              <div className="text-sm text-slate-700">{vendor.name}</div>

              <div className="text-sm text-slate-500">Email</div>
              <div className="text-sm text-slate-700">{vendor.email || '-'}</div>

              <div className="text-sm text-slate-500">Mobile</div>
              <div className="text-sm text-slate-700">{vendor.mobile || '-'}</div>


            </div>

            <div className="space-y-2">
              <div className="text-sm text-slate-500">Balance</div>
              <div className="text-sm text-slate-700">{(vendor.balance || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>

              <div className="text-sm text-slate-500">Status</div>
              <div className="text-sm text-slate-700">{vendor.status}</div>


            </div>
          </div>

          <div className="flex-shrink-0 ml-4 flex flex-col gap-2">
            <button onClick={() => navigate('/vendors')} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Back</button>

            <button onClick={() => { setEditing(vendor); openEdit(); }} className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-medium text-white">Edit</button>
          </div>
        </div>

        <div className="mt-4">
          <VendorApis apis={vendor.apis} />
        </div>
      </div>



      <Modal isOpen={isEditOpen} onClose={() => { closeEdit(); setEditing(null); }} className="max-w-md lg:max-w-lg m-4">
        <VendorForm vendor={editing}
          onSuccess={() => { closeEdit(); setEditing(null); dispatch(addNotification({ variant: 'success', title: 'Vendor updated', message: 'Vendor updated successfully' })); }}
          onCancel={() => { closeEdit(); setEditing(null); }}
          onError={(msg) => dispatch(addNotification({ variant: 'error', title: 'Operation failed', message: msg }))}
        />
      </Modal>
    </div>
  );
}
