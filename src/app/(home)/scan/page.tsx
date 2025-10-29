"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/use-auth";
import { useMedicines } from "@/hooks/useMedicines";
import CameraInterface from "@/components/scanner/CameraInterface";
import MatchList from "@/components/scanner/MatchList";
import MedicineCard from "@/components/scanner/MedicineCard";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Loader2,
  RotateCcw,
  Search,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { ocrProcessor } from "@/services/ocr-processor.service";
import { medicineMatchService } from "@/services/medicine-match.service";
import { stockCheckerService } from "@/services/stock-checker.service";
import {
  CameraError,
  MedicineMatch,
  PharmacyMedicineWithDetails,
  ScanWorkflowState,
  StockInfo,
} from "@/types/scanner-types";
import toast from "react-hot-toast";

export default function ScanMedicineToCheckStock() {
  const router = useRouter();
  const { currentPharmacy } = useAuth();
  const {
    medicines,
    loading: medicinesLoading,
    fetchBatchesForMedicine,
  } = useMedicines(currentPharmacy?.id);

  // Workflow state
  const [workflowState, setWorkflowState] = useState<ScanWorkflowState>("idle");
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [cameraKey, setCameraKey] = useState<number>(0); // Key to force camera remount

  // Scan results
  const [ocrText, setOcrText] = useState<string>("");
  const [matches, setMatches] = useState<MedicineMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MedicineMatch | null>(
    null
  );
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Initialize OCR worker on mount
  useEffect(() => {
    const initOCR = async () => {
      try {
        setProgressMessage("Initializing scanner...");
        await ocrProcessor.initialize();
        setWorkflowState("camera_ready");
        setProgressMessage("");
      } catch (err) {
        console.error("Failed to initialize OCR:", err);
        setError("Failed to initialize scanner. Please refresh the page.");
        setWorkflowState("error");
      }
    };

    initOCR();

    // Cleanup on unmount
    return () => {
      ocrProcessor.terminate();
    };
  }, []);

  /**
   * Handle image capture from camera
   */
  const handleCapture = async (imageData: string) => {
    setWorkflowState("processing");
    setProgressMessage("Analyzing image...");
    setError(null);

    try {
      // Step 1: OCR Processing
      setProgressMessage("Reading text from image...");
      const ocrResult = await ocrProcessor.processImage(imageData);
      setOcrText(ocrResult.text);

      console.log("OCR Result:", ocrResult.text);

      // Step 2: Find matches
      setWorkflowState("matching");
      setProgressMessage("Searching for medicines...");

      const foundMatches = await medicineMatchService.findMatches(
        ocrResult.text,
        medicines as PharmacyMedicineWithDetails[]
      );

      setMatches(foundMatches);

      // Step 3: Handle results
      if (foundMatches.length === 0) {
        setWorkflowState("results");
        setError(
          "No matching medicines found. Try scanning again with better lighting or search manually."
        );
        toast.error("No medicines found");
      } else if (foundMatches.length === 1) {
        // Auto-select if only one match
        await handleSelectMedicine(foundMatches[0]);
      } else {
        setWorkflowState("results");
        setProgressMessage("");
        toast.success(`Found ${foundMatches.length} possible matches`);
      }
    } catch (err) {
      console.error("Scan error:", err);
      setWorkflowState("error");

      const error = err as Error;
      if (error.message === "no_text_detected") {
        setError(
          "No text detected in the image. Please ensure the medicine packaging is clearly visible and try again."
        );
        toast.error("No text detected");
      } else {
        setError(
          "Failed to process the image. Please try again with better lighting and a clearer view."
        );
        toast.error("Processing failed");
      }
    }
  };

  /**
   * Handle medicine selection
   */
  const handleSelectMedicine = async (match: MedicineMatch) => {
    setSelectedMatch(match);
    setProgressMessage("Loading stock information...");
    console.log("Selected match:", match);
    try {
      // Fetch batches for the medicine
      const batches = await fetchBatchesForMedicine(
        match.medicine.id,
        currentPharmacy?.id
      );

      // Get stock info
      const stock = await stockCheckerService.getStockInfo(
        batches || [],
        match.medicine.stock_quantity,
        match.medicine.reorder_level
      );

      setStockInfo(stock);
      setWorkflowState("results");
      setProgressMessage("");
      toast.success("Medicine details loaded");
    } catch (err) {
      console.error("Error loading stock info:", err);
      toast.error("Failed to load stock information");
      setWorkflowState("results");
      setProgressMessage("");
    }
  };

  /**
   * Handle camera error
   */
  const handleCameraError = (cameraError: CameraError) => {
    setError(cameraError.userMessage);
    setWorkflowState("error");
  };

  /**
   * Reset scan and start over
   */
  const handleScanAnother = () => {
    setOcrText("");
    setMatches([]);
    setSelectedMatch(null);
    setStockInfo(null);
    setError(null);
    setWorkflowState("camera_ready");
    setProgressMessage("");
    // Increment key to force camera remount and restart
    setCameraKey((prev) => prev + 1);
  };

  /**
   * Navigate to medicine details page
   */
  const handleViewDetails = () => {
    if (selectedMatch) {
      router.push(`/inventory/med-list/${selectedMatch.medicine.id}`);
    }
  };

  /**
   * Navigate to manual search
   */
  const handleManualSearch = () => {
    router.push("/inventory/med-list");
  };

  // Guard: No pharmacy selected
  if (!currentPharmacy) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No pharmacy selected</p>
        </div>
      </div>
    );
  }

  // Guard: Loading medicines
  if (medicinesLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600">Loading medicines...</p>
        </div>
      </div>
    );
  }

  console.log("Workflow state:", workflowState);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="font-semibold text-gray-700">Scanner</span>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span>Scan Medicine to Check Stock</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Medicine Scanner</h1>
        <p className="text-gray-600">
          Scan medicine packaging to quickly check stock availability
        </p>
      </div>

      {/* Scanning Tips */}
      {workflowState === "camera_ready" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Tips for best results:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Ensure good lighting</li>
                <li>Hold camera steady and focus on medicine name</li>
                <li>Position packaging within the frame</li>
                <li>Avoid shadows and reflections</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Camera Interface */}
        {(workflowState === "idle" ||
          workflowState === "camera_initializing" ||
          workflowState === "camera_ready") && (
          <CameraInterface
            key={cameraKey}
            onCapture={handleCapture}
            onError={handleCameraError}
            isProcessing={false}
          />
        )}

        {/* Processing State */}
        {(workflowState === "processing" || workflowState === "matching") && (
          <div className="bg-white rounded-lg p-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">{progressMessage}</h3>
            <p className="text-gray-500">Please wait...</p>
          </div>
        )}

        {/* Results State */}
        {workflowState === "results" && (
          <div className="space-y-6">
            {/* Error Message */}
            {error && !selectedMatch && (
              <div className="bg-white rounded-lg p-6 border-2 border-orange-200">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      No Matches Found
                    </h3>
                    <p className="text-gray-600 text-sm">{error}</p>
                    {ocrText && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <p className="text-gray-500 mb-1">Detected text:</p>
                        <p className="text-gray-700 font-mono">
                          {ocrText.substring(0, 200)}
                          {ocrText.length > 200 ? "..." : ""}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleScanAnother} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={handleManualSearch} variant="default">
                    <Search className="h-4 w-4 mr-2" />
                    Manual Search
                  </Button>
                </div>
              </div>
            )}

            {/* Match List (multiple matches) */}
            {!selectedMatch && matches.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <MatchList
                  matches={matches}
                  onSelectMedicine={handleSelectMedicine}
                />
              </div>
            )}

            {/* Selected Medicine Card */}
            {selectedMatch && (
              <div>
                <MedicineCard
                  match={selectedMatch}
                  stockInfo={stockInfo}
                  onViewDetails={handleViewDetails}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleScanAnother}
                variant="outline"
                size="lg"
                className="min-w-[200px]"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Scan Another
              </Button>
              {!selectedMatch && matches.length === 0 && (
                <Button
                  onClick={handleManualSearch}
                  variant="default"
                  size="lg"
                  className="min-w-[200px]"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Manual Search
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {workflowState === "error" && (
          <div className="bg-white rounded-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleScanAnother} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={handleManualSearch} variant="default">
                <Search className="h-4 w-4 mr-2" />
                Manual Search
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
