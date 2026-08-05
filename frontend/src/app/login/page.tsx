"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, Eye, EyeOff } from "lucide-react";

const CASE_STAGES = [
  { code: "LA", label: "Labor Arbiter" },
  { code: "NLRC", label: "National Labor Relations Commission" },
  { code: "CA", label: "Court of Appeals" },
  { code: "SC", label: "Supreme Court" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/system/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-[#F5F1E3]">
      {/* LEFT — brand / case journey panel */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-[#12331F] px-12 py-12 text-white lg:flex">
        {/* subtle texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B08D57]">
              <Scale className="h-5 w-5 text-[#12331F]" />
            </div>
            <div>
              <p className="font-serif text-sm font-semibold tracking-tight">CMI Case Management</p>
              <p className="text-xs text-white/50">Labor Case Monitoring</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-serif text-3xl font-medium leading-tight text-white">
            Every case, tracked
            <br />
            from filing to
            <br />
            final judgment.
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
            One record follows each case through every stage of appeal —
            nothing falls through the cracks.
          </p>

          {/* signature element: the real case journey, as a vertical stepper */}
          <div className="mt-10 space-y-0">
            {CASE_STAGES.map((stage, i) => (
              <div key={stage.code} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#B08D57]/40 bg-white/5 text-[10px] font-semibold tracking-wide text-[#B08D57]">
                    {stage.code}
                  </span>
                  {i < CASE_STAGES.length - 1 && (
                    <span className="my-1 h-8 w-px bg-white/15" />
                  )}
                </div>
                <p className="pt-1 text-sm text-white/70">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/30">
          Internal system · Authorized personnel only
        </p>
      </div>

      {/* RIGHT — sign in form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* mobile-only brand mark */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#12331F]">
              <Scale className="h-4 w-4 text-[#B08D57]" />
            </div>
            <p className="font-serif text-sm font-semibold text-[#12331F]">CMI Case Management</p>
          </div>

          <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Welcome back</p>
          <h2 className="mt-1.5 font-serif text-2xl font-medium text-[#12331F]">Sign in to your account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to access the case dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-600">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 ou#12331Ftline-none transition placeholder:text-slate-400 focus:border-[] focus:ring-2 focus:ring-[#12331F]/10"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-slate-600">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-[#B08D57] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border bor#12331Fder-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#12331F] focus:ring-2 focus:ring-[#12331F]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#12331F] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1B4A2C] active:bg-[#12331F]"
            >
              Sign in
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Having trouble signing in? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}