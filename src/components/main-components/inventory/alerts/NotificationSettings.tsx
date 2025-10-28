import React, { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // Show test notification
        new Notification("Notifications Enabled! 🎉", {
          body: "You'll now receive alerts for low stock and expiring medicines.",
          icon: "/icons/alert-info.png",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  if (!isSupported) {
    return null; // Browser doesn't support notifications
  }

  return (
    <div className="flex items-center gap-2">
      {permission === "granted" ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Bell className="h-4 w-4" />
          <span>Notifications enabled</span>
        </div>
      ) : permission === "denied" ? (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <BellOff className="h-4 w-4" />
          <span>Notifications blocked</span>
          <span className="text-xs text-gray-500">
            (Enable in browser settings)
          </span>
        </div>
      ) : (
        <Button
          onClick={requestPermission}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          Enable Notifications
        </Button>
      )}
    </div>
  );
}
