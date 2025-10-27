"use client";

import { CustomerProfileMain } from "@/components/main-components/pos/customers/CustomerProfileMain";
import useAuth from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function CustomerDetailPage() {
  const { currentPharmacy, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentPharmacy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No pharmacy selected</p>
        </div>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Invalid customer ID</p>
        </div>
      </div>
    );
  }

  return (
    <CustomerProfileMain
      customerId={customerId}
      pharmacyId={currentPharmacy.id}
    />
  );
}
