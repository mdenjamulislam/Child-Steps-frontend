"use client";

import { useState, FormEvent, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { SignupPayload, PublicRoleName } from "@/types/auth";

// ── Constants ─────────────────────────────────────────────────────────────────

const PUBLIC_ROLES: { value: PublicRoleName; label: string; icon: string; description: string }[] =
  [
    { value: "parent", label: "Parent", icon: "👨‍👩‍👧", description: "Manage your child's profile & track milestones" },
    { value: "guardian", label: "Guardian", icon: "🛡️", description: "Care for a child as a legal guardian" },
    { value: "teacher", label: "Teacher", icon: "🎓", description: "Monitor students and log educational progress" },
  ];

// ── Form State ────────────────────────────────────────────────────────────────

interface SignupFormState {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role_name: PublicRoleName | "";
}

interface FormErrors {
  full_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  role_name?: string;
  general?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: SignupFormState): FormErrors {
  const errors: FormErrors = {};

  if (!values.full_name || values.full_name.trim().length < 2) {
    errors.full_name = "Full name must be at least 2 characters.";
  }
  if (!values.email || !EMAIL_REGEX.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.password || values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (values.password !== values.confirm_password) {
    errors.confirm_password = "Passwords do not match.";
  }
  if (!values.role_name) {
    errors.role_name = "Please select your role.";
  }

  return errors;
}

// ── Password Strength ─────────────────────────────────────────────────────────

function getPasswordStrength(password: string): {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
} {
  if (!password) return { level: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { level: 0, label: "", color: "" },
    { level: 1, label: "Weak", color: "bg-red-400" },
    { level: 2, label: "Fair", color: "bg-orange-400" },
    { level: 3, label: "Good", color: "bg-yellow-400" },
    { level: 4, label: "Strong", color: "bg-brand-500" },
  ] as const;

  const idx = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  return levels[idx];
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

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<SignupFormState>({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role_name: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleRoleSelect = useCallback(
    (value: PublicRoleName) => {
      setForm((prev) => ({ ...prev, role_name: value }));
      if (errors.role_name) {
        setErrors((prev) => ({ ...prev, role_name: undefined }));
      }
    },
    [errors.role_name]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const payload: SignupPayload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      full_name: form.full_name.trim(),
      role_name: form.role_name as PublicRoleName,
    };

    const result = await signup(payload);

    if (result.success) {
      setSuccessMessage(
        "🎉 Account created! Redirecting to login…"
      );
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setErrors({ general: result.error ?? "Signup failed. Please try again." });
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-50 via-emerald-50 to-sky-100 py-10">
      {/* Background decorations */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[550px] h-[550px] rounded-full bg-accent-200 opacity-25 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[550px] h-[550px] rounded-full bg-brand-200 opacity-25 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-blue-200 opacity-20 blur-2xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg mx-4 animate-slide-up">
        <div className="glass-card p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 shadow-glass mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Start tracking your child&apos;s development journey
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div
              role="status"
              id="signup-success-banner"
              className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-sm animate-fade-in"
            >
              <span>{successMessage}</span>
            </div>
          )}

          {/* General Error Banner */}
          {errors.general && (
            <div
              role="alert"
              id="signup-error-banner"
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

          <form id="signup-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="signup-full-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                id="signup-full-name"
                name="full_name"
                type="text"
                autoComplete="name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Jane Smith"
                aria-invalid={!!errors.full_name}
                aria-describedby={errors.full_name ? "signup-name-error" : undefined}
                className={`input-field ${errors.full_name ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.full_name && (
                <p id="signup-name-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.full_name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "signup-email-error" : undefined}
                className={`input-field ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.email && (
                <p id="signup-email-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "signup-password-error" : "signup-password-strength"}
                  className={`input-field pr-12 ${errors.password ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                <button
                  type="button"
                  id="signup-toggle-password"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {/* Password strength bar */}
              {form.password && (
                <div id="signup-password-strength" aria-live="polite" className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrength.level ? passwordStrength.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.label && (
                    <p className="text-xs text-gray-500">
                      Strength: <span className="font-semibold">{passwordStrength.label}</span>
                    </p>
                  )}
                </div>
              )}
              {errors.password && (
                <p id="signup-password-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  name="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  aria-invalid={!!errors.confirm_password}
                  aria-describedby={errors.confirm_password ? "signup-confirm-error" : undefined}
                  className={`input-field pr-12 ${errors.confirm_password ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                <button
                  type="button"
                  id="signup-toggle-confirm"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {errors.confirm_password && (
                <p id="signup-confirm-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.confirm_password}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <fieldset>
              <legend className="block text-sm font-semibold text-gray-700 mb-2">
                I am a…
                <span className="text-red-500 ml-0.5">*</span>
              </legend>
              <div
                id="signup-role-group"
                role="group"
                aria-required="true"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {PUBLIC_ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    id={`signup-role-${role.value}`}
                    onClick={() => handleRoleSelect(role.value)}
                    aria-pressed={form.role_name === role.value}
                    className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 ${
                      form.role_name === role.value
                        ? "border-brand-500 bg-brand-50 shadow-soft"
                        : "border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50"
                    }`}
                  >
                    <span className="text-2xl">{role.icon}</span>
                    <span className={`text-sm font-semibold ${form.role_name === role.value ? "text-brand-700" : "text-gray-700"}`}>
                      {role.label}
                    </span>
                    <span className="text-xs text-gray-400 leading-tight hidden sm:block">
                      {role.description}
                    </span>
                    {form.role_name === role.value && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {errors.role_name && (
                <p id="signup-role-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.role_name}
                </p>
              )}
            </fieldset>

            {/* Submit */}
            <button
              id="signup-submit"
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
                  Creating account…
                </>
              ) : (
                "Create account"
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
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign in link */}
          <Link
            href="/login"
            id="goto-login"
            className="btn-secondary w-full h-11 text-sm flex items-center justify-center"
          >
            Sign in instead
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
          {" & "}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}
