"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { fetchCurrentUser, fetchUsers, registerUser, UnauthorizedError, type CurrentUser, type UserRole } from "@/lib/api";

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
  const [role, setRole] = useState<UserRole>("handling_personnel");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then(async (user) => {
        const isAdmin = user.role === "admin";
        setAuthorized(isAdmin);
        if (isAdmin) setUsers(await fetchUsers());
      })
      .catch((error) => {
        if (error instanceof UnauthorizedError) window.location.href = "/login";
        else setAuthorized(false);
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setRole("handling_personnel");
      setUsers((currentUsers) => [...currentUsers, createdUser].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setMessage({ type: "success", text: "User created successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to create user." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authorized === null) {
    return <div className="p-6 text-sm text-slate-500">Loading user management...</div>;
  }

  if (!authorized) {
    return <div className="p-6 text-sm text-rose-700">You do not have permission to manage users.</div>;
  }

  return (
    <div className="min-h-full bg-[#F5F1E3] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Administration</p>
          <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create accounts and assign their access role.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
              <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Role
              <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10">
                {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-[#12331F] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1B4A2C] disabled:cursor-not-allowed disabled:opacity-60">
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#12331F]">Existing Users</h2>
              <p className="mt-1 text-xs text-slate-500">{users.length} registered account{users.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Full name</th>
                  <th className="px-3 py-2 font-semibold">Username</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-3 py-3 font-medium text-slate-700">{user.full_name}</td>
                    <td className="px-3 py-3 text-slate-500">{user.username}</td>
                    <td className="px-3 py-3 text-slate-500">
                      {user.role === "handling_personnel" ? "Handling Personnel" : user.role === "admin" ? "Admin" : "Viewer"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
