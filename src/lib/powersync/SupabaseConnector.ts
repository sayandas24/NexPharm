// lib/powersync/SupabaseConnector.ts
import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from '@powersync/web';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const FATAL_RESPONSE_CODES = [
  /^22\d{3}$/,
  /^23\d{3}$/,
  /^42\d{3}$/,
  /^PGRST\d{3}$/,
];

export class SupabaseConnector implements PowerSyncBackendConnector {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // ============ PowerSync Required Methods ============
  
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const {
      data: { session },
      error,
    } = await this.client.auth.getSession();

    if (error || !session) {
      console.error('Could not fetch Supabase credentials:', error);
      return null;
    }

    console.log('✅ PowerSync session active');

    return {
      endpoint: process.env.NEXT_PUBLIC_POWERSYNC_URL!,
      token: session.access_token ?? '',
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    let lastOp: CrudEntry | null = null;

    try {
      for (const op of transaction.crud) {
        lastOp = op;
        const table = this.client.from(op.table);
        let result: any;

        switch (op.op) {
          case 'PUT':
            const record = { ...op.opData, id: op.id };
            result = await table.upsert(record);
            break;

          case 'PATCH':
            result = await table.update(op.opData).eq('id', op.id);
            break;

          case 'DELETE':
            result = await table.delete().eq('id', op.id);
            break;
        }

        if (result?.error) {
          console.error('❌ Supabase operation error:', result.error);
          throw new Error(
            `Could not update Supabase. Error: ${result.error.message}`
          );
        }
      }

      await transaction.complete();
      console.log('✅ Local changes synced to Supabase');
    } catch (ex: any) {
      console.debug('⚠️ Upload error:', ex);

      if (
        typeof ex.code === 'string' &&
        FATAL_RESPONSE_CODES.some((regex) => regex.test(ex.code))
      ) {
        console.error(`❌ Fatal error - discarding transaction:`, lastOp, ex);
        await transaction.complete();
      } else {
        throw ex;
      }
    }
  }
}

// That's it! No auth methods here!
