// ── Frontend Auth Types ───────────────────────────────────────────────────────

/** Roles available for public self-registration */
export type PublicRoleName = "parent" | "teacher" | "guardian";

/** All possible system roles */
export type SystemRoleName =
  | "super_admin"
  | "admin"
  | "manager"
  | "staff"
  | PublicRoleName;

/** User profile returned from the API */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  role_id: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

/** Payload for login */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Payload for signup */
export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
  role_name: PublicRoleName;
}

/** Auth state stored in context */
export interface AuthState {
  user: UserProfile | null;
  role: string | null;
  permissions: string[];
  token: string | null;
  loading: boolean;
}

/** Functions + state exposed by AuthContext */
export interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<{ success: boolean; error?: string }>;
  signup: (payload: SignupPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permissionName: string) => boolean;
  hasRole: (roleName: string | string[]) => boolean;
}

/** Shape of a successful login API response */
export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user: UserProfile;
  };
  error?: string;
}

/** Shape of a successful signup API response */
export interface SignupResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: string;
      email: string;
      full_name: string;
      role: string;
    };
  };
  error?: string;
}

/** Shape of GET /me response */
export interface MeResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}
