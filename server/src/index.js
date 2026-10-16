import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import billsRouter from './routes/bills.js';
import productsRouter from './routes/products.js';
import customersRouter from './routes/customers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sastika Mobiles Billing API is running smoothly',
    timestamp: new Date().toISOString(),
    shop: {
      name: process.env.SHOP_NAME || 'Sastika Mobiles',
      gstin: process.env.SHOP_GSTIN || '33AAAAA0000A1Z5',
      phone: process.env.SHOP_PHONE || '+91 98765 43210'
    }
  });
});

// Shop details endpoint
app.get('/api/shop-info', (req, res) => {
  res.json({
    name: process.env.SHOP_NAME || 'Sastika Mobiles',
    gstin: process.env.SHOP_GSTIN || '33AAAAA0000A1Z5',
    phone: process.env.SHOP_PHONE || '+91 98765 43210',
    address: process.env.SHOP_ADDRESS || 'Main Road, Bazaar Street, Tamil Nadu'
  });
});

// API Routes
app.use('/api/bills', billsRouter);
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Sastika Mobiles Billing Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check available at http://localhost:${PORT}/api/health`);
});
