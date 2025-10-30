// lib/powersync/client.ts
import { PowerSyncDatabase } from "@powersync/web";
import { wrapPowerSyncWithKysely } from "@powersync/kysely-driver";
import { Kysely } from "kysely";
import { AppSchema } from "./schema";
import { SupabaseConnector } from "./SupabaseConnector";
import { PharmacyDatabase } from "@/types/database-types";

export class PowerSyncClient {
  private static instance: PowerSyncClient | null = null;

  public powerSyncDb!: PowerSyncDatabase;
  public db!: Kysely<PharmacyDatabase>;
  public supabaseConnector!: SupabaseConnector;
  private isInitialized: boolean = false;

  private constructor() {
    // Only initialize if we're in the browser
    if (typeof window === "undefined") {
      console.warn("⚠️ PowerSync cannot be initialized on the server");
      return;
    }

    console.log("🔧 Creating PowerSync instance...");

    // Check if SharedWorker is supported (not available on mobile browsers)
    const supportsSharedWorker = typeof SharedWorker !== "undefined";

    if (!supportsSharedWorker) {
      console.log("📱 Mobile browser detected - disabling multi-tab support");
    }

    // Initialize PowerSync database
    this.powerSyncDb = new PowerSyncDatabase({
      database: {
        dbFilename: "pharmacy.db",
        dbLocation: "indexeddb",
      },
      schema: AppSchema,
      flags: {
        enableMultiTabs: supportsSharedWorker,
      },
    });

    // Wrap with Kysely for type-safe queries
    this.db = wrapPowerSyncWithKysely<PharmacyDatabase>(
      this.powerSyncDb as any
    );

    // Initialize Supabase connector
    this.supabaseConnector = new SupabaseConnector();
  }

  public static getInstance(): PowerSyncClient {
    // Only create instance in browser
    if (typeof window === "undefined") {
      // Return a dummy instance for SSR
      return {} as PowerSyncClient;
    }

    if (!PowerSyncClient.instance) {
      PowerSyncClient.instance = new PowerSyncClient();
    }
    return PowerSyncClient.instance;
  }

  async init(): Promise<void> {
    // Skip initialization on server
    if (typeof window === "undefined") {
      console.warn("⚠️ Skipping PowerSync init on server");
      return;
    }

    if (this.isInitialized) {
      console.log("✅ PowerSync already initialized");
      return;
    }

    if (!this.powerSyncDb) {
      console.error("❌ PowerSync database not initialized");
      return;
    }

    try {
      console.log("🔄 Initializing PowerSync database...");
      await this.powerSyncDb.init();

      console.log("🔄 Connecting to backend...");
      await this.powerSyncDb.connect(this.supabaseConnector);

      this.isInitialized = true;
      console.log("✅ PowerSync fully initialized and syncing");
    } catch (error) {
      console.error("❌ Failed to initialize PowerSync:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      await this.powerSyncDb.disconnectAndClear();
      this.isInitialized = false;
      console.log("🔌 PowerSync disconnected");
    }
  }

  async clearDatabase(): Promise<void> {
    await this.powerSyncDb.disconnectAndClear();
    await this.powerSyncDb.close();
    console.log("🗑️ Database cleared");
  }

  get isConnected(): boolean {
    return this.isInitialized && this.powerSyncDb.connected;
  }

  get syncStatus() {
    return this.powerSyncDb.currentStatus;
  }
}

// Export singleton instance getter (lazy-loaded)
let _powerSyncClient: PowerSyncClient | null = null;

export const getPowerSyncClient = (): PowerSyncClient => {
  if (!_powerSyncClient) {
    _powerSyncClient = PowerSyncClient.getInstance();
  }
  return _powerSyncClient;
};

// For backward compatibility
export const powerSyncClient =
  typeof window !== "undefined"
    ? PowerSyncClient.getInstance()
    : ({} as PowerSyncClient);

// Export Kysely db for direct use (only in browser)
export const db =
  typeof window !== "undefined"
    ? powerSyncClient.db
    : ({} as Kysely<PharmacyDatabase>);
