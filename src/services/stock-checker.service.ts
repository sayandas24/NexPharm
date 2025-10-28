// Stock Checker Service

import { StockInfo } from "@/types/scanner-types";
import { MedicineBatchTable } from "@/types/database-types";

class StockCheckerService {
  /**
   * Get stock information for a medicine
   */
  async getStockInfo(
    batches: MedicineBatchTable[],
    stockQuantity: number,
    reorderLevel: number
  ): Promise<StockInfo> {
    // Filter only available batches
    const availableBatches = batches.filter(
      (batch) => batch.available_quantity > 0
    );

    // Sort batches by expiry date (earliest first)
    availableBatches.sort((a, b) => {
      const dateA = new Date(a.expiry_date).getTime();
      const dateB = new Date(b.expiry_date).getTime();
      return dateA - dateB;
    });

    // Calculate total quantity
    const totalQuantity = stockQuantity;

    // Check if low stock
    const isLowStock = totalQuantity > 0 && totalQuantity <= reorderLevel;

    // Find near-expiry batches (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const nearExpiryBatches = availableBatches.filter((batch) => {
      const expiryDate = new Date(batch.expiry_date);
      return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
    });

    return {
      totalQuantity,
      availableBatches,
      isLowStock,
      reorderLevel,
      nearExpiryBatches,
    };
  }

  /**
   * Format expiry date for display
   */
  formatExpiryDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    // Check if expired
    if (date < now) {
      return "Expired";
    }

    // Calculate days until expiry
    const daysUntilExpiry = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 30) {
      return `Expires in ${daysUntilExpiry} days`;
    }

    // Format as readable date
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Get stock status badge variant
   */
  getStockStatusVariant(
    totalQuantity: number,
    isLowStock: boolean
  ): "default" | "secondary" | "destructive" | "outline" {
    if (totalQuantity === 0) return "destructive";
    if (isLowStock) return "outline";
    return "default";
  }

  /**
   * Get stock status text
   */
  getStockStatusText(totalQuantity: number, isLowStock: boolean): string {
    if (totalQuantity === 0) return "Out of Stock";
    if (isLowStock) return "Low Stock";
    return "In Stock";
  }

  /**
   * Check if batch is near expiry (within 30 days)
   */
  isNearExpiry(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return expiry <= thirtyDaysFromNow && expiry > now;
  }

  /**
   * Check if batch is expired
   */
  isExpired(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return expiry < now;
  }

  /**
   * Get expiry status color
   */
  getExpiryStatusColor(expiryDate: string): string {
    if (this.isExpired(expiryDate)) return "text-red-600";
    if (this.isNearExpiry(expiryDate)) return "text-orange-600";
    return "text-gray-600";
  }
}

// Export singleton instance
export const stockCheckerService = new StockCheckerService();
