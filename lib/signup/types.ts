export interface SampleWriting {
  platform: "x" | "blog" | "linkedin" | "";
  topic: string;
  text: string;
}

export interface SignupFormData {
  // Step 1: Basic Info
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  xHandle: string;
  blogUrl: string;
  bioShort: string;

  // Step 2: Specialty
  primarySpecialtyId: string;

  // Step 3: Writing Style
  targetAudience: string;
  tone: "formal" | "friendly" | "educational" | "analytical" | "";
  preferredLength: "short_tweet" | "medium_post" | "long_article" | "";
  favoritePhrases: string[];
  avoidedPhrases: string[];
  styleNotes: string;

  // Step 4: Samples
  samples: SampleWriting[];

  // Step 5: Distribution
  telegramEnabled: boolean;
  emailEnabled: boolean;
  preferredSendHour: number;
}

export const INITIAL_FORM_DATA: SignupFormData = {
  fullName: "",
  email: "",
  phone: "",
  licenseNumber: "",
  xHandle: "",
  blogUrl: "",
  bioShort: "",
  primarySpecialtyId: "",
  targetAudience: "",
  tone: "",
  preferredLength: "",
  favoritePhrases: [],
  avoidedPhrases: [],
  styleNotes: "",
  samples: [],
  telegramEnabled: true,
  emailEnabled: true,
  preferredSendHour: 8,
};