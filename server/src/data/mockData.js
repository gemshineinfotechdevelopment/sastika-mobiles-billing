// Initial mock data for Sastika Mobiles Billing Software

export let products = [
  {
    id: "prod-1",
    name: "Redmi Note 13 Pro 5G",
    category: "Smartphones",
    brand: "Xiaomi",
    model: "Note 13 Pro (8GB/256GB)",
    price: 24999,
    costPrice: 22500,
    gstRate: 18,
    hsnCode: "85171300",
    stock: 14,
    imeiNumbers: ["863456789012345", "863456789012346"]
  },
  {
    id: "prod-2",
    name: "Samsung Galaxy A55 5G",
    category: "Smartphones",
    brand: "Samsung",
    model: "A55 (8GB/128GB)",
    price: 36999,
    costPrice: 33200,
    gstRate: 18,
    hsnCode: "85171300",
    stock: 8,
    imeiNumbers: ["352345678901234", "352345678901235"]
  },
  {
    id: "prod-3",
    name: "Vivo V30 5G",
    category: "Smartphones",
    brand: "Vivo",
    model: "V30 (8GB/128GB)",
    price: 31999,
    costPrice: 28900,
    gstRate: 18,
    hsnCode: "85171300",
    stock: 6,
    imeiNumbers: ["869876543210987"]
  },
  {
    id: "prod-4",
    name: "65W SuperVOOC Fast Charger",
    category: "Accessories",
    brand: "OnePlus",
    model: "Type-C 65W",
    price: 1499,
    costPrice: 900,
    gstRate: 18,
    hsnCode: "85044030",
    stock: 45,
    imeiNumbers: []
  },
  {
    id: "prod-5",
    name: "Boat Airdopes 141 ANC",
    category: "Audio",
    brand: "boAt",
    model: "141 ANC TWS",
    price: 1699,
    costPrice: 1100,
    gstRate: 18,
    hsnCode: "85183000",
    stock: 25,
    imeiNumbers: []
  },
  {
    id: "prod-6",
    name: "9H Gorilla Tempered Glass",
    category: "Accessories",
    brand: "Generic",
    model: "Universal Curved Edge",
    price: 199,
    costPrice: 40,
    gstRate: 18,
    hsnCode: "70071900",
    stock: 120,
    imeiNumbers: []
  }
];

export let customers = [
  {
    id: "cust-1",
    name: "Muthu Kumar",
    phone: "9876543210",
    email: "muthu@example.com",
    address: "Gandhi Nagar, Madurai",
    gstin: ""
  },
  {
    id: "cust-2",
    name: "Praveen Raj",
    phone: "9843210987",
    email: "praveen@example.com",
    address: "Anna Salai, Chennai",
    gstin: "33BBBBB1111B1Z2"
  }
];

export let bills = [
  {
    id: "INV-2026-0001",
    invoiceNumber: "INV-0001",
    date: new Date().toISOString(),
    customer: {
      name: "Muthu Kumar",
      phone: "9876543210",
      address: "Gandhi Nagar, Madurai",
      gstin: ""
    },
    items: [
      {
        productId: "prod-1",
        name: "Redmi Note 13 Pro 5G",
        model: "Note 13 Pro (8GB/256GB)",
        imei: "863456789012345",
        quantity: 1,
        unitPrice: 24999,
        gstRate: 18,
        taxableAmount: 21185.59,
        cgst: 1906.70,
        sgst: 1906.70,
        total: 24999
      },
      {
        productId: "prod-6",
        name: "9H Gorilla Tempered Glass",
        model: "Universal Curved Edge",
        imei: "",
        quantity: 1,
        unitPrice: 199,
        gstRate: 18,
        taxableAmount: 168.64,
        cgst: 15.18,
        sgst: 15.18,
        total: 199
      }
    ],
    subTotal: 21354.23,
    cgstTotal: 1921.88,
    sgstTotal: 1921.88,
    totalTax: 3843.76,
    grandTotal: 25198,
    paymentMode: "UPI",
    notes: "Thanks for shopping with Sastika Mobiles!"
  }
];
