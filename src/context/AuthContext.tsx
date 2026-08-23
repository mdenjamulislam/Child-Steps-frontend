"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
} from "react";
import {
  apiClient,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "@/lib/apiClient";
import type {
  AuthState,
  AuthContextType,
  LoginPayload,
  SignupPayload,
  LoginResponse,
  SignupResponse,
  MeResponse,
} from "@/types/auth";

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  role: null,
  permissions: [],
  token: null,
  loading: true, // starts true so we can rehydrate silently
};

// ── Reducer ───────────────────────────────────────────────────────────────────

type AuthAction =
  | { type: "SET_USER"; payload: Omit<AuthState, "loading"> }
  | { type: "CLEAR_USER" }
  | { type: "SET_LOADING"; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, ...action.payload, loading: false };
    case "CLEAR_USER":
      return { ...initialState, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Rehydrate session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const rehydrate = async () => {
      const storedToken = getStoredToken();

      if (!storedToken) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      try {
        const res = await apiClient.get<MeResponse>("/auth/me", {
          token: storedToken,
        });

        if (res.success && res.data) {
          dispatch({
            type: "SET_USER",
            payload: {
              user: res.data,
              role: res.data.role,
              permissions: res.data.permissions,
              token: storedToken,
            },
          });
        } else {
          // Token is stale / invalid
          clearStoredToken();
          dispatch({ type: "CLEAR_USER" });
        }
      } catch {
        clearStoredToken();
        dispatch({ type: "CLEAR_USER" });
      }
    };

    rehydrate();
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getDashboardRouteForRole = (role: string | null): string => {
    if (!role) return "/dashboard";
    if (["parent", "guardian"].includes(role)) return "/dashboard/parent";
    if (role === "teacher") return "/dashboard/teacher";
    if (["super_admin", "admin", "manager", "staff"].includes(role)) return "/dashboard/admin";
    return "/dashboard";
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (payload: LoginPayload): Promise<{ success: boolean; error?: string; redirectRoute?: string }> => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const res = await apiClient.post<LoginResponse>("/auth/login", payload);

        if (res.success && res.data) {
          const { accessToken, user } = res.data;
          setStoredToken(accessToken);

          dispatch({
            type: "SET_USER",
            payload: {
              user,
              role: user.role,
              permissions: user.permissions,
              token: accessToken,
            },
          });

          return { success: true, redirectRoute: getDashboardRouteForRole(user.role) };
        }

        dispatch({ type: "SET_LOADING", payload: false });
        return { success: false, error: res.error ?? "Login failed." };
      } catch (err) {
        dispatch({ type: "SET_LOADING", payload: false });
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        return { success: false, error: message };
      }
    },
    []
  );

  // ── Signup ──────────────────────────────────────────────────────────────────
  const signup = useCallback(
    async (payload: SignupPayload): Promise<{ success: boolean; error?: string }> => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const res = await apiClient.post<SignupResponse>("/auth/signup", payload);

        dispatch({ type: "SET_LOADING", payload: false });

        if (res.success) {
          return { success: true };
        }

        return { success: false, error: res.error ?? "Signup failed." };
      } catch (err) {
        dispatch({ type: "SET_LOADING", payload: false });
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        return { success: false, error: message };
      }
    },
    []
  );

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearStoredToken();
    dispatch({ type: "CLEAR_USER" });
  }, []);

  // ── Permission helpers ──────────────────────────────────────────────────────
  const hasPermission = useCallback(
    (permissionName: string): boolean => {
      return state.permissions.includes(permissionName);
    },
    [state.permissions]
  );

  const hasRole = useCallback(
    (roleName: string | string[]): boolean => {
      if (!state.role) return false;
      if (Array.isArray(roleName)) return roleName.includes(state.role);
      return state.role === roleName;
    },
    [state.role]
  );

  // ── Memoised context value ──────────────────────────────────────────────────
  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      signup,
      logout,
      hasPermission,
      hasRole,
    }),
    [state, login, signup, logout, hasPermission, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
