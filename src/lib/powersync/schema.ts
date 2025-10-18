// lib/powersync/schema.ts
import { column, Schema, Table } from '@powersync/web';

// ============ Table Definitions ============

const profiles = new Table({
  full_name: column.text,
  email: column.text, // Changed from phone to email
  role: column.text,
  avatar_url: column.text, // For Google profile picture
  created_at: column.text,
  updated_at: column.text,
});

const suppliers = new Table({
  name: column.text,
  contact_person: column.text,
  phone: column.text,
  email: column.text,
  address: column.text,
  gst_number: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const medicines = new Table(
  {
    name: column.text,
    generic_name: column.text,
    manufacturer: column.text,
    category: column.text,
    barcode: column.text,
    unit_type: column.text,
    reorder_level: column.integer,
    storage_condition: column.text,
    requires_prescription: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      barcode_idx: ['barcode'],
      name_idx: ['name'],
    },
  }
);

const medicine_batches = new Table(
  {
    medicine_id: column.text,
    supplier_id: column.text,
    batch_number: column.text,
    manufacture_date: column.text,
    expiry_date: column.text,
    mrp: column.real,
    purchase_price: column.real,
    selling_price: column.real,
    quantity: column.integer,
    available_quantity: column.integer,
    gst_percentage: column.real,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      medicine_idx: ['medicine_id'],
      expiry_idx: ['expiry_date'],
      batch_number_idx: ['batch_number'],
    },
  }
);

const customers = new Table(
  {
    name: column.text,
    phone: column.text,
    email: column.text,
    address: column.text,
    date_of_birth: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      phone_idx: ['phone'],
      email_idx: ['email'],
    },
  }
);

const sales = new Table(
  {
    invoice_number: column.text,
    customer_id: column.text,
    user_id: column.text,
    total_amount: column.real,
    discount_amount: column.real,
    tax_amount: column.real,
    net_amount: column.real,
    payment_method: column.text,
    payment_status: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      user_idx: ['user_id'],
      customer_idx: ['customer_id'],
      created_idx: ['created_at'],
      invoice_idx: ['invoice_number'],
    },
  }
);

const sale_items = new Table(
  {
    sale_id: column.text,
    medicine_batch_id: column.text,
    medicine_name: column.text,
    batch_number: column.text,
    quantity: column.integer,
    unit_price: column.real,
    discount: column.real,
    gst_percentage: column.real,
    gst_amount: column.real,
    total_price: column.real,
    created_at: column.text,
  },
  {
    indexes: {
      sale_idx: ['sale_id'],
    },
  }
);

const expiry_alerts = new Table(
  {
    medicine_batch_id: column.text,
    alert_type: column.text,
    is_acknowledged: column.integer,
    acknowledged_by: column.text,
    acknowledged_at: column.text,
    created_at: column.text,
  },
  {
    indexes: {
      batch_idx: ['medicine_batch_id'],
      acknowledged_idx: ['is_acknowledged'],
    },
  }
);

const stock_alerts = new Table(
  {
    medicine_id: column.text,
    current_stock: column.integer,
    reorder_level: column.integer,
    is_resolved: column.integer,
    created_at: column.text,
  },
  {
    indexes: {
      medicine_idx: ['medicine_id'],
      resolved_idx: ['is_resolved'],
    },
  }
);

// ============ Export Schema ============
export const AppSchema = new Schema({
  profiles,
  suppliers,
  medicines,
  medicine_batches,
  customers,
  sales,
  sale_items,
  expiry_alerts,
  stock_alerts,
});

// ============ TypeScript Types (Kysely) ============

export interface ProfileTable {
  id: string;
  full_name: string;
  email: string; // Changed from phone to email
  role: 'admin' | 'pharmacist' | 'cashier';
  avatar_url: string | null; // For Google profile picture
  created_at: string;
  updated_at: string;
}

export interface SupplierTable {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicineTable {
  id: string;
  name: string;
  generic_name: string | null;
  manufacturer: string | null;
  category: string | null;
  barcode: string | null;
  unit_type: 'strip' | 'bottle' | 'tube' | 'piece' | null;
  reorder_level: number;
  storage_condition: string | null;
  requires_prescription: number;
  created_at: string;
  updated_at: string;
}

export interface MedicineBatchTable {
  id: string;
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

export interface CustomerTable {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleTable {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  user_id: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'wallet' | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

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

export interface ExpiryAlertTable {
  id: string;
  medicine_batch_id: string;
  alert_type: '15_days' | '30_days' | '90_days' | 'expired';
  is_acknowledged: number;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface StockAlertTable {
  id: string;
  medicine_id: string;
  current_stock: number;
  reorder_level: number;
  is_resolved: number;
  created_at: string;
}

// Kysely Database Interface
export interface PharmacyDatabase {
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

// Export types
export type Database = (typeof AppSchema)['types'];
