"use client";

import React, { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Camera, SwitchCamera, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraError, CameraErrorType } from "@/types/scanner-types";
import { captureImageFromVideo } from "@/utils/image-processing.utils";

interface CameraInterfaceProps {
  onCapture: (imageData: string) => void;
  onError: (error: CameraError) => void;
  isProcessing: boolean;
}

export interface CameraInterfaceRef {
  openCamera: () => void;
  closeCamera: () => void;
  isOpen: boolean;
}

const CameraInterface = forwardRef<CameraInterfaceRef, CameraInterfaceProps>(
  ({ onCapture, onError, isProcessing }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string>("");
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

    const openCamera = async () => {
      setError("");

      try {
        // Simple camera request
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        console.log("Stream obtained:", stream.id);

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;

          console.log("Stream set to video element");

          // Force play
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
              })
              .catch((err) => {
                console.error("Play error:", err);
                setError(`Play error: ${err.message}`);
              });
          };
        }
      } catch (err: any) {
        console.error("Camera error:", err);
        const errorMessage = `Error: ${err.name} - ${err.message}`;
        setError(errorMessage);
        
        onError({
          type: CameraErrorType.UNKNOWN_ERROR,
          message: err.message,
          userMessage: errorMessage,
          action: "retry",
        });
      }
    };

    const closeCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        setIsOpen(false);
      }
    };

    const switchCamera = () => {
      closeCamera();
      setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
      setTimeout(() => {
        openCamera();
      }, 100);
    };

    const handleCapture = () => {
      if (!videoRef.current) {
        return;
      }

      const imageData = captureImageFromVideo(videoRef.current);

      if (imageData) {
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

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      openCamera,
      closeCamera,
      isOpen,
    }));

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        closeCamera();
      };
    }, []);

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

              {/* Camera not active overlay */}
              {!isOpen && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <p>Camera not active</p>
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
);

CameraInterface.displayName = "CameraInterface";

export default CameraInterface;
