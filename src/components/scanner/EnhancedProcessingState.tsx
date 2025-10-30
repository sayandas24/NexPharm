"use client";

import React, { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhancedProcessingStateProps {
  currentStep: "ocr" | "matching" | "loading_stock" | "loading_supplier" | "loading_sales";
  message: string;
  onCancel: () => void;
}

export default function EnhancedProcessingState({
  currentStep,
  message,
  onCancel,
}: EnhancedProcessingStateProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showEstimate, setShowEstimate] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (elapsedTime > 3) {
      setShowEstimate(true);
    }
  }, [elapsedTime]);

  const getStepNumber = (): number => {
    switch (currentStep) {
      case "ocr":
        return 1;
      case "matching":
        return 2;
      case "loading_stock":
        return 3;
      case "loading_supplier":
        return 4;
      case "loading_sales":
        return 5;
      default:
        return 1;
    }
  };

  const getTotalSteps = (): number => {
    return 5;
  };

  const getStepLabel = (): string => {
    switch (currentStep) {
      case "ocr":
        return "Reading text from image";
      case "matching":
        return "Searching for medicines";
      case "loading_stock":
        return "Loading stock information";
      case "loading_supplier":
        return "Loading supplier details";
      case "loading_sales":
        return "Loading sales statistics";
      default:
        return "Processing";
    }
  };

  return (
    <div className="bg-white rounded-lg p-12 text-center shadow-lg border-2 border-gray-200">
      <Loader2 className="h-16 w-16 animate-spin mx-auto text-red-500 mb-6" />
      
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          {Array.from({ length: getTotalSteps() }).map((_, index) => (
            <div
              key={index}
              className={`h-2 w-12 rounded-full transition-colors ${
                index < getStepNumber()
                  ? "bg-red-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Step {getStepNumber()} of {getTotalSteps()}
        </p>
      </div>

      <h3 className="text-xl font-semibold mb-2 text-gray-900">
        {getStepLabel()}
      </h3>
      <p className="text-gray-600 mb-6">{message}</p>

      {showEstimate && (
        <p className="text-sm text-gray-500 mb-4">
          This is taking longer than expected... ({elapsedTime}s)
        </p>
      )}

      <Button onClick={onCancel} variant="outline" size="lg">
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>
    </div>
  );
}
