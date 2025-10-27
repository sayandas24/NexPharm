"use client";

import React from "react";
import { BillingMain } from "@/components/main-components/pos/BillingMain";
import useAuth from "@/hooks/use-auth";

export default function BillingPage() {
  const { currentPharmacy, currentUser, loading } = useAuth();

  if (!currentPharmacy || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">
          Please select a pharmacy to continue
        </p>
      </div>
    );
  }

  return (
    <BillingMain pharmacyId={currentPharmacy.id} userId={currentUser.id} />
  );
}
