import ScanComponentMain from "@/components/scanner/ScanComponentMain";
import QuickScan from "./QuickScan";
import QuickBill from "./QuickBill";
import QuickMedicineAdd from "./QuickMedicineAdd";
import QuickSalesReport from "./QuickSalesReport";
import QuickLinks from "./QuickLinks";

export default function QuickActions() {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Scan Medicine */}

        <QuickScan />
        {/* Add Bill */}
        <QuickBill />

        {/* Add Medicine */}
        <QuickMedicineAdd />

        {/* View Reports */}
        <QuickSalesReport />

        {/* Manage Suppliers */}
      </div>
      <QuickLinks />
    </div>
  );
}
