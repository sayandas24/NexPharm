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
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Component unmounting, releasing camera");
      closeCamera();
    };
  }, []);

  /**
   * Open camera
   */
  const openCamera = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      console.log("Requesting camera access...");

      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      console.log("Stream obtained:", stream.id);
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          console.log("Metadata loaded:", {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
          });

          video
            .play()
            .then(() => {
              console.log("Video playing");
              setIsOpen(true);
              setIsLoading(false);
            })
            .catch((err) => {
              console.error("Play error:", err);
              setError(`Play error: ${err.message}`);
              setIsLoading(false);
            });
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      let errorMessage = "Failed to access camera";

      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use.";
      }

      setError(errorMessage);
      setIsLoading(false);

      onError({
        type: CameraErrorType.UNKNOWN_ERROR,
        message: err.message,
        userMessage: errorMessage,
        action: "retry",
      });
    }
  };

  /**
   * Close camera
   */
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsOpen(false);
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
  const switchCamera = async () => {
    closeCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    // Wait a bit then reopen
    setTimeout(() => {
      openCamera();
    }, 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[400px]">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Starting camera...</p>
      </div>
    );
  }

  // Error state
  if (error && !isOpen) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[400px]">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
        <p className="text-gray-600 text-center mb-4 max-w-md">{error}</p>
        <Button onClick={openCamera} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Manual Camera Control */}
      {!isOpen && (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[400px]">
          <Camera className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Ready</h3>
          <p className="text-gray-600 text-center mb-4">
            Click the button below to start the camera
          </p>
          <Button onClick={openCamera} size="lg">
            Open Camera
          </Button>
        </div>
      )}

      {/* Video Preview */}
      {isOpen && (
        <>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                transform: facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
              }}
            />

            {/* Overlay guide */}
            {!isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-white/50 rounded-lg w-4/5 h-3/4 shadow-lg">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                    Position medicine packaging within frame
                  </div>
                </div>
              </div>
            )}

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
              disabled={isProcessing}
              className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
            >
              <Camera className="h-8 w-8" />
            </Button>

            {/* Close Camera Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={closeCamera}
              disabled={isProcessing}
              className="h-12 w-12"
            >
              <AlertCircle className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
