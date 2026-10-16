# Sastika Mobiles - Full Stack Billing Software

A modern billing software & inventory management system tailored for mobile handset and accessory retail stores, built with React, Vite, Tailwind CSS v4, and Node.js Express.

---

## 📁 Project Architecture

```
sastika-mobiles-billing/
├── .env                  # Frontend environment variables
├── .env.example          # Frontend template
├── .gitignore            # Gitignore covering root & server
├── index.html
├── package.json          # Root scripts & frontend dependencies
├── tsconfig.json
├── vite.config.ts        # Vite + Tailwind v4 + API proxy
│
├── src/                  # 🖥️ FRONTEND (React 19 + TypeScript)
│   ├── assets/           # Logos & static assets
│   ├── components/       # UI Components
│   │   ├── Header.tsx            # Navigation & live server status
│   │   ├── InvoiceGenerator.tsx  # Billing POS form (GST & IMEI)
│   │   ├── InvoiceModal.tsx      # Printable GST Tax Invoice
│   │   ├── RecentBills.tsx       # Invoice history & search
│   │   └── InventoryView.tsx     # Stock management & product catalog
│   ├── services/
│   │   └── api.ts        # API client connected to backend
│   ├── types/
│   │   └── index.ts      # TypeScript interfaces
│   ├── App.css           # Print-specific stylesheets
│   ├── App.tsx           # Main application dashboard
│   ├── index.css         # Tailwind CSS v4 entry point
│   └── main.tsx
│
└── server/               # ⚙️ BACKEND (Node.js + Express ES Modules)
    ├── .env              # Backend environment variables
    ├── .env.example      # Backend template
    ├── package.json      # Express, CORS, Morgan, Dotenv
    └── src/
        ├── index.js      # Server entry point & health check
        ├── data/
        │   └── mockData.js   # In-memory store (products, bills, customers)
        └── routes/
            ├── bills.js      # Invoice creation, calculation & history
            ├── products.js   # Stock inventory & IMEI tracking
            └── customers.js  # Customer directory
```

---

## 🚀 Quick Start

### 1. Install Dependencies
Install all frontend and backend dependencies in one command:
```bash
npm run install:all
```
*(Or run `npm install` in the root folder, and `npm install` inside the `server/` folder).*

### 2. Start Both Frontend & Backend Concurrently (Recommended)
```bash
npm run dev:all
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 3. Alternative Individual Run Commands
```bash
# Run only Frontend (Vite)
npm run dev

# Run only Backend (Node --watch)
npm run dev:server
```

---

## 🔑 Environment Variables

### Frontend (`.env`)
| Variable | Value | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |
| `VITE_SHOP_NAME` | `Sastika Mobiles` | Shop title on bill header |
| `VITE_SHOP_GSTIN` | `33AAAAA0000A1Z5` | Shop GSTIN number |
| `VITE_SHOP_PHONE` | `+91 98765 43210` | Contact phone on invoices |
| `VITE_SHOP_ADDRESS` | `Main Road, Bazaar Street, Tamil Nadu` | Shop address |

### Backend (`server/.env`)
| Variable | Value | Description |
|---|---|---|
| `PORT` | `5000` | Express server port |
| `NODE_ENV` | `development` | Runtime environment |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `SHOP_NAME` | `Sastika Mobiles` | Shop name for API responses |

---

## 📡 API Endpoints

- `GET /api/health` - Server health status and shop metadata
- `GET /api/shop-info` - Shop configuration details
- `GET /api/bills` - Retrieve past invoices (supports `?search=`)
- `POST /api/bills` - Generate new invoice with auto GST and stock reduction
- `GET /api/bills/:id` - Retrieve a specific invoice
- `GET /api/products` - Retrieve inventory list (supports `?search=` and `?category=`)
- `POST /api/products` - Add new product with serial/IMEI support
- `GET /api/customers` - Customer directory
- `POST /api/customers` - Register a customer

---

## 🖨️ Key Features
- **Tailwind CSS v4**: Zero-config `@tailwindcss/vite` integration.
- **GST Calculation**: Automated 18% GST (CGST 9% + SGST 9%) and reverse taxable calculations.
- **IMEI & Serial Number Tracking**: Specific serial/IMEI tracking for mobile devices.
- **Printable Invoices**: Native browser print formatting optimized for standard A4 / thermal invoice receipts.
- **Stock Management**: Real-time stock alerts for low inventory.
