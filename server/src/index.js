import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import { seedDatabaseIfEmpty } from './config/seedData.js';

// Route Imports
import billsRouter from './routes/bills.js';
import productsRouter from './routes/products.js';
import customersRouter from './routes/customers.js';
import purchasesRouter from './routes/purchases.js';
import suppliersRouter from './routes/suppliers.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';
import uploadRouter from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Connect to MongoDB & Seed initial data
(async () => {
  const isConnected = await connectDB();
  if (isConnected) {
    await seedDatabaseIfEmpty();
  }
})();

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    message: 'Sastika Mobiles Billing API is running smoothly with MongoDB & Cloudinary',
    timestamp: new Date().toISOString(),
    shop: {
      name: process.env.SHOP_NAME || 'Sastika Mobiles',
      gstin: process.env.SHOP_GSTIN || '33AAAAA0000A1Z5',
      phone: process.env.SHOP_PHONE || '+91 98765 43210',
    },
  });
});

// Shop details endpoint
app.get('/api/shop-info', (req, res) => {
  res.json({
    name: process.env.SHOP_NAME || 'Sastika Mobiles',
    gstin: process.env.SHOP_GSTIN || '33AAAAA0000A1Z5',
    phone: process.env.SHOP_PHONE || '+91 98765 43210',
    address: process.env.SHOP_ADDRESS || 'Main Road, Bazaar Street, Tamil Nadu',
  });
});

// API Routes for all pages
app.use('/api/products', productsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/upload', uploadRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Sastika Mobiles Billing Server running on http://localhost:${PORT}`);
  console.log(`🍃 Database: MongoDB (${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sastika_mobiles_billing'})`);
  console.log(`☁️ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Needs Credentials in .env'}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
