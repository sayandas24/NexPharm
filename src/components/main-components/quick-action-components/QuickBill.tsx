import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BillingMain } from "../pos/billing/BillingMain";
import useAuth from "@/hooks/use-auth";
export default function QuickBill() {
  const { currentPharmacy, currentUser, loading } = useAuth();
  const [billOpen, setBillOpen] = useState(false);

  const handleBillOpen = () => {
    setBillOpen(true);
  };

  const handleScanClose = () => {
    setBillOpen(false);
  };

  return (
    <div>
      <button
        onClick={handleBillOpen}
        className="group w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-green-300 to-green-600 p-4 md:p-6 text-left shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100"
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
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
              />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-base md:text-lg mb-0.5 md:mb-1">Create Bill</h3>
          <p className="text-green-100 text-xs md:text-sm">New sale transaction</p>
        </div>
      </button>

      <Dialog open={billOpen} onOpenChange={setBillOpen}>
        <DialogContent className="min-w-[93vw] min-h-[93vh] max-h-[93vh] max-[500px]:min-h-[83vh] max-[500px]:max-h-[83vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Quick Bill</DialogTitle>
          </DialogHeader>

          {currentPharmacy?.id && currentUser?.id && (
            <BillingMain
              pharmacyId={currentPharmacy.id}
              userId={currentUser.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
