import React, { useState, useEffect } from "react";
import { X, Edit3, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import api, { errMsg } from "../lib/api";

const CATEGORIES = ["Retail", "Technical", "Equipment", "Disposal", "Others"];
const UNITS = ["Piece", "Bottle", "Box", "Gram", "Kg", "ML", "Liter", "Packet"];

export default function EditProductModal({ product, products = [], onClose, onSuccess }) {
  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "Retail");
  const [brand, setBrand] = useState(product?.brand || "");
  const [vendorName, setVendorName] = useState(product?.vendor_name || "");
  const [unit, setUnit] = useState(product?.unit || "Piece");
  const [unitCost, setUnitCost] = useState(product?.unit_cost || 0);
  const [mrp, setMrp] = useState(product?.mrp || 0);
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price || 0);
  const [storeQty, setStoreQty] = useState(product?.store_qty || product?.current_stock || 0);
  const [minStock, setMinStock] = useState(product?.min_stock ?? 0);
  const [submitting, setSubmitting] = useState(false);

  const [existingProducts, setExistingProducts] = useState(products || []);
  useEffect(() => {
    if (!products || products.length === 0) {
      api.get("/inventory/skus")
        .then(res => {
          setExistingProducts(res.data || []);
        })
        .catch(err => console.error(err));
    }
  }, [products]);

  const uniqueBrands = Array.from(new Set(existingProducts.map(p => p.brand).filter(Boolean)));
  const uniqueVendors = Array.from(new Set(existingProducts.map(p => p.vendor_name || p.vendor).filter(Boolean)));

  if (!product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/inventory/product/${product.id}`, {
        name: name.trim(),
        category,
        brand: brand.trim(),
        vendor_name: vendorName.trim(),
        unit,
        unit_cost: parseFloat(unitCost) || 0,
        mrp: parseFloat(mrp) || parseFloat(unitCost) * 1.5,
        selling_price: parseFloat(sellingPrice) || parseFloat(unitCost),
        store_qty: parseFloat(storeQty) || 0,
        min_stock: isNaN(parseFloat(minStock)) ? 0 : parseFloat(minStock),
      });

      toast.success(`Successfully updated item '${res.data.name}'!`);
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-slate-950 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 text-white flex items-center justify-between border-b border-amber-500/30 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="lss-overline text-amber-300">Inventory Master Registry</span>
            </div>
            <h3 className="font-serif-lux text-2xl font-bold tracking-tight text-white mt-0.5">
              Edit Inventory Product Item
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Product Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="lss-input w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="lss-input w-full text-xs font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="lss-input w-full text-xs font-semibold"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="lss-input w-full text-xs font-semibold"
                list="edit-product-brands"
              />
              <datalist id="edit-product-brands">
                {uniqueBrands.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Vendor Name</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="lss-input w-full text-xs font-semibold"
                list="edit-product-vendors"
              />
              <datalist id="edit-product-vendors">
                {uniqueVendors.map(v => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <span className="lss-overline text-amber-900">Pricing & Stock Adjustments</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Purchase Cost (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="lss-input w-full font-bold tabular"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">MRP (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="lss-input w-full font-bold tabular"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Stock Qty</label>
                <input
                  type="number"
                  value={storeQty}
                  onChange={(e) => setStoreQty(e.target.value)}
                  className="lss-input w-full font-bold tabular"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Min Stock Alert</label>
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="lss-input w-full font-bold tabular"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="lss-btn-outline px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="lss-btn-gold px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>{submitting ? "Updating..." : "Save Product Changes"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
