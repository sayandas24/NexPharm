"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CheckoutSummaryProps {
  subtotal: number;
  taxAmount: number;
  netAmount: number;
  onDiscountChange: (discount: number) => void;
  onCheckout: (paymentMethod: "cash" | "card" | "upi" | "wallet") => void;
  disabled: boolean;
}

export function CheckoutSummary({
  subtotal,
  taxAmount,
  netAmount,
  onDiscountChange,
  onCheckout,
  disabled,
}: CheckoutSummaryProps) {
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "upi" | "wallet"
  >("cash");

  const handleDiscountChange = (value: string) => {
    const discountValue = parseFloat(value) || 0;
    setDiscount(discountValue);
    onDiscountChange(discountValue);
  };

  const handleCheckout = () => {
    onCheckout(paymentMethod);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-xs sm:text-sm">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-between text-xs sm:text-sm">
        <span className="text-muted-foreground">Tax (GST):</span>
        <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
      </div>

      <div className="border-t pt-2">
        <Label htmlFor="discount" className="text-xs sm:text-sm mb-1">
          Discount
        </Label>
        <Input
          id="discount"
          type="number"
          min="0"
          step="0.01"
          value={discount}
          onChange={(e) => handleDiscountChange(e.target.value)}
          placeholder="0.00"
          className="h-8 text-sm"
        />
      </div>

      <div className="border-t pt-2">
        <div className="flex justify-between items-center">
          <span className="text-sm sm:text-base font-semibold">Net Amount:</span>
          <span className="text-lg sm:text-xl font-bold text-purple-600">
            ₹{netAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="border-t pt-2">
        <Label htmlFor="payment-method" className="text-xs sm:text-sm mb-1">
          Payment Method
        </Label>
        <Select
          value={paymentMethod}
          onValueChange={(value: any) => setPaymentMethod(value)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="wallet">Wallet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleCheckout}
        disabled={disabled}
        className="w-full mt-2 bg-purple-600 hover:bg-purple-700 h-9 text-sm font-semibold"
      >
        Complete Sale
      </Button>
    </div>
  );
}
