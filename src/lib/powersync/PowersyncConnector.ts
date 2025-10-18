// lib/powersync/connector.ts
import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from "@powersync/web";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const FATAL_RESPONSE_CODES = [
  /^22\d{3}$/, // Data exception
  /^23\d{3}$/, // Integrity constraint violation
  /^42\d{3}$/, // Syntax error or access rule violation
  /^PGRST\d{3}$/, // PostgREST errors
];

export class SupabaseConnector implements PowerSyncBackendConnector {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const {
      data: { session },
      error,
    } = await this.client.auth.getSession();

    if (error || !session) {
      console.error("Could not fetch Supabase credentials:", error);
      return null;
    }

    console.log("✅ PowerSync session active");

    return {
      endpoint: process.env.NEXT_PUBLIC_POWERSYNC_URL!,
      token: session.access_token ?? "",
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
          case "PUT":
            const record = { ...op.opData, id: op.id };
            result = await table.upsert(record);
            break;

          case "PATCH":
            result = await table.update(op.opData).eq("id", op.id);
            break;

          case "DELETE":
            result = await table.delete().eq("id", op.id);
            break;
        }

        if (result?.error) {
          console.error("❌ Supabase operation error:", result.error);
          throw new Error(
            `Could not update Supabase. Error: ${result.error.message}`
          );
        }
      }

      await transaction.complete();
      console.log("✅ Local changes synced to Supabase");
    } catch (ex: any) {
      console.debug("⚠️ Upload error:", ex);

      if (
        typeof ex.code === "string" &&
        FATAL_RESPONSE_CODES.some((regex) => regex.test(ex.code))
      ) {
        console.error(`❌ Fatal error - discarding transaction:`, lastOp, ex);
        await transaction.complete();
      } else {
        throw ex;
      }
    }
  }

  // ============ Email Authentication Methods ============

  /**
   * Sign in with email (passwordless - sends magic link)
   */
  async signInWithEmail(email: string) {
    const { data, error } = await this.client.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("❌ Error sending magic link:", error);
      throw error;
    }

    console.log("✅ Magic link sent to:", email);
    return data;
  }

  /**
   * Sign in with email and password (traditional login)
   */
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("❌ Login error:", error);
      throw error;
    }

    console.log("✅ Login successful");
    return data;
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string, fullName: string) {
    const { data, error } = await this.client.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error("❌ Sign up error:", error);
      throw error;
    }

    console.log("✅ Sign up successful - check email for verification");
    return data;
  }

  // mark ============ Google OAuth Methods ============

  /**
   * Sign in with Google OAuth
   */
  async loginWithGoogle() {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("❌ Google login error:", error);
      throw error;
    }

    console.log("✅ Redirecting to Google login...");
    return data;
  }

  // ============ Profile Management ============

  /**
   * Create user profile after authentication
   * Call this after successful login/signup
   */
  async createProfile(
    userId: string,
    fullName: string,
    email: string,
    role: "admin" | "pharmacist" | "cashier" = "cashier"
  ) {
    const { data, error } = await this.client
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        phone: email, // Using email as identifier since we removed phone auth
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating profile:", error);
      throw error;
    }

    console.log("✅ Profile created successfully");
    return data;
  }

  /**
   * Get or create profile (helper method)
   * Automatically creates profile if it doesn't exist
   */
  async getOrCreateProfile(
    userId: string,
    fullName: string,
    email: string,
    role: "admin" | "pharmacist" | "cashier" = "cashier"
  ) {
    // Try to get existing profile
    let profile = await this.getUserProfile(userId);

    // Create if doesn't exist
    if (!profile) {
      profile = await this.createProfile(userId, fullName, email, role);
    }

    return profile;
  }

  /**
   * Logout user
   */
  async logout() {
    const { error } = await this.client.auth.signOut();
    if (error) {
      console.error("❌ Error logging out:", error);
      throw error;
    }
    console.log("✅ Logged out successfully");
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();

    if (error) {
      console.error("Error getting user:", error);
      return null;
    }

    return user;
  }

  /**
   * // mark Get user profile from database
   */
  async getUserProfile(userId: string) {
    console.log(userId, "Got user id in getuser profile");
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log(data, error, "Got data in getuser profile");
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: { full_name?: string; phone?: string; role?: string }
  ) {
    const { data, error } = await this.client
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating profile:", error);
      throw error;
    }

    console.log("✅ Profile updated successfully");
    return data;
  }

  /**
   * Check if email is already registered
   */
  async isEmailRegistered(email: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id")
      .eq("phone", email) // We're using phone field to store email
      .single();

    return !!data && !error;
  }

  /**
   * Reset password - sends reset email
   */
  async resetPassword(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error("❌ Error sending reset email:", error);
      throw error;
    }

    console.log("✅ Password reset email sent");
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { error } = await this.client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("❌ Error updating password:", error);
      throw error;
    }

    console.log("✅ Password updated");
  }
}
