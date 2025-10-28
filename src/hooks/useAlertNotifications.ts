// hooks/useAlertNotifications.ts
"use client";
import { Alert } from "@/types/alert.types";
import { useEffect, useRef, useCallback } from "react";

interface UseAlertNotificationsProps {
  alerts: Alert[];
  enabled?: boolean;
}

export function useAlertNotifications({
  alerts,
  enabled = true,
}: UseAlertNotificationsProps) {
  const previousAlertIds = useRef<Set<string>>(new Set());
  const notificationPermission = useRef<NotificationPermission>("default");

  // Request notification permission on mount
  useEffect(() => {
    if (
      !enabled ||
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return;
    }

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        notificationPermission.current = permission;
        console.log("Notification permission:", permission);
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    };

    // Check current permission
    notificationPermission.current = Notification.permission;

    // Request if not already granted or denied
    if (Notification.permission === "default") {
      requestPermission();
    }
  }, [enabled]);

  const showNotification = useCallback((alert: Alert) => {
    try {
      const title = getNotificationTitle(alert);
      const body = getNotificationBody(alert);
      const icon = getNotificationIcon(alert);

      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: alert.id, // Prevents duplicate notifications
        requireInteraction: alert.severity === "critical", // Keep critical alerts visible
        silent: false,
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        // Navigate to alerts page
        window.location.href = "/inventory/alerts";
        notification.close();
      };

      // Auto-close after 10 seconds (except critical)
      if (alert.severity !== "critical") {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, []);

  const getNotificationTitle = (alert: Alert): string => {
    if (alert.type === "low_stock") {
      if (alert.currentStock === 0) {
        return "🔴 Critical: Out of Stock!";
      }
      return "🟠 Low Stock Alert";
    }

    // Expiry alerts
    if (alert.alertType === "15_days") {
      return "🔴 Critical: Expiring Soon!";
    }
    if (alert.alertType === "30_days") {
      return "🟡 Warning: Expiring in 30 Days";
    }
    return "🔵 Info: Expiring in 90 Days";
  };

  const getNotificationBody = (alert: Alert): string => {
    if (alert.type === "low_stock") {
      return `${alert.medicineName}\nCurrent Stock: ${alert.currentStock}\nReorder Level: ${alert.reorderLevel}`;
    }

    // Expiry alerts
    return `${alert.medicineName}\nBatch: ${
      alert.batchNumber
    }\nExpires: ${new Date(alert.expiryDate!).toLocaleDateString()}\n${
      alert.daysUntilExpiry
    } days remaining`;
  };

  const getNotificationIcon = (alert: Alert): string => {
    // You can customize these icons or use your own
    if (alert.severity === "critical") {
      return "/icons/alert-critical.png"; // Add your icon
    }
    if (alert.severity === "warning") {
      return "/icons/alert-warning.png"; // Add your icon
    }
    return "/icons/alert-info.png"; // Add your icon
  };

  // Show notifications for new alerts
  useEffect(() => {
    if (!enabled || notificationPermission.current !== "granted") {
      return;
    }

    // Get current alert IDs
    const currentAlertIds = new Set(alerts.map((a) => a.id));

    // Find new alerts (not in previous set)
    const newAlerts = alerts.filter(
      (alert) =>
        !previousAlertIds.current.has(alert.id) && !alert.isAcknowledged
    );

    // Show notification for each new alert
    newAlerts.forEach((alert) => {
      showNotification(alert);
    });

    // Update previous alert IDs
    previousAlertIds.current = currentAlertIds;
  }, [alerts, enabled, showNotification]);

  return {
    permission: notificationPermission.current,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  };
}
