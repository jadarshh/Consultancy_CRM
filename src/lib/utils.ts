import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function formatDate(date: Date | string | null | undefined, fmt = "MMM dd, yyyy"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, "MMM dd, yyyy 'at' h:mm a");
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isExpired(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  return isBefore(d, new Date());
}

export function isExpiringSoon(date: Date | string | null | undefined, withinDays = 30): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + withinDays);
  return isAfter(d, new Date()) && isBefore(d, threshold);
}

// ─── Reference Number Generator ──────────────────────────────────────────────

export function generateRefNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(5, "0")}`;
}

// ─── Currency Formatter ───────────────────────────────────────────────────────

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "USD"
): string {
  if (amount === null || amount === undefined) return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ─── String Utilities ─────────────────────────────────────────────────────────

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function fullName(
  firstName: string,
  middleName: string | null | undefined,
  lastName: string
): string {
  return [firstName, middleName, lastName].filter(Boolean).join(" ");
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function snakeToTitle(str: string): string {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Stage / Priority Helpers ─────────────────────────────────────────────────

export const STAGE_LABELS: Record<string, string> = {
  NEW_INQUIRY: "New Inquiry",
  INITIAL_CONSULTATION: "Initial Consultation",
  PROFILE_ASSESSMENT: "Profile Assessment",
  COUNTRY_SHORTLISTED: "Country Shortlisted",
  DOCUMENTS_COLLECTION: "Documents Collection",
  APPLICATION_PREP: "Application Prep",
  APPLICATIONS_SUBMITTED: "Applications Submitted",
  OFFER_RECEIVED: "Offer Received",
  OFFER_ACCEPTED: "Offer Accepted",
  TUITION_DEPOSITED: "Tuition Deposited",
  VISA_DOCUMENTS_PREP: "Visa Docs Prep",
  VISA_APPLIED: "Visa Applied",
  VISA_APPROVED: "Visa Approved",
  PRE_DEPARTURE: "Pre-Departure",
  DEPARTED: "Departed",
  ENROLLED: "Enrolled",
  ON_HOLD: "On Hold",
  WITHDRAWN: "Withdrawn",
  VISA_REFUSED: "Visa Refused",
  NOT_QUALIFIED: "Not Qualified",
};

export const STAGE_COLORS: Record<string, string> = {
  NEW_INQUIRY: "badge-neutral",
  INITIAL_CONSULTATION: "badge-info",
  PROFILE_ASSESSMENT: "badge-primary",
  COUNTRY_SHORTLISTED: "badge-success",
  DOCUMENTS_COLLECTION: "badge-warning",
  APPLICATION_PREP: "badge-warning",
  APPLICATIONS_SUBMITTED: "badge-info",
  OFFER_RECEIVED: "badge-success",
  OFFER_ACCEPTED: "badge-success",
  TUITION_DEPOSITED: "badge-success",
  VISA_DOCUMENTS_PREP: "badge-warning",
  VISA_APPLIED: "badge-primary",
  VISA_APPROVED: "badge-success",
  PRE_DEPARTURE: "badge-success",
  DEPARTED: "badge-success",
  ENROLLED: "badge-success",
  ON_HOLD: "badge-warning",
  WITHDRAWN: "badge-danger",
  VISA_REFUSED: "badge-danger",
  NOT_QUALIFIED: "badge-danger",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "priority-low",
  MEDIUM: "priority-medium",
  HIGH: "priority-high",
  URGENT: "priority-urgent",
};

export const PIPELINE_STAGES = [
  "NEW_INQUIRY",
  "INITIAL_CONSULTATION",
  "PROFILE_ASSESSMENT",
  "COUNTRY_SHORTLISTED",
  "DOCUMENTS_COLLECTION",
  "APPLICATION_PREP",
  "APPLICATIONS_SUBMITTED",
  "OFFER_RECEIVED",
  "OFFER_ACCEPTED",
  "TUITION_DEPOSITED",
  "VISA_DOCUMENTS_PREP",
  "VISA_APPLIED",
  "VISA_APPROVED",
  "PRE_DEPARTURE",
  "DEPARTED",
  "ENROLLED",
];

export const TERMINAL_STAGES = ["ON_HOLD", "WITHDRAWN", "VISA_REFUSED", "NOT_QUALIFIED"];
