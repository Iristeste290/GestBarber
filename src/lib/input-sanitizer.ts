import { z } from "zod";

/**
 * Sanitization and validation utilities for user inputs
 * Prevents XSS, SQL injection, and ensures data integrity
 */

// Characters that are dangerous for HTML/script injection
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /<[^>]*>/g, // Any HTML tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
  /data:/gi, // Data URLs
  /vbscript:/gi, // VBScript protocol
  /expression\s*\(/gi, // CSS expressions
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|OR|AND)\b\s+)/gi,
  /(['";])/g, // Quote characters often used in injection
  /(--|#|\/\*)/g, // SQL comments
];

/**
 * Remove all HTML tags and dangerous characters from text
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  let sanitized = input.trim();
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  
  // Decode HTML entities that might be used to bypass filters
  sanitized = sanitized
    .replace(/&lt;/g, "")
    .replace(/&gt;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, "")
    .replace(/&#x([a-fA-F0-9]+);/g, "");
  
  // Remove script-like patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }
  
  // Remove null bytes and control characters (except newlines for textarea)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  
  return sanitized.trim();
}

/**
 * Sanitize for name fields - only letters, spaces, and common name characters
 */
export function sanitizeName(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  // First apply general sanitization
  let sanitized = sanitizeText(input);
  
  // Allow only letters (including accented), spaces, hyphens, and apostrophes
  // Common for names like "O'Connor", "Jean-Pierre", "José", "Müller"
  sanitized = sanitized.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "");
  
  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, " ").trim();
  
  // Limit length
  return sanitized.slice(0, 100);
}

/**
 * Sanitize phone number - only digits
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  // Keep only digits
  return input.replace(/\D/g, "").slice(0, 15);
}

/**
 * Sanitize for general text fields (notes, descriptions)
 */
export function sanitizeGeneralText(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== "string") return "";
  
  let sanitized = sanitizeText(input);
  
  // Allow basic punctuation and common characters
  // Remove anything that looks like code or injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }
  
  return sanitized.slice(0, maxLength);
}

/**
 * Sanitize email - basic email character validation
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  // Remove any HTML/script content first
  let sanitized = sanitizeText(input);
  
  // Keep only valid email characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9@._+-]/g, "").toLowerCase();
  
  return sanitized.slice(0, 254);
}

// ================== ZOD SCHEMAS ==================

/**
 * Brazilian name validation - allows accented characters
 */
export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: "Nome deve ter no mínimo 2 caracteres" })
  .max(100, { message: "Nome deve ter no máximo 100 caracteres" })
  .refine(
    (val) => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(val),
    { message: "Nome deve conter apenas letras" }
  )
  .transform(sanitizeName);

/**
 * Brazilian phone validation (10-11 digits)
 */
export const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine(
    (val) => val.length >= 10 && val.length <= 11,
    { message: "Telefone deve ter 10 ou 11 dígitos" }
  )
  .refine(
    (val) => /^[1-9][0-9]{9,10}$/.test(val),
    { message: "Telefone inválido" }
  );

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .trim()
  .email({ message: "E-mail inválido" })
  .max(254, { message: "E-mail muito longo" })
  .transform(sanitizeEmail);

/**
 * General text/notes validation
 */
export const notesSchema = z
  .string()
  .max(500, { message: "Texto muito longo (máximo 500 caracteres)" })
  .transform((val) => sanitizeGeneralText(val, 500))
  .optional();

/**
 * Appointment customer data validation schema
 */
export const appointmentCustomerSchema = z.object({
  customerName: nameSchema,
  customerPhone: phoneSchema,
  notes: notesSchema,
});

/**
 * Client registration schema
 */
export const clientRegistrationSchema = z.object({
  fullName: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema,
  notes: notesSchema,
});

// ================== VALIDATION HELPERS ==================

/**
 * Validate and sanitize appointment customer data
 */
export function validateAppointmentCustomer(data: {
  customerName: string;
  customerPhone: string;
  notes?: string;
}): { success: true; data: { customerName: string; customerPhone: string; notes?: string } } | { success: false; error: string } {
  const result = appointmentCustomerSchema.safeParse(data);
  
  if (!result.success) {
    return { 
      success: false, 
      error: result.error.errors[0]?.message || "Dados inválidos" 
    };
  }
  
  return { 
    success: true, 
    data: {
      customerName: result.data.customerName,
      customerPhone: result.data.customerPhone,
      notes: result.data.notes,
    }
  };
}

/**
 * Check if a string contains potentially dangerous content
 */
export function containsDangerousContent(input: string): boolean {
  if (!input) return false;
  
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) return true;
    pattern.lastIndex = 0; // Reset regex state
  }
  
  return false;
}

/**
 * Safe input handler for React onChange events
 */
export function createSafeInputHandler(
  setter: (value: string) => void,
  sanitizer: (input: string) => string = sanitizeText
) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(sanitizer(e.target.value));
  };
}
