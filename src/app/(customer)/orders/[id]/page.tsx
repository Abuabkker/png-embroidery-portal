"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Package, ChevronRight, Download, Truck, CreditCard } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`).then(r => r.json()).then(d => { setOrder(d.data); setLoading(false); });
  }, [id]);

  async function downloadInvoice() {
    if (!order) return;
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const W  = doc.internal.pageSize.getWidth(); // 210
    const mL = 14;
    const mR = W - 14; // 196

    // ── Navy header band ──
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, W, 32, "F");

    doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(255, 255, 255);
    doc.text("PNG Embroidery Portal", mL, 13);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(180, 200, 255);
    doc.text("Section 451, Cameron Road, Waigani Drive, Port Moresby, NCD", mL, 20);
    doc.text("Tel: +675 311 2000  ·  sales@pngembroidery.net", mL, 26);

    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(255, 255, 255);
    doc.text("TAX INVOICE", mR, 13, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(180, 200, 255);
    doc.text(new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), mR, 20, { align: "right" });
    doc.text(`Order No: #${order.orderNumber}`, mR, 26, { align: "right" });

    // ── Bill To / Order Info row ──
    let y = 42;
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text("BILL TO", mL, y);
    doc.text("ORDER DETAILS", mR, y, { align: "right" });

    y += 5;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20, 20, 20);
    doc.text(order.user?.name || "Customer", mL, y);

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
    doc.text(`Status: ${order.status.replace(/_/g, " ")}`, mR, y, { align: "right" });

    y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
    if (order.user?.email) doc.text(order.user.email, mL, y);
    doc.text(`Payment: ${(order.paymentMethod || "bank_transfer").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}`, mR, y, { align: "right" });

    y += 5;
    doc.text(`Shipping: ${(order.shippingMethod || "standard").charAt(0).toUpperCase() + (order.shippingMethod || "standard").slice(1)}`, mR, y, { align: "right" });

    // ── Divider ──
    y += 6;
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.line(mL, y, mR, y);
    y += 4;

    // ── Items table ──
    autoTable(doc, {
      startY: y,
      head: [["Product", "Customization", "Qty", "Unit Price", "Line Total"]],
      body: order.items.map((item: any) => [
        item.productName,
        [
          item.customization?.size  ? `Size: ${item.customization.size}`  : "",
          item.customization?.color ? `Color: ${item.customization.color}` : "",
          item.customization?.embroideryNames?.filter(Boolean).join(", ") || "",
        ].filter(Boolean).join("  ·  ") || "—",
        String(item.quantity),
        formatCurrency(Number(item.unitPrice)),
        formatCurrency(Number(item.lineTotal)),
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

    // ── Totals block (right-aligned, drawn manually) ──
    let ty = (doc as any).lastAutoTable.finalY + 8;
    const tR = mR;        // right edge
    const labelX = tR - 42;

    const subtotalRows: [string, string][] = [
      ["Subtotal",     formatCurrency(Number(order.subtotal))],
      ...(Number(order.customTotal) > 0  ? [["Embroidery",                   formatCurrency(Number(order.customTotal))]  as [string,string]] : []),
      [`Shipping (${order.shippingMethod || "standard"})`, formatCurrency(Number(order.shippingCost))],
      ...(Number(order.discount) > 0     ? [["Discount",                    `-${formatCurrency(Number(order.discount))}`] as [string,string]] : []),
    ];

    doc.setFontSize(9);
    subtotalRows.forEach(([label, val]) => {
      doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
      doc.text(label, labelX, ty, { align: "right" });
      doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
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
    doc.text("TOTAL DUE", labelX, ty + 5, { align: "right" });
    doc.setFontSize(10);
    doc.text(formatCurrency(Number(order.total)), tR - 1, ty + 5, { align: "right" });

    // ── Footer ──
    ty += 18;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(130, 130, 130);
    doc.text("Payment is due within 7 days via bank transfer to PNG Embroidery Portal.", mL, ty);
    doc.text("For inquiries: sales@pngembroidery.net  ·  Tel: +675 311 2000", mL, ty + 5);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your order!", mL, ty + 10);

    doc.save(`Invoice-${order.orderNumber}.pdf`);
  }

  if (loading) return (
    <div className="max-w-3xl animate-pulse space-y-4">
      <div className="h-8 bg-gray-100 rounded-xl w-48" />
      {Array.from({length:3}).map((_,i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
    </div>
  );

  if (!order) return (
    <div className="text-center py-20">
      <p className="font-bold text-gray-700 mb-3">Order not found</p>
      <Link href="/orders" className="text-navy text-sm font-semibold hover:underline">← My Orders</Link>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/orders" className="hover:text-gray-700">My Orders</Link>
        <ChevronRight size={12} />
        <span className="text-gray-900 font-semibold">#{order.orderNumber}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-700">{order.user?.name || "Customer"}</span>
            <span className="text-gray-400"> · {new Date(order.createdAt).toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <button onClick={downloadInvoice}
            className="flex items-center gap-2 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors">
            <Download size={13} /> Invoice
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <p className="px-5 py-4 font-extrabold text-sm text-gray-900 border-b border-gray-50">Order Items</p>
          <div className="divide-y divide-gray-50">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex gap-4 p-4">
                <div className="w-14 h-14 shrink-0 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                  {item.productImage
                    ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                    : <Package size={16} className="text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">{item.productName}</p>
                  <CustomizationBadges c={item.customization} />
                  <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-sm text-gray-900 shrink-0">{formatCurrency(Number(item.lineTotal))}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals + info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2 text-sm">
            <p className="font-extrabold text-gray-900 mb-3">Order Summary</p>
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-semibold text-gray-900">{formatCurrency(Number(order.subtotal))}</span></div>
            {Number(order.customTotal) > 0 && <div className="flex justify-between text-gray-600"><span>Embroidery</span><span className="font-semibold text-gray-900">{formatCurrency(Number(order.customTotal))}</span></div>}
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-semibold text-gray-900">{formatCurrency(Number(order.shippingCost))}</span></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-semibold">-{formatCurrency(Number(order.discount))}</span></div>}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-extrabold text-gray-900"><span>Total</span><span>{formatCurrency(Number(order.total))}</span></div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 text-sm">
            <p className="font-extrabold text-gray-900 mb-1">Delivery & Payment</p>
            <div className="flex items-center gap-2 text-gray-600">
              <Truck size={13} className="text-gray-400 shrink-0" />
              <span className="capitalize">{order.shippingMethod ?? "standard"} shipping</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard size={13} className="text-gray-400 shrink-0" />
              <span className="capitalize">{(order.paymentMethod ?? "bank_transfer").replace(/_/g, " ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Payment:</span>
              <span className={`text-xs font-bold ${order.paymentStatus === "PAID" ? "text-green-600" : "text-orange-500"}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Status history */}
        {order.statusHistory?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-extrabold text-sm text-gray-900 mb-4">Status History</p>
            <div className="space-y-3">
              {order.statusHistory.map((h: any, i: number) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${i === 0 ? "bg-navy" : "bg-gray-300"}`} />
                    {i < order.statusHistory.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-bold text-gray-800">{h.status.replace(/_/g," ")}</p>
                    {h.note && <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>}
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(h.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
