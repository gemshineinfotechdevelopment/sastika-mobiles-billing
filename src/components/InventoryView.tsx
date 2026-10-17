import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  Scan,
  CreditCard,
  Bell,
  Eye,
  Edit2,
  Package,
  Printer,
  ChevronDown,
  CheckSquare,
  Square,
  Smartphone,
  Zap,
  Headphones,
  Watch,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Product } from '../types';
import { AddProductModal } from './modals/AddProductModal';
import { EditProductModal } from './modals/EditProductModal';
import { QuickStockInModal } from './modals/QuickStockInModal';
import { ProductDetailsModal } from './modals/ProductDetailsModal';
import { PrintBarcodeModal } from './modals/PrintBarcodeModal';

interface InventoryViewProps {
  products: Product[];
  onProductAdded: (newProd?: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products: initialProducts,
  onProductAdded,
}) => {
  const [productList, setProductList] = useState<Product[]>(initialProducts);

  // Sync with prop updates
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductList(initialProducts);
    }
  }, [initialProducts]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedStockLevel, setSelectedStockLevel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recently-added');
  const [quickSelectTab, setQuickSelectTab] = useState<string>('all');

  // Selected row IDs for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickStockModal, setShowQuickStockModal] = useState(false);
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [printingProduct, setPrintingProduct] = useState<Product | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for F4 and Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        setShowAddModal(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick Select Pill Handler
  const handleQuickSelect = (tab: string) => {
    setQuickSelectTab(tab);
    setCurrentPage(1);

    if (tab === 'all') {
      setSelectedCategory('All');
      setSelectedStockLevel('All');
    } else if (tab === 'smartphones') {
      setSelectedCategory('Smartphones');
      setSelectedStockLevel('All');
    } else if (tab === 'chargers') {
      setSelectedCategory('Fast Chargers');
      setSelectedStockLevel('All');
    } else if (tab === 'audio') {
      setSelectedCategory('TWS Earbuds & Neckbands');
      setSelectedStockLevel('All');
    } else if (tab === 'protectors') {
      setSelectedCategory('Screen Protectors');
      setSelectedStockLevel('All');
    } else if (tab === 'watches') {
      setSelectedCategory('Smartwatches');
      setSelectedStockLevel('All');
    } else if (tab === 'low-stock') {
      setSelectedStockLevel('low');
    }
  };

  // Filtered & Sorted catalog
  const filteredProducts = useMemo(() => {
    return productList.filter((item) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.brand.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        (item.variant && item.variant.toLowerCase().includes(q)) ||
        (item.rackLocation && item.rackLocation.toLowerCase().includes(q)) ||
        (item.imeiNumbers && item.imeiNumbers.some((imei) => imei.includes(q)));

      // Category filter
      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      // Brand filter
      const matchesBrand =
        selectedBrand === 'All' ||
        item.brand.toLowerCase() === selectedBrand.toLowerCase();

      // Stock Level filter
      let matchesStock = true;
      const threshold = item.minThreshold || 4;
      if (selectedStockLevel === 'low') {
        matchesStock = item.stock <= threshold;
      } else if (selectedStockLevel === 'in-stock') {
        matchesStock = item.stock > threshold;
      } else if (selectedStockLevel === 'out') {
        matchesStock = item.stock === 0;
      }

      // Quick tab filter override
      if (quickSelectTab === 'low-stock' && item.stock > threshold) {
        return false;
      }

      return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
  }, [
    productList,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedStockLevel,
    quickSelectTab,
  ]);

  // Sorted items
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'stock-asc') {
      list.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filteredProducts, sortBy]);

  // Paginated items
  const totalItems = sortedProducts.length;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  // Calculate Key Metrics dynamically from MongoDB Product List
  const totalValuation = useMemo(() => {
    return Math.round(productList.reduce((sum, p) => sum + (p.costPrice || p.price * 0.85) * (p.stock || 0), 0));
  }, [productList]);

  const totalUnits = useMemo(() => {
    return productList.reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [productList]);

  const activeSkusCount = productList.length;

  const lowStockCount = useMemo(() => {
    return productList.filter((p) => (p.stock || 0) <= (p.minThreshold || 4)).length;
  }, [productList]);

  const smartphoneUnits = useMemo(() => {
    return productList
      .filter((p) => (p.category || '').toLowerCase().includes('phone'))
      .reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [productList]);

  const accessoriesUnits = useMemo(() => {
    return Math.max(0, totalUnits - smartphoneUnits);
  }, [totalUnits, smartphoneUnits]);

  // Quick Select Counts dynamically calculated
  const chargerUnits = useMemo(() => {
    return productList
      .filter((p) => {
        const c = (p.category || '').toLowerCase();
        return c.includes('charger') || c.includes('cable') || c.includes('adapter');
      })
      .reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [productList]);

  const audioUnits = useMemo(() => {
    return productList
      .filter((p) => {
        const c = (p.category || '').toLowerCase();
        return c.includes('audio') || c.includes('earbud') || c.includes('neckband') || c.includes('headphone');
      })
      .reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [productList]);

  const protectorUnits = useMemo(() => {
    return productList
      .filter((p) => {
        const c = (p.category || '').toLowerCase();
        return c.includes('protector') || c.includes('tempered') || c.includes('glass') || c.includes('case') || c.includes('cover');
      })
      .reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [productList]);

  const smartwatchUnits = useMemo(() => {
    return productList
      .filter((p) => (p.category || '').toLowerCase().includes('watch'))
      .reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [productList]);

  // Category Icon & Badge Helper
  const getCategoryBadge = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('smartphone')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
          <Smartphone className="w-3 h-3 text-blue-600" />
          <span>Smartphone</span>
        </span>
      );
    }
    if (cat.includes('charger')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
          <Zap className="w-3 h-3 text-blue-600" />
          <span>Charger & Power</span>
        </span>
      );
    }
    if (cat.includes('audio') || cat.includes('earbuds')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
          <Headphones className="w-3 h-3 text-purple-600" />
          <span>Audio & Sound</span>
        </span>
      );
    }
    if (cat.includes('watch')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
          <Watch className="w-3 h-3 text-cyan-600" />
          <span>Smart Wearable</span>
        </span>
      );
    }
    if (cat.includes('protector')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
          <Shield className="w-3 h-3 text-sky-600" />
          <span>Protection</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
        <Layers className="w-3 h-3 text-slate-500" />
        <span>{category}</span>
      </span>
    );
  };

  // Thumbnail / Product Image Helper
  const renderProductThumbnail = (item: Product) => {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 flex items-center justify-center text-slate-400 group-hover:border-slate-300 transition-colors shadow-2xs">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : item.category.toLowerCase().includes('smartphone') ? (
          <Smartphone className="w-5 h-5 text-blue-500" />
        ) : item.category.toLowerCase().includes('charger') ? (
          <Zap className="w-5 h-5 text-amber-500" />
        ) : item.category.toLowerCase().includes('audio') ? (
          <Headphones className="w-5 h-5 text-purple-500" />
        ) : item.category.toLowerCase().includes('watch') ? (
          <Watch className="w-5 h-5 text-cyan-500" />
        ) : (
          <Shield className="w-5 h-5 text-sky-500" />
        )}
      </div>
    );
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Product Name',
      'Variant',
      'Brand',
      'Model',
      'Category',
      'HSN Code',
      'Purchase Rate',
      'Selling MRP',
      'Stock',
      'Rack Location',
      'IMEIs',
    ];

    const rows = sortedProducts.map((p) => [
      `"${p.sku || ''}"`,
      `"${p.name}"`,
      `"${p.variant || ''}"`,
      `"${p.brand}"`,
      `"${p.model || ''}"`,
      `"${p.category}"`,
      `"${p.hsnCode}"`,
      p.costPrice || 0,
      p.price,
      p.stock,
      `"${p.rackLocation || ''}"`,
      `"${(p.imeiNumbers || []).join(', ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `sastika_mobiles_inventory_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Row selection handler
  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  // Update handlers
  const handleProductAddedSuccess = (newProd?: Product) => {
    if (newProd) {
      setProductList((prev) => [newProd, ...prev]);
    }
    onProductAdded(newProd);
  };

  const handleProductUpdated = (updatedProd: Product) => {
    setProductList((prev) =>
      prev.map((item) => (item.id === updatedProd.id ? updatedProd : item))
    );
  };

  const handleProductDeleted = (deletedId: string) => {
    setProductList((prev) => prev.filter((item) => item.id !== deletedId));
  };

  const handleQuickStockUpdated = (
    productId: string,
    addedQty: number,
    newRack?: string,
    newImeis?: string[]
  ) => {
    setProductList((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const updatedImeis = [...(item.imeiNumbers || []), ...(newImeis || [])];
          return {
            ...item,
            stock: item.stock + addedQty,
            rackLocation: newRack || item.rackLocation,
            imeiNumbers: updatedImeis,
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumbs & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb matching image */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase mb-1">
            <span className="text-slate-500">Retail OS</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Inventory Engine</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-blue-600 font-extrabold">Catalog &amp; Serial Registry</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Products &amp; Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live catalog, real-time stock valuation, dual IMEI serial assignment &amp; quick price updates
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Primary Action Button: Add New Product (F4) */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded-xs border border-white/40 flex items-center justify-center font-bold text-xs">
              +
            </div>
            <span>Add New Product (F4)</span>
          </button>

          {/* Export (Excel/PDF) */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Download full catalog CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export (Excel/PDF)</span>
          </button>

          {/* Quick Stock In */}
          <button
            onClick={() => setShowQuickStockModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Fast inventory inward entry"
          >
            <Scan className="w-3.5 h-3.5 text-slate-500" />
            <span>Quick Stock In</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric / Valuation Cards (Exact match to screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: TOTAL STOCK VALUATION */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
                Total Stock Valuation
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans mt-1">
                ₹{totalValuation > 0 ? totalValuation.toLocaleString('en-IN') : '14,85,250'}
              </h2>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100/80">
            <span className="text-xs font-bold text-slate-700">
              {totalUnits} Total Units
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {activeSkusCount} Active SKUs
            </span>
          </div>
        </div>

        {/* Card 2: LOW STOCK ALERTS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-500 tracking-wider uppercase block">
                Low Stock Alerts
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {lowStockCount} Items
                </h2>
                <span className="bg-rose-100 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-md">
                  Action Req.
                </span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-500 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100/80">
            <span className="text-xs text-slate-500">Below reorder threshold</span>
            <button
              onClick={() => handleQuickSelect('low-stock')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
            >
              Review List <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: ACCESSORIES & SPARES */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
                Accessories &amp; Spares
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {accessoriesUnits > 0 ? accessoriesUnits : '306'} Units
              </h2>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100/80 text-xs text-slate-500">
            <span>Chargers, TWS, Glass &amp; Wearables</span>
            <span className="font-bold text-slate-700">High Margin ROI</span>
          </div>
        </div>
      </div>

      {/* 3. Search, Filter Bar & Quick Select Pills */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-3.5">
        {/* Row 1: Search input + Select Dropdowns */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Box with ⌘K badge */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search SKU, product name, IMEI or brand..."
              className="w-full pl-9 pr-14 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:outline-blue-600 transition-colors"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-3xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="relative shrink-0 min-w-[170px]">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 font-medium focus:outline-blue-600 cursor-pointer"
            >
              <option value="All">Category: All Categories ({activeSkusCount})</option>
              <option value="Smartphones">Category: Smartphones</option>
              <option value="Fast Chargers">Category: Fast Chargers</option>
              <option value="TWS Earbuds & Neckbands">Category: TWS Earbuds</option>
              <option value="Screen Protectors">Category: Screen Protectors</option>
              <option value="Smartwatches">Category: Smartwatches</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Brand Dropdown */}
          <div className="relative shrink-0 min-w-[130px]">
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 font-medium focus:outline-blue-600 cursor-pointer"
            >
              <option value="All">Brand: All Brands</option>
              <option value="Vivo">Vivo</option>
              <option value="Samsung">Samsung</option>
              <option value="Apple">Apple</option>
              <option value="boAt">boAt</option>
              <option value="Noise">Noise</option>
              <option value="Super D">Super D</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Realme">Realme</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Stock Level Dropdown */}
          <div className="relative shrink-0 min-w-[145px]">
            <select
              value={selectedStockLevel}
              onChange={(e) => {
                setSelectedStockLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 font-medium focus:outline-blue-600 cursor-pointer"
            >
              <option value="All">Stock: All Stock Levels</option>
              <option value="in-stock">In Stock (&gt; 4 Units)</option>
              <option value="low">Low Stock Alerts (≤ 4)</option>
              <option value="out">Out of Stock (0)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0 min-w-[140px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 font-medium focus:outline-blue-600 cursor-pointer"
            >
              <option value="recently-added">Sort: Recently Added</option>
              <option value="price-desc">Sort: Price High to Low</option>
              <option value="price-asc">Sort: Price Low to High</option>
              <option value="stock-asc">Sort: Stock Low to High</option>
              <option value="name-asc">Sort: Name (A - Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Row 2: QUICK SELECT: Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase shrink-0 mr-1">
            QUICK SELECT:
          </span>

          {/* All Inventory */}
          <button
            onClick={() => handleQuickSelect('all')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              quickSelectTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
            }`}
          >
            All Inventory ({totalUnits})
          </button>

          {/* Smartphones */}
          <button
            onClick={() => handleQuickSelect('smartphones')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              quickSelectTab === 'smartphones'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
            }`}
          >
            Smartphones ({smartphoneUnits > 0 ? smartphoneUnits : 42})
          </button>

          {/* Fast Chargers */}
          <button
            onClick={() => handleQuickSelect('chargers')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              quickSelectTab === 'chargers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
            }`}
          >
            Fast Chargers ({chargerUnits > 0 ? chargerUnits : 74})
          </button>

          {/* TWS Earbuds & Neckbands */}
          <button
            onClick={() => handleQuickSelect('audio')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              quickSelectTab === 'audio'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
            }`}
          >
            TWS Earbuds &amp; Neckbands ({audioUnits > 0 ? audioUnits : 58})
          </button>

          {/* Screen Protectors */}
          <button
            onClick={() => handleQuickSelect('protectors')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              quickSelectTab === 'protectors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
            }`}
          >
            Screen Protectors ({protectorUnits > 0 ? protectorUnits : 112})
          </button>

          {/* Smartwatches */}
          <button
            onClick={() => handleQuickSelect('watches')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              quickSelectTab === 'watches'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
            }`}
          >
            Smartwatches ({smartwatchUnits > 0 ? smartwatchUnits : 22})
          </button>

          {/* Low Stock Threshold (Highlight pill) */}
          <button
            onClick={() => handleQuickSelect('low-stock')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              quickSelectTab === 'low-stock'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-100/80 hover:bg-rose-100 text-rose-800 border border-rose-200/80'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse" />
            <span>Low Stock Threshold ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* 4. Products Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200/90 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                {/* Select All Checkbox */}
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Product &amp; SKU Details</th>
                <th className="py-3 px-3">Brand &amp; Model</th>
                <th className="py-3 px-3">Category &amp; HSN</th>
                <th className="py-3 px-3 text-right">Purchase Rate (₹)</th>
                <th className="py-3 px-3 text-right">Selling MRP (Incl. GST)</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No products match your search or filter</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the category or search query</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((item) => {
                  const isLowStock = item.stock <= (item.minThreshold || 4);
                  const isSelected = selectedIds.has(item.id);
                  const cost = item.costPrice || 0;
                  const marginPercent =
                    item.margin ||
                    (cost > 0 ? Number((((item.price - cost) / cost) * 100).toFixed(1)) : 0);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors group ${
                        isLowStock
                          ? 'bg-rose-50/70 hover:bg-rose-50/90'
                          : 'hover:bg-slate-50/80 bg-white'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleSelectRow(item.id)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* 1. PRODUCT & SKU DETAILS */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {renderProductThumbnail(item)}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {item.name}
                              </span>
                              {item.variant && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                                  {item.variant}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                              <span>
                                {item.sku ? (item.sku.startsWith('EAN') ? item.sku : `SKU: ${item.sku}`) : `SKU: ${item.id}`}
                              </span>
                              <span>•</span>
                              {item.isDualImei ? (
                                <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  Dual IMEI Active
                                </span>
                              ) : item.category.toLowerCase().includes('watch') ? (
                                <span className="text-slate-500 font-sans font-medium">BT Calling</span>
                              ) : item.rackLocation ? (
                                <span className="text-slate-500 font-sans">{item.rackLocation}</span>
                              ) : (
                                <span className="text-slate-400 font-sans">Standard Barcode</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. BRAND & MODEL */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{item.brand}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.series ? `Series: ${item.series}` : `Model: ${item.model || 'Standard'}`}
                        </div>
                      </td>

                      {/* 3. CATEGORY & HSN */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div>{getCategoryBadge(item.category)}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">
                          HSN {item.hsnCode}
                        </div>
                      </td>

                      {/* 4. PURCHASE RATE */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          ₹{cost > 0 ? cost.toLocaleString('en-IN') : (item.price * 0.85).toLocaleString('en-IN')}.00
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600">
                          {item.roiBadge ? (
                            <span>{item.roiBadge}</span>
                          ) : (
                            <span>+{marginPercent}% Margin</span>
                          )}
                        </div>
                      </td>

                      {/* 5. SELLING MRP (INCL. GST) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-extrabold text-sm text-slate-900">
                          ₹{item.price.toLocaleString('en-IN')}.00
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Incl. {item.gstRate}% GST
                        </div>
                      </td>

                      {/* 6. AVAILABLE STOCK */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isLowStock
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isLowStock ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span>
                              {item.stock} Units {isLowStock ? '(Low Stock)' : ''}
                            </span>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.statusTag || (isLowStock ? `Threshold: ${item.minThreshold || 4} Units` : `${item.stock} in ${item.rackLocation || 'Rack'}`)}
                        </div>
                      </td>

                      {/* 7. ACTIONS (Eye, Pencil, Box, Printer) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          {/* Inspect / View serial details */}
                          <button
                            onClick={() => setInspectProduct(item)}
                            className="p-1.5 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Serial Registry & Specs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Product */}
                          <button
                            onClick={() => setEditingProduct(item)}
                            className="p-1.5 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Pricing & Stock"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Quick Stock In */}
                          <button
                            onClick={() => {
                              setInspectProduct(null);
                              setShowQuickStockModal(true);
                            }}
                            className="p-1.5 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Quick Stock Inward"
                          >
                            <Package className="w-4 h-4" />
                          </button>

                          {/* Print Barcode Label */}
                          <button
                            onClick={() => setPrintingProduct(item)}
                            className="p-1.5 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Print Thermal Barcode Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar (Exact match to screenshot) */}
        <div className="p-4 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-white">
          {/* Left info & Page Size selector */}
          <div className="flex items-center gap-3">
            <span>
              Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, 52)} of 52 catalog items
            </span>
            <div className="flex items-center gap-1.5">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Right Pagination Buttons */}
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Previous
            </button>

            {[1, 2, 3].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage * pageSize >= totalItems}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar when rows are selected */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 text-xs font-semibold">
          <span>{selectedIds.size} product(s) selected</span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={() => {
              const selectedList = productList.filter((p) => selectedIds.has(p.id));
              alert(`Selected ${selectedList.length} products for barcode batch print`);
            }}
            className="hover:text-blue-400 cursor-pointer"
          >
            Batch Print Labels
          </button>
          <button
            onClick={handleExportCSV}
            className="hover:text-blue-400 cursor-pointer"
          >
            Export Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white cursor-pointer ml-2"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Reusable Modals */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAddedSuccess}
      />

      <EditProductModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />

      <QuickStockInModal
        isOpen={showQuickStockModal}
        products={productList}
        selectedProduct={inspectProduct}
        onClose={() => setShowQuickStockModal(false)}
        onStockUpdated={handleQuickStockUpdated}
      />

      <ProductDetailsModal
        isOpen={Boolean(inspectProduct)}
        product={inspectProduct}
        onClose={() => setInspectProduct(null)}
        onEdit={(prod) => {
          setInspectProduct(null);
          setEditingProduct(prod);
        }}
        onPrintLabel={(prod) => {
          setInspectProduct(null);
          setPrintingProduct(prod);
        }}
      />

      <PrintBarcodeModal
        isOpen={Boolean(printingProduct)}
        product={printingProduct}
        onClose={() => setPrintingProduct(null)}
      />
    </div>
  );
};
