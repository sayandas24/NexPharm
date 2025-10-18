// hooks/use-auth.ts
"use client";

import { usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { useEffect, useState } from "react";
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

// ============ Hook ============
export default function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyMember[]>([]);
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { supabaseConnector } = usePowerSync();

  // ============ Internal Helper: Get User Data ============
  const fetchUserData = async (user: User) => {
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
  };

  // ============ Get Current User ============
  const getUser = async () => {
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
  };

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
        const response = await supabaseConnector.client.from("profiles").insert({
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
        const memberRes = await supabaseConnector.client.from("pharmacy_members").insert({
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
  const switchPharmacy = async (pharmacyId: string) => {
    try {
      const pharmacy = pharmacies.find((p) => p.pharmacy_id === pharmacyId);
      if (!pharmacy) throw new Error("Pharmacy not found");

      setCurrentPharmacy(pharmacy.pharmacies);

      if (currentUser) {
        await supabaseConnector.client
          .from("profiles")
          .update({ default_pharmacy_id: pharmacyId })
          .eq("id", currentUser.id);
      }

      console.log("✅ Switched to pharmacy:", pharmacy.pharmacies.name);
    } catch (err: any) {
      setError(err.message);
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
  }, []);

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
