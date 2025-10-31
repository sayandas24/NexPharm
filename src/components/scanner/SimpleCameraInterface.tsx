"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, SwitchCamera, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureImageFromVideo } from "@/utils/image-processing.utils";

interface SimpleCameraInterfaceProps {
  onCapture: (imageData: string) => void;
  onError: (error: any) => void;
  isProcessing: boolean;
}

export default function SimpleCameraInterface({
  onCapture,
  onError,
  isProcessing,
}: SimpleCameraInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Start camera
  // const startCamera = async () => {
  //   setIsLoading(true);
  //   setError("");

  //   try {
  //     // Check if getUserMedia is supported
  //     // if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  //     //   throw new Error("Camera API not supported in this browser");
  //     // }

  //     // Stop existing stream if any
  //     // if (streamRef.current) {
  //     //   streamRef.current.getTracks().forEach((track) => track.stop());
  //     // }

  //     console.log("Requesting camera access...");

  //     // Request camera with fallback constraints
  //     let stream: MediaStream;
  //     try {
  //       stream = await navigator.mediaDevices.getUserMedia({
  //         video: {
  //           facingMode: facingMode,
  //           width: { ideal: 1280 },
  //           height: { ideal: 720 },
  //         },
  //         audio: false,
  //       });
  //     } catch (err) {
  //       // Fallback: try without facingMode if it fails
  //       console.log("Retrying without facingMode constraint...");
  //       stream = await navigator.mediaDevices.getUserMedia({
  //         video: {
  //           width: { ideal: 1280 },
  //           height: { ideal: 720 },
  //         },
  //         audio: false,
  //       });
  //     }

  //     streamRef.current = stream;

  //     // Set to video element
  //     if (videoRef.current) {
  //       const video = videoRef.current;
  //       video.srcObject = stream;

  //       // Force play
  //       video.onloadedmetadata = () => {
  //         console.log("Metadata loaded:", {
  //           videoWidth: video.videoWidth,
  //           videoHeight: video.videoHeight,
  //           readyState: video.readyState,
  //         });

  //         video
  //           .play()
  //           .then(() => {
  //             console.log("Video playing");
  //             setIsReady(true);
  //           })
  //           .catch((err) => {
  //             console.error("Play error:", err);
  //             setError(`Play error: ${err.message}`);
  //           });
  //       };

  //       setIsReady(true);
  //     }
  //   } catch (err: any) {
  //     console.error("Camera error:", err);

  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const startCamera = async () => {
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

      console.log("Stream obtained:", stream);
      console.log("Video tracks:", stream.getVideoTracks());

      if (videoRef.current) {
        const video = videoRef.current;

        // Set srcObject directly
        video.srcObject = stream;

        console.log("Stream set to video element");
        streamRef.current = stream;

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
              setIsReady(true);
            })
            .catch((err) => {
              console.error("Play error:", err);
              setError(`Play error: ${err.message}`);
            });
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError(`Error: ${err.name} - ${err.message}`);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  };

  // Initialize on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Capture image
  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) {
      return;
    }

    const imageData = captureImageFromVideo(videoRef.current);
    console.log("Image data:", imageData);
    if (imageData) {
      stopCamera();
      onCapture(imageData);
    } else {
      setError("Failed to capture image");
    }
  };

  // Switch camera
  const switchCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setTimeout(() => {
      console.log("Switching camera...", facingMode);
      startCamera();
    }, 300);
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
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[400px]">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
        <p className="text-gray-600 text-center mb-4 max-w-md">{error}</p>
        <Button onClick={startCamera} variant="outline">
          Try Again
        </Button>
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
          style={{
            transform: facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
          }}
        />

        {/* Overlay guide */}
        {isReady && (
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

        {/* Not ready overlay */}
        {!isReady && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p>Camera not ready</p>
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
          disabled={isProcessing || !isReady}
          className="h-12 w-12"
        >
          <SwitchCamera className="h-5 w-5" />
        </Button>

        {/* Capture Button */}
        <Button
          size="lg"
          onClick={handleCapture}
          disabled={isProcessing || !isReady}
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
