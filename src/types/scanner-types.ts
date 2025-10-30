// Scanner Types and Interfaces

import { MedicinesTable, MedicineBatchTable } from "./database-types";

// Camera Types
export enum CameraErrorType {
  PERMISSION_DENIED = "permission_denied",
  NO_CAMERA_FOUND = "no_camera_found",
  CAMERA_IN_USE = "camera_in_use",
  UNKNOWN_ERROR = "unknown_error",
}

export interface CameraError {
  type: CameraErrorType;
  message: string;
  userMessage: string;
  action: "retry" | "settings" | "fallback";
}

export interface CameraState {
  stream: MediaStream | null;
  facingMode: "user" | "environment";
  hasPermission: boolean;
  error: string | null;
}

// OCR Types
export enum OCRErrorType {
  INITIALIZATION_FAILED = "initialization_failed",
  PROCESSING_FAILED = "processing_failed",
  NO_TEXT_DETECTED = "no_text_detected",
  LOW_QUALITY_IMAGE = "low_quality_image",
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
}

// Medicine Match Types
export type MatchType = "exact" | "fuzzy" | "partial";

export interface PharmacyMedicineWithDetails extends MedicinesTable {
  pharmacy_id: string;
  mrp: number;
  stock_quantity: number;
  price_range_min: number;
  price_range_max: number;
  reorder_level: number;
  storage_conditions: string | null;
  is_available: boolean;
}

export interface MedicineMatch {
  medicine: PharmacyMedicineWithDetails;
  confidence: number;
  matchedText: string;
  matchType: MatchType;
}

// Stock Types
export interface StockInfo {
  totalQuantity: number;
  availableBatches: MedicineBatchTable[];
  isLowStock: boolean;
  reorderLevel: number;
  nearExpiryBatches: MedicineBatchTable[];
}

// Scan Result Types
export interface ScanResult {
  id: string;
  timestamp: Date;
  imageData: string;
  ocrText: string;
  ocrConfidence: number;
  matches: MedicineMatch[];
  selectedMatch: MedicineMatch | null;
}

export interface ScanSession {
  sessionId: string;
  startTime: Date;
  scans: ScanResult[];
  pharmacyId: string;
}

// Supplier Information
export interface SupplierInfo {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
}

// Sales Statistics
export interface SalesStatistics {
  unitsSoldLast30Days: number;
  averageDailySales: number;
  estimatedDaysUntilStockOut: number | null;
  lastSaleDate: Date | null;
}

// Recent Scan
export interface RecentScan {
  id: string;
  medicine: PharmacyMedicineWithDetails;
  timestamp: Date;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
}

// Enhanced Scan Session
export interface EnhancedScanSession {
  sessionId: string;
  startTime: Date;
  recentScans: RecentScan[];
  pharmacyId: string;
}

// Workflow State
export type ScanWorkflowState =
  | "idle"
  | "camera_initializing"
  | "camera_ready"
  | "capturing"
  | "processing"
  | "matching"
  | "results"
  | "error";
