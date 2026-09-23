"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, Eye, EyeOff, Loader2, CircleAlert, LockKeyhole, ShieldCheck } from "lucide-react";
import { login, setSessionToken, LoginError } from "@/lib/api";

const CASE_STAGES = [
  { code: "SEnA", label: "Single Entry Approach" },
  { code: "LA", label: "Labor Arbiter" },
  { code: "NLRC", label: "National Labor Relations Commission" },
  { code: "CA", label: "Court of Appeals" },
  { code: "SC", label: "Supreme Court" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [shake, setShake] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);

  // Autofocus the username field on load — one less click for the
  // person signing in, and a small "this feels considered" touch.
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  function handlePasswordKeyEvent(e: React.KeyboardEvent<HTMLInputElement>) {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { access_token } = await login(username, password);
      setSessionToken(access_token);
      router.push("/system/dashboard");
    } catch (err) {
      setError(err instanceof LoginError ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
      // Brief shake draws the eye to the error without being alarmist.
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    }
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-[#F5F1E3]">
      {/* Ambient background texture for the whole page — kept very subtle
          so it reads as texture, not decoration competing with the form. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #12331F 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* LEFT — brand / case journey panel. h-full + a flex-1 centered
          middle block (instead of fixed margins) means this whole column
          redistributes itself to fit whatever viewport height it's given —
          short laptop screens compress the gaps, tall monitors relax them,
          neither ever needs to scroll. */}
      <div className="relative hidden h-full w-[44%] flex-col overflow-hidden bg-[#12331F] px-10 py-6 text-white lg:flex xl:w-[42%] xl:px-12 xl:py-8">
        {/* Layered glow accents instead of a flat dot grid — gives the
            panel depth without adding visual noise. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#B08D57]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#B08D57]/10 blur-3xl" />

        <div className="relative flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B08D57] shadow-[0_4px_14px_rgba(176,141,87,0.35)]">
            <Scale className="h-4 w-4 text-[#12331F]" />
          </div>
          <div>
            <p className="font-serif text-sm font-semibold tracking-tight">CMI Case Management</p>
            <p className="text-xs text-white/50">Labor Case Monitoring</p>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#B08D57]/30 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-[#B08D57]">
            <ShieldCheck size={12} />
            Internal system
          </span>

          <h1 className="mt-3 font-serif text-[1.6rem] font-medium leading-tight text-white xl:text-3xl">
            Every case, tracked
            <br />
            from filing to
            <br />
            final judgment.
          </h1>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/50 xl:text-sm">
            One record follows each case through every stage of appeal —
            nothing falls through the cracks.
          </p>

          <div className="mt-5 space-y-0 xl:mt-6">
            {CASE_STAGES.map((stage, i) => (
              <div key={stage.code} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#B08D57]/40 bg-white/5 text-[9px] font-semibold tracking-wide text-[#B08D57]">
                    {stage.code}
                  </span>
                  {i < CASE_STAGES.length - 1 && (
                    <span className="h-4 w-px bg-linear-to-b from-white/15 to-white/5" />
                  )}
                </div>
                <p className="pt-0.5 text-xs text-white/70 xl:text-sm">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative flex shrink-0 items-center gap-1.5 text-xs text-white/30">
          <LockKeyhole size={12} />
          Authorized personnel only
        </p>
      </div>

      {/* RIGHT — sign in form. h-full + centered flex means this column
          also just re-centers itself for any viewport height instead of
          relying on scroll. */}
      <div className="relative flex h-full flex-1 items-center justify-center overflow-y-auto px-6 py-6">
        <div className="w-full max-w-sm animate-[fadeIn_0.4s_ease-out]">
          {/* mobile-only brand mark */}
          <div className="mb-5 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#12331F]">
              <Scale className="h-4 w-4 text-[#B08D57]" />
            </div>
            <div>
              <p className="font-serif text-sm font-semibold text-[#12331F]">CMI Case Management</p>
              <p className="text-xs text-slate-400">Labor Case Monitoring</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ded7c5] bg-white/70 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:p-7">
            <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Welcome back</p>
            <h2 className="mt-1 font-serif text-xl font-medium text-[#12331F] sm:text-2xl">Sign in to your account</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your credentials to access the case dashboard.
            </p>

            {error && (
              <div
                role="alert"
                className={`mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 transition-transform ${
                  shake ? "animate-[shake_0.42s_ease-in-out]" : ""
                }`}
              >
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Username
                </label>
                <input
                  ref={usernameRef}
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#12331F] focus:ring-2 focus:ring-[#12331F]/10"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-600">
                    Password
                  </label>
                  {capsLockOn && (
                    <span className="text-[11px] font-medium text-amber-600">Caps Lock is on</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handlePasswordKeyEvent}
                    onKeyUp={handlePasswordKeyEvent}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                      capsLockOn
                        ? "border-amber-300 focus:border-amber-400 focus:ring-amber-200/60"
                        : "border-slate-200 focus:border-[#12331F] focus:ring-[#12331F]/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#12331F]/20"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !username || !password}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#12331F] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1B4A2C] hover:shadow-md active:translate-y-0 active:bg-[#12331F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
              >
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Having trouble signing in? Contact your system administrator.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          10%,
          90% {
            transform: translateX(-1px);
          }
          20%,
          80% {
            transform: translateX(2px);
          }
          30%,
          50%,
          70% {
            transform: translateX(-4px);
          }
          40%,
          60% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );
}