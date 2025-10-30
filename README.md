# 🏥 NexPharm - Next-Generation Pharmacy Management System

A modern, real-time pharmacy inventory and POS management system built with Next.js, Supabase, and PowerSync for seamless offline-first functionality.

![NexPharm](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🌟 Features

### Core Functionality
- 💊 **Medicine Inventory Management** - Complete CRUD operations with batch tracking
- 🏷️ **Barcode Scanning** - Quick medicine lookup using barcode scanner integration
- 📦 **Batch & Expiry Tracking** - Automatic tracking of medicine batches and expiration dates
- 🛒 **Point of Sale (POS) System** - Fast billing with real-time stock updates
- 📄 **GST-Compliant Invoicing** - Generate tax-compliant invoices

### Smart Features
- 🔔 **Automated Alerts System**
  - 15/30/90 day expiry warnings
  - Low stock notifications
  - Browser push notifications
- 📊 **Analytics Dashboard**
  - Sales reports (daily/weekly/monthly)
  - Revenue tracking
  - Top-selling medicines
  - Inventory value overview
- 👥 **Multi-User Support**
  - Role-based access control
  - Pharmacy-specific data isolation
- 🔄 **Real-Time Sync** - PowerSync integration for offline-first functionality
- 📱 **Mobile Responsive** - Works seamlessly on all devices

### Management Tools
- 👤 **Customer Management** - Track customer purchase history and details
- 🏭 **Supplier Management** - Maintain supplier database and relationships
- 📈 **Medicine Groups** - Organize medicines by category and type
- ⚠️ **Medicine Shortage Tracking** - Monitor medicines below reorder level

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, React
- **Backend**: Supabase (PostgreSQL)
- **Real-time Sync**: PowerSync
- **Database ORM**: Kysely
- **UI Components**: shadcn/ui, Lucide Icons
- **Forms**: Formik + Yup
- **Charts**: Recharts
- **Barcode Scanner**: undecaf/barcode-detector-polyfill
- **Styling**: Tailwind CSS

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/pnpm/yarn
- Supabase account
- PowerSync account

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nexpharm.git
cd nexpharm
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. **Environment Variables**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_POWERSYNC_URL=your_powersync_instance_url
```

4. **Database Setup**

Run the SQL migrations in your Supabase project:
- Create tables for medicines, pharmacy_medicines, medicine_batches, sales, customers, suppliers, etc.
- Set up Row Level Security (RLS) policies
- Configure PowerSync sync rules

5. **Run Development Server**
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗂️ Project Structure

```
nexpharm/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   │   ├── medicines/     # Medicine management
│   │   ├── pos/           # Point of Sale
│   │   ├── inventory/     # Inventory management
│   │   ├── customers/     # Customer management
│   │   ├── suppliers/     # Supplier management
│   │   ├── alerts/        # Alerts & notifications
│   │   └── analytics/     # Analytics dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
├── hooks/                 # Custom React hooks
│   └── use-medicines.ts   # Medicine operations hook
├── lib/                   # Utilities & configurations
│   └── powersync/         # PowerSync setup
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/nexpharm)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Environment Variables (Production)

Make sure to add these in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_POWERSYNC_URL`

## 📊 Database Schema

### Core Tables
- `medicines` - Master medicine catalog
- `pharmacy_medicines` - Pharmacy-specific medicine inventory
- `medicine_batches` - Batch tracking with expiry dates
- `sales` - Sales transactions
- `sale_items` - Individual sale line items
- `customers` - Customer database
- `suppliers` - Supplier information
- `expiry_alerts` - Automated expiry notifications

### Multi-Pharmacy Architecture
The system supports multiple pharmacies with data isolation using the `pharmacy_id` foreign key across all relevant tables.

## 🎯 Key Features Implementation

### 1. Real-Time Sync with PowerSync
- Offline-first architecture
- Automatic sync when online
- Conflict resolution
- Multi-device support

### 2. Barcode Scanning
- Browser-based barcode detection
- Quick medicine lookup
- Add to cart directly from scan

### 3. Automated Alerts
- Background jobs check expiry dates
- Push notifications for low stock
- Email alerts (optional)

### 4. Analytics Dashboard
- Visual sales trends
- Top-performing medicines
- Revenue insights
- Inventory valuation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Sayan Das**
- GitHub: [@sayandas24](https://github.com/sayandas24)

## 🙏 Acknowledgments

- Built for hackathon demonstration
- Inspired by real-world pharmacy management challenges
- Powered by modern web technologies

## 📞 Support

For support, email your-email@example.com or open an issue in the GitHub repository.

---

Made with ❤️ for improving pharmacy operations
