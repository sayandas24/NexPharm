// lib/powersync/provider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  PropsWithChildren,
} from "react";
import { PowerSyncDatabase } from "@powersync/web";
import { PowerSyncContext } from "@powersync/react";
import { Kysely } from "kysely";
import { powerSyncClient } from "./PowersyncClient";
import { SupabaseConnector } from "./SupabaseConnector";
import { PharmacyDatabase } from "@/types/database-types";

// ============ Context Types ============
interface PowerSyncContextType {
  powerSyncDb: PowerSyncDatabase;
  db: Kysely<PharmacyDatabase>;
  supabaseConnector: SupabaseConnector;
  isReady: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  syncStatus: SyncStatus;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  clearDatabase: () => Promise<void>;
  waitForSync: (timeoutMs?: number) => Promise<boolean>;
}

interface SyncStatus {
  connected: boolean;
  lastSyncedAt: Date | null;
}

// ============ Create Context ============
const PowerSyncProviderContext = createContext<PowerSyncContextType | null>(
  null
);

// ============ Provider Component ============
export function PowerSyncProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    lastSyncedAt: null,
  });

  // Initialize PowerSync
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === "undefined") {
      console.warn("⚠️ PowerSync skipped - not in browser environment");
      return;
    }

    let mounted = true;
    let statusListener: any = null;

    const initializePowerSync = async () => {
      try {
        console.log("🚀 Starting PowerSync initialization...");
        setIsConnecting(true);

        await powerSyncClient.init();

        if (!mounted) return;

        // Register status listener to track connection state
        statusListener = powerSyncClient.powerSyncDb.registerListener({
          initialized: () => {
            console.log("📱 PowerSync database initialized");
          },
          statusChanged: (status) => {
            if (!mounted) return;

            console.log("🔄 Status changed:", {
              connected: status.connected,
              dataFlowStatus: status.dataFlowStatus,
            });

            setIsConnected(status.connected);
            setIsConnecting(false); // Stop showing connecting state once we get a status
            setSyncStatus({
              connected: status.connected,
              lastSyncedAt: status.lastSyncedAt
                ? new Date(status.lastSyncedAt)
                : null,
            });

            // Clear error if connected successfully
            if (status.connected) {
              setError(null);
            }
          },
        });

        if (mounted) {
          setIsReady(true);
          console.log("✅ PowerSync ready for use");
        }
      } catch (err) {
        console.error("❌ PowerSync initialization error:", err);
        if (mounted) {
          setError(err as Error);
          setIsConnecting(false);
        }
      }
    };

    initializePowerSync();

    // Cleanup
    return () => {
      mounted = false;
      if (statusListener) {
        console.log("🧹 Cleaning up PowerSync status listener");
        // Note: PowerSync doesn't have an unregister method, listener will be cleaned up on disconnect
      }
    };
  }, []);

  // Connect function
  const connect = useCallback(async () => {
    if (!powerSyncClient.powerSyncDb) {
      console.error("❌ PowerSync database not initialized");
      return;
    }

    try {
      console.log("🔗 Connecting to PowerSync...");
      setIsConnecting(true);
      setError(null);

      await powerSyncClient.powerSyncDb.connect(
        powerSyncClient.supabaseConnector
      );

      console.log("✅ Connect initiated - waiting for status update");

      // Fallback timeout in case status listener doesn't fire
      setTimeout(() => {
        setIsConnecting(false);
      }, 10000); // 10 second timeout

      // Note: isConnecting will be set to false by the statusChanged listener
    } catch (err) {
      console.error("❌ Connection failed:", err);
      setError(err as Error);
      setIsConnecting(false);
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(async () => {
    if (!powerSyncClient.powerSyncDb) {
      console.error("❌ PowerSync database not initialized");
      return;
    }

    try {
      console.log("🔌 Disconnecting from PowerSync...");
      setIsConnecting(true);

      await powerSyncClient.powerSyncDb.disconnect();

      console.log("✅ Disconnected successfully");
      setIsConnecting(false);
      setIsConnected(false);
    } catch (err) {
      console.error("❌ Disconnection failed:", err);
      setError(err as Error);
      setIsConnecting(false);
    }
  }, []);

  // Reconnect function (disconnect then connect)
  const reconnect = useCallback(async () => {
    if (!powerSyncClient.powerSyncDb) {
      console.error("❌ PowerSync database not initialized");
      return;
    }

    try {
      console.log("🔄 Attempting to reconnect PowerSync...");
      setIsConnecting(true);
      setError(null);

      // Disconnect first if already connected
      if (powerSyncClient.powerSyncDb.connected) {
        console.log("🔌 Disconnecting existing connection...");
        await powerSyncClient.powerSyncDb.disconnect();
        // Wait a bit for clean disconnect
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Reinitialize the database if needed
      console.log("�  Reinitializing PowerSync database...");
      await powerSyncClient.powerSyncDb.init();

      // Now reconnect
      console.log("🔗 Connecting to PowerSync...");
      await powerSyncClient.powerSyncDb.connect(
        powerSyncClient.supabaseConnector
      );

      console.log("✅ Reconnect initiated - waiting for status update");
      // Note: isConnecting will be set to false by the statusChanged listener
    } catch (err) {
      console.error("❌ Reconnection failed:", err);
      setError(err as Error);
      setIsConnecting(false);
    }
  }, []);

  // Clear database function
  const clearDatabase = useCallback(async () => {
    if (!powerSyncClient.powerSyncDb) {
      console.error("❌ PowerSync database not initialized");
      throw new Error("PowerSync database not initialized");
    }

    try {
      console.log("🗑️ Clearing local database...");

      // Disconnect if connected
      if (powerSyncClient.powerSyncDb.connected) {
        console.log("🔌 Disconnecting before clear...");
        await powerSyncClient.powerSyncDb.disconnect();
        // Wait for clean disconnect
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Clear database but don't close - just clear the data
      await powerSyncClient.powerSyncDb.disconnectAndClear();

      console.log("✅ Database cleared successfully");
    } catch (err) {
      console.error("❌ Failed to clear database:", err);
      throw err;
    }
  }, []);

  // Wait for sync function
  const waitForSync = useCallback(
    async (timeoutMs: number = 30000): Promise<boolean> => {
      return new Promise((resolve) => {
        const startTime = Date.now();

        const checkSync = () => {
          // Check if connected and has synced at least once
          if (syncStatus.connected && syncStatus.lastSyncedAt) {
            console.log("✅ Sync completed successfully");
            resolve(true);
          } else if (Date.now() - startTime > timeoutMs) {
            console.warn("⚠️ Sync timeout reached");
            resolve(false);
          } else {
            setTimeout(checkSync, 500);
          }
        };

        checkSync();
      });
    },
    [syncStatus]
  );

  // Context value
  const value: PowerSyncContextType = {
    powerSyncDb: powerSyncClient.powerSyncDb,
    db: powerSyncClient.db,
    supabaseConnector: powerSyncClient.supabaseConnector,
    isReady,
    isConnected,
    isConnecting,
    error,
    syncStatus,
    connect,
    disconnect,
    reconnect,
    clearDatabase,
    waitForSync,
  };

  return (
    <PowerSyncProviderContext.Provider value={value}>
      {/* PowerSyncContext from @powersync/react for hooks support */}
      <PowerSyncContext.Provider value={powerSyncClient.powerSyncDb as any}>
        {children}
      </PowerSyncContext.Provider>
    </PowerSyncProviderContext.Provider>
  );
}

// ============ Custom Hooks ============

/**
 * Main hook to access PowerSync context
 */
export function usePowerSync() {
  const context = useContext(PowerSyncProviderContext);

  if (!context) {
    throw new Error("usePowerSync must be used within PowerSyncProvider");
  }

  return context;
}

/**
 * Shorthand hook to access Kysely database instance
 */
export function useKyselyDB() {
  const { db } = usePowerSync();
  return db;
}

/**
 * Hook to access Supabase connector
 */
export function useSupabaseConnector() {
  const { supabaseConnector } = usePowerSync();
  return supabaseConnector;
}

/**
 * Hook to check if PowerSync is ready and connected
 */
export function usePowerSyncStatus() {
  const { isReady, isConnected, isConnecting, error, syncStatus } =
    usePowerSync();

  return {
    isReady,
    isConnected,
    isConnecting,
    isOnline: isConnected,
    isOffline: !isConnected,
    error,
    syncStatus,
  };
}

/**
 * Hook to watch online/offline status with callbacks
 */
export function useConnectionStatus(
  onOnline?: () => void,
  onOffline?: () => void
) {
  const { isConnected } = usePowerSync();
  const [previousStatus, setPreviousStatus] = useState(isConnected);

  useEffect(() => {
    if (isConnected !== previousStatus) {
      if (isConnected && onOnline) {
        console.log("🟢 App is now ONLINE");
        onOnline();
      } else if (!isConnected && onOffline) {
        console.log("🔴 App is now OFFLINE");
        onOffline();
      }
      setPreviousStatus(isConnected);
    }
  }, [isConnected, previousStatus, onOnline, onOffline]);

  return isConnected;
}
