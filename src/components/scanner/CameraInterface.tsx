"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CameraError,
  CameraErrorType,
  CameraState,
} from "@/types/scanner-types";
import { captureImageFromVideo } from "@/utils/image-processing.utils";

interface CameraInterfaceProps {
  onCapture: (imageData: string) => void;
  onError: (error: CameraError) => void;
  isProcessing: boolean;
}

export default function CameraInterface({
  onCapture,
  onError,
  isProcessing,
}: CameraInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraState, setCameraState] = useState<CameraState>({
    stream: null,
    facingMode: "environment",
    hasPermission: false,
    error: null,
  });
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Detect mobile device and HTTPS
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isSecureContext = typeof window !== "undefined" && window.isSecureContext;
  const [showHTTPSWarning, setShowHTTPSWarning] = useState(false);

  // Initialize camera on mount and when facing mode changes
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      await initializeCamera();
      if (mounted) {
        console.log("✅ Camera initialization complete");
      }
    };
    
    init();

    // Cleanup on unmount
    return () => {
      mounted = false;
      console.log("🧹 Component unmounting, releasing camera");
      releaseCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  /**
   * Initialize camera with MediaDevices API
   */
  const initializeCamera = async () => {
    setIsInitializing(true);
    setCameraState((prev) => ({ ...prev, error: null }));
    setShowHTTPSWarning(false);

    try {
      // Check HTTPS requirement on mobile
      if (isMobile && !isSecureContext) {
        setShowHTTPSWarning(true);
        throw new Error("HTTPS required for camera access on mobile devices");
      }

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      // Release existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Request camera access with mobile-optimized constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: isMobile ? 1280 : 1920 },
          height: { ideal: isMobile ? 720 : 1080 },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      };

      console.log("📹 Requesting camera with constraints:", constraints);
      console.log("📱 Device type:", isMobile ? "Mobile" : "Desktop");
      console.log("🔒 Secure context:", isSecureContext);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("✅ Camera stream obtained");

      // Store stream in ref for immediate access
      streamRef.current = stream;

      // Set stream to video element
      if (videoRef.current) {
        console.log("📺 Setting stream to video element");
        const video = videoRef.current;
        
        // Set srcObject
        video.srcObject = stream;

        // Wait for video metadata to load before playing
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video metadata load timeout"));
          }, 5000);

          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            console.log("📹 Video metadata loaded");
            console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
            resolve();
          };

          video.onerror = (err) => {
            clearTimeout(timeout);
            console.error("Video error:", err);
            reject(new Error("Video load error"));
          };
        });

        // Try to play the video
        try {
          await video.play();
          console.log("▶️ Video playing successfully");
          console.log("Video readyState:", video.readyState);
          console.log("Video paused:", video.paused);
        } catch (playError) {
          console.warn("⚠️ Video autoplay failed, retrying:", playError);
          // Force play with multiple retries
          let retries = 0;
          const maxRetries = 3;
          const retryPlay = async () => {
            try {
              await video.play();
              console.log("▶️ Video playing after retry", retries + 1);
            } catch (retryError) {
              retries++;
              if (retries < maxRetries) {
                console.log(`Retry ${retries}/${maxRetries}...`);
                setTimeout(retryPlay, 200 * retries);
              } else {
                console.error("Video play failed after all retries:", retryError);
              }
            }
          };
          setTimeout(retryPlay, 100);
        }
      }

      // Update state - IMPORTANT: Set this before setIsInitializing
      setCameraState({
        stream,
        facingMode: facingMode,
        hasPermission: true,
        error: null,
      });
      
      // Set initializing to false AFTER state is updated
      setIsInitializing(false);
      console.log("✅ Camera ready - hasPermission: true");
    } catch (err: any) {
      console.error("Camera initialization error:", err);
      setIsInitializing(false);
      handleCameraError(err);
    }
  };

  /**
   * Handle camera errors with enhanced user guidance
   */
  const handleCameraError = (err: any) => {
    let error: CameraError;
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError"
    ) {
      let userMessage = "Please allow camera access in your browser settings to use the scanner.";
      
      if (isMobile) {
        if (isIOS) {
          userMessage = "Camera permission denied. Go to Settings > Safari > Camera and allow access for this website.";
        } else if (isAndroid) {
          userMessage = "Camera permission denied. Tap the lock icon in the address bar and enable camera permissions.";
        }
      } else {
        userMessage = "Camera permission denied. Click the camera icon in your browser's address bar and select 'Allow'.";
      }

      error = {
        type: CameraErrorType.PERMISSION_DENIED,
        message: "Camera permission denied",
        userMessage,
        action: "settings",
      };
    } else if (
      err.name === "NotFoundError" ||
      err.name === "DevicesNotFoundError"
    ) {
      error = {
        type: CameraErrorType.NO_CAMERA_FOUND,
        message: "No camera found",
        userMessage: "No camera device was found on your device. Please use the manual search option instead.",
        action: "fallback",
      };
    } else if (
      err.name === "NotReadableError" ||
      err.name === "TrackStartError"
    ) {
      let userMessage = "Camera is already in use by another application. Please close other apps using the camera and try again.";
      
      if (isMobile) {
        userMessage = "Camera is in use. Close other apps that might be using the camera and try again.";
      }

      error = {
        type: CameraErrorType.CAMERA_IN_USE,
        message: "Camera is in use",
        userMessage,
        action: "retry",
      };
    } else if (err.message?.includes("HTTPS required")) {
      error = {
        type: CameraErrorType.UNKNOWN_ERROR,
        message: "HTTPS required",
        userMessage: "Camera access requires a secure connection (HTTPS). Please access the site using https://",
        action: "settings",
      };
    } else {
      error = {
        type: CameraErrorType.UNKNOWN_ERROR,
        message: err.message || "Unknown camera error",
        userMessage:
          "An error occurred while accessing the camera. Please refresh the page and try again.",
        action: "retry",
      };
    }

    console.error("Camera error details:", {
      errorName: err.name,
      errorMessage: err.message,
      isMobile,
      isSecureContext,
      userAgent: navigator.userAgent,
    });

    setCameraState((prev) => ({ ...prev, error: error.userMessage }));
    onError(error);
  };

  /**
   * Capture image from video stream
   */
  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) {
      return;
    }

    const imageData = captureImageFromVideo(videoRef.current);

    if (imageData) {
      // Call the onCapture callback
      onCapture(imageData);
      console.log("Image captured successfully");
    } else {
      onError({
        type: CameraErrorType.UNKNOWN_ERROR,
        message: "Failed to capture image",
        userMessage: "Failed to capture image. Please try again.",
        action: "retry",
      });
    }
  };

  /**
   * Switch between front and back camera
   */
  const switchCamera = () => {
    setFacingMode((prev) => prev === "user" ? "environment" : "user");
  };

  /**
   * Release camera resources
   */
  const releaseCamera = () => {
    console.log("Releasing camera resources...");

    // Stop all tracks from the stream using ref (immediate access)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(
          "Stopped camera track:",
          track.label,
          "- State:",
          track.readyState
        );
      });
      streamRef.current = null;
    }

    // Clear video element source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log("Cleared video srcObject");
    }

    // Update state
    setCameraState((prev) => ({ ...prev, stream: null, hasPermission: false }));
    console.log("Camera released successfully");
  };

  /**
   * Retry camera initialization
   */
  const handleRetry = () => {
    initializeCamera();
  };

  // Show HTTPS warning on mobile
  if (showHTTPSWarning && isMobile) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-orange-50 rounded-lg border-2 border-orange-300 min-h-[400px]">
        <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-orange-900">HTTPS Required</h3>
        <p className="text-gray-700 text-center mb-4 max-w-md">
          Camera access requires a secure connection (HTTPS) on mobile devices. Please ensure you&apos;re accessing the site via https://.
        </p>
        <div className="text-sm text-gray-600 text-center max-w-md">
          <p className="mb-2">Current URL: {typeof window !== "undefined" ? window.location.href : ""}</p>
          {typeof window !== "undefined" && window.location.protocol === "http:" && (
            <p className="text-orange-600 font-medium">
              Try accessing: {window.location.href.replace("http://", "https://")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (cameraState.error && !isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[400px]">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
        <p className="text-gray-600 text-center mb-4 max-w-md">
          {cameraState.error}
        </p>
        <Button onClick={handleRetry} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  // Show loading state
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[400px]">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Initializing camera...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Video Preview */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          webkit-playsinline="true"
          className="w-full h-full object-cover"
          style={{
            transform: facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
            WebkitTransform: facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
          }}
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            console.log("Video metadata loaded event:", {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
            });
          }}
          onCanPlay={() => {
            console.log("Video can play event");
          }}
          onPlay={() => {
            console.log("Video play event");
          }}
        />

        {/* Overlay guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-4 border-white/50 rounded-lg w-4/5 h-3/4 shadow-lg">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              Position medicine packaging within frame
            </div>
          </div>
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
              <p>Processing image...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {/* Switch Camera Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={switchCamera}
          disabled={isProcessing}
          className="h-12 w-12"
        >
          <SwitchCamera className="h-5 w-5" />
        </Button>

        {/* Capture Button */}
        <Button
          size="lg"
          onClick={handleCapture}
          disabled={isProcessing || !cameraState.hasPermission}
          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
        >
          <Camera className="h-8 w-8" />
        </Button>

        {/* Placeholder for symmetry */}
        <div className="h-12 w-12" />
      </div>
    </div>
  );
}
