import { useMemo, useState, useEffect } from "react";
import { useListUsersQuery, useDeleteUserMutation, useGetUserQuery, useUpdateUserMutation } from "../../features/users/usersApi";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import UserForm from "../../components/users/UserForm";
import { useAppDispatch } from "../../hooks";
import { addNotification } from "../../features/notifications/notificationsSlice";

export default function UsersList() {
  // UI uses 1-based page; backend uses 0-based page query param
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50); // default to 50 as per requirement
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);

  // Query params are used only for API calls; no URL reads/writes are performed here.

  const { data, isLoading } = useListUsersQuery({ page, pageSize, search, role, status });
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { isOpen, openModal, closeModal } = useModal();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const { data: editingUser, isLoading: isEditingUserLoading, error: editingUserError } = useGetUserQuery(editingUserId || "", { skip: !editingUserId });
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [toDelete, setToDelete] = useState<any | null>(null);
  // notifications are now global via the notifications slice
  const dispatch = useAppDispatch();



  const total = data?.total || 0;
  const users = data?.data || [];

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteUser(toDelete.id).unwrap();
      dispatch(addNotification({ variant: "success", title: "User deleted", message: `${toDelete.firstName} ${toDelete.lastName} deleted` }));
    } catch (err: any) {
      dispatch(addNotification({ variant: "error", title: "Delete failed", message: err?.data?.message || err?.message || "Failed to delete user" }));
    } finally {
      setToDelete(null);
      closeDeleteModal();
    }
  };

  const toggleStatus = async (u: any) => {
    const next = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setUpdatingId(String(u.id));
      await updateUser({ id: String(u.id), body: { status: next } }).unwrap();
      dispatch(addNotification({ variant: "success", title: "Status updated", message: `${u.firstName} ${u.lastName} is now ${next}` }));
    } catch (err: any) {
      dispatch(addNotification({ variant: "error", title: "Update failed", message: err?.data?.message || err?.message || "Failed to update status" }));
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper to render pagination items with ellipsis
  const getPageItems = (current: number, totalPages: number) => {
    const items: Array<number | string> = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }

    items.push(1);
    if (current > 4) items.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);

    for (let i = start; i <= end; i++) items.push(i);

    if (current < totalPages - 3) items.push("...");
    items.push(totalPages);
    return items;
  };

  // show toast if fetching user details for edit fails
  useEffect(() => {
    if (editingUserError) {
      const err: any = editingUserError as any;
      dispatch(addNotification({ variant: 'error', title: 'Failed to load user', message: err?.data?.message || err?.message || 'Failed to fetch user details' }));
      setEditingUserId(null);
      closeModal();
    }
  }, [editingUserError]);

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
              value={role || ""}
              onChange={(e) => setRole(e.target.value || undefined)}
            >
              <option value="">All Roles</option>
              <option value="Operations">Operations</option>
              <option value="Finance">Finance</option>
              <option value="IT">IT</option>
            </select>

            <select
              className="h-9 rounded-full border border-slate-300 bg-transparent px-3 text-xs text-slate-800 dark:text-slate-100 dark:border-slate-600"
              value={status || ""}
              onChange={(e) => setStatus(e.target.value || undefined)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm">Rows</label>
            <select
              className="h-9 rounded-full border border-slate-300 bg-transparent px-3 text-xs text-slate-800 dark:text-slate-100 dark:border-slate-600"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>

            <button className="inline-flex h-9 items-center justify-center rounded-full bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500" onClick={() => { setEditingUserId(null); openModal(); }}>Create User</button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="py-2 text-sm font-medium text-slate-900 dark:text-slate-50">Name</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Email</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Mobile</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Role</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Status</th>
                <th className="text-sm font-medium text-slate-900 dark:text-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6}>Loading...</td></tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr><td colSpan={6}>No users</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-3 text-sm text-slate-800 dark:text-slate-100">{u.firstName} {u.lastName}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{u.email}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{u.mobile}</td>
                  <td className="text-sm text-slate-700 dark:text-slate-200">{u.role}</td>
                  <td className="text-sm">
                    <button
                      type="button"
                      aria-pressed={u.status === "ACTIVE"}
                      disabled={updatingId === String(u.id)}
                      onClick={() => toggleStatus(u)}
                      className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors ${u.status === "ACTIVE" ? 'bg-indigo-600' : 'bg-slate-200'} ${updatingId === String(u.id) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform bg-white rounded-full transition-transform ${u.status === "ACTIVE" ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td>
                    <button className="mr-2 text-sm text-brand-500" onClick={() => { setEditingUserId(String(u.id)); openModal(); }}>Edit</button>
                    <button className="text-sm text-error-500" onClick={() => { setToDelete(u); openDeleteModal(); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-700 dark:text-slate-200">Page {page} of {pages}</div>

          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>

            {getPageItems(page, pages).map((it, idx) => (
              <button
                key={String(it) + idx}
                onClick={() => typeof it === "number" && setPage(it)}
                disabled={typeof it !== "number"}
                className={`px-2 py-1 border rounded ${it === page ? 'bg-slate-100' : ''}`}
              >
                {it}
              </button>
            ))}

            <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-2 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>



      <Modal isOpen={isDeleteOpen} onClose={() => { closeDeleteModal(); setToDelete(null); }} className="max-w-sm m-4">
        <div className="p-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">Delete User</h3>
          <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete {toDelete?.firstName} {toDelete?.lastName}? This action cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { closeDeleteModal(); setToDelete(null); }} className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm">Cancel</button>
            <button onClick={confirmDelete} className="inline-flex h-9 items-center justify-center rounded-full bg-rose-600 px-4 text-sm text-white">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isOpen} onClose={() => { closeModal(); setEditingUserId(null); }} className="max-w-md lg:max-w-lg m-4">
        {isEditingUserLoading ? (
          <div className="p-4">Loading user details...</div>
        ) : (
          <UserForm user={editingUserId ? (editingUser || null) : null}
            onSuccess={() => { const wasEdit = !!editingUserId; closeModal(); setEditingUserId(null); dispatch(addNotification({ variant: 'success', title: wasEdit ? 'User updated' : 'User created', message: wasEdit ? 'User updated successfully' : 'User created successfully' })); }}
            onCancel={() => { closeModal(); setEditingUserId(null); }}
            onError={(msg) => dispatch(addNotification({ variant: 'error', title: 'Operation failed', message: msg }))}
          />
        )}
      </Modal>
    </div>
  );
}
