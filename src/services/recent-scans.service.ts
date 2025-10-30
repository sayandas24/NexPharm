// Recent Scans Service

import { PharmacyMedicineWithDetails } from "@/types/scanner-types";
import { StockInfo } from "@/types/scanner-types";

export interface RecentScan {
  id: string;
  medicine: PharmacyMedicineWithDetails;
  timestamp: Date;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
}

class RecentScansService {
  private scans: RecentScan[] = [];
  private maxScans = 5;

  /**
   * Add a scan to the recent scans list
   */
  addScan(medicine: PharmacyMedicineWithDetails, stockInfo: StockInfo): void {
    const scan: RecentScan = {
      id: crypto.randomUUID(),
      medicine,
      timestamp: new Date(),
      stockStatus: this.determineStockStatus(stockInfo),
    };

    // Add to beginning, keep only last 5
    this.scans.unshift(scan);
    if (this.scans.length > this.maxScans) {
      this.scans = this.scans.slice(0, this.maxScans);
    }
  }

  /**
   * Get all recent scans
   */
  getScans(): RecentScan[] {
    return this.scans;
  }

  /**
   * Clear all recent scans
   */
  clearScans(): void {
    this.scans = [];
  }

  /**
   * Determine stock status from stock info
   */
  private determineStockStatus(
    stockInfo: StockInfo
  ): "in_stock" | "low_stock" | "out_of_stock" {
    if (stockInfo.totalQuantity === 0) return "out_of_stock";
    if (stockInfo.isLowStock) return "low_stock";
    return "in_stock";
  }

  /**
   * Get stock status badge variant
   */
  getStockStatusVariant(
    status: "in_stock" | "low_stock" | "out_of_stock"
  ): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "out_of_stock":
        return "destructive";
      case "low_stock":
        return "outline";
      case "in_stock":
        return "default";
    }
  }

  /**
   * Get stock status text
   */
  getStockStatusText(status: "in_stock" | "low_stock" | "out_of_stock"): string {
    switch (status) {
      case "out_of_stock":
        return "Out of Stock";
      case "low_stock":
        return "Low Stock";
      case "in_stock":
        return "In Stock";
    }
  }
}

// Export singleton instance
export const recentScansService = new RecentScansService();
