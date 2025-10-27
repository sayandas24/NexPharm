// hooks/usePOS.ts
"use client";

import { useKyselyDB, usePowerSync } from "@/lib/powersync/PowersyncProvider";
import {
  CustomerTable,
  MedicineBatchTable,
  MedicinesTable,
} from "@/types/database-types";
import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// Type for joined pharmacy medicine data
interface PharmacyMedicineWithDetails extends MedicinesTable {
  pharmacy_id: string;
  mrp: number;
  stock_quantity: number;
  price_range_min: number;
  price_range_max: number;
  reorder_level: number;
  storage_conditions: string | null;
  is_available: number;
}

// Cart item interface
export interface CartItem {
  id: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  gstAmount: number;
  totalPrice: number;
  availableQuantity: number;
}

// Customer data interface
export interface CustomerData {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
}

export function usePOS() {
  const db = useKyselyDB();
  const { isReady } = usePowerSync();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // ============ Customer Operations ============

  /**
   * Search for customer by phone number
   */
  const searchCustomerByPhoneOrName = useCallback(
    async ({
      name,
      phone,
      pharmacyId,
    }: {
      name?: string;
      phone?: string;
      pharmacyId: string;
    }): Promise<CustomerTable | undefined> => {
      if (!isReady || !pharmacyId) return undefined;

      // Need at least one search criterion
      if (!phone && !name) return undefined;

      try {
        setLoading(true);
        setError(null);

        let query = db
          .selectFrom("customers")
          .selectAll()
          .where("pharmacy_id", "=", pharmacyId);

        // Build conditional OR clauses only for provided fields
        if (phone || name) {
          query = query.where((eb) => {
            const conditions = [];
            if (phone)
              conditions.push(eb("customers.phone", "like", `%${phone}%`));
            if (name)
              conditions.push(eb("customers.name", "like", `%${name}%`));
            return eb.or(conditions);
          });
        }

        const customer = await query.execute();
        return customer as CustomerTable[] | any;
      } catch (err) {
        console.error("Error searching customer:", err);
        setError("Failed to search customer");
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [db, isReady]
  );

  /**
   * Create new customer
   */
  const createCustomer = useCallback(
    async (
      data: Omit<CustomerTable, "id" | "created_at" | "updated_at">
    ): Promise<string> => {
      if (!isReady) throw new Error("Database not ready");

      try {
        setLoading(true);
        setError(null);

        const customerId = uuidv4();
        const now = new Date().toISOString();

        await db
          .insertInto("customers")
          .values({
            id: customerId,
            ...data,
            created_at: now,
            updated_at: now,
          })
          .execute();

        return customerId;
      } catch (err) {
        console.error("Error creating customer:", err);
        setError("Failed to create customer");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, isReady]
  );
  /**
   * Add item to cart
   */
  const addToCart = useCallback(
    (
      batch: MedicineBatchTable,
      medicine: PharmacyMedicineWithDetails,
      quantity: number
    ) => {
      if (quantity <= 0 || quantity > batch.available_quantity) {
        setError("Invalid quantity");
        return;
      }

      const cartItemId = uuidv4();
      const unitPrice = batch.selling_price;
      const gstPercentage = batch.gst_percentage;

      // Calculate GST amount
      const baseAmount = unitPrice * quantity;
      const gstAmount = (baseAmount * gstPercentage) / 100;
      const totalPrice = baseAmount + gstAmount;

      const newItem: CartItem = {
        id: cartItemId,
        medicineId: medicine.id,
        medicineName: medicine.name,
        batchId: batch.id,
        batchNumber: batch.batch_number,
        quantity,
        unitPrice,
        gstPercentage,
        gstAmount,
        totalPrice,
        availableQuantity: batch.available_quantity,
      };

      setCart((prev) => [...prev, newItem]);
    },
    []
  );

  /**
   * Update cart item quantity
   */
  const updateCartItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      setCart((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;

          // Validate quantity
          if (quantity <= 0 || quantity > item.availableQuantity) {
            setError("Invalid quantity");
            return item;
          }

          // Recalculate amounts
          const baseAmount = item.unitPrice * quantity;
          const gstAmount = (baseAmount * item.gstPercentage) / 100;
          const totalPrice = baseAmount + gstAmount;

          return {
            ...item,
            quantity,
            gstAmount,
            totalPrice,
          };
        })
      );
    },
    []
  );

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  /**
   * Clear cart
   */
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // ============ Calculation Operations ============

  /**
   * Calculate subtotal (sum of base amounts without GST)
   */
  const calculateSubtotal = useCallback((): number => {
    return cart.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);
  }, [cart]);

  /**
   * Calculate total tax amount (sum of all GST amounts)
   */
  const calculateTaxAmount = useCallback((): number => {
    return cart.reduce((sum, item) => {
      return sum + item.gstAmount;
    }, 0);
  }, [cart]);

  /**
   * Calculate net amount (subtotal + tax - discount)
   */
  const calculateNetAmount = useCallback(
    (discount: number): number => {
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTaxAmount();
      return subtotal + taxAmount - discount;
    },
    [calculateSubtotal, calculateTaxAmount]
  );

  // ============ Checkout Operations ============

  /**
   * Generate unique invoice number
   */
  const generateInvoiceNumber = useCallback(
    async (pharmacyId: string): Promise<string> => {
      if (!isReady || !pharmacyId) throw new Error("Invalid parameters");

      try {
        // Get latest invoice for this pharmacy
        const latestSale = await db
          .selectFrom("sales")
          .select("invoice_number")
          .where("pharmacy_id", "=", pharmacyId)
          .orderBy("created_at", "desc")
          .executeTakeFirst();

        if (!latestSale || !latestSale.invoice_number) {
          // First invoice for this pharmacy
          return `INV-${pharmacyId.substring(0, 6)}-00001`;
        }

        // Extract number from invoice and increment
        const parts = latestSale.invoice_number.split("-");
        const lastNumber = parseInt(parts[parts.length - 1], 10);
        const newNumber = (lastNumber + 1).toString().padStart(5, "0");

        return `INV-${pharmacyId.substring(0, 6)}-${newNumber}`;
      } catch (err) {
        console.error("Error generating invoice number:", err);
        // Fallback to timestamp-based invoice
        return `INV-${pharmacyId.substring(0, 6)}-${Date.now()}`;
      }
    },
    [db, isReady]
  );

  /**
   * Complete sale transaction
   */
  const completeSale = useCallback(
    async (
      pharmacyId: string,
      userId: string,
      customerId: string | null,
      paymentMethod: "cash" | "card" | "upi" | "wallet",
      discount: number
    ): Promise<string> => {
      if (!isReady) throw new Error("Database not ready");
      if (cart.length === 0) throw new Error("Cart is empty");

      try {
        setLoading(true);
        setError(null);

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(pharmacyId);

        // Calculate totals
        const subtotal = calculateSubtotal();
        const taxAmount = calculateTaxAmount();
        const netAmount = calculateNetAmount(discount);

        // Create sale record
        const saleId = uuidv4();
        const now = new Date().toISOString();

        await db
          .insertInto("sales")
          .values({
            id: saleId,
            pharmacy_id: pharmacyId,
            invoice_number: invoiceNumber,
            customer_id: customerId,
            user_id: userId,
            total_amount: subtotal,
            discount_amount: discount,
            tax_amount: taxAmount,
            net_amount: netAmount,
            payment_method: paymentMethod,
            payment_status: "completed",
            created_at: now,
            updated_at: now,
          })
          .execute();

        // Create sale items and update batch quantities
        for (const item of cart) {
          // Create sale item
          const saleItemId = uuidv4();
          await db
            .insertInto("sale_items")
            .values({
              id: saleItemId,
              sale_id: saleId,
              pharmacy_id: pharmacyId,
              medicine_batch_id: item.batchId,
              medicine_name: item.medicineName,
              batch_number: item.batchNumber,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              discount: 0, // Item-level discount not implemented yet
              gst_percentage: item.gstPercentage,
              gst_amount: item.gstAmount,
              total_price: item.totalPrice,
              created_at: now,
            })
            .execute();

          // Update batch available quantity
          await db
            .updateTable("medicine_batches")
            .set((eb) => ({
              available_quantity: eb("available_quantity", "-", item.quantity),
              updated_at: now,
            }))
            .where("id", "=", item.batchId)
            .execute();
        }

        // Clear cart after successful sale
        clearCart();

        return saleId;
      } catch (err) {
        console.error("Error completing sale:", err);
        setError("Failed to complete sale");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      db,
      isReady,
      cart,
      generateInvoiceNumber,
      calculateSubtotal,
      calculateTaxAmount,
      calculateNetAmount,
      clearCart,
    ]
  );

  return {
    // Customer operations
    searchCustomerByPhoneOrName,
    createCustomer,

    // Medicine operations

    // Cart operations
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,

    // Calculation operations
    calculateSubtotal,
    calculateTaxAmount,
    calculateNetAmount,

    // Checkout operations
    generateInvoiceNumber,
    completeSale,

    // State
    loading,
    error,
  };
}
