"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, Plus, Minus, ChevronRight, Package, ArrowRight } from "lucide-react";

function CustomizationTags({ c }: { c: any }) {
  if (!c) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {c.size && (
        <span className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
          Size: {c.size}
        </span>
      )}
      {c.color && (
        <span className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
          Color: {c.color}
        </span>
      )}
      {c.embroideryNames?.filter(Boolean).length > 0 && (
        <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
          Embroidery: {c.embroideryNames.filter(Boolean).join(", ")}
        </span>
      )}
    </div>
  );
}

export default function CartPage() {
  const [items, setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    const res = await fetch("/api/cart");
    const data = await res.json();
    setItems(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  async function updateQty(itemId: string, qty: number) {
    setUpdating(itemId);
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity: qty }),
    });
    await fetchCart();
    window.dispatchEvent(new Event("cart-updated"));
    setUpdating(null);
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId);
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    await fetchCart();
    window.dispatchEvent(new Event("cart-updated"));
    setUpdating(null);
  }

  const subtotal = items.reduce((s, i) => s + Number(i.product.basePrice) * i.quantity, 0);
  const customTotal = items.reduce((s, i) => i.customization ? s + Number(i.product.customSurcharge) * i.quantity : s, 0);
  const shipping = 25;
  const total = subtotal + customTotal + shipping;

  if (loading) return (
    <div className="max-w-3xl space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">My Cart</h1>
        {items.length > 0 && (
          <span className="text-sm text-gray-500">{items.length} item{items.length > 1 ? "s" : ""}</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl py-20 text-center border border-gray-100">
          <ShoppingCart size={44} className="mx-auto text-gray-200 mb-4" />
          <p className="font-bold text-gray-700 mb-1">Your cart is empty</p>
          <p className="text-sm text-gray-400 mb-6">Browse the shop to add items</p>
          <Link href="/shop"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-gray-700 transition-colors">
            Go to Shop <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Cart items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className={`flex gap-4 p-4 transition-opacity ${updating === item.id ? "opacity-50 pointer-events-none" : ""}`}>
                {/* Product image */}
                <div className="w-20 h-20 shrink-0 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name}
                      className="w-full h-full object-contain p-1.5"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <Package size={20} className="text-gray-300" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${item.product.slug}`}
                    className="font-bold text-sm text-gray-900 hover:underline line-clamp-2 leading-snug">
                    {item.product.name}
                  </Link>
                  <CustomizationTags c={item.customization} />
                  <p className="text-sm font-bold text-gray-900 mt-2">
                    ${(Number(item.product.basePrice) * item.quantity).toFixed(2)}
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      (${Number(item.product.basePrice).toFixed(2)} each)
                    </span>
                  </p>
                </div>

                {/* Qty + delete */}
                <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                  <button onClick={() => removeItem(item.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors">
                      <Minus size={12} />
                    </button>
                    <span className="px-3 text-sm font-bold text-gray-900 min-w-[1.75rem] text-center">
                      {item.quantity}
                    </span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <p className="font-extrabold text-gray-900 text-sm">Order Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              {customTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Customization</span>
                  <span className="font-semibold text-gray-900">${customTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping (standard)</span>
                <span className="font-semibold text-gray-900">${shipping.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-extrabold text-gray-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Link href="/checkout"
              className="mt-2 w-full flex items-center justify-center gap-2 text-white font-bold text-sm py-3 rounded-full transition-all"
              style={{ background: "linear-gradient(to bottom, #4B9C3A, #3B8B2A)" }}>
              Proceed to Checkout <ChevronRight size={15} />
            </Link>
            <Link href="/shop"
              className="block text-center text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
              ← Continue Shopping
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
