// Enum constants matching database enums (00001_create_enums.sql)

export const LISTING_TYPES = ["WTB", "WTS"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_CATEGORIES = [
  "sealed",
  "singles",
  "graded",
] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_LANGUAGES = ["japanese", "english", "any"] as const;
export type ListingLanguage = (typeof LISTING_LANGUAGES)[number];

export const LISTING_STATUSES = [
  "active",
  "sold",
  "expired",
  "removed",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const CURRENCIES = ["BND", "USD", "MYR", "SGD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const REPORT_REASONS = [
  "scam",
  "spam",
  "harassment",
  "inappropriate",
  "trade_dispute",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const OFFER_STATUSES = ["pending", "accepted", "declined"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

// Display labels

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  WTB: "Want to Buy",
  WTS: "Want to Sell",
};

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  sealed: "Sealed",
  singles: "Singles",
  graded: "Graded",
};

export const LANGUAGE_LABELS: Record<ListingLanguage, string> = {
  japanese: "Japanese",
  english: "English",
  any: "Any",
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BND: "B$",
  USD: "$",
  MYR: "RM",
  SGD: "S$",
};

// Database row types

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  reputation_score: number;
  completed_trades: number;
  created_at: string;
  is_banned: boolean;
  last_active_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  type: ListingType;
  title: string;
  description: string;
  category: ListingCategory;
  language: ListingLanguage;
  price: number | null;
  currency: Currency;
  images: string[];
  looking_for_description: string | null;
  looking_for_images: string[];
  wants_cash: boolean;
  wants_offers: boolean;
  wants_singles: boolean;
  wants_graded: boolean;
  wants_sealed: boolean;
  status: ListingStatus;
  created_at: string;
  bumped_at: string;
  expires_at: string;
}

export interface ListingWithProfile extends Listing {
  profiles: Pick<Profile, "username" | "reputation_score" | "completed_trades">;
}

export interface Conversation {
  id: string;
  listing_id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  is_read: boolean;
}

export interface TradeConfirmation {
  id: string;
  listing_id: string;
  confirmer_id: string;
  confirmed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const TRADE_COMPLETION_STATUSES = [
  "completed",
  "disputed",
  "auto_completed",
] as const;
export type TradeCompletionStatus = (typeof TRADE_COMPLETION_STATUSES)[number];

export interface TradeCompletionRow {
  id: string;
  listing_id: string;
  user_id: string;
  status: TradeCompletionStatus;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  listing_id: string | null;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  created_at: string;
}

export interface Offer {
  id: string;
  listing_id: string;
  offerer_id: string;
  message: string | null;
  front_image: string | null;
  back_image: string | null;
  status: OfferStatus;
  created_at: string;
}

export interface OfferWithProfile extends Offer {
  profiles: Pick<Profile, "username" | "avatar_url" | "reputation_score" | "completed_trades">;
}

// Grading

export const GRADING_COMPANIES = ["RAW", "PSA", "CGC", "BGS", "SEALED"] as const;
export type GradingCompany = (typeof GRADING_COMPANIES)[number];

export const PSA_GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
export type PSAGrade = (typeof PSA_GRADES)[number];

export const CGC_GRADES = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"] as const;
export type CGCGrade = (typeof CGC_GRADES)[number];

export const BGS_GRADES = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5"] as const;
export type BGSGrade = (typeof BGS_GRADES)[number];

// Per-card grading for have images
export interface HaveImage {
  url: string;
  grader: GradingCompany;
  grade: string; // e.g. "10", "9.5", "" for RAW/SEALED
}

// Per-card type tag for want items
export const WANT_ITEM_TYPES = ["singles", "graded", "sealed"] as const;
export type WantItemType = (typeof WANT_ITEM_TYPES)[number];

export const WANT_ITEM_TYPE_LABELS: Record<WantItemType, string> = {
  singles: "Singles",
  graded: "Graded",
  sealed: "Sealed",
};

export interface WantItem {
  url: string;
  type: WantItemType;
}

// Form data types (for create/edit forms)

export interface ListingFormData {
  havesText: string; // user text after [H]
  wantsText: string; // user text after [W]
  description: string;
  price: string; // string for form input, parsed to number on submit
  currency: Currency;
  haveImages: HaveImage[]; // cards with per-card grading
  wantItems: WantItem[]; // cards/items user wants with type tags
  wantsCash: boolean;
  wantsOffers: boolean;
  wantsSingles: boolean;
  wantsGraded: boolean;
  wantsSealed: boolean;
}

// Image upload

export const MAX_IMAGES = 6;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
