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
}

export interface GrowthRecord {
  id: string;
  child_id: string;
  record_date: string;
  weight_kg: number;
  height_cm: number;
  head_circumference_cm?: number | null;
  bmi: number;
  created_at: string;
}

export type MilestoneCategory =
  | "Cognitive"
  | "Motor Skills"
  | "Language"
  | "Social-Emotional";

export type MilestoneStatus = "not-started" | "in-progress" | "achieved";

export interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  target_age_months: number;
  category: MilestoneCategory;
}

export interface ChildMilestoneItem extends Milestone {
  child_milestone_id?: string | null;
  status: MilestoneStatus;
  achieved_date?: string | null;
  notes?: string | null;
}

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
