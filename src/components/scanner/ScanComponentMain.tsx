"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/use-auth";
import { useMedicines } from "@/hooks/useMedicines";
import { useKyselyDB } from "@/lib/powersync/PowersyncProvider";
import CameraInterface from "@/components/scanner/CameraInterface";
import MatchList from "@/components/scanner/MatchList";
import EnhancedMedicineCard from "@/components/scanner/EnhancedMedicineCard";
import RecentScans from "@/components/scanner/RecentScans";
import ScanningTips from "@/components/scanner/ScanningTips";
import EnhancedProcessingState from "@/components/scanner/EnhancedProcessingState";
import MedicineCardSkeleton from "@/components/scanner/MedicineCardSkeleton";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Loader2,
  RotateCcw,
  Search,
  ChevronRight,
  WifiOff,
  Wifi,
} from "lucide-react";
import { ocrProcessor } from "@/services/ocr-processor.service";
import { medicineMatchService } from "@/services/medicine-match.service";
import { stockCheckerService } from "@/services/stock-checker.service";
import { recentScansService } from "@/services/recent-scans.service";
import useSales from "@/hooks/useSales";
import {
  CameraError,
  MedicineMatch,
  PharmacyMedicineWithDetails,
  ScanWorkflowState,
  StockInfo,
  SupplierInfo,
  SalesStatistics,
  RecentScan,
} from "@/types/scanner-types";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { BillingMain } from "../main-components/pos/billing/BillingMain";

export default function ScanComponentMain({ currentPharmacy }: any) {
  const router = useRouter();

  const {
    medicines,
    loading: medicinesLoading,
    fetchBatchesForMedicine,
  } = useMedicines(currentPharmacy?.id);

  const { fetchSalesForMedicine } = useSales(currentPharmacy?.id || "");

  const { currentUser, loading } = useAuth();

  const [billOpen, setBillOpen] = useState(false);
  // Workflow state
  const [workflowState, setWorkflowState] = useState<ScanWorkflowState>("camera_ready");
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [cameraKey, setCameraKey] = useState<number>(0); // Key to force camera remount
  const [currentProcessingStep, setCurrentProcessingStep] = useState<
    "ocr" | "matching" | "loading_stock" | "loading_sales"
  >("ocr");

  // Scan results
  const [ocrText, setOcrText] = useState<string>("");
  const [matches, setMatches] = useState<MedicineMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MedicineMatch | null>(
    null
  );
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);

  // New state for enhanced features
  const [salesStats, setSalesStats] = useState<SalesStatistics | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  // Loading states
  const [loadingSales, setLoadingSales] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Network state
  const [isOnline, setIsOnline] = useState(true);

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

    // Setup online/offline listeners
    const handleOnline = () => {
      console.log("Connection restored");
      setIsOnline(true);
      toast.success("Connection restored");
      
      // Auto-retry initialization if it failed due to offline
      if (workflowState === "error" && !ocrProcessor.isReady()) {
        initOCR();
      }
    };

    const handleOffline = () => {
      console.log("Connection lost");
      setIsOnline(false);
      toast.error("You are offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial online status
    setIsOnline(navigator.onLine);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      ocrProcessor.terminate();
      recentScansService.clearScans();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load recent scans from service
  useEffect(() => {
    setRecentScans(recentScansService.getScans());
  }, [selectedMatch]);

  /**
   * Handle image capture from camera
   */
  const handleCapture = async (imageData: string) => {
    setWorkflowState("processing");
    setCurrentProcessingStep("ocr");
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
      setCurrentProcessingStep("matching");
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
    setSalesStats(null);

    try {
      // Step 1: Load stock information
      setCurrentProcessingStep("loading_stock");
      setProgressMessage("Loading stock information...");
      console.log("Selected match:", match);

      const batches = await fetchBatchesForMedicine(
        match.medicine.id,
        currentPharmacy?.id
      );

      const stock = await stockCheckerService.getStockInfo(
        batches || [],
        match.medicine.stock_quantity,
        match.medicine.reorder_level
      );

      setStockInfo(stock);

      // Step 3: Load sales statistics for this month
      setCurrentProcessingStep("loading_sales");
      setProgressMessage("Loading sales statistics...");
      setLoadingSales(true);

      try {
        // mark Get Sales data for this particular medicine
        const {
          averageDailySales,
          estimatedDaysUntilStockOut,
          unitsSold,
          salesData,
        } = await fetchSalesForMedicine(
          match.medicine.name,
          currentPharmacy,
          stock
        );

        setSalesStats({
          unitsSoldLast30Days: unitsSold,
          averageDailySales: Math.round(averageDailySales * 100) / 100,
          estimatedDaysUntilStockOut,
          lastSaleDate: salesData?.last_sale_date
            ? new Date(salesData.last_sale_date)
            : null,
        });
      } catch (err) {
        console.error("Error loading sales stats:", err);
      } finally {
        setLoadingSales(false);
      }

      // Step 4: Add to recent scans
      recentScansService.addScan(match.medicine, stock);
      setRecentScans(recentScansService.getScans());

      setWorkflowState("results");
      setProgressMessage("");
      toast.success("Medicine details loaded");
    } catch (err) {
      console.error("Error loading medicine info:", err);
      toast.error("Failed to load medicine information");
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
    setSalesStats(null);
    setError(null);
    setWorkflowState("camera_ready");
    setProgressMessage("");
    // Increment key to force camera remount and restart
    setCameraKey((prev) => prev + 1);
  };

  /**
   * Handle selecting a recent scan
   */
  const handleSelectRecentScan = async (scan: RecentScan) => {
    const match: MedicineMatch = {
      medicine: scan.medicine,
      confidence: 1.0,
      matchedText: scan.medicine.name,
      matchType: "exact",
    };
    await handleSelectMedicine(match);
  };

  /**
   * Handle cancel during processing
   */
  const handleCancelProcessing = () => {
    handleScanAnother();
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

  /**
   * // Add medicine to cart
   */
  const handleAddToCart = () => {
    if (selectedMatch) {
      setBillOpen(true);
      toast.success("Navigating to billing...");
    }
  };

  /**
   * View batches page
   */
  const handleViewBatches = () => {
    if (selectedMatch) {
      router.push(
        `/inventory/med-list/${selectedMatch.medicine.id}/batches`
      );
    }
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

  return (
    <div className="p-6 bg-white  max-w-4xl mx-auto max-[500px]:p-3">
      {/* Header */}
      <div className="mb-6 ">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medicine Scanner</h1>
            <p className="text-gray-600">
              Scan medicine packaging to quickly check stock availability
            </p>
          </div>
          {/* Network Status Indicator */}
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <Wifi className="h-4 w-4" />
                <span>Online</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Scanning Tips */}
      <ScanningTips isVisible={workflowState === "camera_ready"} />
      {/* Main Content */}
      <div className="">
        {/* Camera Interface */}
        {(workflowState === "idle" ||
          workflowState === "camera_initializing" ||
          workflowState === "camera_ready" ||
          workflowState === "processing" ||
          workflowState === "matching") && (
          <>
            <CameraInterface
              key={cameraKey}
              onCapture={handleCapture}
              onError={handleCameraError}
              isProcessing={workflowState === "processing" || workflowState === "matching"}
            />

            {/* Processing Overlay */}
            {(workflowState === "processing" || workflowState === "matching") && (
              <div className="mt-4">
                <EnhancedProcessingState
                  currentStep={currentProcessingStep}
                  message={progressMessage}
                  onCancel={handleCancelProcessing}
                />
              </div>
            )}

            {/* Recent Scans */}
            {recentScans.length > 0 && workflowState === "camera_ready" && (
              <div className="mt-6">
                <RecentScans
                  scans={recentScans}
                  onSelectScan={handleSelectRecentScan}
                />
              </div>
            )}
          </>
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

            {/* mark Selected Medicine Card */}
            {selectedMatch && (
              <div>
                {loadingSales ? (
                  <MedicineCardSkeleton />
                ) : (
                  <EnhancedMedicineCard
                    match={selectedMatch}
                    stockInfo={stockInfo}
                    salesStats={salesStats}
                    onViewDetails={handleViewDetails}
                    onAddToCart={handleAddToCart}
                    onViewBatches={handleViewBatches}
                  />
                )}
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
      {/* mark open bill if click on add to carrt button */}
      <Dialog open={billOpen} onOpenChange={setBillOpen}>
        <DialogContent className="min-w-[99vw] min-h-[93vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Quick Bill</DialogTitle>
          </DialogHeader>
          {currentPharmacy?.id && currentUser?.id && (
            <BillingMain
              pharmacyId={currentPharmacy.id}
              userId={currentUser.id}
              preSelectedMedicine={selectedMatch?.medicine} // Pass the medicine here
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
