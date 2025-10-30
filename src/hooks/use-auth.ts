// hooks/use-auth.ts
"use client";

import { usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

// ============ Types ============
interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  default_pharmacy_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Pharmacy {
  id: string;
  name: string;
  license_number: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string | null;
  gst_number: string | null;
  logo_url: string | null;
}

interface PharmacyMember {
  id: string;
  pharmacy_id: string;
  user_id: string;
  role: "owner" | "admin" | "pharmacist" | "cashier";
  is_active: boolean;
  joined_at: string;
  pharmacies: Pharmacy;
}

// ============ Pharmacy Switch Types ============
export enum SwitchStage {
  VALIDATING = "validating",
  DISCONNECTING = "disconnecting",
  CLEARING = "clearing",
  UPDATING_PROFILE = "updating_profile",
  RECONNECTING = "reconnecting",
  SYNCING = "syncing",
  COMPLETE = "complete",
}

export interface SwitchPharmacyOptions {
  onProgress?: (stage: SwitchStage) => void;
  onError?: (error: Error, stage: SwitchStage) => void;
}

// ============ Hook ============
export default function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyMember[]>([]);
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    supabaseConnector,
    disconnect,
    clearDatabase,
    reconnect,
    waitForSync,
  } = usePowerSync();

  // ============ Internal Helper: Get User Data ============
  const fetchUserData = useCallback(
    async (user: User) => {
      try {
        // Get profile
        const { data: userProfile } = await supabaseConnector.client
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(userProfile);

        // Get user's pharmacies
        const { data: userPharmacies } = await supabaseConnector.client
          .from("pharmacy_members")
          .select(`*, pharmacies:pharmacy_id (*)`)
          .eq("user_id", user.id)
          .eq("is_active", true);

        setPharmacies(userPharmacies || []);

        // Set current pharmacy
        if (userProfile?.default_pharmacy_id && userPharmacies) {
          const defaultPharmacy = userPharmacies.find(
            (p) => p.pharmacy_id === userProfile.default_pharmacy_id
          );
          setCurrentPharmacy(defaultPharmacy?.pharmacies || null);
        } else if (userPharmacies && userPharmacies.length > 0) {
          setCurrentPharmacy(userPharmacies[0].pharmacies);
        }
      } catch (err: any) {
        console.error("Error fetching user data:", err);
        setError(err.message);
      }
    },
    [supabaseConnector, setProfile, setPharmacies, setCurrentPharmacy]
  );

  // ============ Get Current User ============

  const getUser = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabaseConnector.client.auth.getUser();

      setCurrentUser(user);

      if (user) {
        await fetchUserData(user);
      } else {
        setProfile(null);
        setPharmacies([]);
        setCurrentPharmacy(null);
      }
    } catch (err: any) {
      console.error("Error fetching user:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabaseConnector, fetchUserData]);
  // ============ Sign In ============
  const signInWithPassword = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } =
        await supabaseConnector.client.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;

      console.log("✅ Login successful");
      await getUser();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============ Sign Up ============
  const signUpWithPharmacy = async (
    email: string,
    password: string,
    fullName: string,
    pharmacyId: string,
    role: "admin" | "pharmacist" | "cashier"
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Verify pharmacy exists
      const { data: pharmacy, error: pharmacyError } =
        await supabaseConnector.client
          .from("pharmacies")
          .select("id, name")
          .eq("id", pharmacyId)
          .single();

      if (pharmacyError || !pharmacy) {
        throw new Error("Invalid Pharmacy ID");
      }

      // Create auth user
      const { data, error } = await supabaseConnector.client.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) throw error;

      // fix rls issue with remove password signup and add Email OTP (6-Digit Code) - Recommended
      // await supabaseConnector.client.auth.signOut();
      if (data.user) {
        console.log("✅ User created:", data, pharmacyId, email, fullName);
        // Create profile
        const response = await supabaseConnector.client
          .from("profiles")
          .insert({
            id: data.user.id,
            full_name: fullName,
            email: email,
            avatar_url: null,
            default_pharmacy_id: pharmacyId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        console.log("✅ Profile created:", response);

        // Create pharmacy member
        const memberRes = await supabaseConnector.client
          .from("pharmacy_members")
          .insert({
            pharmacy_id: pharmacyId,
            user_id: data.user.id,
            role: role,
            is_active: true,
            joined_at: new Date().toISOString(),
          });
        console.log("✅ Pharmacy member created:", memberRes);

        console.log("✅ Sign up successful!");
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============ Verify Pharmacy ID ============
  const verifyPharmacyId = async (pharmacyId: string) => {
    try {
      const { data, error } = await supabaseConnector.client
        .from("pharmacies")
        .select("id, name, license_number")
        .eq("id", pharmacyId)
        .single();

      if (error || !data) return null;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // ============ Switch Pharmacy ============
  const switchPharmacy = async (
    pharmacyId: string,
    options?: SwitchPharmacyOptions
  ) => {
    const startTime = Date.now();
    const previousPharmacyId = currentPharmacy?.id || null;
    let currentStage: SwitchStage = SwitchStage.VALIDATING;

    try {
      // ===== VALIDATION PHASE =====
      currentStage = SwitchStage.VALIDATING;
      console.log("🔄 Starting pharmacy switch to:", pharmacyId);
      options?.onProgress?.(currentStage);

      // Check if pharmacy is different from current
      if (currentPharmacy?.id === pharmacyId) {
        console.log("ℹ️ Already on this pharmacy");
        return;
      }

      // Verify pharmacy exists in user's list
      const pharmacy = pharmacies.find((p) => p.pharmacy_id === pharmacyId);
      if (!pharmacy) {
        const error = new Error("Pharmacy not found in your pharmacy list");
        options?.onError?.(error, currentStage);
        throw error;
      }

      // Verify user has active membership
      if (!pharmacy.is_active) {
        const error = new Error(
          "Your membership to this pharmacy is not active"
        );
        options?.onError?.(error, currentStage);
        throw error;
      }

      console.log("✅ Validation passed:", pharmacy.pharmacies.name);

      // ===== DISCONNECTION PHASE =====
      currentStage = SwitchStage.DISCONNECTING;
      options?.onProgress?.(currentStage);
      console.log("🔌 Disconnecting from PowerSync...");

      try {
        await disconnect();
        console.log("✅ Disconnected successfully");
      } catch (err: any) {
        console.warn("⚠️ Disconnection warning:", err);
        // Continue anyway - might already be disconnected
      }

      // ===== DATABASE CLEAR PHASE =====
      currentStage = SwitchStage.CLEARING;
      options?.onProgress?.(currentStage);
      console.log("🗑️ Clearing local database...");

      try {
        await clearDatabase();
        console.log("✅ Database cleared successfully");
      } catch (err: any) {
        console.error("❌ Failed to clear database:", err);
        const error = new Error("Failed to clear local database");
        options?.onError?.(error, currentStage);
        throw error;
      }

      // ===== PROFILE UPDATE PHASE =====
      currentStage = SwitchStage.UPDATING_PROFILE;
      options?.onProgress?.(currentStage);
      console.log("💾 Updating user profile...");

      // Update local state first (optimistic update)
      setCurrentPharmacy(pharmacy.pharmacies);

      // Update profile in Supabase
      if (currentUser) {
        try {
          const { error: updateError } = await supabaseConnector.client
            .from("profiles")
            .update({ default_pharmacy_id: pharmacyId })
            .eq("id", currentUser.id);

          if (updateError) {
            console.error("⚠️ Profile update error:", updateError);
            // Don't throw - continue with local switch
          } else {
            console.log("✅ Profile updated successfully");
          }
        } catch (err: any) {
          console.error("⚠️ Profile update failed:", err);
          // Don't throw - continue with local switch
        }
      }

      // ===== RECONNECTION PHASE =====
      currentStage = SwitchStage.RECONNECTING;
      options?.onProgress?.(currentStage);
      console.log("🔗 Reconnecting to PowerSync...");

      try {
        await reconnect();
        console.log("✅ Reconnection initiated");
      } catch (err: any) {
        console.error("❌ Reconnection failed:", err);
        const error = new Error("Failed to reconnect to sync service");
        options?.onError?.(error, currentStage);
        throw error;
      }

      // ===== SYNC WAIT PHASE =====
      currentStage = SwitchStage.SYNCING;
      options?.onProgress?.(currentStage);
      console.log("⏳ Waiting for initial sync...");

      const syncSuccess = await waitForSync(30000);

      if (!syncSuccess) {
        console.warn("⚠️ Sync timeout - continuing in background");
        // Don't throw - allow user to proceed
      } else {
        console.log("✅ Initial sync completed");
      }

      // ===== COMPLETE =====
      currentStage = SwitchStage.COMPLETE;
      options?.onProgress?.(currentStage);
      const duration = Date.now() - startTime;
      console.log(
        `✅ Pharmacy switch complete in ${duration}ms:`,
        pharmacy.pharmacies.name
      );
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ Pharmacy switch failed at stage "${currentStage}" after ${duration}ms:`,
        err
      );
      setError(err.message);

      // Call error callback with stage information
      if (options?.onError && !err.callbackInvoked) {
        err.callbackInvoked = true; // Prevent double callback
        options.onError(err, currentStage);
      }

      // Attempt rollback for critical failures
      if (
        currentStage === SwitchStage.RECONNECTING ||
        currentStage === SwitchStage.SYNCING
      ) {
        if (previousPharmacyId && previousPharmacyId !== pharmacyId) {
          console.log("🔄 Attempting rollback to previous pharmacy...");
          const previousPharmacy = pharmacies.find(
            (p) => p.pharmacy_id === previousPharmacyId
          );
          if (previousPharmacy) {
            setCurrentPharmacy(previousPharmacy.pharmacies);
            console.log("✅ Rolled back to:", previousPharmacy.pharmacies.name);
          }
        }
      }

      throw err;
    }
  };

  // ============ Get Current Role ============
  const getCurrentRole = () => {
    if (!currentPharmacy) return null;
    const membership = pharmacies.find(
      (p) => p.pharmacy_id === currentPharmacy.id
    );
    return membership?.role || null;
  };

  // ============ Logout ============
  const logout = async () => {
    try {
      setLoading(true);
      await supabaseConnector.client.auth.signOut();
      setCurrentUser(null);
      setProfile(null);
      setPharmacies([]);
      setCurrentPharmacy(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============ Update Profile ============
  const updateProfile = async (updates: {
    full_name?: string;
    email?: string;
  }) => {
    try {
      if (!currentUser) throw new Error("No user logged in");

      const { data, error } = await supabaseConnector.client
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", currentUser.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // ============ Reset Password ============
  const resetPassword = async (email: string) => {
    try {
      const { error } =
        await supabaseConnector.client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // ============ Initialize ============
  useEffect(() => {
    getUser();

    const { data: authListener } =
      supabaseConnector.client.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await getUser();
          } else if (event === "SIGNED_OUT") {
            setCurrentUser(null);
            setProfile(null);
            setPharmacies([]);
            setCurrentPharmacy(null);
          }
        }
      );

    return () => authListener.subscription.unsubscribe();
  }, [getUser, supabaseConnector]);

  // ============ Return ============
  return {
    // State
    currentUser,
    profile,
    pharmacies,
    currentPharmacy,
    currentRole: getCurrentRole(),
    loading,
    error,
    isAuthenticated: !!currentUser,

    // Methods
    signInWithPassword,
    signUpWithPharmacy,
    verifyPharmacyId,
    switchPharmacy,
    logout,
    updateProfile,
    resetPassword,
    getUser,
  };
}
