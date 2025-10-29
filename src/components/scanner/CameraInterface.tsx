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
  const streamRef = useRef<MediaStream | null>(null); // Store stream in ref for immediate access
  const [cameraState, setCameraState] = useState<CameraState>({
    stream: null,
    facingMode: "environment",
    hasPermission: false,
    error: null,
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();

    // Cleanup on unmount
    return () => {
      releaseCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-initialize when facing mode changes
  useEffect(() => {
    if (cameraState.hasPermission) {
      initializeCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraState.facingMode]);

  /**
   * Initialize camera with MediaDevices API
   */
  const initializeCamera = async () => {
    setIsInitializing(true);
    setCameraState((prev) => ({ ...prev, error: null }));

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      // Release existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraState.facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Store stream in ref for immediate access
      streamRef.current = stream;

      // Set stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraState((prev) => ({
        ...prev,
        stream,
        hasPermission: true,
        error: null,
      }));
    } catch (err: any) {
      console.error("Camera initialization error:", err);
      handleCameraError(err);
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Handle camera errors
   */
  const handleCameraError = (err: any) => {
    let error: CameraError;

    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError"
    ) {
      error = {
        type: CameraErrorType.PERMISSION_DENIED,
        message: "Camera permission denied",
        userMessage:
          "Please allow camera access in your browser settings to use the scanner.",
        action: "settings",
      };
    } else if (
      err.name === "NotFoundError" ||
      err.name === "DevicesNotFoundError"
    ) {
      error = {
        type: CameraErrorType.NO_CAMERA_FOUND,
        message: "No camera found",
        userMessage: "No camera device was found on your device.",
        action: "fallback",
      };
    } else if (
      err.name === "NotReadableError" ||
      err.name === "TrackStartError"
    ) {
      error = {
        type: CameraErrorType.CAMERA_IN_USE,
        message: "Camera is in use",
        userMessage:
          "Camera is already in use by another application. Please close other apps using the camera.",
        action: "retry",
      };
    } else {
      error = {
        type: CameraErrorType.UNKNOWN_ERROR,
        message: err.message || "Unknown camera error",
        userMessage:
          "An error occurred while accessing the camera. Please try again.",
        action: "retry",
      };
    }

    setCameraState((prev) => ({ ...prev, error: error.userMessage }));
    onError(error);
  };

  /**
   * Capture image from video stream and stop camera
   */
  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) {
      return;
    }

    const imageData = captureImageFromVideo(videoRef.current);

    if (imageData) {
      // Stop the camera stream immediately after capture
      console.log("Stopping camera after capture...");
      releaseCamera();

      // Call the onCapture callback
      onCapture(imageData);
      console.log("Image captured and camera stopped");
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
    setCameraState((prev) => ({
      ...prev,
      facingMode: prev.facingMode === "user" ? "environment" : "user",
    }));
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
          className="w-full h-full object-cover"
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
