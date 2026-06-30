export type Role = "user" | "admin" | "superadmin";

export type Company = {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
  created_by: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  company_id: string | null;
  role: Role;
  created_at: string;
  aimastery_approved: boolean;
  aimastery_requested: boolean;
};

export type Activity = {
  id: string;
  title: string;
  description: string | null;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
  time_estimate_minutes: number | null;
  points: number;
  tools: string[];
  tags: string[];
  functions: string[];
  position: number;
  published: boolean;
  is_featured: boolean;
  is_locked: boolean;
  is_mastery: boolean;
  hero_position: number | null;
  category: string;
  created_at: string;
  thumbnail_url: string | null;
  banner_url: string | null;
  try_link: string | null;
};

export type UserProgress = {
  id: string;
  user_id: string;
  activity_id: string;
  status: "not_started" | "in_progress" | "completed";
  updated_at: string;
};
