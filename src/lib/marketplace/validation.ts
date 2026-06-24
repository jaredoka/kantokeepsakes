import {
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_LANGUAGES,
  CURRENCIES,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  type ListingType,
  type ListingCategory,
  type ListingLanguage,
  type Currency,
} from "./types";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTitle(title: string): ValidationResult {
  const trimmed = title.trim();
  if (!trimmed) return { valid: false, error: "Title is required." };
  if (trimmed.length < 5)
    return { valid: false, error: "Title must be at least 5 characters." };
  if (trimmed.length > 120)
    return { valid: false, error: "Title must be 120 characters or fewer." };
  return { valid: true };
}

export function validateDescription(description: string): ValidationResult {
  const trimmed = description.trim();
  if (!trimmed) return { valid: false, error: "Description is required." };
  if (trimmed.length < 10)
    return {
      valid: false,
      error: "Description must be at least 10 characters.",
    };
  if (trimmed.length > 2000)
    return {
      valid: false,
      error: "Description must be 2000 characters or fewer.",
    };
  return { valid: true };
}

export function validateType(type: string): ValidationResult {
  if (!LISTING_TYPES.includes(type as ListingType))
    return { valid: false, error: "Invalid listing type." };
  return { valid: true };
}

export function validateCategory(category: string): ValidationResult {
  if (!LISTING_CATEGORIES.includes(category as ListingCategory))
    return { valid: false, error: "Invalid category." };
  return { valid: true };
}

export function validateLanguage(language: string): ValidationResult {
  if (!LISTING_LANGUAGES.includes(language as ListingLanguage))
    return { valid: false, error: "Invalid language." };
  return { valid: true };
}

export function validateCurrency(currency: string): ValidationResult {
  if (!CURRENCIES.includes(currency as Currency))
    return { valid: false, error: "Invalid currency." };
  return { valid: true };
}

export function validatePrice(price: string): ValidationResult {
  if (!price.trim()) return { valid: true }; // price is optional ("make offer")
  const num = Number(price);
  if (isNaN(num) || num < 0)
    return { valid: false, error: "Price must be a positive number." };
  if (num > 999999)
    return { valid: false, error: "Price cannot exceed 999,999." };
  return { valid: true };
}

export function validateImages(images: string[]): ValidationResult {
  if (images.length > MAX_IMAGES)
    return { valid: false, error: `Maximum ${MAX_IMAGES} images allowed.` };
  return { valid: true };
}

export function validateImageFile(file: File): ValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number]))
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are accepted.",
    };
  if (file.size > MAX_IMAGE_SIZE_BYTES)
    return {
      valid: false,
      error: `Image must be under ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.`,
    };
  return { valid: true };
}

export function validateOfferMessage(message: string): ValidationResult {
  if (!message.trim())
    return { valid: false, error: "Offer message is required." };
  if (message.trim().length > 1000)
    return {
      valid: false,
      error: "Offer message must be 1000 characters or fewer.",
    };
  return { valid: true };
}

export interface ListingInput {
  type: string;
  title: string;
  description: string;
  category: string;
  language: string;
  price: string;
  currency: string;
  images: string[];
  wantsCash?: boolean;
  wantsOffers?: boolean;
  wantsSingles?: boolean;
  wantsGraded?: boolean;
  wantsSealed?: boolean;
}

export function validateListing(data: ListingInput): ValidationResult {
  const checks = [
    validateType(data.type),
    validateTitle(data.title),
    validateDescription(data.description),
    validateCategory(data.category),
    validateLanguage(data.language),
    validatePrice(data.price),
    validateCurrency(data.currency),
    validateImages(data.images),
  ];

  for (const check of checks) {
    if (!check.valid) return check;
  }

  // At least one want type must be selected
  if (
    !data.wantsCash &&
    !data.wantsOffers &&
    !data.wantsSingles &&
    !data.wantsGraded &&
    !data.wantsSealed
  ) {
    return {
      valid: false,
      error:
        "You must select at least one want type (Cash, Any Offers, Any Singles, Any Graded, or Any Sealed).",
    };
  }

  // If wantsCash is selected, price must be provided
  if (data.wantsCash && !data.price.trim()) {
    return {
      valid: false,
      error: "Price is required when Cash is selected.",
    };
  }

  return { valid: true };
}
