"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Camera,
  SwitchCamera,
  AlertCircle,
  Loader2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>(
    []
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const startCamera = async (deviceId?: string) => {
    setError("");

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Use oncanplay instead of onloadedmetadata for faster ready state
        videoRef.current.oncanplay = () => {
          videoRef.current
            ?.play()
            .then(() => {
              setIsReady(true);
            })
            .catch((err) => {
              console.error("Play error:", err);
              setError(`Play error: ${err.message}`);
            });
        };
      }

      return stream;
    } catch (err: any) {
      console.error("Camera error:", err);
      setError(`Error: ${err.name} - ${err.message}`);
      onError(err);
      throw err;
    }
  };

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

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Enumerated devices:", devices);
      const videoDevices = devices.filter((d) => d.kind === "videoinput" && d.deviceId);
      console.log("Video devices:", videoDevices);
      return videoDevices;
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
      return [];
    }
  };

  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        // Get saved device from sessionStorage
        const savedDeviceId = sessionStorage.getItem("selectedCameraDevice");
        console.log("Saved device ID:", savedDeviceId);

        // Start camera FIRST to get permissions
        try {
          const stream = await startCamera(savedDeviceId || undefined);
          
          if (!mounted) return;

          // NOW enumerate devices (after permissions granted)
          const videoDevices = await enumerateDevices();
          
          if (!mounted) return;

          setAvailableDevices(videoDevices);

          // Validate saved device exists
          if (savedDeviceId && videoDevices.length > 0) {
            const deviceExists = videoDevices.some(
              (d) => d.deviceId === savedDeviceId
            );
            
            if (!deviceExists) {
              sessionStorage.removeItem("selectedCameraDevice");
              console.log("Saved camera device no longer available");
            }
          }

          // Update selectedDeviceId based on actual stream
          if (stream) {
            const tracks = stream.getVideoTracks();
            if (tracks.length > 0) {
              const settings = tracks[0].getSettings();
              console.log("Camera settings:", settings);
              if (settings.deviceId) {
                setSelectedDeviceId(settings.deviceId);
                sessionStorage.setItem("selectedCameraDevice", settings.deviceId);
              }
            }
          }
        } catch (err) {
          console.error("Failed to start camera:", err);
          
          // Try fallback without device ID
          if (savedDeviceId && mounted) {
            try {
              const stream = await startCamera();
              
              if (!mounted) return;

              // Enumerate after fallback
              const videoDevices = await enumerateDevices();
              setAvailableDevices(videoDevices);

              if (stream) {
                const tracks = stream.getVideoTracks();
                if (tracks.length > 0) {
                  const settings = tracks[0].getSettings();
                  if (settings.deviceId) {
                    setSelectedDeviceId(settings.deviceId);
                    sessionStorage.setItem("selectedCameraDevice", settings.deviceId);
                  }
                }
              }
            } catch (fallbackErr) {
              console.error("Fallback camera start also failed:", fallbackErr);
            }
          }
        }
      } catch (err) {
        console.error("Failed to initialize camera:", err);
      }
    };

    initCamera();

    // Listen for device changes
    const handleDeviceChange = async () => {
      if (!mounted) return;
      
      const videoDevices = await enumerateDevices();
      setAvailableDevices(videoDevices);
      
      // Check if current device is still available
      if (selectedDeviceId) {
        const currentDeviceExists = videoDevices.some(
          (d) => d.deviceId === selectedDeviceId
        );
        
        if (!currentDeviceExists) {
          console.log("Current camera disconnected, switching to default");
          sessionStorage.removeItem("selectedCameraDevice");
          stopCamera();
          await startCamera();
          
          // Re-enumerate after starting new camera
          const newDevices = await enumerateDevices();
          setAvailableDevices(newDevices);
        }
      }
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      mounted = false;
      stopCamera();
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) return;

    const imageData = captureImageFromVideo(videoRef.current);
    if (imageData) {
      stopCamera();
      onCapture(imageData);
    } else {
      setError("Failed to capture image");
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    sessionStorage.setItem("selectedCameraDevice", deviceId);
    stopCamera();

    try {
      await startCamera(deviceId);
      
      // Re-enumerate to ensure we have fresh device info
      const videoDevices = await enumerateDevices();
      setAvailableDevices(videoDevices);
    } catch (err) {
      console.error("Failed to switch camera:", err);
      setError("Failed to switch camera");

      // Fallback to first available device
      if (availableDevices.length > 0) {
        const fallback = availableDevices[0];
        setSelectedDeviceId(fallback.deviceId);
        sessionStorage.setItem("selectedCameraDevice", fallback.deviceId);
        try {
          await startCamera(fallback.deviceId);
        } catch (fallbackErr) {
          console.error("Fallback camera also failed:", fallbackErr);
        }
      }
    }
  };

  const switchCamera = async () => {
    stopCamera();
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);

    await new Promise((resolve) => setTimeout(resolve, 100));
    await startCamera();
    
    // Re-enumerate after switching
    const videoDevices = await enumerateDevices();
    setAvailableDevices(videoDevices);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[400px]">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
        <p className="text-gray-600 text-center mb-4 max-w-md">{error}</p>
        <Button onClick={() => startCamera()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
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

        {isReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white/50 rounded-lg w-4/5 h-3/4">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-1 rounded-full text-xs whitespace-nowrap">
                Position medicine packaging within frame
              </div>
            </div>
          </div>
        )} 

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center text-white flex-col">
            <Loader2 className="h-12 w-12 animate-spin mb-2" />
            <p>Starting camera...</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 mt-4">
        {availableDevices.length > 1 && (
          <div className="w-full max-w-xs">
            <Select
              value={selectedDeviceId}
              onValueChange={handleDeviceChange}
              disabled={isProcessing || !isReady}
            >
              <SelectTrigger className="w-full">
                <Video className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {availableDevices.map((device, index) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={switchCamera}
            disabled={isProcessing || !isReady}
            className="h-12 w-12"
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            onClick={handleCapture}
            disabled={isProcessing || !isReady}
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
          >
            <Camera className="h-8 w-8" />
          </Button>

          <div className="h-12 w-12" />
        </div>
      </div>
    </div>
  );
}