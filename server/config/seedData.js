import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Bill } from '../models/Bill.js';
import { Supplier } from '../models/Supplier.js';
import { PurchaseBill } from '../models/PurchaseBill.js';
import { Settings } from '../models/Settings.js';
import { User } from '../models/User.js';

export const seedDatabaseIfEmpty = async () => {
  try {
    // 0. Seed Admin User if missing
    const adminUser = await User.findOne({ username: 'officetest' });
    if (!adminUser) {
      await User.create({
        username: 'officetest',
        password: 'admin$123',
        name: 'Rajesh Kumar',
        role: 'admin',
        shopName: 'Sastika Mobiles',
      });
      console.log('✅ Seeded default Admin User (officetest)');
    }

    // 1. Seed Settings if empty
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        shopName: process.env.SHOP_NAME || 'Sastika Mobiles',
        gstin: process.env.SHOP_GSTIN || '33AAAAA0000A1Z5',
        phone: process.env.SHOP_PHONE || '+91 98765 43210',
        address: process.env.SHOP_ADDRESS || 'Main Road, Bazaar Street, Tamil Nadu',
        tagline: 'Premium Smartphones & Genuine Accessories',
        thermalPrinter: {
          paperSize: '3-inch',
          showQrCode: true,
          showImeiBarcode: true,
          printFooterNote:
            'Thank you for shopping at Sastika Mobiles! Items with physical damage are not eligible for warranty.',
        },
      });
      console.log('✅ Seeded default Store Settings');
    }

    // 2. Seed Products if empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const initialProducts = [
        {
          id: 'prod-1',
          name: 'Vivo V29 5G (8GB / 128GB)',
          variant: 'Himalayan Blue',
          sku: 'VIV-V29-BLU-08',
          category: 'Smartphones',
          brand: 'Vivo',
          model: 'V2250',
          price: 31999,
          costPrice: 26800,
          margin: 19.3,
          gstRate: 18,
          hsnCode: '85171300',
          stock: 12,
          rackLocation: 'Rack A1',
          isDualImei: true,
          statusTag: '12 IMEIs in Rack A1',
          imeiNumbers: ['863456789012341', '863456789012342', '863456789012343', '863456789012344'],
          imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&auto=format&fit=crop&q=80',
        },
        {
          id: 'prod-2',
          name: 'Samsung Galaxy M34 5G (6GB / 128GB)',
          variant: 'Prism Silver',
          sku: 'SAM-M34-SLV-06',
          category: 'Smartphones',
          brand: 'Samsung',
          model: 'SM-M346B',
          price: 16999,
          costPrice: 14900,
          margin: 14.0,
          gstRate: 18,
          hsnCode: '85171300',
          stock: 2,
          minThreshold: 5,
          rackLocation: 'Rack A2',
          isDualImei: true,
          statusTag: 'Threshold: 5 Units',
          imeiNumbers: ['352345678901231', '352345678901232'],
          imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300&auto=format&fit=crop&q=80',
        },
        {
          id: 'prod-3',
          name: 'Apple 20W USB-C Power Adapter',
          variant: 'Original Retail Box',
          sku: '194252157008',
          ean: '194252157008',
          category: 'Fast Chargers',
          brand: 'Apple',
          model: 'A2305',
          price: 1900,
          costPrice: 1320,
          margin: 43.9,
          gstRate: 18,
          hsnCode: '85044090',
          stock: 3,
          minThreshold: 10,
          rackLocation: 'Rack C3',
          statusTag: 'Critical Reorder (3 Left)',
          imeiNumbers: [],
          imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
        },
        {
          id: 'prod-4',
          name: 'boAt Rockerz 255 Pro+ Wireless Neckband',
          variant: 'Active Teal',
          sku: 'BOAT-RCK-255-TL',
          category: 'TWS Earbuds',
          brand: 'boAt',
          model: 'Rockerz 255 Pro+',
          price: 1299,
          costPrice: 850,
          margin: 52.8,
          gstRate: 18,
          hsnCode: '85183000',
          stock: 4,
          minThreshold: 8,
          rackLocation: 'Rack D1',
          statusTag: 'Threshold: 8 Units',
          imeiNumbers: [],
          imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80',
        },
        {
          id: 'prod-5',
          name: 'Redmi Note 13 5G (8GB / 256GB)',
          variant: 'Gold 128GB',
          sku: 'RED-N13-GLD-08',
          category: 'Smartphones',
          brand: 'Xiaomi',
          model: '2312DRAABG',
          price: 17999,
          costPrice: 15200,
          margin: 18.4,
          gstRate: 18,
          hsnCode: '85171300',
          stock: 1,
          minThreshold: 4,
          rackLocation: 'Rack A3',
          isDualImei: true,
          statusTag: '1 Unit only! (Critical)',
          imeiNumbers: ['864567890123451'],
          imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
        },
        {
          id: 'prod-6',
          name: 'Super D 9H Matte Tempered Glass',
          variant: 'Universal Pack',
          sku: 'ACC-SPD-9H-MAT',
          category: 'Screen Protectors',
          brand: 'GorillaArmor',
          model: 'Super D 9H',
          price: 299,
          costPrice: 75,
          margin: 75.0,
          gstRate: 18,
          hsnCode: '70071900',
          stock: 164,
          rackLocation: 'Rack E2',
          statusTag: 'High Margin Leader',
          imeiNumbers: [],
          imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300&auto=format&fit=crop&q=80',
        },
      ];
      await Product.insertMany(initialProducts);
      console.log(`✅ Seeded ${initialProducts.length} initial Products`);
    }

    // 3. Seed Customers if empty
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      const initialCustomers = [
        {
          id: '#CUST-9840',
          name: 'Suresh Kumar',
          tier: 'VIP MEMBER',
          address: 'CIT Nagar, Chennai',
          phone: '+91 98401 23456',
          email: 'suresh.kumar@chennaitech.com',
          lifetimeSales: 68450.0,
          billsCount: 5,
          lastBillDate: '24 Oct',
          khataBalance: 0.0,
          khataStatus: 'settled',
          loyaltyPoints: 197,
          avatarBg: 'bg-blue-600 text-white',
          initials: 'SK',
        },
        {
          id: '#CUST-9841',
          name: 'Priya Raman',
          tier: 'REGULAR',
          address: 'T. Nagar, Chennai',
          phone: '+91 97910 88721',
          email: 'priya.raman@outlook.com',
          lifetimeSales: 24199.0,
          billsCount: 2,
          lastBillDate: '20 Oct',
          khataBalance: 6999.0,
          dueText: 'Due since 24 Oct',
          khataStatus: 'pending',
          loyaltyPoints: 45,
          avatarBg: 'bg-indigo-100 text-indigo-700',
          initials: 'PR',
        },
        {
          id: '#CUST-9712',
          name: 'Karthik Raja',
          tier: 'KHATA RISK',
          address: 'Vadapalani, Chennai',
          phone: '+91 94441 55092',
          email: 'karthik.raja@yahoo.in',
          lifetimeSales: 78999.0,
          billsCount: 3,
          lastBillDate: '01 Oct',
          khataBalance: 31999.0,
          dueText: '> 35 DAYS DUE',
          khataStatus: 'risk',
          loyaltyPoints: 310,
          avatarBg: 'bg-rose-100 text-rose-700',
          initials: 'KR',
        },
      ];
      await Customer.insertMany(initialCustomers);
      console.log(`✅ Seeded ${initialCustomers.length} initial Customers`);
    }

    // 4. Seed Suppliers if empty
    const supplierCount = await Supplier.countDocuments();
    if (supplierCount === 0) {
      const initialSuppliers = [
        {
          id: 'SUP-01',
          name: 'Supreme Tele Distribution',
          address: 'Ritchie St, Chennai',
          phone: '+91 94441 55221',
          email: 'orders@supremetele.in',
          gstin: '33AABCS1234F1Z1',
          contactPerson: 'M. Senthil Kumar',
          category: 'Smartphones & Smart Devices',
          totalPurchases: 350500,
          balanceDue: 200500,
        },
        {
          id: 'SUP-02',
          name: 'Anand Telecom Chennai',
          address: 'Mount Road, Chennai',
          phone: '+91 98840 12903',
          email: 'anand.telecom@yahoo.com',
          gstin: '33BBCPT4412B1Z4',
          contactPerson: 'Anand Narayanan',
          category: 'Audio & Wearables',
          totalPurchases: 48250,
          balanceDue: 0,
        },
        {
          id: 'SUP-05',
          name: 'Redington India Ltd',
          address: 'Guindy Industrial Estate, Chennai',
          phone: '+91 98410 22345',
          email: 'sales.chennai@redington.co.in',
          gstin: '33AAACR1234F1Z5',
          contactPerson: 'G. Sundaram',
          category: 'Apple & Oneplus Distribution',
          totalPurchases: 345000,
          balanceDue: 45000,
        },
      ];
      await Supplier.insertMany(initialSuppliers);
      console.log(`✅ Seeded ${initialSuppliers.length} initial Suppliers`);
    }

    // 5. Seed Bills if empty
    const billCount = await Bill.countDocuments();
    if (billCount === 0) {
      const initialBills = [
        {
          id: 'bill-1',
          invoiceNumber: 'INV-2024-0028',
          date: '2024-10-24',
          time: '14:32',
          customer: {
            id: '#CUST-9840',
            name: 'Suresh Kumar',
            phone: '+91 98401 23456',
            tier: 'VIP MEMBER',
          },
          items: [
            {
              productId: 'prod-1',
              name: 'Vivo V29 5G (8GB / 128GB)',
              imei: '863456789012341',
              quantity: 1,
              unitPrice: 31999,
              gstRate: 18,
              taxableAmount: 27117.8,
              cgst: 2440.6,
              sgst: 2440.6,
              total: 31999,
            },
            {
              productId: 'prod-3',
              name: 'Apple 20W USB-C Power Adapter',
              quantity: 1,
              unitPrice: 1900,
              gstRate: 18,
              taxableAmount: 1610.17,
              cgst: 144.91,
              sgst: 144.91,
              total: 1900,
            },
          ],
          subTotal: 28727.97,
          cgstTotal: 2585.51,
          sgstTotal: 2585.51,
          totalTax: 5171.02,
          grandTotal: 33899,
          paidAmount: 33899,
          balanceDue: 0,
          paymentMode: 'UPI (GPay)',
          tenderMode: 'UPI (GPay)',
          status: 'PAID',
          customerType: 'MEMBER',
          itemSummary: 'Vivo V29 5G (Himalayan Blue) + Apple 20W Adapter',
          subSummary: 'IMEI: 863456789012341 (1 Yr Mfr Warranty)',
        },
      ];
      await Bill.insertMany(initialBills);
      console.log(`✅ Seeded ${initialBills.length} initial Bills`);
    }

    // 6. Seed PurchaseBills if empty
    const purchaseCount = await PurchaseBill.countDocuments();
    if (purchaseCount === 0) {
      const initialPurchases = [
        {
          id: 'po-1',
          supplierInvoiceNumber: 'RED-INV-8902',
          date: '2024-10-22',
          supplier: {
            name: 'Redington India Ltd',
            address: 'Guindy Industrial Estate, Chennai',
            phone: '+91 98410 22345',
            gstin: '33AAACR1234F1Z5',
          },
          itemsSummary: '15x Apple 20W Adapters, 10x OnePlus Earbuds',
          unitsCount: 25,
          imeiLoggedCount: 0,
          isBarcoded: true,
          totalAmount: 345000,
          paidAmount: 300000,
          balanceDue: 45000,
          dueNotice: 'Credit 15 Days',
          paymentStatus: 'PARTIAL DUE',
          stockSyncStatus: 'Verified',
          taxAuditStatus: 'ITC Claimed (18%)',
        },
      ];
      await PurchaseBill.insertMany(initialPurchases);
      console.log(`✅ Seeded ${initialPurchases.length} initial Purchase Bills`);
    }
  } catch (err) {
    console.warn('Seeding note:', err.message);
  }
};
