<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Build a pharmacy inventory management system using Next.js latest and Supabase also with powersync for instant locally update.

Core features:

- Medicine inventory with batch/expiry tracking
- POS billing with just medicine name scanning
- Automated expiry alerts (15-30-90 days)
- Real-time stock management
- GST-compliant invoicing
- Customer and supplier management
- Sales analytics dashboard
- Multi-user with role-based access

Requirements:

1. Complete Supabase database schema with RLS policies
2. Next.js app folder structure
3. Step-by-step development roadmap
4. MVP feature priority list
5. Technical implementation approach for barcode scanning,
printing, and notifications
6. Complete Powersync rules for connecting with supabase

Focus on: Modern UI, mobile-responsive, real-time sync, affordable pricing model.

Provide: Database schema, project architecture, development phases, and
where to start building. i'll bring it in a hackathon, so i need to build fast

I'll help you build a complete pharmacy inventory management system for your hackathon. Here's a comprehensive development roadmap with everything you need to start fast and build efficiently.[^1][^2][^3]

## Complete Database Schema (Supabase)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users & Authentication (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pharmacist', 'cashier')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicines with batch tracking
CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  category TEXT,
  barcode TEXT UNIQUE,
  unit_type TEXT CHECK (unit_type IN ('strip', 'bottle', 'tube', 'piece')),
  reorder_level INTEGER DEFAULT 10,
  storage_condition TEXT,
  requires_prescription BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicine batches with expiry tracking
CREATE TABLE medicine_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  batch_number TEXT NOT NULL,
  manufacture_date DATE,
  expiry_date DATE NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  available_quantity INTEGER NOT NULL,
  gst_percentage DECIMAL(5,2) DEFAULT 12.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(medicine_id, batch_number)
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales/Invoices
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'wallet')),
  payment_status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale items
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  medicine_batch_id UUID REFERENCES medicine_batches(id),
  medicine_name TEXT NOT NULL,
  batch_number TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  gst_percentage DECIMAL(5,2),
  gst_amount DECIMAL(10,2),
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expiry alerts tracking
CREATE TABLE expiry_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_batch_id UUID REFERENCES medicine_batches(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('15_days', '30_days', '90_days', 'expired')),
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Low stock alerts
CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  reorder_level INTEGER NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_medicines_barcode ON medicines(barcode);
CREATE INDEX idx_medicine_batches_expiry ON medicine_batches(expiry_date);
CREATE INDEX idx_medicine_batches_medicine ON medicine_batches(medicine_id);
CREATE INDEX idx_sales_created ON sales(created_at DESC);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_customers_phone ON customers(phone);
```


## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expiry_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Suppliers: All authenticated users can read, only admins can modify
CREATE POLICY "All users can view suppliers" ON suppliers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert suppliers" ON suppliers
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Medicines: All authenticated users can read and pharmacists/admins can modify
CREATE POLICY "All users can view medicines" ON medicines
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Pharmacists and admins can manage medicines" ON medicines
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'pharmacist')
  );

-- Medicine Batches: Similar to medicines
CREATE POLICY "All users can view batches" ON medicine_batches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Pharmacists and admins can manage batches" ON medicine_batches
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'pharmacist')
  );

-- Customers: All authenticated users can read and create
CREATE POLICY "All users can manage customers" ON customers
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Sales: Users can view their own sales, admins view all
CREATE POLICY "Users can view own sales" ON sales
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "All users can create sales" ON sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sale Items: Follow parent sale permissions
CREATE POLICY "Users can view sale items" ON sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales 
      WHERE sales.id = sale_items.sale_id 
      AND (sales.user_id = auth.uid() OR 
           (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    )
  );

-- Alerts: All authenticated users can read
CREATE POLICY "All users can view alerts" ON expiry_alerts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "All users can view stock alerts" ON stock_alerts
  FOR ALL USING (auth.uid() IS NOT NULL);
```


## PowerSync Configuration (sync-rules.yaml)

```yaml
# PowerSync Sync Rules for Pharmacy System
bucket_definitions:
  # Global bucket for reference data
  global:
    data:
      - SELECT id, name, generic_name, manufacturer, category, barcode, 
          unit_type, reorder_level, requires_prescription 
        FROM medicines
      - SELECT id, name, contact_person, phone, email, gst_number 
        FROM suppliers

  # User-specific bucket for profiles
  user_profile:
    parameters: SELECT request.user_id() AS user_id
    data:
      - SELECT * FROM profiles WHERE id = bucket.user_id

  # Medicine batches - available to all authenticated users
  medicine_inventory:
    parameters: SELECT request.user_id() AS user_id
    data:
      - SELECT mb.* FROM medicine_batches mb
        WHERE request.user_id() IS NOT NULL
      
  # Customers - available to all
  customers:
    parameters: SELECT request.user_id() AS user_id
    data:
      - SELECT * FROM customers
        WHERE request.user_id() IS NOT NULL

  # User's own sales
  user_sales:
    parameters: SELECT request.user_id() AS user_id
    data:
      - SELECT * FROM sales 
        WHERE user_id = bucket.user_id
      - SELECT si.* FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.user_id = bucket.user_id

  # Admin sales (all sales)
  admin_sales:
    parameters: SELECT request.user_id() AS user_id
    data:
      - SELECT * FROM sales
        WHERE (SELECT role FROM profiles WHERE id = bucket.user_id) = 'admin'
      - SELECT si.* FROM sale_items si
        WHERE (SELECT role FROM profiles WHERE id = bucket.user_id) = 'admin'

  # Alerts - available to all
  alerts:
    parameters: SELECT request.user_id() AS user_id
    data:
      - SELECT * FROM expiry_alerts
        WHERE request.user_id() IS NOT NULL
      - SELECT * FROM stock_alerts
        WHERE request.user_id() IS NOT NULL
```


## Next.js 15 Project Structure

```
pharmacy-inventory/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   ├── page.tsx                # Dashboard home/analytics
│   │   ├── inventory/
│   │   │   ├── page.tsx            # Medicine list
│   │   │   ├── add/page.tsx        # Add medicine
│   │   │   └── [id]/page.tsx       # Edit medicine
│   │   ├── batches/
│   │   │   ├── page.tsx            # Batch list with expiry
│   │   │   └── add/page.tsx        # Add batch
│   │   ├── pos/
│   │   │   └── page.tsx            # POS billing interface
│   │   ├── sales/
│   │   │   ├── page.tsx            # Sales history
│   │   │   └── [id]/page.tsx       # Invoice details
│   │   ├── customers/
│   │   │   ├── page.tsx            # Customer list
│   │   │   └── add/page.tsx        # Add customer
│   │   ├── suppliers/
│   │   │   ├── page.tsx            # Supplier list
│   │   │   └── add/page.tsx        # Add supplier
│   │   ├── alerts/
│   │   │   └── page.tsx            # Expiry & stock alerts
│   │   └── reports/
│   │       └── page.tsx            # Analytics & reports
│   ├── api/
│   │   ├── invoice/
│   │   │   └── route.ts            # PDF generation
│   │   └── barcode/
│   │       └── route.ts            # Barcode generation
│   └── layout.tsx
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── barcode-scanner.tsx          # Barcode scanning component
│   ├── pos-cart.tsx                 # Shopping cart for POS
│   ├── invoice-template.tsx         # GST invoice template
│   ├── expiry-badge.tsx             # Color-coded expiry indicator
│   ├── dashboard-stats.tsx          # Analytics cards
│   └── data-table.tsx               # Reusable table component
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Supabase browser client
│   │   ├── server.ts                # Supabase server client
│   │   └── middleware.ts            # Auth middleware
│   ├── powersync/
│   │   ├── client.ts                # PowerSync setup
│   │   ├── schema.ts                # Local SQLite schema
│   │   └── connector.ts             # Supabase connector
│   ├── utils.ts                     # Utility functions
│   └── constants.ts                 # App constants
├── hooks/
│   ├── use-powersync.ts             # PowerSync React hook
│   ├── use-barcode-scanner.ts       # Barcode scanning hook
│   └── use-medicines.ts             # Medicine queries
├── types/
│   └── database.ts                  # TypeScript types
└── middleware.ts                    # Next.js middleware for auth
```


## Development Roadmap (Hackathon Speed)

### Phase 1: Foundation (2-3 hours)

**Priority: CRITICAL**

1. Initialize Next.js 15 project with TypeScript
```bash
npx create-next-app@latest pharmacy-inventory --typescript --tailwind --app
cd pharmacy-inventory
npm install @supabase/supabase-js @supabase/ssr
npm install @powersync/web @powersync/react @journeyapps/wa-sqlite
```

2. Set up Supabase project and run database schema[^4][^5]
3. Configure environment variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_POWERSYNC_URL=your-powersync-url
```

4. Create Supabase client setup
5. Set up authentication (login/register pages)[^6][^1]

### Phase 2: PowerSync Integration (1-2 hours)

**Priority: CRITICAL**

1. Create PowerSync instance on PowerSync Cloud
2. Connect to Supabase database[^2][^3]
3. Configure sync rules (copy YAML above)[^7][^8]
4. Implement PowerSync client in Next.js[^9][^10]
```typescript
// lib/powersync/client.ts
import { PowerSyncDatabase } from '@powersync/web';
import { WASQLiteDBAdapter } from '@journeyapps/wa-sqlite';
import { schema } from './schema';

export const powerSync = new PowerSyncDatabase({
  database: {
    dbFilename: 'pharmacy.db',
    dbLocation: 'indexeddb',
  },
  schema: schema,
  flags: {
    enableMultiTabs: true,
  },
});
```


### Phase 3: Core POS System (3-4 hours)

**Priority: HIGH**

1. Build medicine inventory list with search[^11][^12]
2. Implement barcode scanning for POS[^13][^14]
```bash
npm install @undecaf/barcode-detector-polyfill
```

3. Create POS billing interface
4. Implement cart functionality with batch selection
5. Generate GST-compliant invoices[^15][^11]
```bash
npm install jspdf
```


### Phase 4: Inventory Management (2-3 hours)

**Priority: HIGH**

1. Add medicine form with batch tracking
2. Implement stock management
3. Create supplier management
4. Build customer database

### Phase 5: Alerts System (1-2 hours)

**Priority: MEDIUM**

1. Automated expiry alerts (15/30/90 days)[^11][^15]
```sql
-- Database function for expiry alerts
CREATE OR REPLACE FUNCTION check_expiry_alerts()
RETURNS void AS $$
BEGIN
  -- Insert 15-day alerts
  INSERT INTO expiry_alerts (medicine_batch_id, alert_type)
  SELECT id, '15_days'
  FROM medicine_batches
  WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '15 days'
  AND NOT EXISTS (
    SELECT 1 FROM expiry_alerts 
    WHERE medicine_batch_id = medicine_batches.id 
    AND alert_type = '15_days'
  );
  
  -- 30-day and 90-day alerts similar
END;
$$ LANGUAGE plpgsql;
```

2. Low stock alerts
3. Notification system (browser notifications)[^9]

### Phase 6: Analytics Dashboard (2-3 hours)

**Priority: MEDIUM**

1. Sales analytics (daily/weekly/monthly)
2. Top-selling medicines
3. Revenue charts
4. Expiring stock overview
```bash
npm install recharts
```


### Phase 7: Polish \& Testing (1-2 hours)

**Priority: LOW**

1. Mobile-responsive UI adjustments
2. Role-based access control enforcement[^5][^4]
3. Print invoice functionality
4. Error handling and validation

## MVP Feature Priority List

### Must-Have (Build First)

1. ✅ Authentication \& user roles
2. ✅ Medicine inventory CRUD
3. ✅ Batch management with expiry
4. ✅ Barcode scanning POS
5. ✅ Basic billing \& invoice generation
6. ✅ PowerSync real-time sync
7. ✅ Expiry alerts (30-day minimum)

### Should-Have (If Time Permits)

8. Customer management
9. Supplier management
10. Sales history \& filtering
11. Basic analytics dashboard
12. Stock alerts
13. GST-compliant reporting

### Nice-to-Have (Post-Hackathon)

14. Advanced analytics with charts
15. Multi-pharmacy support
16. Email/SMS notifications
17. Prescription management
18. Return/exchange handling

## Technical Implementation Guide

### Barcode Scanning Implementation

```typescript
// components/barcode-scanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { BarcodeDetector } from '@undecaf/barcode-detector-polyfill';

export function BarcodeScanner({ onScan }: { onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let detector: BarcodeDetector;
    let animationFrame: number;

    async function startScanning() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        detector = new BarcodeDetector({ formats: ['ean_13', 'code_128'] });
        
        const scan = async () => {
          if (videoRef.current && isScanning) {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              onScan(barcodes[^0].rawValue);
              setIsScanning(false);
            }
          }
          animationFrame = requestAnimationFrame(scan);
        };
        
        scan();
      } catch (error) {
        console.error('Scanner error:', error);
      }
    }

    if (isScanning) {
      startScanning();
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isScanning, onScan]);

  return (
    <div className="relative">
      <video ref={videoRef} className="w-full rounded-lg" />
      <button 
        onClick={() => setIsScanning(!isScanning)}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
      </button>
    </div>
  );
}
```


### Invoice PDF Generation

```typescript
// app/api/invoice/route.ts
import { jsPDF } from 'jspdf';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const invoice = await request.json();
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Tax Invoice', 105, 20, { align: 'center' });
  
  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice No: ${invoice.invoice_number}`, 20, 40);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 45);
  doc.text(`GSTIN: YOUR_GST_NUMBER`, 20, 50);
  
  // Customer details
  doc.text(`Customer: ${invoice.customer?.name || 'Walk-in'}`, 20, 60);
  doc.text(`Phone: ${invoice.customer?.phone || 'N/A'}`, 20, 65);
  
  // Items table
  let y = 80;
  doc.text('Item', 20, y);
  doc.text('Qty', 100, y);
  doc.text('Price', 130, y);
  doc.text('GST', 160, y);
  doc.text('Total', 180, y);
  
  y += 10;
  invoice.sale_items.forEach((item: any) => {
    doc.text(item.medicine_name, 20, y);
    doc.text(item.quantity.toString(), 100, y);
    doc.text(item.unit_price.toFixed(2), 130, y);
    doc.text(item.gst_amount.toFixed(2), 160, y);
    doc.text(item.total_price.toFixed(2), 180, y);
    y += 8;
  });
  
  // Totals
  y += 10;
  doc.text(`Tax Amount: ${invoice.tax_amount.toFixed(2)}`, 140, y);
  doc.text(`Net Amount: ${invoice.net_amount.toFixed(2)}`, 140, y + 8);
  
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  });
}
```


### PowerSync React Hook

```typescript
// hooks/use-powersync.ts
import { usePowerSync } from '@powersync/react';
import { useEffect, useState } from 'react';

export function useMedicines() {
  const powerSync = usePowerSync();
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const fetchMedicines = async () => {
      const result = await powerSync.getAll(
        'SELECT m.*, COUNT(mb.id) as batch_count FROM medicines m ' +
        'LEFT JOIN medicine_batches mb ON m.id = mb.medicine_id ' +
        'GROUP BY m.id ORDER BY m.name'
      );
      setMedicines(result);
    };

    fetchMedicines();

    // Watch for changes
    const unsubscribe = powerSync.watch(
      'SELECT * FROM medicines',
      [],
      { onResult: () => fetchMedicines() }
    );

    return () => unsubscribe();
  }, [powerSync]);

  return medicines;
}
```


## Where to Start Building (Step-by-Step)

1. **Day 0 (Setup)**: Create Supabase project, run schema, deploy PowerSync instance
2. **Hour 1-3**: Next.js setup, auth pages, Supabase client configuration
3. **Hour 4-6**: PowerSync integration, sync rules deployment, test sync
4. **Hour 7-10**: Medicine inventory UI, add/edit forms, list view
5. **Hour 10-13**: POS interface, barcode scanner, cart functionality
6. **Hour 13-15**: Billing logic, invoice generation, payment processing
7. **Hour 15-17**: Batch management, expiry tracking, alerts
8. **Hour 17-19**: Dashboard analytics, sales reports
9. **Hour 19-21**: Customer/supplier management
10. **Hour 21-24**: Testing, bug fixes, UI polish, demo preparation

## Affordable Pricing Model

**Development Stack Costs:**

- Supabase Free Tier: 500MB database, 2GB bandwidth (FREE)
- PowerSync Free Tier: 3 concurrent connections (FREE for hackathon)
- Vercel Free Tier: Unlimited personal projects (FREE)
- **Total Monthly Cost**: \$0 for MVP/hackathon

**Production Scaling:**

- Supabase Pro: \$25/month (8GB database, 250GB bandwidth)
- PowerSync Starter: \$29/month (unlimited connections)
- Vercel Pro: \$20/month (optional)
- **Total**: ~\$54-74/month for small pharmacy

This setup gives you a production-ready, offline-first pharmacy management system with real-time sync, perfect for a hackathon demo![^3][^1][^2][^7][^4]
<span style="display:none">[^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37]</span>

<div align="center">⁂</div>

[^1]: https://nextjs.org/blog/next-15

[^2]: https://supabase.com/partners/integrations/powersync

[^3]: https://docs.powersync.com/integration-guides/supabase-+-powersync

[^4]: https://supabase.com/docs/guides/database/postgres/row-level-security

[^5]: https://supabase.com/features/row-level-security

[^6]: https://nextjs.org/docs/app

[^7]: https://docs.powersync.com/integration-guides/supabase-+-powersync/rls-and-sync-rules

[^8]: https://www.powersync.com/blog/powersync-and-supabase-just-the-basics

[^9]: https://blog.flutterflow.io/introducing-a-local-database-that-auto-syncs-with-supabase/

[^10]: https://ignitecookbook.com/docs/recipes/LocalFirstDataWithPowerSync/

[^11]: https://five.co/blog/create-a-pharmacy-database/

[^12]: https://databasesample.com/database/pharmacy-database

[^13]: https://scanbot.io/techblog/next-js-barcode-scanner-tutorial/

[^14]: https://dev.to/khalid7487/implementing-a-qr-scanner-and-send-request-to-backend-using-next-js-3c7o

[^15]: https://www.cmarix.com/blog/pharmacy-inventory-management-software/

[^16]: https://nextjs.org/blog

[^17]: https://www.reddit.com/r/nextjs/comments/1nyc7aw/deep_dive_into_nextjs_2025_leveraging_the_latest/

[^18]: https://nextjs.org/docs/app/getting-started

[^19]: https://www.youtube.com/watch?v=6jQdZcYY8OY

[^20]: https://janhesters.com/blog/how-to-set-up-nextjs-15-for-production-in-2025

[^21]: https://staff.emu.edu.tr/ekremvaroglu/en/Documents/Pharmacy Database Scheme - without solution.pdf

[^22]: https://javascript.plainenglish.io/nextjs-15-features-b30d575f8dd7

[^23]: https://docs.powersync.com/integration-guides/supabase-+-powersync/realtime-streaming

[^24]: https://www.scribd.com/document/521612761/Pharmacy-Management-System-database-flow

[^25]: https://supabase.com/partners/integrations

[^26]: https://databasesample.com/database/pharmacy-management-system-database

[^27]: https://stackoverflow.com/questions/79218804/powersync-sync-rule-issue-with-supabase-auth-relationship-data

[^28]: https://docs.powersync.com/installation/authentication-setup/supabase-auth

[^29]: https://www.themorrow.digital/blog/setting-up-a-secure-supabase-project

[^30]: https://www.youtube.com/watch?v=tJ7PUX98Mlg

[^31]: https://docs.powersync.com/usage/sync-rules

[^32]: https://dantedecodes.vercel.app/articles/fortify-your-database-supabases-row-level-security-3fh8/

[^33]: https://www.reddit.com/r/nextjs/comments/1i6e132/barcode_scanning_in_nextjs/

[^34]: https://www.youtube.com/watch?v=Xg5FTYGPn5U

[^35]: https://www.youtube.com/watch?v=Ow_Uzedfohk

[^36]: https://stackoverflow.com/questions/73011149/how-to-implement-qr-code-scannermobile-in-next-js

[^37]: https://bndkt.com/blog/2023/building-an-offline-first-chat-app-using-powersync-and-supabase

