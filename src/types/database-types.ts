// ============ TypeScript Types (Kysely) ============

// NEW: Pharmacy Table Type
export interface PharmacyTable {
  id: string;
  name: string;
  license_number: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string | null;
  gst_number: string | null;
  owner_id: string;
  subscription_plan: "free" | "basic" | "pro" | "enterprise";
  subscription_expires_at: string | null;
  is_active: number; // SQLite boolean
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

// NEW: Pharmacy Member Table Type
export interface PharmacyMemberTable {
  id: string;
  pharmacy_id: string;
  user_id: string;
  role: "owner" | "admin" | "pharmacist" | "cashier";
  is_active: number; // SQLite boolean
  invited_by: string | null;
  joined_at: string;
}

// UPDATED: Profile Table Type
export interface ProfileTable {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  default_pharmacy_id: string | null; // NEW
  created_at: string;
  updated_at: string;
}

// UPDATED: Supplier Table Type
export interface SupplierTable {
  id: string;
  pharmacy_id: string; // NEW
  name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  created_at: string;
  updated_at: string;
}

// UPDATED: Medicine Table Type
export interface MedicineTable {
  id: string;
  pharmacy_id: string; // NEW
  name: string;
  generic_name: string | null;
  manufacturer: string | null;
  category: string | null;
  barcode: string | null;
  unit_type: "strip" | "bottle" | "tube" | "piece" | null;
  reorder_level: number;
  storage_condition: string | null;
  requires_prescription: number; // SQLite boolean
  created_at: string;
  updated_at: string;
}

// UPDATED: Medicine Batch Table Type
export interface MedicineBatchTable {
  id: string;
  pharmacy_id: string; // NEW
  medicine_id: string;
  supplier_id: string | null;
  batch_number: string;
  manufacture_date: string | null;
  expiry_date: string;
  mrp: number;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  available_quantity: number;
  gst_percentage: number;
  created_at: string;
  updated_at: string;
}

// UPDATED: Customer Table Type
export interface CustomerTable {
  id: string;
  pharmacy_id: string; // NEW
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

// UPDATED: Sale Table Type
export interface SaleTable {
  id: string;
  pharmacy_id: string; // NEW
  invoice_number: string;
  customer_id: string | null;
  user_id: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  payment_method: "cash" | "card" | "upi" | "wallet" | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

// Sale Item Table Type (unchanged)
export interface SaleItemTable {
  id: string;
  sale_id: string;
  medicine_batch_id: string | null;
  medicine_name: string;
  batch_number: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  gst_percentage: number | null;
  gst_amount: number | null;
  total_price: number;
  created_at: string;
}

// UPDATED: Expiry Alert Table Type
export interface ExpiryAlertTable {
  id: string;
  pharmacy_id: string; // NEW
  medicine_batch_id: string;
  alert_type: "15_days" | "30_days" | "90_days" | "expired";
  is_acknowledged: number; // SQLite boolean
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

// UPDATED: Stock Alert Table Type
export interface StockAlertTable {
  id: string;
  pharmacy_id: string; // NEW
  medicine_id: string;
  current_stock: number;
  reorder_level: number;
  is_resolved: number; // SQLite boolean
  created_at: string;
}

// UPDATED: Kysely Database Interface
export interface PharmacyDatabase {
  pharmacies: PharmacyTable; // NEW
  pharmacy_members: PharmacyMemberTable; // NEW
  profiles: ProfileTable;
  suppliers: SupplierTable;
  medicines: MedicineTable;
  medicine_batches: MedicineBatchTable;
  customers: CustomerTable;
  sales: SaleTable;
  sale_items: SaleItemTable;
  expiry_alerts: ExpiryAlertTable;
  stock_alerts: StockAlertTable;
}
