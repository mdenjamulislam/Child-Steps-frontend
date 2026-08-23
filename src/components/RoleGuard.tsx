"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// -- Props ---------------------------------------------------------------------

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

// -- Skeleton Loader -----------------------------------------------------------

function AuthLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Verifying session...</p>
      </div>
    </div>
  );
}

// -- Access Denied (403) UI ----------------------------------------------------

function AccessDenied() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <svg className="h-8 w-8 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
          Access Denied
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          You do not have the required permissions to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Go Back
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// -- Guard Component -----------------------------------------------------------

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, role, loading, hasRole } = useAuth();
  const router = useRouter();
  
  // Local state to prevent hydration mismatch flashes
  const [isReady, setIsReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Wait until AuthContext finishes its initial rehydration
    if (loading) return;

    if (!user) {
      // User is not logged in -> Redirect to login
      router.replace("/login");
      return;
    }

    if (hasRole(allowedRoles)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }

    setIsReady(true);
  }, [loading, user, role, allowedRoles, hasRole, router]);

  // Show loading skeleton while AuthContext is fetching / verifying
  if (loading || (!isReady && user)) {
    return <AuthLoadingSkeleton />;
  }

  // If ready but not authorized, show 403 page
  if (isReady && !isAuthorized) {
    return <AccessDenied />;
  }

  // If authorized, render children
  if (isReady && isAuthorized) {
    return <>{children}</>;
  }

  // Fallback (e.g. redirecting)
  return null;
}
