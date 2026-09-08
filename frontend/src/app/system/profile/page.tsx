"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Bell, Camera, Check, Eye, EyeOff, KeyRound, Pencil, User, X } from "lucide-react";
import { fetchCurrentUser, fetchMyNotifications, requestPasswordReset, UnauthorizedError, updateCurrentUser, type CurrentUser } from "@/lib/api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

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
  const [isEditing, setIsEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "cancel" | null>(null);

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
    if (!isEditing || !isDirty) return;
    setConfirmAction("save");
  }

  async function saveProfile() {
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
      setIsEditing(false);
      window.dispatchEvent(new Event("profile-updated"));
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to update your profile." });
    } finally {
      setIsSaving(false);
    }
  }

  const isDirty = Boolean(
    user && (
      fullName !== user.full_name ||
      username !== user.username ||
      password ||
      currentPassword ||
      profilePicture !== user.profile_picture
    ),
  );

  function discardChanges() {
    if (!user) return;
    setFullName(user.full_name);
    setUsername(user.username);
    setPassword("");
    setCurrentPassword("");
    setProfilePicture(user.profile_picture);
    setIsEditing(false);
  }

  function confirmPendingAction() {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === "save") void saveProfile();
    if (action === "cancel") discardChanges();
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

          <div className="flex flex-col gap-5 rounded-xl border border-[#ded7c5] bg-[#faf8f1] p-4 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0 rounded-full border-4 border-white bg-[#12331F] p-1 text-white shadow-[0_0_0_3px_#ded7c5,0_8px_20px_rgba(18,51,31,0.14)]">
              <div className="h-full w-full overflow-hidden rounded-full">
                {profilePicture ? <img src={profilePicture} alt="Profile preview" className="h-full w-full object-cover" /> : <User className="absolute inset-0 m-auto h-10 w-10" />}
              </div>
              <label htmlFor="profile-picture" className={`absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#B08D57] text-[#12331F] shadow-md transition focus-within:ring-2 focus-within:ring-[#12331F] focus-within:ring-offset-2 ${isEditing ? "cursor-pointer hover:scale-105 hover:bg-[#c19b64]" : "cursor-not-allowed opacity-50"}`} title={isEditing ? "Change profile picture" : "Click Edit to change your profile picture"}>
                <Camera className="h-4 w-4" />
              </label>
              <input id="profile-picture" type="file" accept="image/*" disabled={!isEditing} className="sr-only" onChange={handlePictureChange} />
            </div>
            <div><h2 className="text-sm font-semibold text-[#12331F]">Profile picture</h2><p className="mt-1 text-xs text-slate-500">Use an image up to 2 MB.</p></div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">Full name<input required disabled={!isEditing} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10 disabled:cursor-not-allowed disabled:opacity-60" /></label>
            <label className="text-xs font-medium text-slate-600">Username<input required disabled={!isEditing} value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10 disabled:cursor-not-allowed disabled:opacity-60" /></label>
            {!approvedReset && <label className="text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-1.5">Current password <KeyRound className="h-3.5 w-3.5 text-slate-400" /></span><span className="relative mt-1.5 block"><input disabled={!isEditing} type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Required to change password" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10 disabled:cursor-not-allowed disabled:opacity-60" /><button type="button" disabled={!isEditing} onClick={() => setShowCurrentPassword((visible) => !visible)} aria-label={showCurrentPassword ? "Hide current password" : "Show current password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50">{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>}
            <label className="text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-1.5">New password <KeyRound className="h-3.5 w-3.5 text-slate-400" /></span><span className="relative mt-1.5 block"><input disabled={!isEditing} minLength={6} type={showNewPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Leave blank to keep your current password" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm font-normal text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10 disabled:cursor-not-allowed disabled:opacity-60" /><button type="button" disabled={!isEditing} onClick={() => setShowNewPassword((visible) => !visible)} aria-label={showNewPassword ? "Hide new password" : "Show new password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50">{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {user.role !== "admin" && (
              <button type="button" onClick={handlePasswordResetRequest} disabled={isRequestingReset} className="inline-flex items-center gap-2 text-sm font-medium text-[#12331F] hover:text-[#B08D57] disabled:opacity-60">
                <Bell className="h-4 w-4" />
                {isRequestingReset ? "Sending request..." : "Request password reset from admin"}
              </button>
            )}
            {!isEditing ? (
              <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#12331F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1B4A2C]"><Pencil className="h-4 w-4" />Edit profile</button>
            ) : (
              <div className="flex items-center gap-2">
                {isDirty && <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-[#12331F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1B4A2C] disabled:cursor-not-allowed disabled:opacity-60"><Check className="h-4 w-4" />{isSaving ? "Saving..." : "Save changes"}</button>}
                <button type="button" onClick={() => isDirty ? setConfirmAction("cancel") : discardChanges()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" />Cancel</button>
              </div>
            )}
          </div>
        </form>
      </div>
      {confirmAction === "save" && (
        <ConfirmDialog
          title="Save profile changes"
          message="Save your updated profile details and picture?"
          confirmLabel="Save changes"
          onConfirm={confirmPendingAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "cancel" && (
        <ConfirmDialog
          title="Discard profile changes"
          message="Discard your unsaved profile changes?"
          confirmLabel="Discard changes"
          onConfirm={confirmPendingAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}