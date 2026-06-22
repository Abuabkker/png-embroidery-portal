"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ShoppingBag, Package, CheckCircle, Download, Loader2,
  ChevronRight, Tag, Truck, CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function CustomizationBadges({ c }: { c: any }) {
  if (!c) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {c.size  && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Size: {c.size}</span>}
      {c.color && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Color: {c.color}</span>}
      {c.embroideryNames?.filter(Boolean).length > 0 && (
        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
          Embroidery: {c.embroideryNames.filter(Boolean).join(", ")}
        </span>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const { data: session } = useSession();
  const userName  = session?.user?.name || "Customer";
  const userEmail = session?.user?.email || "";

  const [items, setItems]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [confirming, setConfirming]   = useState(false);
  const [confirmed, setConfirmed]     = useState(false);
  const [orderId, setOrderId]         = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [shippingMethod, setShipping] = useState<"standard" | "express">("standard");
  const [discountCode, setDiscount]   = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/cart").then(r => r.json()).then(d => {
      setItems(d.data || []);
      setLoading(false);
    });
  }, []);

  const subtotal    = items.reduce((s, i) => s + Number(i.product.basePrice) * i.quantity, 0);
  const customTotal = items.reduce((s, i) => i.customization ? s + Number(i.product.customSurcharge ?? 0) * i.quantity : s, 0);
  const shipping    = 0;
  const total       = subtotal + customTotal;

  async function handleConfirm() {
    if (items.length === 0) return;
    setConfirming(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingMethod, discountCode: discountApplied ? discountCode : undefined }),
    });
    const data = await res.json();
    setConfirming(false);
    if (res.ok) {
      setOrderId(data.data.id);
      setOrderNumber(data.data.orderNumber);
      setConfirmed(true);
      window.dispatchEvent(new Event("cart-updated"));
    }
  }

  async function generatePDF(type: "quotation" | "invoice") {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const W  = doc.internal.pageSize.getWidth();
    const mL = 14;
    const mR = W - 14;

    // ── Navy header band ──
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, W, 32, "F");

    doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(255, 255, 255);
    doc.text("PNG Embroidery Portal", mL, 13);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(180, 200, 255);
    doc.text("Section 451, Cameron Road, Waigani Drive, Port Moresby, NCD", mL, 20);
    doc.text("Tel: +675 311 2000  ·  sales@pngembroidery.net", mL, 26);

    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(255, 255, 255);
    doc.text(type === "invoice" ? "TAX INVOICE" : "QUOTATION", mR, 13, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(180, 200, 255);
    doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), mR, 20, { align: "right" });
    if (orderNumber) doc.text(`Order No: #${orderNumber}`, mR, 26, { align: "right" });

    // ── Bill To / Order Info ──
    let y = 42;
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text("BILL TO", mL, y);
    doc.text("ORDER INFO", mR, y, { align: "right" });

    y += 5;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20, 20, 20);
    doc.text(userName, mL, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
    doc.text("Payment: Bank Transfer", mR, y, { align: "right" });

    y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
    if (userEmail) doc.text(userEmail, mL, y);
    doc.text("Delivery: Free", mR, y, { align: "right" });

    // ── Divider ──
    y += 7;
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.line(mL, y, mR, y);
    y += 4;

    // ── Items table ──
    autoTable(doc, {
      startY: y,
      head: [["Product", "Customization", "Qty", "Unit Price", "Line Total"]],
      body: items.map(item => [
        item.product.name,
        [
          item.customization?.size  ? `Size: ${item.customization.size}`  : "",
          item.customization?.color ? `Color: ${item.customization.color}` : "",
          item.customization?.embroideryNames?.filter(Boolean).join(", ") || "",
        ].filter(Boolean).join("  ·  ") || "—",
        String(item.quantity),
        formatCurrency(Number(item.product.basePrice)),
        formatCurrency((Number(item.product.basePrice) + (item.customization ? Number(item.product.customSurcharge ?? 0) : 0)) * item.quantity),
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 9, fontStyle: "bold", halign: "left" },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 65 },
        2: { cellWidth: 12, halign: "center" },
        3: { cellWidth: 28, halign: "right" },
        4: { cellWidth: 22, halign: "right" },
      },
      margin: { left: mL, right: 14 },
    });

    // ── Totals ──
    let ty = (doc as any).lastAutoTable.finalY + 8;
    const tR     = mR;
    const labelX = tR - 42;

    const subtotalRows: [string, string][] = [
      ["Subtotal", formatCurrency(subtotal)],
      ...(customTotal > 0 ? [["Embroidery", formatCurrency(customTotal)] as [string, string]] : []),
      ["Delivery", "FREE"],
    ];

    doc.setFontSize(9);
    subtotalRows.forEach(([label, val]) => {
      doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
      doc.text(label, labelX, ty, { align: "right" });
      doc.setFont("helvetica", "bold"); doc.setTextColor(val === "FREE" ? 22 : 20, val === "FREE" ? 163 : 20, val === "FREE" ? 74 : 20);
      doc.text(val, tR, ty, { align: "right" });
      ty += 6;
    });

    // Rule above total
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    doc.line(labelX - 25, ty - 2, tR, ty - 2);
    ty += 2;

    // Total row pill
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(labelX - 26, ty - 1, tR - (labelX - 26) + 0.5, 9, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text("TOTAL", labelX, ty + 5, { align: "right" });
    doc.setFontSize(10);
    doc.text(formatCurrency(total), tR - 1, ty + 5, { align: "right" });

    // ── Footer ──
    ty += 18;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(130, 130, 130);
    doc.text("This quotation is valid for 30 days. Payment via bank transfer to PNG Embroidery Portal.", mL, ty);
    doc.text("For inquiries: sales@pngembroidery.net  ·  Tel: +675 311 2000", mL, ty + 5);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your interest!", mL, ty + 10);

    const label = type === "invoice" ? "Invoice" : "Quotation";
    doc.save(`PNG-Embroidery-${label}-${orderNumber || "draft"}.pdf`);
  }

  if (loading) return (
    <div className="max-w-3xl animate-pulse space-y-4">
      <div className="h-8 bg-gray-100 rounded-xl w-48" />
      {Array.from({length:3}).map((_,i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
    </div>
  );

  // ── Order Confirmed screen ──
  if (confirmed) return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={40} className="text-green-500" strokeWidth={1.8} />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Order Confirmed!</h1>
      <p className="text-gray-700 mb-1">
        Thank you, <span className="font-bold text-gray-900">{userName}</span>!
      </p>
      <p className="text-gray-500 mb-1">
        Your order <span className="font-bold text-gray-800">#{orderNumber}</span> has been placed successfully.
      </p>
      <p className="text-sm text-gray-400 mb-8">You and your account manager have been notified.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => generatePDF("invoice")}
          className="flex items-center justify-center gap-2 bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors">
          <Download size={16} /> Download Invoice
        </button>
        <Link href={`/orders/${orderId}`}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
          View Order <ChevronRight size={16} />
        </Link>
      </div>
      <Link href="/shop" className="block mt-4 text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Continue Shopping
      </Link>
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-lg mx-auto text-center py-20">
      <ShoppingBag size={44} className="mx-auto text-gray-200 mb-4" />
      <p className="font-bold text-gray-700 mb-4">Your cart is empty</p>
      <Link href="/shop" className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
        Go to Shop
      </Link>
    </div>
  );

  return (
    <div className="max-w-5xl" ref={invoiceRef}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/cart" className="hover:text-gray-700">Cart</Link>
        <ChevronRight size={12} />
        <span className="text-gray-900 font-semibold">Order Review</span>
      </nav>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Review Your Order</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: items + options ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <p className="font-extrabold text-gray-900">Order Items</p>
              <span className="text-xs text-gray-400">{items.length} item{items.length > 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 p-4">
                  <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
                    {item.product.imageUrl
                      ? <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-contain p-1.5" />
                      : <Package size={18} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 leading-snug">{item.product.name}</p>
                    <CustomizationBadges c={item.customization} />
                    <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-gray-900">
                      {formatCurrency(Number(item.product.basePrice) * item.quantity)}
                    </p>
                    {item.customization && Number(item.product.customSurcharge) > 0 && (
                      <p className="text-[10px] text-blue-500 mt-0.5">
                        +{formatCurrency(Number(item.product.customSurcharge) * item.quantity)} embroidery
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <Truck size={15} /> Delivery
            </p>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-green-200 bg-green-50">
              <Truck size={16} className="text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">Standard Delivery</p>
                <p className="text-xs text-gray-400">5–7 business days</p>
              </div>
              <span className="text-sm font-bold text-green-600">FREE</span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard size={15} /> Payment Method
            </p>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-navy bg-navy/5">
              <CreditCard size={16} className="text-navy" />
              <div>
                <p className="text-sm font-bold text-gray-800">Bank Transfer</p>
                <p className="text-xs text-gray-400">Invoice will be issued upon confirmation</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: summary ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
            <p className="font-extrabold text-gray-900 mb-4">Order Summary</p>

            <div className="space-y-2.5 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              {customTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Embroidery</span><span className="font-semibold text-gray-900">{formatCurrency(customTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span><span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 flex justify-between font-extrabold text-gray-900 text-base">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Discount code */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Tag size={13} className="text-gray-400 shrink-0" />
                  <input value={discountCode} onChange={e => setDiscount(e.target.value.toUpperCase())}
                    placeholder="Discount code" disabled={discountApplied}
                    className="flex-1 text-xs bg-transparent outline-none text-gray-800" />
                </div>
                <button onClick={() => discountCode && setDiscountApplied(true)} disabled={discountApplied || !discountCode}
                  className="px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-gray-700 transition-colors">
                  Apply
                </button>
              </div>
              {discountApplied && <p className="text-xs text-green-600 mt-1.5 font-semibold">✓ Discount applied</p>}
            </div>

            {/* Download quotation draft */}
            <button onClick={() => generatePDF("quotation")}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-bold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors mb-3">
              <Download size={14} /> Download Quotation
            </button>

            {/* Confirm order */}
            <button onClick={handleConfirm} disabled={confirming || items.length === 0}
              className="w-full flex items-center justify-center gap-2 text-white font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(to bottom, #4B9C3A, #3B8B2A)" }}>
              {confirming ? <><Loader2 size={16} className="animate-spin" /> Confirming…</> : <><CheckCircle size={16} /> Confirm Order</>}
            </button>

            <p className="text-[11px] text-center text-gray-400 mt-3">
              By confirming you agree to our terms. A notification will be sent to your account manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
