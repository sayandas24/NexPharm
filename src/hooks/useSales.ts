import { useKyselyDB, usePowerSync } from "@/lib/powersync/PowersyncProvider";
import { sql } from "kysely";

export default function useSales(pharmacyId: string) {
  const db = useKyselyDB();
  const { isReady, powerSyncDb } = usePowerSync();

  const fetchSalesAnalytics = async (
    period: "daily" | "weekly" | "monthly" | "all",
    customDateRange?: { start: Date; end: Date }
  ) => {
    if (!isReady || !pharmacyId) return [];

    const now = new Date();
    let startDate: Date;

    // Use custom date range if provided, otherwise calculate from period
    if (customDateRange) {
      startDate = customDateRange.start;
    } else {
      // Calculate start date based on period
      switch (period) {
        case "daily":
          // Today
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          // Last 7 days
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          // Last 30 days
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          // All time - set to a very old date
          startDate = new Date("2000-01-01");
          break;
      }
    }

    let query = db
      .selectFrom("sales")
      .select([
        sql<string>`DATE(created_at)`.as("date"),
        sql<number>`CAST(SUM(net_amount) AS REAL)`.as("revenue"),
        sql<number>`CAST(SUM(total_amount) AS REAL)`.as("total_sales"),
        sql<number>`CAST(SUM(discount_amount) AS REAL)`.as("total_discount"),
        sql<number>`CAST(SUM(tax_amount) AS REAL)`.as("total_tax"),
        sql<number>`COUNT(id)`.as("transactions"),
      ])
      .where("pharmacy_id", "=", pharmacyId);

    // Add date filter
    if (customDateRange) {
      query = query
        .where("created_at", ">=", customDateRange.start.toISOString())
        .where("created_at", "<=", customDateRange.end.toISOString());
    } else if (period !== "all") {
      query = query.where("created_at", ">=", startDate.toISOString());
    }

    const result = await query
      .groupBy(sql`DATE(created_at)`)
      .orderBy("date", "desc")
      .execute();

    return result;
  };

  const fetchSalesSummary = async (
    period: "daily" | "weekly" | "monthly" | "all",
    customDateRange?: { start: Date; end: Date }
  ) => {
    if (!isReady || !pharmacyId) return null;

    const now = new Date();
    let startDate: Date;

    // Use custom date range if provided, otherwise calculate from period
    if (customDateRange) {
      startDate = customDateRange.start;
    } else {
      switch (period) {
        case "daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          startDate = new Date("2000-01-01");
          break;
      }
    }

    let query = db
      .selectFrom("sales")
      .select([
        sql<number>`CAST(SUM(net_amount) AS REAL)`.as("total_revenue"),
        sql<number>`CAST(SUM(total_amount) AS REAL)`.as("total_sales"),
        sql<number>`CAST(SUM(discount_amount) AS REAL)`.as("total_discount"),
        sql<number>`CAST(SUM(tax_amount) AS REAL)`.as("total_tax"),
        sql<number>`COUNT(id)`.as("total_transactions"),
        sql<number>`CAST(AVG(net_amount) AS REAL)`.as("avg_sale_value"),
      ])
      .where("pharmacy_id", "=", pharmacyId);

    if (customDateRange) {
      query = query
        .where("created_at", ">=", customDateRange.start.toISOString())
        .where("created_at", "<=", customDateRange.end.toISOString());
    } else if (period !== "all") {
      query = query.where("created_at", ">=", startDate.toISOString());
    }

    const result = await query.executeTakeFirst();

    return result;
  };

  const fetchSalesByPaymentMethod = async (
    period: "daily" | "weekly" | "monthly" | "all",
    customDateRange?: { start: Date; end: Date }
  ) => {
    if (!isReady || !pharmacyId) return [];

    const now = new Date();
    let startDate: Date;

    // Use custom date range if provided, otherwise calculate from period
    if (customDateRange) {
      startDate = customDateRange.start;
    } else {
      switch (period) {
        case "daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          startDate = new Date("2000-01-01");
          break;
      }
    }

    let query = db
      .selectFrom("sales")
      .select([
        "payment_method",
        sql<number>`CAST(SUM(net_amount) AS REAL)`.as("revenue"),
        sql<number>`COUNT(id)`.as("transactions"),
      ])
      .where("pharmacy_id", "=", pharmacyId);

    if (customDateRange) {
      query = query
        .where("created_at", ">=", customDateRange.start.toISOString())
        .where("created_at", "<=", customDateRange.end.toISOString());
    } else if (period !== "all") {
      query = query.where("created_at", ">=", startDate.toISOString());
    }

    const result = await query
      .groupBy("payment_method")
      .orderBy("revenue", "desc")
      .execute();

    return result;
  };

  const fetchTopSellingDays = async (
    period: "weekly" | "monthly" | "all",
    limit: number = 10
  ) => {
    if (!isReady || !pharmacyId) return [];

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = new Date("2000-01-01");
        break;
    }

    let query = db
      .selectFrom("sales")
      .select([
        sql<string>`DATE(created_at)`.as("date"),
        sql<number>`CAST(SUM(net_amount) AS REAL)`.as("revenue"),
        sql<number>`COUNT(id)`.as("transactions"),
      ])
      .where("pharmacy_id", "=", pharmacyId);

    if (period !== "all") {
      query = query.where("created_at", ">=", startDate.toISOString());
    }

    const result = await query
      .groupBy(sql`DATE(created_at)`)
      .orderBy("revenue", "desc")
      .limit(limit)
      .execute();

    return result;
  };

  const fetchTopCustomers = async (
    period: "daily" | "weekly" | "monthly" | "all",
    customDateRange?: { start: Date; end: Date },
    limit: number = 10
  ) => {
    if (!isReady || !pharmacyId) return [];

    const now = new Date();
    let startDate: Date;

    // Use custom date range if provided, otherwise calculate from period
    if (customDateRange) {
      startDate = customDateRange.start;
    } else {
      switch (period) {
        case "daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          startDate = new Date("2000-01-01");
          break;
      }
    }

    let query = db
      .selectFrom("sales")
      .innerJoin("customers", "sales.customer_id", "customers.id")
      .select([
        "customers.id as customer_id",
        "customers.name as customer_name",
        sql<number>`CAST(SUM(sales.net_amount) AS REAL)`.as("total_spent"),
        sql<number>`COUNT(sales.id)`.as("transaction_count"),
      ])
      .where("sales.pharmacy_id", "=", pharmacyId)
      .where("customers.pharmacy_id", "=", pharmacyId);

    // Add date filter
    if (customDateRange) {
      query = query
        .where("sales.created_at", ">=", customDateRange.start.toISOString())
        .where("sales.created_at", "<=", customDateRange.end.toISOString());
    } else if (period !== "all") {
      query = query.where("sales.created_at", ">=", startDate.toISOString());
    }

    const result = await query
      .groupBy(["customers.id", "customers.name"])
      .orderBy("total_spent", "desc")
      .limit(limit)
      .execute();

    return result;
  };

  const fetchCustomerTopMedicines = async (
    customerId: string,
    period: "daily" | "weekly" | "monthly" | "all",
    customDateRange?: { start: Date; end: Date },
    limit: number = 20
  ) => {
    if (!isReady || !pharmacyId || !customerId) return [];

    const now = new Date();
    let startDate: Date;

    // Use custom date range if provided, otherwise calculate from period
    if (customDateRange) {
      startDate = customDateRange.start;
    } else {
      switch (period) {
        case "daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          startDate = new Date("2000-01-01");
          break;
      }
    }

    let query = db
      .selectFrom("sales")
      .innerJoin("sale_items", "sales.id", "sale_items.sale_id")
      .select([
        "sale_items.medicine_name",
        sql<number>`CAST(SUM(sale_items.quantity) AS INTEGER)`.as(
          "total_quantity"
        ),
        sql<number>`CAST(SUM(sale_items.total_price) AS REAL)`.as(
          "total_amount"
        ),
        sql<number>`COUNT(DISTINCT sales.id)`.as("purchase_count"),
      ])
      .where("sales.pharmacy_id", "=", pharmacyId)
      .where("sales.customer_id", "=", customerId);

    // Add date filter
    if (customDateRange) {
      query = query
        .where("sales.created_at", ">=", customDateRange.start.toISOString())
        .where("sales.created_at", "<=", customDateRange.end.toISOString());
    } else if (period !== "all") {
      query = query.where("sales.created_at", ">=", startDate.toISOString());
    }

    const result = await query
      .groupBy("sale_items.medicine_name")
      .orderBy("total_quantity", "desc")
      .limit(limit)
      .execute();

    return result;
  };

  const fetchTopMedicines = async (
    period: "daily" | "weekly" | "monthly" | "all",
    customDateRange?: { start: Date; end: Date },
    limit: number = 10
  ) => {
    if (!isReady || !pharmacyId) return [];

    const now = new Date();
    let startDate: Date;

    // Use custom date range if provided, otherwise calculate from period
    if (customDateRange) {
      startDate = customDateRange.start;
    } else {
      switch (period) {
        case "daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          startDate = new Date("2000-01-01");
          break;
      }
    }

    let query = db
      .selectFrom("sales")
      .innerJoin("sale_items", "sales.id", "sale_items.sale_id")
      .select([
        "sale_items.medicine_name",
        sql<number>`CAST(SUM(sale_items.quantity) AS INTEGER)`.as(
          "total_quantity"
        ),
        sql<number>`CAST(SUM(sale_items.total_price) AS REAL)`.as(
          "total_revenue"
        ),
        sql<number>`COUNT(DISTINCT sales.id)`.as("transaction_count"),
      ])
      .where("sales.pharmacy_id", "=", pharmacyId);

    // Add date filter
    if (customDateRange) {
      query = query
        .where("sales.created_at", ">=", customDateRange.start.toISOString())
        .where("sales.created_at", "<=", customDateRange.end.toISOString());
    } else if (period !== "all") {
      query = query.where("sales.created_at", ">=", startDate.toISOString());
    }

    const result = await query
      .groupBy("sale_items.medicine_name")
      .orderBy("total_revenue", "desc")
      .limit(limit)
      .execute();

    return result;
  };

  return {
    fetchSalesAnalytics,
    fetchSalesSummary,
    fetchSalesByPaymentMethod,
    fetchTopSellingDays,
    fetchTopCustomers,
    fetchCustomerTopMedicines,
    fetchTopMedicines,
  };
}
