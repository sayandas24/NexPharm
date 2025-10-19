// lib/powersync/schema.ts
import { column, Schema, Table } from '@powersync/web';

// ============ Table Definitions ============

// PHARMACIES TABLE
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

// PHARMACY MEMBERS TABLE
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

// PROFILES TABLE
const profiles = new Table({
  full_name: column.text,
  email: column.text,
  avatar_url: column.text,
  default_pharmacy_id: column.text,
  created_at: column.text,
  updated_at: column.text,
});

// SUPPLIERS TABLE
const suppliers = new Table(
  {
    pharmacy_id: column.text,
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
      pharmacy_idx: ['pharmacy_id'],
    },
  }
);

// ✅ MEDICINES TABLE - GLOBAL CATALOG (NO pharmacy_id!)
const medicines = new Table(
  {
    name: column.text,
    generic_name: column.text,
    brand_names: column.text,
    manufacturer: column.text,
    category: column.text,
    strength: column.text,
    pack_size: column.text,
    how_to_use: column.text,
    dosage_adults: column.text,
    dosage_children: column.text,
    dosage_elderly: column.text,
    duration: column.text,
    side_effects: column.text,
    warnings: column.text,
    shelf_life: column.text,
    barcode: column.text,
    requires_prescription: column.integer,
    medicine_image_url: column.text,
    medicine_images: column.text, // JSON
    package_image_url: column.text,
    unit_type: column.text,
    medicine_group: column.text,
    tags: column.text,
    is_active: column.integer,
    is_otc: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      barcode_idx: ['barcode'],
      name_idx: ['name'],
      active_idx: ['is_active'],
    },
  }
);

// ✅ NEW: PHARMACY MEDICINES JUNCTION TABLE
const pharmacy_medicines = new Table(
  {
    pharmacy_id: column.text,
    medicine_id: column.text,
    mrp: column.real,
    price_range_min: column.real,
    price_range_max: column.real,
    stock_quantity: column.integer,
    reorder_level: column.integer,
    storage_conditions: column.text,
    is_available: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      pharmacy_idx: ['pharmacy_id'],
      medicine_idx: ['medicine_id'],
      composite_idx: ['pharmacy_id', 'medicine_id'],
      available_idx: ['pharmacy_id', 'is_available'],
    },
  }
);

// MEDICINE BATCHES TABLE
const medicine_batches = new Table(
  {
    pharmacy_id: column.text,
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
      pharmacy_idx: ['pharmacy_id'],
      medicine_idx: ['pharmacy_id', 'medicine_id'],
      expiry_idx: ['pharmacy_id', 'expiry_date'],
      batch_number_idx: ['pharmacy_id', 'batch_number'],
    },
  }
);

// CUSTOMERS TABLE
const customers = new Table(
  {
    pharmacy_id: column.text,
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
      pharmacy_idx: ['pharmacy_id'],
      phone_idx: ['pharmacy_id', 'phone'],
      email_idx: ['pharmacy_id', 'email'],
    },
  }
);

// SALES TABLE
const sales = new Table(
  {
    pharmacy_id: column.text,
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
      pharmacy_idx: ['pharmacy_id'],
      user_idx: ['pharmacy_id', 'user_id'],
      customer_idx: ['pharmacy_id', 'customer_id'],
      created_idx: ['pharmacy_id', 'created_at'],
      invoice_idx: ['pharmacy_id', 'invoice_number'],
    },
  }
);

// SALE ITEMS TABLE (✅ NOW WITH pharmacy_id)
const sale_items = new Table(
  {
    sale_id: column.text,
    pharmacy_id: column.text, // ✅ ADDED
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
      pharmacy_idx: ['pharmacy_id'], // ✅ ADDED
    },
  }
);

// EXPIRY ALERTS TABLE
const expiry_alerts = new Table(
  {
    pharmacy_id: column.text,
    medicine_batch_id: column.text,
    alert_type: column.text,
    is_acknowledged: column.integer,
    acknowledged_by: column.text,
    acknowledged_at: column.text,
    created_at: column.text,
  },
  {
    indexes: {
      pharmacy_idx: ['pharmacy_id'],
      batch_idx: ['pharmacy_id', 'medicine_batch_id'],
      acknowledged_idx: ['pharmacy_id', 'is_acknowledged'],
    },
  }
);

// STOCK ALERTS TABLE
const stock_alerts = new Table(
  {
    pharmacy_id: column.text,
    medicine_id: column.text,
    current_stock: column.integer,
    reorder_level: column.integer,
    is_resolved: column.integer,
    created_at: column.text,
  },
  {
    indexes: {
      pharmacy_idx: ['pharmacy_id'],
      medicine_idx: ['pharmacy_id', 'medicine_id'],
      resolved_idx: ['pharmacy_id', 'is_resolved'],
    },
  }
);

// ============ Export Schema ============
export const AppSchema = new Schema({
  pharmacies,
  pharmacy_members,
  profiles,
  suppliers,
  medicines, // ✅ Global catalog (no pharmacy_id)
  pharmacy_medicines, // ✅ ADDED - Junction table
  medicine_batches,
  customers,
  sales,
  sale_items,
  expiry_alerts,
  stock_alerts,
});

// Export types
export type Database = (typeof AppSchema)['types'];