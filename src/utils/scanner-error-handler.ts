// Scanner Error Handler Utility

import { CameraErrorType, OCRErrorType } from "@/types/scanner-types";

export interface EnhancedOCRError {
  type: OCRErrorType;
  message: string;
  userMessage: string;
  recoveryAction: "retry" | "check_connection" | "contact_support" | "use_manual_search";
  retryable: boolean;
  technicalDetails?: string;
}

export interface EnhancedCameraError {
  type: CameraErrorType;
  message: string;
  userMessage: string;
  action: "retry" | "settings" | "fallback";
  isHTTPSRequired?: boolean;
  isMobile?: boolean;
  browserInfo?: string;
  recoverySteps?: string[];
}

/**
 * Map Tesseract/OCR errors to user-friendly messages
 */
export function handleTesseractError(error: any): EnhancedOCRError {
  const errorMessage = error?.message || error?.toString() || "Unknown error";
  const isProduction = process.env.NODE_ENV === "production";

  // Network errors
  if (
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("NetworkError") ||
    errorMessage.includes("net::ERR")
  ) {
    return {
      type: OCRErrorType.NETWORK_ERROR,
      message: errorMessage,
      userMessage:
        "Unable to load scanner components. Please check your internet connection and try again.",
      recoveryAction: "check_connection",
      retryable: true,
      technicalDetails: isProduction ? undefined : errorMessage,
    };
  }

  // Worker loading errors
  if (
    errorMessage.includes("worker") ||
    errorMessage.includes("Worker") ||
    errorMessage.includes("load")
  ) {
    return {
      type: OCRErrorType.WORKER_LOAD_FAILED,
      message: errorMessage,
      userMessage:
        "Failed to initialize scanner. Please refresh the page and try again.",
      recoveryAction: "retry",
      retryable: true,
      technicalDetails: isProduction ? undefined : errorMessage,
    };
  }

  // Timeout errors
  if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
    return {
      type: OCRErrorType.TIMEOUT,
      message: errorMessage,
      userMessage:
        "Scanner processing timed out. Please try again with better lighting or a clearer image.",
      recoveryAction: "retry",
      retryable: true,
      technicalDetails: isProduction ? undefined : errorMessage,
    };
  }

  // No text detected
  if (errorMessage.includes("no_text_detected") || errorMessage === OCRErrorType.NO_TEXT_DETECTED) {
    return {
      type: OCRErrorType.NO_TEXT_DETECTED,
      message: errorMessage,
      userMessage:
        "No text detected in the image. Please ensure the medicine packaging is clearly visible and try again.",
      recoveryAction: "retry",
      retryable: true,
      technicalDetails: isProduction ? undefined : errorMessage,
    };
  }

  // Offline
  if (!navigator.onLine) {
    return {
      type: OCRErrorType.OFFLINE,
      message: "Device is offline",
      userMessage:
        "You appear to be offline. Scanner requires an internet connection to work.",
      recoveryAction: "check_connection",
      retryable: true,
      technicalDetails: isProduction ? undefined : errorMessage,
    };
  }

  // Generic initialization failure
  if (errorMessage.includes("initialization_failed") || errorMessage === OCRErrorType.INITIALIZATION_FAILED) {
    return {
      type: OCRErrorType.INITIALIZATION_FAILED,
      message: errorMessage,
      userMessage:
        "Failed to initialize scanner. Please refresh the page and try again.",
      recoveryAction: "retry",
      retryable: true,
      technicalDetails: isProduction ? undefined : errorMessage,
    };
  }

  // Generic processing failure
  return {
    type: OCRErrorType.PROCESSING_FAILED,
    message: errorMessage,
    userMessage:
      "Failed to process the image. Please try again with better lighting and a clearer view.",
    recoveryAction: "use_manual_search",
    retryable: true,
    technicalDetails: isProduction ? undefined : errorMessage,
  };
}

/**
 * Map camera errors to user-friendly messages with recovery steps
 */
export function handleCameraError(error: any): EnhancedCameraError {
  const errorName = error?.name || "";
  const errorMessage = error?.message || error?.toString() || "Unknown error";
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const browserInfo = navigator.userAgent;

  // Permission denied
  if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
    const recoverySteps = isMobile
      ? isIOS
        ? [
            "1. Go to Settings > Safari > Camera",
            "2. Allow camera access for this website",
            "3. Refresh the page and try again",
          ]
        : [
            "1. Tap the lock icon in the address bar",
            "2. Enable camera permissions",
            "3. Refresh the page and try again",
          ]
      : [
          "1. Click the camera icon in your browser's address bar",
          "2. Select 'Allow' for camera access",
          "3. Refresh the page if needed",
        ];

    return {
      type: CameraErrorType.PERMISSION_DENIED,
      message: errorMessage,
      userMessage:
        "Camera permission denied. Please allow camera access in your browser settings to use the scanner.",
      action: "settings",
      isMobile,
      browserInfo,
      recoverySteps,
    };
  }

  // No camera found
  if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
    return {
      type: CameraErrorType.NO_CAMERA_FOUND,
      message: errorMessage,
      userMessage: "No camera device was found on your device.",
      action: "fallback",
      isMobile,
      browserInfo,
      recoverySteps: [
        "Camera hardware is required for scanning",
        "Please use the manual search option instead",
      ],
    };
  }

  // Camera in use
  if (errorName === "NotReadableError" || errorName === "TrackStartError") {
    return {
      type: CameraErrorType.CAMERA_IN_USE,
      message: errorMessage,
      userMessage:
        "Camera is already in use by another application. Please close other apps using the camera and try again.",
      action: "retry",
      isMobile,
      browserInfo,
      recoverySteps: [
        "1. Close other apps that might be using the camera",
        "2. Close other browser tabs with camera access",
        "3. Try again",
      ],
    };
  }

  // HTTPS required (mobile specific)
  if (!window.isSecureContext && isMobile) {
    return {
      type: CameraErrorType.UNKNOWN_ERROR,
      message: "Insecure context",
      userMessage:
        "Camera access requires a secure connection (HTTPS). Please access the site using HTTPS.",
      action: "settings",
      isHTTPSRequired: true,
      isMobile,
      browserInfo,
      recoverySteps: [
        "Camera access requires HTTPS on mobile devices",
        "Please ensure you're accessing the site via https://",
      ],
    };
  }

  // Generic error
  return {
    type: CameraErrorType.UNKNOWN_ERROR,
    message: errorMessage,
    userMessage:
      "An error occurred while accessing the camera. Please try again.",
    action: "retry",
    isMobile,
    browserInfo,
    recoverySteps: [
      "1. Refresh the page",
      "2. Check camera permissions",
      "3. Try using manual search if the issue persists",
    ],
  };
}

/**
 * Get recovery action suggestion based on error
 */
export function getErrorRecoveryAction(
  error: EnhancedOCRError | EnhancedCameraError
): string {
  if ("recoveryAction" in error) {
    switch (error.recoveryAction) {
      case "retry":
        return "Try scanning again";
      case "check_connection":
        return "Check your internet connection";
      case "contact_support":
        return "Contact support if the issue persists";
      case "use_manual_search":
        return "Use manual search instead";
      default:
        return "Try again";
    }
  }

  if ("action" in error) {
    switch (error.action) {
      case "retry":
        return "Try again";
      case "settings":
        return "Check your settings";
      case "fallback":
        return "Use manual search";
      default:
        return "Try again";
    }
  }

  return "Try again";
}

/**
 * Log production errors with context
 */
export function logProductionError(
  error: any,
  context: {
    component: string;
    action: string;
    userAgent?: string;
    timestamp?: Date;
    additionalInfo?: Record<string, any>;
  }
): void {
  const isProduction = process.env.NODE_ENV === "production";
  const timestamp = context.timestamp || new Date();

  const errorLog = {
    timestamp: timestamp.toISOString(),
    environment: process.env.NODE_ENV,
    component: context.component,
    action: context.action,
    error: {
      message: error?.message || error?.toString() || "Unknown error",
      name: error?.name,
      stack: isProduction ? undefined : error?.stack,
    },
    userAgent: context.userAgent || navigator.userAgent,
    online: navigator.onLine,
    secureContext: window.isSecureContext,
    ...context.additionalInfo,
  };

  // Log to console
  console.error("[Scanner Error]", errorLog);

  // In production, you might want to send this to an error tracking service
  // Example: Sentry, LogRocket, etc.
  if (isProduction) {
    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { scanner: errorLog } });
  }
}
