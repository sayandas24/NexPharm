// lib/powersync/client.ts
import { PowerSyncDatabase } from '@powersync/web';
import { wrapPowerSyncWithKysely } from '@powersync/kysely-driver';
import { Kysely } from 'kysely';
import { AppSchema, PharmacyDatabase } from './schema';
import { SupabaseConnector } from './PowersyncConnector';

export class PowerSyncClient {
  private static instance: PowerSyncClient | null = null;

  public powerSyncDb: PowerSyncDatabase;
  public db: Kysely<PharmacyDatabase>;
  public supabaseConnector: SupabaseConnector;
  private isInitialized: boolean = false;

  private constructor() {
    console.log('🔧 Creating PowerSync instance...');
    
    // Initialize PowerSync database
    this.powerSyncDb = new PowerSyncDatabase({
      database: {
        dbFilename: 'pharmacy.db',
        dbLocation: 'indexeddb',
      },
      schema: AppSchema,
      flags: {
        enableMultiTabs: true,
      },
    });

    // Wrap with Kysely for type-safe queries
    this.db = wrapPowerSyncWithKysely<PharmacyDatabase>(this.powerSyncDb);

    // Initialize Supabase connector
    this.supabaseConnector = new SupabaseConnector();
  }

  public static getInstance(): PowerSyncClient {
    if (!PowerSyncClient.instance) {
      PowerSyncClient.instance = new PowerSyncClient();
    }
    return PowerSyncClient.instance;
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ PowerSync already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing PowerSync database...');
      await this.powerSyncDb.init();

      console.log('🔄 Connecting to backend...');
      await this.powerSyncDb.connect(this.supabaseConnector);

      this.isInitialized = true;
      console.log('✅ PowerSync fully initialized and syncing');

      // Listen to sync status changes
      this.powerSyncDb.registerListener({
        initialized: () => console.log('📱 Database initialized'),
        statusChanged: (status) => {
          console.log('🔄 Sync status:', status.connected ? 'Online' : 'Offline');
        },
      });
    } catch (error) {
      console.error('❌ Failed to initialize PowerSync:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      await this.powerSyncDb.disconnectAndClear();
      this.isInitialized = false;
      console.log('🔌 PowerSync disconnected');
    }
  }

  async clearDatabase(): Promise<void> {
    await this.powerSyncDb.disconnectAndClear();
    await this.powerSyncDb.close();
    console.log('🗑️ Database cleared');
  }

  get isConnected(): boolean {
    return this.isInitialized && this.powerSyncDb.connected;
  }

  get syncStatus() {
    return this.powerSyncDb.currentStatus;
  }
}

// Export singleton instance
export const powerSyncClient = PowerSyncClient.getInstance();

// Export Kysely db for direct use
export const db = powerSyncClient.db;
