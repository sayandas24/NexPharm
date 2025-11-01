"use client";

import { useEffect, useState } from "react";
import { usePOS, CustomerData } from "@/hooks/usePOS";
import { CustomerForm } from "./CustomerForm";
import { MedicineSearch } from "./MedicineSearch";
import { BatchSelector } from "./BatchSelector";
import { CartTable } from "./CartTable";
import { CheckoutSummary } from "./CheckoutSummary";
import toast from "react-hot-toast";
import { useMedicines } from "@/hooks/useMedicines";
import { useRouter } from "next/navigation";

interface BillingMainProps {
  pharmacyId: string;
  userId: string;
  preSelectedMedicine?: any;
}

export function BillingMain({
  pharmacyId,
  userId,
  preSelectedMedicine,
}: BillingMainProps) {
  const { searchMedicinesByName, fetchBatchesForMedicine } =
    useMedicines(pharmacyId);

  const {
    searchCustomerByPhoneOrName,
    createCustomer,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    calculateSubtotal,
    calculateTaxAmount,
    calculateNetAmount,
    completeSale,
    loading,
  } = usePOS();

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

  const router = useRouter();

  const handleCustomerSelect = (customerData: CustomerData) => {
    setCustomer(customerData);
    toast.success(`${customerData.name} has been added to the bill`);
  };

  useEffect(() => {
    if (preSelectedMedicine) {
      handleMedicineSelect(preSelectedMedicine);
    }
  }, [preSelectedMedicine]);

  const handleMedicineSelect = (medicine: any) => {
    setSelectedMedicine(medicine);
  };

  const handleBatchSelect = (batch: any, quantity: number) => {
    addToCart(batch, selectedMedicine, quantity);
    setSelectedMedicine(null);
    toast.success(`${selectedMedicine.name} added to cart`);
  };

  const handleCheckout = async (
    paymentMethod: "cash" | "card" | "upi" | "wallet"
  ) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      const saleId = await completeSale(
        pharmacyId,
        userId,
        customer?.id || null,
        paymentMethod,
        discount
      );

      toast.success(
        `Sale completed successfully! Sale ID: ${saleId.substring(0, 8)}...`
      );

      setCustomer(null);
      setDiscount(0);
    } catch (error) {
      toast.error("Failed to complete sale. Please try again.");
    }
  };

  const subtotal = calculateSubtotal();
  const taxAmount = calculateTaxAmount();
  const netAmount = calculateNetAmount(discount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900">
            Point of Sale
          </h1>
          <p className="text-xs sm:text-sm text-purple-600 mt-1">
            Create and manage pharmacy sales
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Left Column - Customer & Medicine Search */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Current Customer Badge - Mobile First */}
            {customer && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-purple-600 font-medium">
                        Customer
                      </p>
                      <p className="text-sm sm:text-base text-purple-900 font-semibold truncate">
                        {customer.name}
                      </p>
                      {customer.phone && (
                        <p className="text-xs text-purple-600">
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setCustomer(null)}
                    className="text-purple-400 hover:text-purple-600 p-1 flex-shrink-0"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Customer Section */}
            <div className="bg-white rounded-lg shadow border border-purple-100 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-purple-900">
                  Customer
                </h3>
              </div>
              <CustomerForm
                onCustomerSelect={handleCustomerSelect}
                pharmacyId={pharmacyId}
                searchCustomerByPhoneOrName={searchCustomerByPhoneOrName as any}
                createCustomer={createCustomer}
              />
            </div>

            {/* Medicine Search Section */}
            <div className="bg-white rounded-lg shadow border border-purple-100 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-purple-900">
                  Search Medicine
                </h3>
              </div>
              <MedicineSearch
                pharmacyId={pharmacyId}
                onMedicineSelect={handleMedicineSelect}
                searchMedicinesByName={searchMedicinesByName as any}
              />
            </div>
          </div>

          {/* Right Column - Cart & Checkout */}
          <div className="space-y-3 sm:space-y-4">
            {/* Cart Section */}
            <div className="bg-white rounded-lg shadow border border-purple-100 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-purple-900">
                  Cart
                </h3>
                {cart.length > 0 && (
                  <span className="ml-auto bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {cart.length}
                  </span>
                )}
              </div>
              <CartTable
                items={cart}
                onUpdateQuantity={updateCartItemQuantity}
                onRemoveItem={removeFromCart}
              />
            </div>

            {/* Checkout Section */}
            <div className="bg-white rounded-lg shadow border border-purple-100 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-purple-900">
                  Checkout
                </h3>
              </div>
              <CheckoutSummary
                subtotal={subtotal}
                taxAmount={taxAmount}
                netAmount={netAmount}
                onDiscountChange={setDiscount}
                onCheckout={handleCheckout}
                disabled={cart.length === 0 || loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Batch Selector Modal */}
      <BatchSelector
        medicine={selectedMedicine}
        pharmacyId={pharmacyId}
        onBatchSelect={handleBatchSelect}
        onClose={() => setSelectedMedicine(null)}
        fetchBatchesForMedicine={fetchBatchesForMedicine as any}
      />
    </div>
  );
}
