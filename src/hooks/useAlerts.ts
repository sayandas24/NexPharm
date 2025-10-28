"use client";
import { useKyselyDB, usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { Alert, AlertSeverity, AlertType, ExpiryAlertType, UseAlertsReturn } from "@/types/alert.types";
import { useCallback, useEffect, useState } from "react";
 
export function useAlerts(pharmacyId: string | undefined): UseAlertsReturn {
  const db = useKyselyDB();
  const { isReady, powerSyncDb } = usePowerSync();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate severity based on alert type and data
  const calculateSeverity = (
    type: AlertType,
    data: {
      currentStock?: number;
      alertType?: ExpiryAlertType;
    }
  ): AlertSeverity => {
    if (type === "low_stock") {
      return data.currentStock === 0 ? "critical" : "warning";
    }

    if (type === "expiry") {
      if (data.alertType === "15_days") return "critical";
      if (data.alertType === "30_days") return "warning";
      return "info"; // 90_days
    }

    return "info";
  };

  // Fetch alerts from database
  const fetchAlerts = useCallback(
    async (showLoading = false) => {
      if (!isReady || !pharmacyId) return;

      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        // Query 1: Fetch stock alerts
        const stockAlerts = await db
          .selectFrom("stock_alerts")
          .innerJoin(
            "pharmacy_medicines",
            "pharmacy_medicines.medicine_id",
            "stock_alerts.medicine_id"
          )
          .innerJoin("medicines", "medicines.id", "stock_alerts.medicine_id")
          .select([
            "stock_alerts.id",
            "stock_alerts.medicine_id as medicineId",
            "stock_alerts.current_stock as currentStock",
            "stock_alerts.reorder_level as reorderLevel",
            "stock_alerts.is_resolved as isResolved",
            "stock_alerts.created_at as createdAt",
            "medicines.name as medicineName",
            "medicines.generic_name as genericName",
            "medicines.category",
          ])
          .where("stock_alerts.pharmacy_id", "=", pharmacyId)
          .where("stock_alerts.is_resolved", "=", 0)
          .execute();

        // Query 2: Fetch expiry alerts
        const expiryAlerts = await db
          .selectFrom("expiry_alerts")
          .innerJoin(
            "medicine_batches",
            "medicine_batches.id",
            "expiry_alerts.medicine_batch_id"
          )
          .innerJoin(
            "medicines",
            "medicines.id",
            "medicine_batches.medicine_id"
          )
          .select([
            "expiry_alerts.id",
            "expiry_alerts.medicine_batch_id as batchId",
            "expiry_alerts.alert_type as alertType",
            "expiry_alerts.is_acknowledged as isAcknowledged",
            "expiry_alerts.acknowledged_by as acknowledgedBy",
            "expiry_alerts.acknowledged_at as acknowledgedAt",
            "expiry_alerts.created_at as createdAt",
            "medicine_batches.medicine_id as medicineId",
            "medicine_batches.batch_number as batchNumber",
            "medicine_batches.expiry_date as expiryDate",
            "medicine_batches.available_quantity as availableQuantity",
            "medicines.name as medicineName",
            "medicines.generic_name as genericName",
            "medicines.category",
          ])
          .where("expiry_alerts.pharmacy_id", "=", pharmacyId)
          .where("expiry_alerts.is_acknowledged", "=", 0)
          .execute();

        // Transform stock alerts to unified Alert model
        const transformedStockAlerts: Alert[] = stockAlerts.map((alert) => ({
          id: alert.id,
          type: "low_stock" as AlertType,
          severity: calculateSeverity("low_stock", {
            currentStock: alert.currentStock,
          }),
          medicineId: alert.medicineId,
          medicineName: alert.medicineName,
          genericName: alert.genericName,
          category: alert.category,
          currentStock: alert.currentStock,
          reorderLevel: alert.reorderLevel,
          isResolved: alert.isResolved === 1,
          isAcknowledged: false, // Stock alerts don't have acknowledgement
          acknowledgedBy: null,
          acknowledgedAt: null,
          createdAt: alert.createdAt,
        }));

        // Transform expiry alerts to unified Alert model
        const transformedExpiryAlerts: Alert[] = expiryAlerts.map((alert) => {
          const daysUntilExpiry = calculateDaysUntilExpiry(alert.expiryDate);

          return {
            id: alert.id,
            type: "expiry" as AlertType,
            severity: calculateSeverity("expiry", {
              alertType: alert.alertType as ExpiryAlertType,
            }),
            medicineId: alert.medicineId,
            medicineName: alert.medicineName,
            genericName: alert.genericName,
            category: alert.category,
            batchId: alert.batchId,
            batchNumber: alert.batchNumber,
            expiryDate: alert.expiryDate,
            daysUntilExpiry,
            alertType: alert.alertType as ExpiryAlertType,
            availableQuantity: alert.availableQuantity,
            isAcknowledged: alert.isAcknowledged === 1,
            acknowledgedBy: alert.acknowledgedBy,
            acknowledgedAt: alert.acknowledgedAt,
            createdAt: alert.createdAt,
          };
        });

        // Filter out duplicate expiry alerts - keep only the most urgent per batch
        const uniqueExpiryAlerts = transformedExpiryAlerts.reduce((acc, alert) => {
          const existing = acc.find(a => a.batchId === alert.batchId);
          
          if (!existing) {
            acc.push(alert);
          } else {
            // Keep the more urgent alert (15_days > 30_days > 90_days)
            const urgencyOrder = { '15_days': 1, '30_days': 2, '90_days': 3 };
            const currentUrgency = urgencyOrder[alert.alertType!] || 999;
            const existingUrgency = urgencyOrder[existing.alertType!] || 999;
            
            if (currentUrgency < existingUrgency) {
              // Replace with more urgent alert
              const index = acc.indexOf(existing);
              acc[index] = alert;
            }
          }
          
          return acc;
        }, [] as Alert[]);

        // Combine and sort alerts by severity and creation date
        const allAlerts = [
          ...transformedStockAlerts,
          ...uniqueExpiryAlerts,  // Use filtered expiry alerts
        ].sort((a, b) => {
          // Sort by severity first (critical > warning > info)
          const severityOrder = { critical: 0, warning: 1, info: 2 };
          const severityDiff =
            severityOrder[a.severity] - severityOrder[b.severity];
          if (severityDiff !== 0) return severityDiff;

          // Then by creation date (newest first)
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setAlerts(allAlerts);
      } catch (err) {
        console.error("Error fetching alerts:", err);
        setError(err as Error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [db, isReady, pharmacyId]
  );

  // Acknowledge alert
  const acknowledgeAlert = useCallback(
    async (alertId: string, alertType: AlertType, userId: string): Promise<void> => {
      if (!isReady || !pharmacyId) {
        throw new Error("Database not ready or pharmacy not selected");
      }

      try {
        const now = new Date().toISOString();

        if (alertType === "expiry") {
          // Update expiry alert
          await db
            .updateTable("expiry_alerts")
            .set({
              is_acknowledged: 1,
              acknowledged_by: userId,
              acknowledged_at: now,
            })
            .where("id", "=", alertId)
            .where("pharmacy_id", "=", pharmacyId)
            .execute();
        } else if (alertType === "low_stock") {
          // For stock alerts, we mark them as resolved
          // (Stock alerts don't have acknowledgement fields, they have is_resolved)
          await db
            .updateTable("stock_alerts")
            .set({
              is_resolved: 1,
            })
            .where("id", "=", alertId)
            .where("pharmacy_id", "=", pharmacyId)
            .execute();
        }

        // Optimistically update local state
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? {
                  ...alert,
                  isAcknowledged: true,
                  acknowledgedBy: userId,
                  acknowledgedAt: now,
                  isResolved: alertType === "low_stock" ? true : alert.isResolved,
                }
              : alert
          )
        );

        // Refresh to get updated data from database
        await fetchAlerts(false);
      } catch (err) {
        console.error("Error acknowledging alert:", err);
        throw err;
      }
    },
    [db, isReady, pharmacyId, fetchAlerts]
  );

  // Watch for database changes and auto-refresh
  useEffect(() => {
    if (!isReady || !powerSyncDb || !pharmacyId) return;

    console.log("🔍 Setting up PowerSync watch for alerts...");
    let aborted = false;

    const setupWatch = async () => {
      // Initial fetch with loading state
      await fetchAlerts(true);

      // Build watch query for stock_alerts
      const stockAlertsQuery = db
        .selectFrom("stock_alerts")
        .selectAll()
        .where("pharmacy_id", "=", pharmacyId);

      const { sql: stockSql, parameters: stockParams } =
        stockAlertsQuery.compile();
      const mutableStockParams = [...stockParams];

      // Build watch query for expiry_alerts
      const expiryAlertsQuery = db
        .selectFrom("expiry_alerts")
        .selectAll()
        .where("pharmacy_id", "=", pharmacyId);

      const { sql: expirySql, parameters: expiryParams } =
        expiryAlertsQuery.compile();
      const mutableExpiryParams = [...expiryParams];

      try {
        // Watch both tables concurrently
        const watchPromises = [
          (async () => {
            for await (const result of powerSyncDb.watch(
              stockSql,
              mutableStockParams
            )) {
              if (aborted) break;
              console.log("🔄 Stock alerts change detected");
              await fetchAlerts(false);
            }
          })(),
          (async () => {
            for await (const result of powerSyncDb.watch(
              expirySql,
              mutableExpiryParams
            )) {
              if (aborted) break;
              console.log("🔄 Expiry alerts change detected");
              await fetchAlerts(false);
            }
          })(),
        ];

        await Promise.race(watchPromises);
      } catch (error) {
        if (!aborted) {
          console.error("Alerts watch error:", error);
        }
      }
    };

    setupWatch();

    return () => {
      console.log("🛑 Cleaning up PowerSync alerts watch");
      aborted = true;
    };
  }, [isReady, powerSyncDb, pharmacyId, fetchAlerts, db]);

  // Refresh alerts manually
  const refreshAlerts = useCallback(async () => {
    await fetchAlerts(true);
  }, [fetchAlerts]);

  // Calculate counts
  const lowStockCount = alerts.filter((a) => a.type === "low_stock").length;
  const expiryCount = alerts.filter((a) => a.type === "expiry").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return {
    alerts,
    loading,
    error,
    lowStockCount,
    expiryCount,
    criticalCount,
    acknowledgeAlert,
    refreshAlerts,
  };
}

