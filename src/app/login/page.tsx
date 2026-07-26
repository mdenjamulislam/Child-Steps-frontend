"use client";

import { useState, FormEvent, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { LoginPayload } from "@/types/auth";

// ── Form State ────────────────────────────────────────────────────────────────

interface LoginFormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: LoginFormState): FormErrors {
  const errors: FormErrors = {};

  if (!values.email || !EMAIL_REGEX.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.password || values.password.length < 1) {
    errors.password = "Please enter your password.";
  }

  return errors;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      // Clear field-specific error on change
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const payload: LoginPayload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    const result = await login(payload);

    if (result.success) {
      router.push("/");
    } else {
      setErrors({ general: result.error ?? "Login failed. Please try again." });
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-50 via-purple-50 to-sky-100">
      {/* Background decorations */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand-200 opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent-200 opacity-30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-100 opacity-20 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        {/* Glass card */}
        <div className="glass-card p-8 sm:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glass mb-4">
              <span className="text-3xl">🌱</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to your Child Stepper account
            </p>
          </div>

          {/* General Error Banner */}
          {errors.general && (
            <div
              role="alert"
              id="login-error-banner"
              className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in"
            >
              <span className="flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd" />
                </svg>
              </span>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className={`input-field ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.email && (
                <p id="login-email-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  className={`input-field pr-12 ${errors.password ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full h-12 text-base mt-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-medium">
                New to Child Stepper?
              </span>
            </div>
          </div>

          {/* Sign up link */}
          <Link
            href="/signup"
            id="goto-signup"
            className="btn-secondary w-full h-11 text-sm flex items-center justify-center"
          >
            Create a free account
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-5">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
          {" & "}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}
