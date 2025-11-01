// lib/cache/auth-cache-service.ts

// ============ Types ============
export interface CachedProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  default_pharmacy_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CachedPharmacy {
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

export interface CachedPharmacyMember {
  id: string;
  pharmacy_id: string;
  user_id: string;
  role: "owner" | "admin" | "pharmacist" | "cashier";
  is_active: boolean;
  joined_at: string;
  pharmacies: CachedPharmacy;
}

export interface CachedUserData {
  version: number;
  timestamp: number;
  user: {
    id: string;
    email: string;
  } | null;
  profile: CachedProfile | null;
  currentPharmacy: CachedPharmacy | null;
  pharmacies: CachedPharmacyMember[];
}

// ============ AuthCacheService ============
export class AuthCacheService {
  private static instance: AuthCacheService;
  private readonly CACHE_KEY = "medplus_auth_cache";
  private readonly CACHE_VERSION = 1;
  private readonly MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AuthCacheService {
    if (!AuthCacheService.instance) {
      AuthCacheService.instance = new AuthCacheService();
    }
    return AuthCacheService.instance;
  }

  /**
   * Get cached data if valid
   */
  get(): CachedUserData | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) {
        return null;
      }

      const parsed = this.safeParse<CachedUserData>(cached);
      if (!parsed) {
        return null;
      }

      // Validate cache
      if (!this.validate(parsed)) {
        console.log("❌ Cache validation failed, clearing");
        this.clear();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("❌ Error reading cache:", error);
      this.clear();
      return null;
    }
  }

  /**
   * Set cache data
   */
  set(data: Omit<CachedUserData, "version" | "timestamp">): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      const cacheData: CachedUserData = {
        version: this.CACHE_VERSION,
        timestamp: Date.now(),
        ...data,
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error: any) {
      if (error.name === "QuotaExceededError") {
        console.warn("⚠️ localStorage quota exceeded, clearing and retrying");
        this.clear();
        
        // Retry once
        try {
          const cacheData: CachedUserData = {
            version: this.CACHE_VERSION,
            timestamp: Date.now(),
            ...data,
          };
          localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
        } catch (retryError) {
          console.error("❌ Failed to cache after clearing:", retryError);
        }
      } else {
        console.error("❌ Failed to cache data:", error);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error("❌ Error clearing cache:", error);
    }
  }

  /**
   * Validate cache (version and age)
   */
  private validate(cached: CachedUserData): boolean {
    // Check version
    if (cached.version !== this.CACHE_VERSION) {
      console.log(
        `⚠️ Cache version mismatch: expected ${this.CACHE_VERSION}, got ${cached.version}`
      );
      return false;
    }

    // Check age
    const age = Date.now() - cached.timestamp;
    if (age > this.MAX_CACHE_AGE_MS) {
      console.log(
        `⚠️ Cache is too old: ${Math.round(age / (24 * 60 * 60 * 1000))} days`
      );
      return false;
    }

    // Check required fields
    if (!cached.user || !cached.profile) {
      console.log("⚠️ Cache missing required fields");
      return false;
    }

    return true;
  }

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn("⚠️ localStorage is not available:", e);
      return false;
    }
  }

  /**
   * Safe JSON parse with error handling
   */
  private safeParse<T>(json: string): T | null {
    try {
      return JSON.parse(json) as T;
    } catch (error) {
      console.error("❌ Failed to parse cached data:", error);
      this.clear();
      return null;
    }
  }
}
