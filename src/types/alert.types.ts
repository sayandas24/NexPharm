
// ============ Types ============

export type AlertType = "low_stock" | "expiry";
export type AlertSeverity = "critical" | "warning" | "info";
export type ExpiryAlertType = "15_days" | "30_days" | "90_days";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  medicineId: string;
  medicineName: string;
  genericName: string | null;
  category: string | null;

  // For low stock alerts
  currentStock?: number;
  reorderLevel?: number;
  isResolved?: boolean;

  // For expiry alerts
  batchId?: string;
  batchNumber?: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  alertType?: ExpiryAlertType;
  availableQuantity?: number;

  // Common fields
  isAcknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: Error | null;

  // Counts by type
  lowStockCount: number;
  expiryCount: number;
  criticalCount: number;

  // Actions
  acknowledgeAlert: (alertId: string, alertType: AlertType, userId: string) => Promise<void>;
  refreshAlerts: () => Promise<void>;
}