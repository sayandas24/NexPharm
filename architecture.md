# NexPharm - System Architecture Documentation

## Executive Summary

NexPharm is a modern, offline-first pharmacy management system built with Next.js 15, featuring real-time data synchronization, barcode scanning, OCR capabilities, and comprehensive inventory management. The system supports multi-pharmacy operations with role-based access control and provides a complete Point of Sale (POS) solution with GST-compliant invoicing.

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [Problems & Solutions](#problems--solutions)
4. [Database Architecture](#database-architecture)
5. [Key Features](#key-features)
6. [Data Flow](#data-flow)
7. [Security Architecture](#security-architecture)
8. [Performance Optimizations](#performance-optimizations)

---

## Tech Stack

### Frontend Layer
- **Framework**: Next.js 15.5.6 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4 with PostCSS
- **UI Components**: 
  - Radix UI primitives (Dialog, Dropdown, Select, etc.)
  - shadcn/ui component library
  - Lucide React icons
- **Forms**: Formik + Yup validation
- **Charts**: Recharts for analytics visualization
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

### Backend & Data Layer
- **Database**: Supabase (PostgreSQL)
- **ORM**: Kysely (Type-safe SQL query builder)
- **Real-time Sync**: PowerSync (@powersync/web, @powersync/react)
- **Local Storage**: IndexedDB (via PowerSync)
- **Authentication**: Supabase Auth with SSR support (@supabase/ssr)

### Specialized Features
- **OCR Engine**: Tesseract.js 6.0.1 (for medicine label scanning)
- **Barcode Detection**: Browser-based barcode scanner
- **Fuzzy Search**: Fuse.js 7.1.0
- **Image Processing**: Custom utilities for OCR preprocessing
- **Loading Animations**: ldrs (loading indicators)

### Development Tools
- **Linting**: ESLint 9 with Next.js config
- **Type Checking**: TypeScript strict mode
- **Build Tool**: Next.js built-in (Turbopack/Webpack)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router (React 19)                              │
│  ├── (auth) - Authentication pages                          │
│  ├── (home) - Main application                              │
│  │   ├── Dashboard                                          │
│  │   ├── Inventory Management                               │
│  │   ├── POS System                                         │
│  │   ├── Reports & Analytics                                │
│  │   └── Scanner (OCR + Barcode)                           │
│  └── Middleware (Auth & Route Protection)                   │
├─────────────────────────────────────────────────────────────┤
│                    State Management                          │
│  ├── Custom Hooks (useMedicines, usePOS, useAlerts)        │
│  ├── PowerSync Context (Real-time sync state)              │
│  └── Local Cache (Recent scans, statistics)                │
├─────────────────────────────────────────────────────────────┤
│                    Data Sync Layer                           │
│  PowerSync Client                                           │
│  ├── Local Database (IndexedDB - pharmacy.db)              │
│  ├── Kysely Query Builder (Type-safe queries)              │
│  ├── Sync Engine (Bidirectional sync)                      │
│  └── Conflict Resolution                                    │
├─────────────────────────────────────────────────────────────┤
│                    Network Layer                             │
│  ├── Supabase Connector (Auth + Data sync)                 │
│  ├── REST API calls                                         │
│  └── WebSocket (Real-time updates)                         │
├─────────────────────────────────────────────────────────────┤
│                    Backend Services                          │
│  Supabase Platform                                          │
│  ├── PostgreSQL Database                                    │
│  ├── Authentication Service                                 │
│  ├── Row Level Security (RLS)                              │
│  ├── Real-time Subscriptions                               │
│  └── PowerSync Sync Rules                                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (home)/                   # Protected routes
│   │   ├── inventory/            # Medicine management
│   │   ├── pos/                  # Point of Sale
│   │   ├── reports/              # Analytics
│   │   ├── scan/                 # OCR Scanner
│   │   └── suppliers/            # Supplier management
│   ├── layout.tsx                # Root layout
│   └── middleware.ts             # Auth middleware
│
├── components/                   # React components
│   ├── main-components/          # Feature components
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   └── pos/
│   ├── scanner/                  # OCR/Barcode scanner
│   ├── shadcn-sidebar/           # Navigation
│   └── ui/                       # Reusable UI components
│
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Authentication
│   ├── useMedicines.ts           # Medicine CRUD
│   ├── usePOS.ts                 # POS operations
│   ├── useAlerts.ts              # Notifications
│   └── useDashboard.ts           # Analytics
│
├── lib/                          # Core libraries
│   ├── powersync/                # Sync configuration
│   │   ├── schema.ts             # Database schema
│   │   ├── PowersyncClient.ts    # Client setup
│   │   ├── PowersyncProvider.tsx # React context
│   │   └── SupabaseConnector.ts  # Backend connector
│   └── supabase/                 # Supabase setup
│       ├── SupabseServer.ts      # Server-side client
│       └── middleware.ts         # Auth middleware
│
├── services/                     # Business logic
│   ├── ocr-processor.service.ts  # Tesseract OCR
│   ├── medicine-match.service.ts # Fuzzy matching
│   ├── recent-scans.service.ts   # Scan history
│   ├── sales-statistics.service.ts
│   └── stock-checker.service.ts
│
├── types/                        # TypeScript definitions
│   ├── database-types.ts         # DB table types
│   ├── alert.types.ts
│   ├── scanner-types.ts
│   └── inventory-report.types.ts
│
└── utils/                        # Helper functions
    ├── image-processing.utils.ts # OCR preprocessing
    ├── text-matching.utils.ts    # Fuzzy search
    ├── scanner-error-handler.ts
    └── inventory-report.utils.ts
```

---

## Problems & Solutions

### Problem 1: Offline Functionality
**Challenge**: Pharmacies need to operate even without internet connectivity, especially in areas with unreliable networks.

**Solution**: 
- Implemented PowerSync for offline-first architecture
- Local IndexedDB database stores complete pharmacy data
- Bidirectional sync when connection is restored
- Automatic conflict resolution
- Connection status monitoring with auto-reconnect

**Implementation**:
```typescript
// PowerSync watches for changes and syncs automatically
for await (const result of powerSyncDb.watch(sql, parameters)) {
  await fetchMedicines(false); // Update UI on sync
}
```

### Problem 2: Multi-Pharmacy Data Isolation
**Challenge**: Multiple pharmacies using the same system need complete data isolation while sharing a master medicine catalog.

**Solution**:
- Two-tier medicine architecture:
  - `medicines` table: Global master catalog (no pharmacy_id)
  - `pharmacy_medicines` table: Junction table with pharmacy-specific data (pricing, stock, reorder levels)
- All transactional tables include `pharmacy_id` for data isolation
- Row Level Security (RLS) policies enforce access control
- Client-side joins for pharmacy-specific medicine data

**Database Design**:
```typescript
// Global catalog (shared)
medicines: { id, name, generic_name, manufacturer, ... }

// Pharmacy-specific (isolated)
pharmacy_medicines: { 
  pharmacy_id, 
  medicine_id, 
  mrp, 
  stock_quantity, 
  reorder_level 
}
```

### Problem 3: Medicine Identification Speed
**Challenge**: Manual medicine entry is slow and error-prone during busy hours.

**Solution**:
- Dual scanning approach:
  1. **Barcode Scanner**: Instant lookup via barcode
  2. **OCR Scanner**: Extract text from medicine labels using Tesseract.js
- Fuzzy matching algorithm for OCR results
- Recent scans cache for quick access
- Image preprocessing for better OCR accuracy

**OCR Pipeline**:
```
Image Capture → Preprocessing → Tesseract OCR → 
Text Cleaning → Fuzzy Matching → Medicine Selection
```

### Problem 4: Expiry & Stock Management
**Challenge**: Manual tracking of expiry dates and stock levels leads to losses and stockouts.

**Solution**:
- Automated alert system with three severity levels:
  - **Critical**: 15 days to expiry or out of stock
  - **Warning**: 30 days to expiry or low stock
  - **Info**: 90 days to expiry
- Real-time PowerSync watches for batch and stock changes
- Browser push notifications
- Batch-level inventory tracking (FEFO - First Expiry First Out)
- Automatic stock deduction on sales

**Alert Generation**:
```typescript
// Watches both expiry_alerts and stock_alerts tables
// Auto-refreshes UI on database changes
useEffect(() => {
  for await (const result of powerSyncDb.watch(sql, params)) {
    await fetchAlerts(false);
  }
}, [pharmacyId]);
```

### Problem 5: Real-time Inventory Updates
**Challenge**: Multiple users need to see live stock updates to avoid overselling.

**Solution**:
- PowerSync real-time sync across all connected devices
- Optimistic UI updates with server reconciliation
- Atomic batch quantity updates during sales
- Connection status indicator
- Automatic retry on network recovery

### Problem 6: Complex Sales Calculations
**Challenge**: GST calculations, discounts, and multi-batch sales are complex and error-prone.

**Solution**:
- Centralized calculation logic in `usePOS` hook
- Automatic GST calculation per item
- Batch-level pricing support
- Invoice generation with unique numbering
- Atomic transactions (sale + sale_items + batch updates)

**Sales Flow**:
```typescript
1. Add items to cart (with batch selection)
2. Calculate: subtotal + GST + discount = net amount
3. Create sale record
4. Create sale_items records
5. Update batch available_quantity
6. Generate GST-compliant invoice
```

### Problem 7: Type Safety & Data Integrity
**Challenge**: Runtime errors due to type mismatches and invalid queries.

**Solution**:
- Kysely for type-safe SQL queries
- Comprehensive TypeScript types for all tables
- Strict TypeScript configuration
- Schema validation at PowerSync level
- Formik + Yup for form validation

---

## Database Architecture

### Schema Overview

The database follows a multi-tenant architecture with pharmacy-level data isolation:

#### Core Tables

**1. Pharmacies & Users**
```
pharmacies
├── id (PK)
├── name, license_number, address
├── owner_id (FK → profiles)
├── subscription_plan
└── is_active

pharmacy_members
├── id (PK)
├── pharmacy_id (FK)
├── user_id (FK)
├── role (owner|admin|pharmacist|cashier)
└── is_active

profiles
├── id (PK)
├── full_name, email
├── default_pharmacy_id (FK)
└── avatar_url
```

**2. Medicine Catalog (Two-Tier)**
```
medicines (Global Catalog)
├── id (PK)
├── name, generic_name
├── manufacturer, category
├── barcode (UNIQUE)
├── dosage info, warnings
└── is_active

pharmacy_medicines (Junction Table)
├── id (PK)
├── pharmacy_id (FK)
├── medicine_id (FK)
├── mrp, price_range
├── stock_quantity
├── reorder_level
└── is_available

medicine_batches
├── id (PK)
├── pharmacy_id (FK)
├── medicine_id (FK)
├── batch_number
├── expiry_date
├── mrp, purchase_price, selling_price
├── quantity, available_quantity
└── gst_percentage
```

**3. Sales & Transactions**
```
sales
├── id (PK)
├── pharmacy_id (FK)
├── invoice_number (UNIQUE per pharmacy)
├── customer_id (FK, nullable)
├── user_id (FK)
├── total_amount, discount, tax, net_amount
├── payment_method, payment_status
└── created_at

sale_items
├── id (PK)
├── sale_id (FK)
├── pharmacy_id (FK)
├── medicine_batch_id (FK)
├── quantity, unit_price
├── gst_percentage, gst_amount
└── total_price

customers
├── id (PK)
├── pharmacy_id (FK)
├── name, phone, email
└── date_of_birth
```

**4. Alerts & Notifications**
```
expiry_alerts
├── id (PK)
├── pharmacy_id (FK)
├── medicine_batch_id (FK)
├── alert_type (15_days|30_days|90_days|expired)
├── is_acknowledged
└── acknowledged_by, acknowledged_at

stock_alerts
├── id (PK)
├── pharmacy_id (FK)
├── medicine_id (FK)
├── current_stock, reorder_level
└── is_resolved
```

**5. Suppliers**
```
suppliers
├── id (PK)
├── pharmacy_id (FK)
├── name, contact_person
├── phone, email, address
└── gst_number
```

### Indexing Strategy

```typescript
// PowerSync schema indexes for performance
{
  indexes: {
    pharmacy_idx: ['pharmacy_id'],
    medicine_idx: ['pharmacy_id', 'medicine_id'],
    expiry_idx: ['pharmacy_id', 'expiry_date'],
    batch_number_idx: ['pharmacy_id', 'batch_number'],
    barcode_idx: ['barcode'],
    composite_idx: ['pharmacy_id', 'medicine_id']
  }
}
```

### Data Isolation

- All pharmacy-specific tables include `pharmacy_id` foreign key
- PowerSync sync rules filter data by user's pharmacy membership
- Row Level Security (RLS) policies on Supabase enforce access control
- Client-side queries always filter by `pharmacy_id`

---

## Key Features

### 1. Offline-First Architecture
- Full CRUD operations work offline
- Local IndexedDB database (pharmacy.db)
- Automatic sync when online
- Conflict resolution
- Multi-tab support (desktop only)

### 2. Real-Time Synchronization
- PowerSync bidirectional sync
- WebSocket connections for live updates
- Optimistic UI updates
- Connection status monitoring
- Auto-reconnect on network recovery

### 3. Medicine Scanning
- **Barcode Scanner**: Browser-based barcode detection
- **OCR Scanner**: Tesseract.js for label text extraction
- Image preprocessing for accuracy
- Fuzzy matching (Fuse.js)
- Recent scans cache

### 4. Inventory Management
- Batch-level tracking
- Expiry date monitoring
- Stock level alerts
- Reorder level management
- FEFO (First Expiry First Out) support

### 5. Point of Sale (POS)
- Fast billing interface
- Multi-batch selection
- Automatic GST calculation
- Customer management
- Invoice generation
- Multiple payment methods

### 6. Alerts & Notifications
- Expiry alerts (15/30/90 days)
- Low stock alerts
- Critical stock alerts (out of stock)
- Browser push notifications
- Alert acknowledgement system

### 7. Analytics & Reports
- Sales reports (daily/weekly/monthly)
- Revenue tracking
- Top-selling medicines
- Inventory valuation
- Fast/slow-moving medicines
- Customer purchase history

### 8. Multi-Pharmacy Support
- Pharmacy-level data isolation
- Role-based access control
- Pharmacy switching
- Member management
- Subscription plans

---

## Data Flow

### Medicine Search Flow
```
User Input → Fuzzy Search (Fuse.js) → 
Filter by pharmacy_id → 
Join medicines + pharmacy_medicines → 
Display results with stock info
```

### Barcode Scan Flow
```
Camera Capture → Barcode Detection → 
Search by barcode → 
Fetch medicine + batches → 
Display medicine details
```

### OCR Scan Flow
```
Camera Capture → Image Preprocessing → 
Tesseract OCR → Text Extraction → 
Text Cleaning → Fuzzy Matching → 
Display top 5 matches → User Selection
```

### Sales Transaction Flow
```
1. Add items to cart (select batch)
2. Calculate totals (subtotal + GST - discount)
3. Select/create customer
4. Choose payment method
5. Generate invoice number
6. Create sale record
7. Create sale_items records
8. Update batch quantities
9. Sync to server
10. Print/display invoice
```

### Alert Generation Flow
```
Background Job (Supabase) → 
Check expiry dates & stock levels → 
Create alert records → 
PowerSync syncs to client → 
Display in UI → 
Browser notification
```

---

## Security Architecture

### Authentication
- Supabase Auth with JWT tokens
- Server-side session validation
- Cookie-based auth for SSR
- Middleware route protection
- Automatic token refresh

### Authorization
- Row Level Security (RLS) on Supabase
- Pharmacy membership validation
- Role-based access control (RBAC)
- Client-side pharmacy_id filtering
- PowerSync sync rules per user

### Data Protection
- HTTPS only
- Encrypted local storage (IndexedDB)
- Secure cookie settings
- Environment variable protection
- No sensitive data in client code

### Middleware Protection
```typescript
// Protects all routes except auth pages
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg)$).*)"
  ]
};
```

---

## Performance Optimizations

### 1. Database Optimizations
- Indexed queries on pharmacy_id, medicine_id, expiry_date
- Client-side joins for pharmacy_medicines
- Kysely compiled queries
- PowerSync local caching

### 2. UI Optimizations
- React 19 concurrent features
- Optimistic UI updates
- Debounced search inputs
- Lazy loading for images
- Virtual scrolling for large lists

### 3. Network Optimizations
- PowerSync delta sync (only changes)
- Compressed payloads
- Connection pooling
- Automatic retry with exponential backoff
- Offline queue for mutations

### 4. Code Splitting
- Next.js automatic code splitting
- Dynamic imports for heavy components
- Route-based splitting
- Lazy loading for Tesseract.js

### 5. Caching Strategy
- Recent scans cache (localStorage)
- Sales statistics cache
- Medicine search results cache
- PowerSync local database cache

### 6. Image Processing
- Canvas-based preprocessing
- Grayscale conversion
- Contrast enhancement
- Noise reduction
- Optimized for mobile devices

---

## Deployment Architecture

### Production Setup
```
Vercel (Frontend) ←→ Supabase (Backend)
                  ↓
              PowerSync (Sync Layer)
                  ↓
          Client (IndexedDB)
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=<supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
NEXT_PUBLIC_POWERSYNC_URL=<powersync_instance_url>
```

### Build Configuration
- TypeScript strict mode
- ESLint disabled during builds (for demo)
- Webpack fallbacks for Node.js modules
- Tesseract.js CDN configuration

---

## Future Enhancements

1. **Mobile Apps**: React Native version with same codebase
2. **Advanced Analytics**: ML-based demand forecasting
3. **Supplier Integration**: Direct ordering from suppliers
4. **E-Prescription**: Digital prescription management
5. **Multi-Language**: i18n support
6. **Voice Commands**: Voice-based medicine search
7. **Blockchain**: Immutable audit trail for compliance
8. **AI Chatbot**: Customer support automation

---

## Conclusion

NexPharm demonstrates a modern, production-ready architecture for pharmacy management with:
- Offline-first capabilities for reliability
- Real-time sync for multi-user collaboration
- Advanced scanning for operational efficiency
- Comprehensive inventory management
- Scalable multi-pharmacy support
- Type-safe development with TypeScript
- Security-first design

The architecture is designed to scale from single pharmacies to enterprise chains while maintaining performance, security, and user experience.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Author**: Sayan Das (@sayandas24)
