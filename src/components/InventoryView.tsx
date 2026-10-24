import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Package,
  Edit2,
  Trash2,
  Printer,
  AlertTriangle,
  X,
  FolderPlus,
} from 'lucide-react';
import type { Product } from '../types';
import { api } from '../services/api';
import { AddProductModal } from './modals/AddProductModal';
import { EditProductModal } from './modals/EditProductModal';
import { QuickStockInModal } from './modals/QuickStockInModal';
import { ProductDetailsModal } from './modals/ProductDetailsModal';
import { PrintBarcodeModal } from './modals/PrintBarcodeModal';
import { AddCategoryModal } from './modals/AddCategoryModal';

interface InventoryViewProps {
  products: Product[];
  onProductAdded: (newProd?: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products: initialProducts,
  onProductAdded,
}) => {

  
  const [productList, setProductList] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (initialProducts) {
      setProductList(initialProducts);
    }
  }, [initialProducts]);

  // Fetch live products directly from MongoDB on mount
  useEffect(() => {
    api.getProducts()
      .then((res) => {
        if (res && res.products) {
          setProductList(res.products);
        }
      })
      .catch((err) => console.warn('Could not load live products from database:', err));
  }, []);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [showQuickStockModal, setShowQuickStockModal] = useState(false);
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [printingProduct, setPrintingProduct] = useState<Product | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch live categories from database
  const loadCategories = () => {
    api.getCategories()
      .then((res) => {
        if (res && res.categories) {
          const names = res.categories.map((c: any) => (typeof c === 'string' ? c : c.name));
          setExtraCategories(names);
        }
      })
      .catch((err) => console.warn('Could not load categories:', err));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    extraCategories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    productList.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return ['All', ...Array.from(set)];
  }, [productList, extraCategories]);

  const allCategoryNames = useMemo(() => {
    return categories.filter((c) => c !== 'All');
  }, [categories]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.model && p.model.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.imeiNumbers && p.imeiNumbers.some((im) => im.includes(q)));

      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const isLowStock = (p.stock || 0) <= (p.minThreshold || 4);
      const matchLowStock = !filterLowStockOnly || isLowStock;

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [productList, searchQuery, selectedCategory, filterLowStockOnly]);

  // Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Summary Metrics
  const totalStockUnits = useMemo(() => {
    return productList.reduce((acc, p) => acc + (p.stock || 0), 0);
  }, [productList]);

  const lowStockCount = useMemo(() => {
    return productList.filter((p) => (p.stock || 0) <= (p.minThreshold || 4)).length;
  }, [productList]);

  // Handlers
  const handleProductAddedSuccess = (newProd?: Product) => {
    if (newProd) {
      setProductList((prev) => [newProd, ...prev]);
    }
    onProductAdded(newProd);
  };

  const handleProductUpdated = (updated: Product) => {
    setProductList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    onProductAdded();
  };

  const handleProductDeleted = async (deletedId: string) => {
    try {
      await api.deleteProduct(deletedId);
    } catch (err) {
      console.warn('API delete product notice:', err);
    }
    setProductList((prev) => prev.filter((p) => p.id !== deletedId));
    onProductAdded();
  };

  const handleQuickStockUpdated = (
    productId: string,
    addedQty: number
  ) => {
    setProductList((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            stock: (p.stock || 0) + addedQty,
          };
        }
        return p;
      })
    );
    onProductAdded();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header with Stats & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory & Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total Items: <strong className="text-slate-900 font-bold">{productList.length}</strong> • Total Units: <strong className="text-slate-900 font-bold">{totalStockUnits}</strong>
            {lowStockCount > 0 && (
              <span className="text-amber-700 font-semibold ml-2 inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInspectProduct(null);
              setShowQuickStockModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Package className="w-4 h-4 text-slate-500" />
            <span>Quick Stock In</span>
          </button>

          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
            title="Create a new product category"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>+ New Category</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Category Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);

                
                setCurrentPage(1);
              }}
              placeholder="Search product name, brand, or model..."
              className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              filterLowStockOnly
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            ⚠️ Low Stock Only
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Clean Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Product Name & Specs</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching products found. Click "+ Add Product" to create one.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const isOutOfStock = (product.stock || 0) <= 0;
                  const isLowStock = (product.stock || 0) <= (product.minThreshold || 4);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block leading-tight">
                          {product.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                          {product.brand} {product.model} {product.variant ? `• ${product.variant}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {product.category || 'Accessories'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {product.stock || 0} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-sans whitespace-nowrap">
                        ₹{(product.price || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono whitespace-nowrap">
                        {product.costPrice ? `₹${product.costPrice.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectProduct(product);
                              setShowQuickStockModal(true);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            title="Quick Stock In (+)"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProduct(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintingProduct(product)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Print Barcode Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete ${product.name}?`)) {
                                handleProductDeleted(product.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Mobile Product Cards View (sm:hidden) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {paginatedProducts.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs px-4">
              No matching products found. Tap "+ Add Product" to create one.
            </div>
          ) : (
            paginatedProducts.map((product) => {
              const isOutOfStock = (product.stock || 0) <= 0;
              const isLowStock = (product.stock || 0) <= (product.minThreshold || 4);
              return (
                <div key={product.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-700">
                          {product.category || 'Accessories'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOutOfStock ? '0 in stock' : `${product.stock || 0} units`}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {product.brand} {product.model} {product.variant ? `• ${product.variant}` : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-sm text-slate-900 font-sans block">
                        ₹{(product.price || 0).toLocaleString('en-IN')}
                      </span>
                      {product.costPrice && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Cost: ₹{product.costPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Quick Action Buttons Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectProduct(product);
                        setShowQuickStockModal(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[11px] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Stock In</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintingProduct(product)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Print Barcode"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete ${product.name}?`)) {
                            handleProductDeleted(product.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-{Math.min(totalItems, currentPage * pageSize)} of {totalItems} items
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Modals */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAddedSuccess}
        categories={allCategoryNames}
        onCategoryAdded={(newCat) => {
          setExtraCategories((prev) => (prev.includes(newCat) ? prev : [...prev, newCat]));
          setSelectedCategory(newCat);
        }}
      />

      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onCategoryAdded={(newCat) => {
          setExtraCategories((prev) => (prev.includes(newCat) ? prev : [...prev, newCat]));
          setSelectedCategory(newCat);
        }}
      />

      <EditProductModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
        categories={allCategoryNames}
      />

      <QuickStockInModal
        isOpen={showQuickStockModal}
        products={productList}
        selectedProduct={inspectProduct}
        onClose={() => {
          setShowQuickStockModal(false);
          setInspectProduct(null);
        }}
        onStockUpdated={handleQuickStockUpdated}
      />

      <ProductDetailsModal
        isOpen={Boolean(inspectProduct && !showQuickStockModal)}
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
