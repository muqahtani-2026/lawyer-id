/**
 * Signup Wizard — Type Definitions
 * Phase 4.2ب-1 — Tone expanded to 5 values (added concise)
 */

export type SampleWriting = {
  platform: "x" | "blog" | "linkedin";
  topic: string;
  text: string;
};

export type Tone =
  | "formal"
  | "friendly"
  | "educational"
  | "analytical"
  | "concise";

export type PreferredLength = "short_tweet" | "medium_post" | "long_article";

export interface SignupFormData {
  // Step 1 — Basic Info
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  x_handle: string;
  blog_url: string;
  bio_short: string;

  // Step 2 — Specialty (MVP: commercial only)
  specialty_slug: string;

  // Step 3 — Writing Style
  target_audience: string;
  tone: Tone | "";
  preferred_length: PreferredLength | "";
  favorite_phrases: string[];
  avoided_phrases: string[];
  style_notes: string;

  // Step 4 — Writing Samples
  sample_writings: SampleWriting[];

  // Step 5 — Notification Preferences
  telegram_enabled: boolean;
  email_enabled: boolean;
  preferred_send_hour: number;
}

export const INITIAL_FORM_DATA: SignupFormData = {
  // Step 1
  full_name: "",
  email: "",
  phone: "",
  license_number: "",
  x_handle: "",
  blog_url: "",
  bio_short: "",

  // Step 2
  specialty_slug: "commercial",

  // Step 3
  target_audience: "",
  tone: "",
  preferred_length: "",
  favorite_phrases: [],
  avoided_phrases: [],
  style_notes: "",

  // Step 4
  sample_writings: [],

  // Step 5
  telegram_enabled: true,
  email_enabled: true,
  preferred_send_hour: 8,
};