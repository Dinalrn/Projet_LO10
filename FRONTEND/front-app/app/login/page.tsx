"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

interface FieldError {
  login?: string;
  username?: string;
  email?: string;
  password?: string;
  confirm?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});

  // Form state
  const [login, setLogin] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const reset = (next: Mode) => {
    setMode(next);
    setErrors({});
    setLogin("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  const validate = (): FieldError => {
    const e: FieldError = {};
    if (mode === "register") {
      if (!username.trim()) e.username = "Username is required";
      if (!email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        e.email = "Invalid email address";
      if (password.length < 6) e.password = "Minimum 6 characters";
      if (password !== confirm) e.confirm = "Passwords do not match";
    } else {
      if (!login.trim()) e.login = "Username or email is required";
      if (!password) e.password = "Password is required";
    }
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const url =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { login, password }
          : { username, email, password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error ?? "Something went wrong" });
        return;
      }

      // Session cookie is set by the API route — navigate to the app
      router.push("/pages");
      router.refresh();
    } catch {
      setErrors({ general: "Network error, please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Wanna<span className="text-violet-500">Go</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Discover events happening near you
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-8 shadow-xl">

          {/* Tab switcher */}
          <div className="mb-6 flex rounded-xl bg-gray-800 p-1">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => reset(m)}
                className={`flex-1 rounded-lg py-1.5 text-sm font-semibold capitalize transition
                  ${mode === m
                    ? "bg-violet-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          {/* General error */}
          {errors.general && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-950/60 px-4 py-2.5
                            text-sm text-red-300">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Register-only fields */}
            {mode === "register" && (
              <>
                <Field
                  label="Username"
                  type="text"
                  value={username}
                  onChange={setUsername}
                  placeholder="your_name"
                  error={errors.username}
                  autoComplete="username"
                />
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  error={errors.email}
                  autoComplete="email"
                />
              </>
            )}

            {/* Login identifier (login mode only) */}
            {mode === "login" && (
              <Field
                label="Username or email"
                type="text"
                value={login}
                onChange={setLogin}
                placeholder="your_name or you@example.com"
                error={errors.login}
                autoComplete="username"
              />
            )}

            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
              error={errors.password}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {mode === "register" && (
              <Field
                label="Confirm password"
                type="password"
                value={confirm}
                onChange={setConfirm}
                placeholder="••••••••"
                error={errors.confirm}
                autoComplete="new-password"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl
                         bg-violet-600 py-3 font-semibold text-white shadow
                         hover:bg-violet-700 active:bg-violet-800
                         disabled:opacity-50 transition"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              )}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          By using WannaGo you agree to our imaginary terms of service.
        </p>
      </div>
    </main>
  );
}

/* ── Reusable input field ──────────────────────────────────── */
function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`rounded-xl border px-4 py-2.5 text-sm text-white
                    bg-gray-800 placeholder-gray-600 outline-none
                    focus:ring-2 transition
                    ${error
                      ? "border-red-600 focus:ring-red-800"
                      : "border-gray-700 focus:border-violet-500 focus:ring-violet-900"
                    }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
