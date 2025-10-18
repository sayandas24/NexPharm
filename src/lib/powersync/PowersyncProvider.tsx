// lib/powersync/provider.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  PropsWithChildren,
} from 'react';
import { PowerSyncDatabase } from '@powersync/web';
import { PowerSyncContext } from '@powersync/react';
import { Kysely } from 'kysely';
import { PharmacyDatabase } from './schema';
import { powerSyncClient } from './PowersyncClient';
import { SupabaseConnector } from './PowersyncConnector';

// ============ Context Types ============
interface PowerSyncContextType {
  powerSyncDb: PowerSyncDatabase;
  db: Kysely<PharmacyDatabase>;
  supabaseConnector: SupabaseConnector;
  isReady: boolean;
  isConnected: boolean;
  error: Error | null;
  syncStatus: SyncStatus;
  reconnect: () => Promise<void>;
}

interface SyncStatus {
  connected: boolean;
  downloading: boolean;
  uploading: boolean;
  lastSyncedAt: Date | null;
}

// ============ Create Context ============
const PowerSyncProviderContext = createContext<PowerSyncContextType | null>(null);

// ============ Provider Component ============
export function PowerSyncProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    downloading: false,
    uploading: false,
    lastSyncedAt: null,
  });

  // Initialize PowerSync
  useEffect(() => {
    let mounted = true;
    let statusListener: any = null;

    const initializePowerSync = async () => {
      try {
        console.log('🚀 Starting PowerSync initialization...');
        
        await powerSyncClient.init();

        if (!mounted) return;

        // Register status listener
        statusListener = powerSyncClient.powerSyncDb.registerListener({
          initialized: () => {
            console.log('📱 PowerSync database initialized');
          },
          statusChanged: (status) => {
            if (!mounted) return;

            console.log('🔄 Sync status changed:', {
              connected: status.connected,
              downloading: status.downloading,
              uploading: status.uploading,
            });

            setIsConnected(status.connected);
            setSyncStatus({
              connected: status.connected,
              downloading: status.downloading,
              uploading: status.uploading,
              lastSyncedAt: status.lastSyncedAt ? new Date(status.lastSyncedAt) : null,
            });
          },
        });

        setIsReady(true);
        console.log('✅ PowerSync fully initialized and ready');
      } catch (err) {
        console.error('❌ PowerSync initialization error:', err);
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    initializePowerSync();

    // Cleanup
    return () => {
      mounted = false;
      if (statusListener) {
        // Remove listener if possible
        console.log('🧹 Cleaning up PowerSync listeners');
      }
    };
  }, []);

  // Reconnect function
  const reconnect = useCallback(async () => {
    try {
      console.log('🔄 Attempting to reconnect PowerSync...');
      await powerSyncClient.powerSyncDb.connect(powerSyncClient.supabaseConnector);
      console.log('✅ Reconnected successfully');
    } catch (err) {
      console.error('❌ Reconnection failed:', err);
      setError(err as Error);
    }
  }, []);

  // Context value
  const value: PowerSyncContextType = {
    powerSyncDb: powerSyncClient.powerSyncDb,
    db: powerSyncClient.db,
    supabaseConnector: powerSyncClient.supabaseConnector,
    isReady,
    isConnected,
    error,
    syncStatus,
    reconnect,
  };

  return (
    <PowerSyncProviderContext.Provider value={value}>
      {/* PowerSyncContext from @powersync/react for hooks support */}
      <PowerSyncContext.Provider value={powerSyncClient.powerSyncDb}>
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
    throw new Error('usePowerSync must be used within PowerSyncProvider');
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
  const { isReady, isConnected, error, syncStatus } = usePowerSync();
  
  return {
    isReady,
    isConnected,
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
        console.log('🟢 App is now ONLINE');
        onOnline();
      } else if (!isConnected && onOffline) {
        console.log('🔴 App is now OFFLINE');
        onOffline();
      }
      setPreviousStatus(isConnected);
    }
  }, [isConnected, previousStatus, onOnline, onOffline]);

  return isConnected;
}
