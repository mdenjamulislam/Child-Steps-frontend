"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function UnauthorizedPage() {
  const { user, role, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Background decoration */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-red-200 opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-200 opacity-30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        <div className="glass-card p-10 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <span className="text-4xl">🚫</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 font-display mb-2">
            Access Denied
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-1">
            You don&apos;t have permission to view this page.
          </p>
          {role && (
            <p className="text-gray-400 text-xs mb-6">
              Your current role:{" "}
              <span className="font-semibold text-gray-600 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                {role}
              </span>
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              id="unauthorized-go-back"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              ← Go Back
            </button>
            <Link href="/" id="unauthorized-go-home" className="btn-primary">
              Go to Dashboard
            </Link>
          </div>

          {/* Logout option */}
          {user && (
            <div className="mt-6 pt-5 border-t border-gray-200">
              <p className="text-xs text-gray-400 mb-2">
                Signed in as <span className="font-medium text-gray-600">{user.email}</span>
              </p>
              <button
                id="unauthorized-logout"
                onClick={handleLogout}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors underline"
              >
                Sign out and use a different account
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
