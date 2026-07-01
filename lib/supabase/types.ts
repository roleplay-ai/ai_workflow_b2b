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
  completed_steps: number[];
  completed_at: string | null;
  updated_at: string;
  video_watched?: boolean;
};

export type ActivityStep = {
  id: string;
  activity_id: string;
  step_number: number;
  slide_number: number;
  title: string;
  what_learner_sees: string;
  what_this_means: string;
  what_to_do: string[];
  if_stuck: string;
  callout: string;
  coach_next: string;
  try_asking: string[];
  created_at: string;
};

export type SlideImage = { url: string; caption?: string };
export type QuizQuestion = { question: string; options: string[]; correct_index: number };
export type PromptTemplate = { label: string; text: string };
export type DownloadFile = { label: string; url: string; type: "pdf" | "ppt" | "xlsx" | "doc" | "other" };
export type WhatYouGetItem = { icon: string; title: string; description: string };

export type ActivityContent = {
  id: string;
  activity_id: string;
  slide_images: SlideImage[];
  workflow_markdown: string | null;
  quiz: QuizQuestion[];
  goals: string[];
  access_needed: string[];
  prompts: PromptTemplate[];
  downloads: DownloadFile[];
  video_url?: string | null;
  what_you_will_get: WhatYouGetItem[];
  updated_at: string;
};

export type ChatLog = {
  id: string;
  user_id: string;
  activity_id: string;
  step_index: number;
  step_title: string;
  user_message: string;
  ai_response: string;
  navigated_to_step: number | null;
  created_at: string;
};
