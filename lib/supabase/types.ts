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
  streak_count: number;
  streak_week_start: string | null;
  onboarding_completed_at: string | null;
  onboarding_tool: string | null;
  onboarding_tool_tier: string | null;
  onboarding_tool_other: string | null;
  onboarding_function: string | null;
  onboarding_function_other: string | null;
  onboarding_interests: string[];
  onboarding_interests_other: string | null;
  onboarding_experience: string | null;
  workflows_confirmed_at: string | null;
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
  categories: string[];
  functions: string[];
  position: number;
  published: boolean;
  is_featured: boolean;
  is_locked: boolean;
  is_mastery: boolean;
  hero_position: number | null;
  content_type: string;
  created_at: string;
  thumbnail_url: string | null;
  banner_url: string | null;
  try_link: string | null;
};

export type ActivityTag = {
  id: string;
  name: string;
  icon_url: string | null;
  is_featured: boolean;
  featured_description: string | null;
  featured_position: number;
  created_at: string;
};

export type ActivityCategory = {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

export type ActivityFunction = {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

export type SavedWorkflowSource = "onboarding" | "liked";

export type UserSavedWorkflow = {
  id: string;
  user_id: string;
  activity_id: string;
  source: SavedWorkflowSource;
  created_at: string;
};

export type ToolDeepDiveLinkType = "external" | "html";

export type ToolDeepDive = {
  id: string;
  title: string;
  url: string | null;
  link_type: ToolDeepDiveLinkType;
  html_path: string | null;
  description: string | null;
  tool: string | null;
  position: number;
  published: boolean;
  created_at: string;
};

export type ActivityCompany = {
  activity_id: string;
  company_id: string;
};

export type ToolLogo = {
  tool: string;
  logo_url: string;
  updated_at: string;
};

export type AIMasteryProgress = {
  user_id: string;
  module_id: string;
  completed_at: string;
};

export type ActivityView = {
  id: string;
  activity_id: string;
  user_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  created_at: string;
};

export type KbDocumentStatus = "pending" | "processing" | "ready" | "error";

export type KbDocument = {
  id: string;
  title: string;
  description: string | null;
  storage_path: string;
  page_count: number | null;
  status: KbDocumentStatus;
  next_page: number;
  error_message: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type KbDocumentPage = {
  id: string;
  document_id: string;
  page_number: number;
  raw_text: string | null;
};

export type KbDocumentImage = {
  id: string;
  document_id: string;
  page_number: number;
  image_path: string;
  width: number | null;
  height: number | null;
  created_at: string;
};

export type KbChunk = {
  id: string;
  document_id: string;
  page_start: number;
  page_end: number;
  content: string;
  embedding: number[] | null;
  token_count: number | null;
  created_at: string;
};

export type KbChatMessage = {
  id: string;
  user_id: string | null;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  cited_chunks: string[];
  created_at: string;
};

export type FluencyEntityType = "video" | "tool" | "tool_guide" | "deep_dive" | "module" | "page";

export type FluencyView = {
  id: string;
  entity_type: FluencyEntityType;
  entity_id: string;
  user_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  created_at: string;
};



export type SlideImage = { url: string; caption?: string };

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
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

export type PromptTemplate = {
  label: string;
  text: string;
};

export type DownloadFile = {
  label: string;
  url: string;
  type: "pdf" | "ppt" | "xlsx" | "doc" | "other";
};

export type WhatYouGetItem = {
  icon: string;
  title: string;
  description: string;
};

export type ActivityContent = {
  id: string;
  activity_id: string;
  // Slides tab
  slide_images: SlideImage[];
  // Workflow tab — raw markdown; steps parsed from it on the fly
  workflow_markdown: string | null;
  // Quiz tab
  quiz: QuizQuestion[];
  // Goals & Access tab
  goals: string[];           // bullet list of what learner will achieve
  access_needed: string[];   // tools/accounts they need access to
  // Prompts tab
  prompts: PromptTemplate[];
  // Downloads tab — files uploaded to storage
  downloads: DownloadFile[];
  // Video tab — optional activity walkthrough video
  video_url?: string | null;
  // Overview — "What you'll walk away with" items
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

export type UserProgress = {
  id: string;
  user_id: string;
  activity_id: string;
  status: "not_started" | "in_progress" | "completed";
  completed_steps: number[];  // array of step indices the user has ticked
  quiz_score: number | null;
  completed_at: string | null;
  updated_at: string;
  video_watched?: boolean;    // true once learner has watched ≥80% of the video
};

// Supabase generic Database type
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: { name: string; domain?: string | null; created_by?: string | null };
        Update: { name?: string; domain?: string | null };
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: { id: string; email?: string | null; full_name?: string | null; avatar_url?: string | null; company_id?: string | null; role?: Role; aimastery_approved?: boolean; aimastery_requested?: boolean; onboarding_completed_at?: string | null; onboarding_tool?: string | null; onboarding_tool_tier?: string | null; onboarding_tool_other?: string | null; onboarding_function?: string | null; onboarding_function_other?: string | null; onboarding_interests?: string[]; onboarding_interests_other?: string | null; onboarding_experience?: string | null; workflows_confirmed_at?: string | null };
        Update: { email?: string | null; full_name?: string | null; avatar_url?: string | null; company_id?: string | null; role?: Role; aimastery_approved?: boolean; aimastery_requested?: boolean; onboarding_completed_at?: string | null; onboarding_tool?: string | null; onboarding_tool_tier?: string | null; onboarding_tool_other?: string | null; onboarding_function?: string | null; onboarding_function_other?: string | null; onboarding_interests?: string[]; onboarding_interests_other?: string | null; onboarding_experience?: string | null; workflows_confirmed_at?: string | null };
        Relationships: [];
      };
      activities: {
        Row: Activity;
        Insert: { title: string; description?: string | null; level?: Activity["level"]; time_estimate_minutes?: number | null; points?: number; tools?: string[]; tags?: string[]; categories?: string[]; functions?: string[]; position?: number; published?: boolean; is_featured?: boolean; is_locked?: boolean; content_type?: string; banner_url?: string | null; try_link?: string | null };
        Update: { title?: string; description?: string | null; level?: Activity["level"]; time_estimate_minutes?: number | null; points?: number; tools?: string[]; tags?: string[]; categories?: string[]; functions?: string[]; position?: number; published?: boolean; is_featured?: boolean; is_locked?: boolean; content_type?: string; banner_url?: string | null; try_link?: string | null };
        Relationships: [];
      };
      activity_categories: {
        Row: ActivityCategory;
        Insert: { name: string; description?: string | null; icon_url?: string | null; thumbnail_url?: string | null };
        Update: { name?: string; description?: string | null; icon_url?: string | null; thumbnail_url?: string | null };
        Relationships: [];
      };
      activity_functions: {
        Row: ActivityFunction;
        Insert: { name: string; description?: string | null; icon_url?: string | null; thumbnail_url?: string | null };
        Update: { name?: string; description?: string | null; icon_url?: string | null; thumbnail_url?: string | null };
        Relationships: [];
      };
      user_saved_workflows: {
        Row: UserSavedWorkflow;
        Insert: { user_id: string; activity_id: string; source?: SavedWorkflowSource };
        Update: Record<string, never>;
        Relationships: [];
      };
      activity_companies: {
        Row: ActivityCompany;
        Insert: { activity_id: string; company_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      tool_logos: {
        Row: ToolLogo;
        Insert: { tool: string; logo_url: string; updated_at?: string };
        Update: { logo_url?: string; updated_at?: string };
        Relationships: [];
      };
      activity_content: {
        Row: ActivityContent;
        Insert: Omit<ActivityContent, "id">;
        Update: Partial<Omit<ActivityContent, "id" | "activity_id">>;
        Relationships: [];
      };
      activity_steps: {
        Row: ActivityStep;
        Insert: Omit<ActivityStep, "id" | "created_at"> & { try_asking?: string[] };
        Update: Partial<Omit<ActivityStep, "id" | "activity_id" | "created_at">>;
        Relationships: [];
      };
      user_progress: {
        Row: UserProgress;
        Insert: { user_id: string; activity_id: string; status?: UserProgress["status"]; completed_steps?: number[]; quiz_score?: number | null; completed_at?: string | null; updated_at?: string };
        Update: { status?: UserProgress["status"]; completed_steps?: number[]; quiz_score?: number | null; completed_at?: string | null; updated_at?: string; video_watched?: boolean };
        Relationships: [];
      };
      chat_logs: {
        Row: ChatLog;
        Insert: Omit<ChatLog, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      activity_views: {
        Row: ActivityView;
        Insert: { activity_id: string; user_id?: string | null; session_id?: string | null };
        Update: Record<string, never>;
        Relationships: [];
      };
      fluency_views: {
        Row: FluencyView;
        Insert: { entity_type: FluencyEntityType; entity_id: string; user_id?: string | null; session_id?: string | null };
        Update: Record<string, never>;
        Relationships: [];
      };
      tool_deep_dives: {
        Row: ToolDeepDive;
        Insert: { title: string; url?: string | null; link_type?: ToolDeepDiveLinkType; html_path?: string | null; description?: string | null; tool?: string | null; position?: number; published?: boolean };
        Update: { title?: string; url?: string | null; link_type?: ToolDeepDiveLinkType; html_path?: string | null; description?: string | null; tool?: string | null; position?: number; published?: boolean };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
