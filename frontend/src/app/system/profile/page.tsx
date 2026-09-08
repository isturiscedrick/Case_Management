"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Bell, Camera, Eye, EyeOff, KeyRound, Save, User } from "lucide-react";
import { fetchCurrentUser, fetchMyNotifications, requestPasswordReset, UnauthorizedError, updateCurrentUser, type CurrentUser } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [approvedReset, setApprovedReset] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then(async (currentUser) => {
        setUser(currentUser);
        setFullName(currentUser.full_name);
        setUsername(currentUser.username);
        setProfilePicture(currentUser.profile_picture);
        const notifications = await fetchMyNotifications();
        setApprovedReset(notifications.some((notification) => notification.status === "approved"));
      })
      .catch((error) => {
        if (error instanceof UnauthorizedError) window.location.href = "/login";
        else setMessage({ type: "error", text: "Unable to load your profile." });
      });
  }, []);

  function handlePictureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Profile pictures must be 2 MB or smaller." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfilePicture(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);
    try {
      const updated = await updateCurrentUser({
        full_name: fullName.trim(),
        username: username.trim(),
        current_password: currentPassword || undefined,
        password: password || undefined,
        profile_picture: profilePicture,
      });
      setUser(updated);
      setFullName(updated.full_name);
      setUsername(updated.username);
      setPassword("");
      setCurrentPassword("");
      setApprovedReset(false);
      setProfilePicture(updated.profile_picture);
      window.dispatchEvent(new Event("profile-updated"));
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to update your profile." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordResetRequest() {
    setMessage(null);
    setIsRequestingReset(true);
    try {
      await requestPasswordReset();
      setMessage({ type: "success", text: "Password reset request sent to an administrator." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to send the request." });
    } finally {
      setIsRequestingReset(false);
    }
  }

  if (!user) return <div className="p-6 text-sm text-slate-500">Loading profile...</div>;

  return (
    <div className="min-h-full bg-[#F5F1E3] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Account</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Update your account details and profile picture.</p>

        <form onSubmit={handleSubmit} className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {message && <div className={`mb-5 rounded-lg border px-3 py-2.5 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{message.text}</div>}
          {approvedReset && <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">Your password reset request was approved. Enter a new password below; your current password is not required.</div>}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-[#F5F1E3] bg-[#12331F] text-white">
              {profilePicture ? <img src={profilePicture} alt="Profile preview" className="h-full w-full object-cover" /> : <User className="absolute inset-0 m-auto h-9 w-9" />}
              <label htmlFor="profile-picture" className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#B08D57] text-[#12331F] shadow-sm" title="Change profile picture">
                <Camera className="h-4 w-4" />
              </label>
              <input id="profile-picture" type="file" accept="image/*" className="sr-only" onChange={handlePictureChange} />
            </div>
            <div><h2 className="text-sm font-semibold text-[#12331F]">Profile picture</h2><p className="mt-1 text-xs text-slate-500">Use an image up to 2 MB.</p></div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" /></label>
            <label className="text-xs font-medium text-slate-600">Username<input required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" /></label>
            {!approvedReset && <label className="text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-1.5">Current password <KeyRound className="h-3.5 w-3.5 text-slate-400" /></span><span className="relative mt-1.5 block"><input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Required to change password" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" /><button type="button" onClick={() => setShowCurrentPassword((visible) => !visible)} aria-label={showCurrentPassword ? "Hide current password" : "Show current password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>}
            <label className="text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-1.5">New password <KeyRound className="h-3.5 w-3.5 text-slate-400" /></span><span className="relative mt-1.5 block"><input minLength={6} type={showNewPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Leave blank to keep your current password" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" /><button type="button" onClick={() => setShowNewPassword((visible) => !visible)} aria-label={showNewPassword ? "Hide new password" : "Show new password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {user.role !== "admin" && (
              <button type="button" onClick={handlePasswordResetRequest} disabled={isRequestingReset} className="inline-flex items-center gap-2 text-sm font-medium text-[#12331F] hover:text-[#B08D57] disabled:opacity-60">
                <Bell className="h-4 w-4" />
                {isRequestingReset ? "Sending request..." : "Request password reset from admin"}
              </button>
            )}
            <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-[#12331F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1B4A2C] disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}