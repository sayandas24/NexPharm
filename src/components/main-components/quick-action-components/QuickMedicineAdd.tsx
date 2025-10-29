import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BillingMain } from "../pos/billing/BillingMain";
import useAuth from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddMedicineForm } from "../inventory/medicine-lists/AddMedicineForm";

export default function QuickMedicineAdd() {
  const { currentPharmacy, currentUser, loading } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMedicineAdded = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div>
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetTrigger asChild>
          <button className="group w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-300 to-purple-600 p-6 text-left shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform duration-300 group-hover:scale-150"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">
                Add Medicine
              </h3>
              <p className="text-purple-100 text-sm">Add to inventory</p>
            </div>
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Add New Medicine</SheetTitle>
            <SheetDescription>
              Fill in the details to add a new medicine to your inventory
            </SheetDescription>
          </SheetHeader>
          <AddMedicineForm
            onSuccess={handleMedicineAdded}
            pharmacy={currentPharmacy}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
