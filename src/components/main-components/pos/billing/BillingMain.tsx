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
  preSelectedMedicine?: any; // Add this optional prop
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

      // Reset form
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
    <div className="container mx-auto p-6"> 

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <CustomerForm
            onCustomerSelect={handleCustomerSelect}
            pharmacyId={pharmacyId}
            searchCustomerByPhoneOrName={searchCustomerByPhoneOrName as any}
            createCustomer={createCustomer}
          />

          <MedicineSearch
            pharmacyId={pharmacyId}
            onMedicineSelect={handleMedicineSelect}
            searchMedicinesByName={searchMedicinesByName as any}
          />

          {customer && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800">Current Customer</h4>
              <p className="text-sm text-green-700">{customer.name}</p>
              {customer.phone && (
                <p className="text-sm text-green-600">{customer.phone}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <CartTable
            items={cart}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCart}
          />

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
