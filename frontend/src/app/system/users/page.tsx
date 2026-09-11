"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell, Check, Eye, EyeOff, Pencil, Trash2, User, UserPlus, X } from "lucide-react";
import { deleteUser, fetchCurrentUser, fetchPendingNotifications, fetchUsers, registerUser, resetUserPassword, UnauthorizedError, updateUserRole, type CurrentUser, type PasswordResetNotification, type UserRole } from "@/lib/api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "handling_personnel", label: "Handling Personnel" },
  { value: "viewer", label: "Viewer" },
  { value: "admin", label: "Admin" },
];

export default function UsersPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [role, setRole] = useState<UserRole>("handling_personnel");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [notifications, setNotifications] = useState<PasswordResetNotification[]>([]);
  const [deletingUser, setDeletingUser] = useState<CurrentUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [draftRole, setDraftRole] = useState<UserRole | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | { type: "create" }
    | { type: "reset"; userId: number }
    | { type: "edit"; userId: number }
    | { type: "saveRole"; userId: number; nextRole: UserRole }
    | { type: "cancelEdit"; userId: number }
    | null
  >(null);

  useEffect(() => {
    fetchCurrentUser()
      .then(async (user) => {
        const isAdmin = user.role === "admin";
        setCurrentUserId(user.user_id);
        setAuthorized(isAdmin);
        if (isAdmin) {
          const [existingUsers, pendingNotifications] = await Promise.all([fetchUsers(), fetchPendingNotifications()]);
          setUsers(existingUsers);
          setNotifications(pendingNotifications);
        }
      })
      .catch((error) => {
        if (error instanceof UnauthorizedError) window.location.href = "/login";
        else setAuthorized(false);
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmAction({ type: "create" });
  }

  async function createUser() {
    setMessage(null);
    setIsSubmitting(true);

    try {
      const createdUser = await registerUser({
        full_name: fullName.trim(),
        username: username.trim(),
        password,
        role,
      });
      setFullName("");
      setUsername("");
      setPassword("");
      setShowCreatePassword(false);
      setRole("handling_personnel");
      setUsers((currentUsers) => [...currentUsers, createdUser].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setMessage({ type: "success", text: "User created successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to create user." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resetUserId === null) return;
    setConfirmAction({ type: "reset", userId: resetUserId });
  }

  function closeResetPasswordModal() {
    setResetUserId(null);
    setResetPassword("");
    setShowResetPassword(false);
  }

  async function resetUserPasswordForAccount(userId: number) {
    setMessage(null);
    setIsResettingPassword(true);
    try {
      await resetUserPassword(userId, resetPassword);
      setNotifications((current) => current.filter((notification) => notification.user_id !== userId));
      closeResetPasswordModal();
      setMessage({ type: "success", text: "Password reset successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to reset password." });
    } finally {
      setIsResettingPassword(false);
    }
  }

  function startEditing(userId: number) {
    setConfirmAction({ type: "edit", userId });
  }

  function beginEditing(userId: number) {
    const user = getUser(userId);
    if (!user) return;
    setEditingUserId(userId);
    setDraftRole(user.role);
  }

  function handleRoleChange(nextRole: UserRole) {
    setDraftRole(nextRole);
  }

  function requestSaveRole(userId: number) {
    if (!draftRole || draftRole === getUser(userId)?.role) return;
    setConfirmAction({ type: "saveRole", userId, nextRole: draftRole });
  }

  function requestCancelEdit(userId: number) {
    setConfirmAction({ type: "cancelEdit", userId });
  }

  function cancelEditing() {
    setEditingUserId(null);
    setDraftRole(null);
  }

  async function updateRole(userId: number, nextRole: UserRole) {
    try {
      const updatedUser = await updateUserRole(userId, nextRole);
      setUsers((currentUsers) => currentUsers.map((user) => user.user_id === userId ? updatedUser : user));
      setMessage({ type: "success", text: "User role updated successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to update user role." });
    }
  }

  function getUser(userId: number) {
    return users.find((user) => user.user_id === userId);
  }

  function confirmPendingAction() {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    if (action.type === "create") void createUser();
    if (action.type === "reset") void resetUserPasswordForAccount(action.userId);
    if (action.type === "edit") beginEditing(action.userId);
    if (action.type === "saveRole") {
      void updateRole(action.userId, action.nextRole);
      cancelEditing();
    }
    if (action.type === "cancelEdit") cancelEditing();
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.user_id);
      setUsers((currentUsers) => currentUsers.filter((user) => user.user_id !== deletingUser.user_id));
      setNotifications((current) => current.filter((notification) => notification.user_id !== deletingUser.user_id));
      setMessage({ type: "success", text: "User deleted successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to delete user." });
    } finally {
      setDeletingUser(null);
    }
  }

  if (authorized === null) {
    return <div className="p-6 text-sm text-slate-500">Loading user management...</div>;
  }

  if (!authorized) {
    return <div className="p-6 text-sm text-rose-700">You do not have permission to manage users.</div>;
  }

  return (
    <div className="min-h-full bg-[#F5F1E3] p-4 sm:p-5 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <div className="mb-4 shrink-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Administration</p>
          <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create accounts and assign their access role.</p>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.5fr)]">
        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12331F] text-[#B08D57]">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#12331F]">Add User</h2>
              <p className="text-xs text-slate-500">The user can sign in immediately after creation.</p>
            </div>
          </div>

          {message && (
            <div className={`mb-4 rounded-lg border px-3 py-2.5 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {message.text}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">
              Full name
              <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Username
              <input required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Temporary password
              <span className="relative mt-1.5 block">
                <input required minLength={6} type={showCreatePassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" />
                <button type="button" onClick={() => setShowCreatePassword((visible) => !visible)} aria-label={showCreatePassword ? "Hide temporary password" : "Show temporary password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#12331F]/20">
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Role
              <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10">
                {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-[#12331F] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1B4A2C] disabled:cursor-not-allowed disabled:opacity-60">
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between border-b border-amber-200 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#12331F]">Notifications</h2>
              <p className="mt-1 text-xs text-slate-600">{notifications.length} pending password reset request{notifications.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No pending notifications.</p>
          ) : (
            <div className="max-h-[24vh] space-y-2 overflow-y-auto pr-1">
              {notifications.map((notification) => (
                <div key={notification.notification_id} className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                      {notification.user_profile_picture ? (
                        <img src={notification.user_profile_picture} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{notification.message}</p>
                  </div>
                  <button type="button" onClick={() => { setResetUserId(notification.user_id); setResetPassword(""); setShowResetPassword(false); }} className="shrink-0 rounded-lg bg-[#12331F] px-3 py-2 text-xs font-medium text-white hover:bg-[#1B4A2C]">Reset password</button>
                </div>
              ))}
            </div>
          )}
        </section>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#12331F]">Existing Users</h2>
              <p className="mt-1 text-xs text-slate-500">{users.length} registered account{users.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          <div className="max-h-[42vh] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Profile</th>
                  <th className="px-3 py-2 font-semibold">Full name</th>
                  <th className="px-3 py-2 font-semibold">Username</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Password</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-3 py-3">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#B08D57]/70 bg-[#12331F] text-white shadow-sm">
                        {user.profile_picture ? (
                          <img src={user.profile_picture} alt={`${user.full_name} profile`} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-700">{user.full_name}</td>
                    <td className="px-3 py-3 text-slate-500">{user.username}</td>
                    <td className="px-3 py-3 text-slate-500">
                      <select value={editingUserId === user.user_id ? draftRole ?? user.role : user.role} disabled={editingUserId !== user.user_id || user.user_id === currentUserId} onChange={(event) => handleRoleChange(event.target.value as UserRole)} aria-label={`Role for ${user.full_name}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-[#12331F] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60">
                        {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => { setResetUserId(user.user_id); setResetPassword(""); }} className="text-xs font-medium text-[#12331F] underline hover:text-[#B08D57]">Reset password</button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {user.user_id !== currentUserId && (editingUserId === user.user_id ? (
                          <>
                            {draftRole && draftRole !== user.role && <button type="button" onClick={() => requestSaveRole(user.user_id)} aria-label={`Save changes for ${user.full_name}`} title="Save changes" className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"><Check className="h-4 w-4" />Save changes</button>}
                            <button type="button" onClick={() => requestCancelEdit(user.user_id)} aria-label={`Cancel editing ${user.full_name}`} title="Cancel editing" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"><X className="h-4 w-4" /></button>
                          </>
                        ) : (
                          <button type="button" onClick={() => startEditing(user.user_id)} aria-label={`Edit ${user.full_name}`} title="Edit user" className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#12331F] transition hover:bg-emerald-50"><Pencil className="h-4 w-4" />Edit</button>
                        ))}
                        <button type="button" disabled={user.user_id === currentUserId} onClick={() => setDeletingUser(user)} aria-label={`Delete ${user.full_name}`} title={user.user_id === currentUserId ? "You cannot delete your own account" : "Delete user"} className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        </div>
        </div>
      </div>

      {/* RESET PASSWORD — now a popup instead of an inline card */}
      {resetUserId !== null && (
        <Modal title="Reset user password" onClose={closeResetPasswordModal}>
          <form id="admin-reset-password-form" onSubmit={handleResetPassword} className="space-y-3">
            <p className="text-sm text-slate-600">
              Set a temporary password for{" "}
              <span className="font-medium text-slate-800">{getUser(resetUserId)?.full_name ?? "this user"}</span>.
            </p>
            {getUser(resetUserId) && (
              <p className="text-xs text-slate-500">Username: {getUser(resetUserId)?.username}</p>
            )}

            <div>
              <label htmlFor="admin-reset-password" className="mb-1.5 block text-xs font-medium text-slate-600">
                Temporary password
              </label>
              <div className="relative">
                <input
                  id="admin-reset-password"
                  required
                  minLength={6}
                  type={showResetPassword ? "text" : "password"}
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword((visible) => !visible)}
                  aria-label={showResetPassword ? "Hide temporary password" : "Show temporary password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#12331F]/20"
                >
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeResetPasswordModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResettingPassword}
                className="rounded-lg bg-[#12331F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1B4A2C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResettingPassword ? "Resetting password..." : "Continue to confirmation"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingUser && (
        <ConfirmDialog
          title="Delete user"
          message={`Delete ${deletingUser.full_name}? Their account and notifications will be removed, while case records will be preserved.`}
          confirmLabel="Delete user"
          onConfirm={handleDeleteUser}
          onCancel={() => setDeletingUser(null)}
          confirmPhrase={deletingUser.username}
        />
      )}
      {confirmAction?.type === "create" && (
        <ConfirmDialog
          title="Create user"
          message={`Create ${fullName.trim()} (${username.trim()}) with the ${ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role} role?`}
          confirmLabel="Create user"
          onConfirm={confirmPendingAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "reset" && (
        <ConfirmDialog
          title="Reset password"
          message={`Set a new temporary password for ${getUser(confirmAction.userId)?.full_name ?? "this user"}?`}
          confirmLabel="Reset password"
          onConfirm={confirmPendingAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "edit" && (
        <ConfirmDialog
          title="Edit user"
          message={`Edit the role for ${getUser(confirmAction.userId)?.full_name ?? "this user"}?`}
          confirmLabel="Edit user"
          onConfirm={confirmPendingAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "saveRole" && (
        <ConfirmDialog
          title="Update user role"
          message={`Save the ${ROLE_OPTIONS.find((option) => option.value === confirmAction.nextRole)?.label ?? confirmAction.nextRole} role for ${getUser(confirmAction.userId)?.full_name ?? "this user"}?`}
          confirmLabel="Update role"
          onConfirm={confirmPendingAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "cancelEdit" && (
        <ConfirmDialog
          title="Discard changes"
          message={`Discard unsaved role changes for ${getUser(confirmAction.userId)?.full_name ?? "this user"}?`}
          confirmLabel="Discard changes"
          onConfirm={confirmPendingAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}