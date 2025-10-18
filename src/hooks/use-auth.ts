import { usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: "admin" | "pharmacist" | "cashier";
  created_at: string;
  updated_at: string;
}

export default function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { powerSyncDb, supabaseConnector } = usePowerSync();

  // Get current user and profile
  const getUser = async () => {
    try {
      setLoading(true);
      const user = await supabaseConnector.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const userProfile = await supabaseConnector.getUserProfile(user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.error("Error fetching user:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signInWithPassword = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseConnector.signInWithPassword(email, password);
      await getUser();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      setError(null);
      const { user } = await supabaseConnector.signUpWithEmail(
        email,
        password,
        fullName
      );

      // Create profile if user was created
      if (user) {
        await supabaseConnector.createProfile(user.id, fullName, email);
      }

      await getUser();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with magic link
  const signInWithEmail = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseConnector.signInWithEmail(email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await supabaseConnector.loginWithGoogle();
      // Note: Profile creation happens in the auth state listener after redirect
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await supabaseConnector.logout();
      setCurrentUser(null);
      setProfile(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: {
    full_name?: string;
    phone?: string;
    role?: "admin" | "pharmacist" | "cashier";
  }) => {
    try {
      if (!currentUser) throw new Error("No user logged in");

      setLoading(true);
      setError(null);
      const updatedProfile = await supabaseConnector.updateProfile(
        currentUser.id,
        updates
      );
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseConnector.resetPassword(email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      await supabaseConnector.updatePassword(newPassword);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if email is registered
  const isEmailRegistered = async (email: string) => {
    try {
      return await supabaseConnector.isEmailRegistered(email);
    } catch (err: any) {
      console.error("Error checking email:", err);
      return false;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    getUser();

    // Listen to auth state changes
    const { data: authListener } =
      supabaseConnector.client.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state changed:", event);

          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            const user = session?.user;
            console.log(user, "user in auth listen")
            if (user) {
              // Check if profile exists
              const existingProfile = await supabaseConnector.getUserProfile(
                user.id
              );
              console.log(existingProfile, "existingProfile in auth listen")

              // Create profile if it doesn't exist (Google OAuth case)
              if (!existingProfile) {
                try {
                  const fullName =
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] ||
                    "User";
                  const email = user.email || "";

                  await supabaseConnector.createProfile(
                    user.id,
                    fullName,
                    email,
                    "cashier" // Default role
                  );
                  console.log("✅ Profile auto-created for OAuth user");
                } catch (error) {
                  console.error("Failed to create profile:", error);
                }
              }
            }

            await getUser();
          } else if (event === "SIGNED_OUT") {
            setCurrentUser(null);
            setProfile(null);
          }
        }
      );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    // State
    currentUser,
    profile,
    loading,
    error,
    isAuthenticated: !!currentUser,

    // Methods
    getUser,
    signInWithPassword,
    signUp,
    signInWithEmail,
    signInWithGoogle,
    logout,
    updateProfile,
    resetPassword,
    updatePassword,
    isEmailRegistered,
  };
}
