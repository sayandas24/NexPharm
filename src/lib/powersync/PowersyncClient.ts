// lib/powersync/PowersyncClient.ts
import {
  PowerSyncDatabase,
  WASQLiteOpenFactory,
  WASQLiteVFS,
} from "@powersync/web";
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
    if (typeof window === "undefined") {
      console.warn("⚠️ PowerSync cannot be initialized on the server");
      return;
    }

    console.log("🔧 Creating PowerSync instance...");

    // SharedWorker enables multi-tab sync; not available on all mobile browsers
    const supportsSharedWorker = typeof SharedWorker !== "undefined";
    if (!supportsSharedWorker) {
      console.log("📱 SharedWorker unavailable — disabling multi-tab support");
    }

    /**
     * Use WASQLiteOpenFactory with OPFSCoopSyncVFS (recommended):
     *  - Supports all major browsers including Safari
     *  - Reliable multi-tab behaviour when SharedWorker is available
     *  - Better performance than IDBBatchAtomicVFS (IndexedDB-based default)
     *
     * NOTE: The old `database: { dbFilename, dbLocation: "indexeddb" }` shorthand
     * with `dbLocation: "indexeddb"` was INVALID and caused the socketStream error.
     */
    this.powerSyncDb = new PowerSyncDatabase({
      schema: AppSchema,
      database: new WASQLiteOpenFactory({
        dbFilename: "streaming-sync-sync-pharmacy.db",
        vfs: WASQLiteVFS.OPFSCoopSyncVFS,
        flags: {
          enableMultiTabs: supportsSharedWorker,
        },
      }),
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

  /** Returns the singleton instance (browser-only). */
  public static getInstance(): PowerSyncClient {
    if (typeof window === "undefined") {
      // Return an empty shell for SSR — never used for actual DB ops
      return {} as PowerSyncClient;
    }

    if (!PowerSyncClient.instance) {
      PowerSyncClient.instance = new PowerSyncClient();
    }
    return PowerSyncClient.instance;
  }

  /** Initialize the database and connect to the backend. */
  async init(): Promise<void> {
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

// ─── Lazy singleton accessor ───────────────────────────────────────────────

/**
 * Always use getPowerSyncClient() instead of importing `powerSyncClient`
 * directly at module level. The direct export is kept only for backwards
 * compatibility with existing imports but is safe because the factory
 * is called lazily at runtime inside a browser-only guard.
 */
export const getPowerSyncClient = (): PowerSyncClient => {
  return PowerSyncClient.getInstance();
};

/**
 * Module-level singleton — safe because PowerSyncClient.getInstance()
 * returns an empty shell on the server and the real instance in the browser.
 * The actual PowerSyncDatabase is only created inside the constructor which
 * is guarded by `typeof window === "undefined"`.
 */
export const powerSyncClient =
  typeof window !== "undefined"
    ? PowerSyncClient.getInstance()
    : ({} as PowerSyncClient);

/**
 * Kysely db instance — only populated in the browser.
 * Access via usePowerSync() hook in components instead of this export.
 */
export const db =
  typeof window !== "undefined"
    ? powerSyncClient.db
    : ({} as Kysely<PharmacyDatabase>);
