// hooks/useCustomers.ts
"use client";

import { useKyselyDB, usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { CustomerTable, SaleTable, SaleItemTable } from "@/types/database-types";
import { useCallback, useState, useEffect } from "react";
import { sql } from "kysely";

// ============ TypeScript Interfaces ============

export interface CustomerWithStats {
  id: string;
  pharmacy_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
  total_purchases: number;
  total_spending: number;
  last_purchase_date: string | null;
}

export interface CustomerAnalytics {
  total_spending: number;
  total_purchases: number;
  average_transaction_value: number;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
}

export interface PurchaseHistoryItem {
  id: string;
  invoice_number: string;
  created_at: string;
  total_amount: number;
  net_amount: number;
  payment_method: string | null;
  item_count: number;
}

export interface SaleItemDetail {
  id: string;
  medicine_name: string;
  batch_number: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  gst_percentage: number | null;
  gst_amount: number | null;
}

export interface TopMedicine {
  medicine_name: string;
  total_quantity: number;
  purchase_count: number;
}

// ============ Hook ============

export function useCustomers(pharmacyId?: string) {
  const db = useKyselyDB();
  const { isReady } = usePowerSync();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);

  /**
   * Fetch all customers with aggregated stats
   */
  const fetchCustomersWithStats = useCallback(async () => {
    if (!isReady || !pharmacyId) return;

    try {
      setLoading(true);
      setError(null);

      // Query customers with aggregated sales data
      const results = await db
        .selectFrom("customers as c")
        .leftJoin("sales as s", (join) =>
          join
            .onRef("c.id", "=", "s.customer_id")
            .on("s.pharmacy_id", "=", pharmacyId)
        )
        .select([
          "c.id",
          "c.pharmacy_id",
          "c.name",
          "c.phone",
          "c.email",
          "c.address",
          "c.date_of_birth",
          "c.created_at",
          "c.updated_at",
          sql<number>`COUNT(s.id)`.as("total_purchases"),
          sql<number>`COALESCE(SUM(s.net_amount), 0)`.as("total_spending"),
          sql<string>`MAX(s.created_at)`.as("last_purchase_date"),
        ])
        .where("c.pharmacy_id", "=", pharmacyId)
        .groupBy([
          "c.id",
          "c.pharmacy_id",
          "c.name",
          "c.phone",
          "c.email",
          "c.address",
          "c.date_of_birth",
          "c.created_at",
          "c.updated_at",
        ])
        .orderBy("c.name", "asc")
        .execute();

      setCustomers(results as CustomerWithStats[]);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  }, [db, isReady, pharmacyId]);

  /**
   * Fetch single customer by ID with stats
   */
  const getCustomerById = useCallback(
    async (customerId: string): Promise<CustomerWithStats | null> => {
      if (!isReady || !pharmacyId) return null;

      try {
        setLoading(true);
        setError(null);

        const result = await db
          .selectFrom("customers as c")
          .leftJoin("sales as s", (join) =>
            join
              .onRef("c.id", "=", "s.customer_id")
              .on("s.pharmacy_id", "=", pharmacyId)
          )
          .select([
            "c.id",
            "c.pharmacy_id",
            "c.name",
            "c.phone",
            "c.email",
            "c.address",
            "c.date_of_birth",
            "c.created_at",
            "c.updated_at",
            sql<number>`COUNT(s.id)`.as("total_purchases"),
            sql<number>`COALESCE(SUM(s.net_amount), 0)`.as("total_spending"),
            sql<string>`MAX(s.created_at)`.as("last_purchase_date"),
          ])
          .where("c.id", "=", customerId)
          .where("c.pharmacy_id", "=", pharmacyId)
          .groupBy([
            "c.id",
            "c.pharmacy_id",
            "c.name",
            "c.phone",
            "c.email",
            "c.address",
            "c.date_of_birth",
            "c.created_at",
            "c.updated_at",
          ])
          .executeTakeFirst();

        return (result as CustomerWithStats) || null;
      } catch (err) {
        console.error("Error fetching customer:", err);
        setError("Failed to fetch customer");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db, isReady, pharmacyId]
  );

  /**
   * Fetch customer analytics
   */
  const getCustomerAnalytics = useCallback(
    async (customerId: string): Promise<CustomerAnalytics | null> => {
      if (!isReady || !pharmacyId) return null;

      try {
        setLoading(true);
        setError(null);

        const result = await db
          .selectFrom("sales")
          .select([
            sql<number>`COUNT(id)`.as("total_purchases"),
            sql<number>`COALESCE(SUM(net_amount), 0)`.as("total_spending"),
            sql<number>`COALESCE(AVG(net_amount), 0)`.as(
              "average_transaction_value"
            ),
            sql<string>`MIN(created_at)`.as("first_purchase_date"),
            sql<string>`MAX(created_at)`.as("last_purchase_date"),
          ])
          .where("customer_id", "=", customerId)
          .where("pharmacy_id", "=", pharmacyId)
          .executeTakeFirst();

        return (result as CustomerAnalytics) || null;
      } catch (err) {
        console.error("Error fetching customer analytics:", err);
        setError("Failed to fetch analytics");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db, isReady, pharmacyId]
  );

  /**
   * Fetch purchase history with pagination
   */
  const getPurchaseHistory = useCallback(
    async (
      customerId: string,
      page: number = 1,
      pageSize: number = 20
    ): Promise<PurchaseHistoryItem[]> => {
      if (!isReady || !pharmacyId) return [];

      try {
        setLoading(true);
        setError(null);

        const offset = (page - 1) * pageSize;

        // Get sales with item count
        const results = await db
          .selectFrom("sales as s")
          .leftJoin("sale_items as si", "s.id", "si.sale_id")
          .select([
            "s.id",
            "s.invoice_number",
            "s.created_at",
            "s.total_amount",
            "s.net_amount",
            "s.payment_method",
            sql<number>`COUNT(si.id)`.as("item_count"),
          ])
          .where("s.customer_id", "=", customerId)
          .where("s.pharmacy_id", "=", pharmacyId)
          .groupBy([
            "s.id",
            "s.invoice_number",
            "s.created_at",
            "s.total_amount",
            "s.net_amount",
            "s.payment_method",
          ])
          .orderBy("s.created_at", "desc")
          .limit(pageSize)
          .offset(offset)
          .execute();

        return results as PurchaseHistoryItem[];
      } catch (err) {
        console.error("Error fetching purchase history:", err);
        setError("Failed to fetch purchase history");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [db, isReady, pharmacyId]
  );

  /**
   * Fetch sale items for a specific sale
   */
  const getSaleItems = useCallback(
    async (saleId: string): Promise<SaleItemDetail[]> => {
      if (!isReady) return [];

      try {
        setLoading(true);
        setError(null);

        const results = await db
          .selectFrom("sale_items")
          .select([
            "id",
            "medicine_name",
            "batch_number",
            "quantity",
            "unit_price",
            "total_price",
            "gst_percentage",
            "gst_amount",
          ])
          .where("sale_id", "=", saleId)
          .orderBy("created_at", "asc")
          .execute();

        return results as SaleItemDetail[];
      } catch (err) {
        console.error("Error fetching sale items:", err);
        setError("Failed to fetch sale items");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [db, isReady]
  );

  /**
   * Fetch top medicines for customer
   */
  const getTopMedicines = useCallback(
    async (customerId: string, limit: number = 5): Promise<TopMedicine[]> => {
      if (!isReady || !pharmacyId) return [];

      try {
        setLoading(true);
        setError(null);

        const results = await db
          .selectFrom("sale_items as si")
          .innerJoin("sales as s", "si.sale_id", "s.id")
          .select([
            "si.medicine_name",
            sql<number>`SUM(si.quantity)`.as("total_quantity"),
            sql<number>`COUNT(DISTINCT si.sale_id)`.as("purchase_count"),
          ])
          .where("s.customer_id", "=", customerId)
          .where("s.pharmacy_id", "=", pharmacyId)
          .groupBy("si.medicine_name")
          .orderBy("total_quantity", "desc")
          .limit(limit)
          .execute();

        return results as TopMedicine[];
      } catch (err) {
        console.error("Error fetching top medicines:", err);
        setError("Failed to fetch top medicines");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [db, isReady, pharmacyId]
  );

  /**
   * Search customers by name or phone (local filtering)
   */
  const searchCustomers = useCallback(
    (query: string): CustomerWithStats[] => {
      if (!query.trim()) return customers;

      const lowerQuery = query.toLowerCase();
      return customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(lowerQuery) ||
          customer.phone.includes(query)
      );
    },
    [customers]
  );

  // Auto-fetch customers when pharmacyId changes
  useEffect(() => {
    if (pharmacyId) {
      fetchCustomersWithStats();
    }
  }, [pharmacyId, fetchCustomersWithStats]);

  return {
    // Data
    customers,

    // Functions
    fetchCustomersWithStats,
    getCustomerById,
    getCustomerAnalytics,
    getPurchaseHistory,
    getSaleItems,
    getTopMedicines,
    searchCustomers,

    // State
    loading,
    error,
  };
}
