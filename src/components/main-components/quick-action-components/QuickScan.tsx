import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ScanComponentMain from "@/components/scanner/ScanComponentMain";
import useAuth from "@/hooks/use-auth";
export default function QuickScan() {
  const { currentPharmacy } = useAuth();

  const [scanOpen, setScanOpen] = useState(false);

  const handleScanOpen = () => {
    setScanOpen(true);
  };

  return (
    <div>
      <button
        onClick={handleScanOpen}
        className="group w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-300 to-blue-600 p-4 md:p-6 text-left shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform duration-300 group-hover:scale-150"></div>
        <div className="relative">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center mb-2 md:mb-3 backdrop-blur-sm">
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-base md:text-lg mb-0.5 md:mb-1">
            Scan Medicine
          </h3>
          <p className="text-blue-100 text-xs md:text-sm">Check stock instantly</p>
        </div>
      </button>

      {/* Scanner Dialog */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="min-w-[73vw] min-h-[83vh] max-h-[95vh]  overflow-y-auto p-0  max-[900px]:min-w-[92vw] max-[500px]:max-h-[94vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Medicine Scanner</DialogTitle>
          </DialogHeader>
          <ScanComponentMain currentPharmacy={currentPharmacy} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
