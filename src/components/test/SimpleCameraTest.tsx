"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function SimpleCameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const [streamInfo, setStreamInfo] = useState<string>("");

  const openCamera = async () => {
    setError("");
    setStreamInfo("Requesting camera...");

    try {
      // Simple camera request
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStreamInfo(`Stream obtained: ${stream.id}`);
      console.log("Stream obtained:", stream);
      console.log("Video tracks:", stream.getVideoTracks());

      if (videoRef.current) {
        const video = videoRef.current;

        // Set srcObject directly
        video.srcObject = stream;

        setStreamInfo(`Stream set to video element`);
        console.log("Stream set to video element");

        // Force play
        video.onloadedmetadata = () => {
          console.log("Metadata loaded:", {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
          });
          setStreamInfo(
            `Metadata loaded: ${video.videoWidth}x${video.videoHeight}`
          );

          video
            .play()
            .then(() => {
              console.log("Video playing");
              setStreamInfo(
                `Video playing: ${video.videoWidth}x${video.videoHeight}`
              );
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
      setError(`Error: ${err.name} - ${err.message}`);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsOpen(false);
      setStreamInfo("");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple Camera Test</h1>

      <div className="mb-4 space-x-2">
        <Button onClick={openCamera} disabled={isOpen}>
          Open Camera
        </Button>
        <Button onClick={closeCamera} disabled={!isOpen} variant="outline">
          Close Camera
        </Button>
      </div>

      {streamInfo && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-900 rounded">
          {streamInfo}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-900 rounded">{error}</div>
      )}

      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isOpen && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p>Camera not active</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>
          Browser:{" "}
          {typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}
        </p>
        <p>
          Secure Context:{" "}
          {typeof window !== "undefined" && window.isSecureContext
            ? "Yes"
            : "No"}
        </p>
        <p>
          Protocol:{" "}
          {typeof window !== "undefined" ? window.location.protocol : "N/A"}
        </p>
      </div>
    </div>
  );
}
