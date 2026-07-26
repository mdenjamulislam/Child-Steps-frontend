"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, only users whose role is in this list are allowed */
  allowedRoles?: string[];
  /** Override redirect path for unauthenticated users (default: /login) */
  redirectTo?: string;
}

/**
 * ProtectedRoute — wraps any page/component that requires authentication.
 *
 * Behaviour:
 * - While loading: shows a branded full-screen spinner
 * - If unauthenticated: redirects to `redirectTo` (default /login)
 * - If authenticated but wrong role: redirects to /unauthorized
 * - If authenticated + correct role: renders children
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (!role || !allowedRoles.includes(role)) {
        router.replace("/unauthorized");
      }
    }
  }, [user, role, loading, allowedRoles, redirectTo, router]);

  // ── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-purple-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🌱</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">
            Loading your profile…
          </p>
        </div>
      </div>
    );
  }

  // ── Not Authenticated ───────────────────────────────────────────────────────
  if (!user) {
    // The useEffect will redirect, show nothing in the meantime
    return null;
  }

  // ── Wrong Role ──────────────────────────────────────────────────────────────
  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return null;
  }

  // ── Authorised ──────────────────────────────────────────────────────────────
  return <>{children}</>;
}
