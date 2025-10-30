// Network Utilities for Scanner

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Promise with the result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if online before attempting
      if (!isOnline()) {
        throw new Error("Device is offline");
      }

      // Try to execute the function
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay: baseDelay * 2^attempt
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.log(`Retrying in ${delayMs}ms...`);

      // Wait before retrying
      await delay(delayMs);
    }
  }

  // All retries failed, throw the last error
  throw lastError;
}

/**
 * Check if a CDN resource is accessible
 * @param url - URL to check
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise<boolean> - true if accessible, false otherwise
 */
export async function checkCDNAvailability(
  url: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-cache",
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`CDN availability check failed for ${url}:`, error);
    return false;
  }
}

/**
 * Listen for online/offline events
 * @param onOnline - Callback when connection is restored
 * @param onOffline - Callback when connection is lost
 * @returns Cleanup function to remove event listeners
 */
export function watchNetworkStatus(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  const handleOnline = () => {
    console.log("Network connection restored");
    onOnline();
  };

  const handleOffline = () => {
    console.log("Network connection lost");
    onOffline();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/**
 * Try multiple CDN URLs in sequence until one succeeds
 * @param urls - Array of CDN URLs to try
 * @param checkFn - Function to check if CDN is working (optional)
 * @returns Promise with the first working URL
 */
export async function tryMultipleCDNs(
  urls: string[],
  checkFn?: (url: string) => Promise<boolean>
): Promise<string> {
  for (const url of urls) {
    try {
      if (checkFn) {
        const isAvailable = await checkFn(url);
        if (isAvailable) {
          console.log(`CDN available: ${url}`);
          return url;
        }
      } else {
        // If no check function provided, just return the first URL
        return url;
      }
    } catch (error) {
      console.warn(`CDN check failed for ${url}:`, error);
      continue;
    }
  }

  // If all CDNs failed, return the first one as fallback
  console.warn("All CDN checks failed, using first URL as fallback");
  return urls[0];
}

/**
 * Get network information (if available)
 */
export function getNetworkInfo(): {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} {
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
  };
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) {
    return false;
  }

  // Consider 2G and slow-2g as slow connections
  const slowTypes = ["slow-2g", "2g"];
  return slowTypes.includes(connection.effectiveType);
}
