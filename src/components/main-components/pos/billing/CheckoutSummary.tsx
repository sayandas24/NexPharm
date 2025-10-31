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
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Checkout Summary</h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (GST):</span>
          <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
        </div>

        <div className="border-t pt-3">
          <Label htmlFor="discount" className="text-sm">
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
            className="mt-1"
          />
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Net Amount:</span>
            <span className="text-2xl font-bold text-primary">
              ₹{netAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="border-t pt-3">
          <Label htmlFor="payment-method" className="text-sm">
            Payment Method
          </Label>
          <Select
            value={paymentMethod}
            onValueChange={(value: any) => setPaymentMethod(value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select payment method" />
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
          className="w-full mt-4 bg-purple-800 hover:bg-purple-900"
          size="lg"
        >
          Complete Sale
        </Button>
      </div>
    </Card>
  );
}
