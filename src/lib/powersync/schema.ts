// lib/powersync/schema.ts
import { column, Schema, Table } from '@powersync/web';

// ============ Table Definitions ============

// PHARMACIES TABLE (NEW)
const pharmacies = new Table(
  {
    name: column.text,
    license_number: column.text,
    address: column.text,
    city: column.text,
    state: column.text,
    pincode: column.text,
    phone: column.text,
    email: column.text,
    gst_number: column.text,
    owner_id: column.text,
    subscription_plan: column.text,
    subscription_expires_at: column.text,
    is_active: column.integer,
    logo_url: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      owner_idx: ['owner_id'],
      active_idx: ['is_active'],
    },
  }
);

// PHARMACY MEMBERS TABLE (NEW)
const pharmacy_members = new Table(
  {
    pharmacy_id: column.text,
    user_id: column.text,
    role: column.text,
    is_active: column.integer,
    invited_by: column.text,
    joined_at: column.text,
  },
  {
    indexes: {
      pharmacy_idx: ['pharmacy_id'],
      user_idx: ['user_id'],
      active_idx: ['is_active'],
    },
  }
);

// PROFILES TABLE (UPDATED)
const profiles = new Table({
  full_name: column.text,
  email: column.text,
  avatar_url: column.text,
  default_pharmacy_id: column.text, // NEW: Default/last selected pharmacy
  created_at: column.text,
  updated_at: column.text,
});

// SUPPLIERS TABLE (UPDATED - added pharmacy_id)
const suppliers = new Table(
  {
    pharmacy_id: column.text, // NEW: Multi-tenancy field
    name: column.text,
    contact_person: column.text,
    phone: column.text,
    email: column.text,
    address: column.text,
    gst_number: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      pharmacy_idx: ['pharmacy_id'], // NEW
    },
  }
);

// MEDICINES TABLE (UPDATED - added pharmacy_id)
const medicines = new Table(
  {
    pharmacy_id: column.text, // NEW: Multi-tenancy field
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
      pharmacy_idx: ['pharmacy_id'], // NEW
      barcode_idx: ['pharmacy_id', 'barcode'], // UPDATED: Composite index
      name_idx: ['pharmacy_id', 'name'], // UPDATED: Composite index
    },
  }
);

// MEDICINE BATCHES TABLE (UPDATED - added pharmacy_id)
const medicine_batches = new Table(
  {
    pharmacy_id: column.text, // NEW: Multi-tenancy field
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
      pharmacy_idx: ['pharmacy_id'], // NEW
      medicine_idx: ['pharmacy_id', 'medicine_id'], // UPDATED: Composite
      expiry_idx: ['pharmacy_id', 'expiry_date'], // UPDATED: Composite
      batch_number_idx: ['pharmacy_id', 'batch_number'], // UPDATED: Composite
    },
  }
);

// CUSTOMERS TABLE (UPDATED - added pharmacy_id)
const customers = new Table(
  {
    pharmacy_id: column.text, // NEW: Multi-tenancy field
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
      pharmacy_idx: ['pharmacy_id'], // NEW
      phone_idx: ['pharmacy_id', 'phone'], // UPDATED: Composite
      email_idx: ['pharmacy_id', 'email'], // UPDATED: Composite
    },
  }
);

// SALES TABLE (UPDATED - added pharmacy_id)
const sales = new Table(
  {
    pharmacy_id: column.text, // NEW: Multi-tenancy field
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
      pharmacy_idx: ['pharmacy_id'], // NEW
      user_idx: ['pharmacy_id', 'user_id'], // UPDATED: Composite
      customer_idx: ['pharmacy_id', 'customer_id'], // UPDATED: Composite
      created_idx: ['pharmacy_id', 'created_at'], // UPDATED: Composite
      invoice_idx: ['pharmacy_id', 'invoice_number'], // UPDATED: Composite
    },
  }
);

// SALE ITEMS TABLE (unchanged - inherits pharmacy from sales)
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

// EXPIRY ALERTS TABLE (UPDATED - added pharmacy_id)
const expiry_alerts = new Table(
  {
    pharmacy_id: column.text, // NEW: Multi-tenancy field
    medicine_batch_id: column.text,
    alert_type: column.text,
    is_acknowledged: column.integer,
    acknowledged_by: column.text,
    acknowledged_at: column.text,
    created_at: column.text,
  },
  {
    indexes: {
      pharmacy_idx: ['pharmacy_id'], // NEW
      batch_idx: ['pharmacy_id', 'medicine_batch_id'], // UPDATED: Composite
      acknowledged_idx: ['pharmacy_id', 'is_acknowledged'], // UPDATED: Composite
    },
  }
);

// STOCK ALERTS TABLE (UPDATED - added pharmacy_id)
const stock_alerts = new Table(
  {
    pharmacy_id: column.text, // NEW: Multi-tenancy field
    medicine_id: column.text,
    current_stock: column.integer,
    reorder_level: column.integer,
    is_resolved: column.integer,
    created_at: column.text,
  },
  {
    indexes: {
      pharmacy_idx: ['pharmacy_id'], // NEW
      medicine_idx: ['pharmacy_id', 'medicine_id'], // UPDATED: Composite
      resolved_idx: ['pharmacy_id', 'is_resolved'], // UPDATED: Composite
    },
  }
);

// ============ Export Schema ============
export const AppSchema = new Schema({
  pharmacies, // NEW
  pharmacy_members, // NEW
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


// Export types
export type Database = (typeof AppSchema)['types'];
