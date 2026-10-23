import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is always loaded from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Fix Windows / ISP Wi-Fi DNS querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if not allowed
}

export const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/sastika_mobiles_billing';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Error: ${error.message}`);
    return false;
  }
};
