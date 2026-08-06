// ── Shared Frontend TypeScript Types ─────────────────────────────────────────

export interface DailyLog {
  id: string;
  child_id: string;
  log_date: string;
  sleep_hours?: number;
  diet_details?: string;
  mood?: string;
  physical_activity_minutes?: number;
  notes?: string;
  created_at: string;
}
 
export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  blood_group?: string;
  parent_id: string;
  avatar_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  child_id: string;
  title: string;
  category: MilestoneCategory;
  description?: string;
  is_achieved: boolean;
  achieved_at?: string;
  created_at: string;
  updated_at: string;
}

export type MilestoneCategory =
  | "physical"
  | "cognitive"
  | "language"
  | "social"
  | "emotional"
  | "self_care";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}
