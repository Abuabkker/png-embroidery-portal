import { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  CONFIRMED:       { label: "Confirmed",     className: "bg-green-100 text-green-700" },
  ORDER_RECEIVED:  { label: "Received",      className: "bg-gray-100 text-gray-600" },
  IN_REVIEW:       { label: "In Review",     className: "bg-purple-100 text-purple-700" },
  PROOF_SENT:      { label: "Proof Sent",    className: "bg-orange-100 text-orange-700" },
  PROOF_APPROVED:  { label: "Proof OK",      className: "bg-teal-100 text-teal-700" },
  IN_PRODUCTION:   { label: "In Production", className: "bg-blue-100 text-blue-700" },
  QUALITY_CHECK:   { label: "QC Check",      className: "bg-indigo-100 text-indigo-700" },
  SHIPPED:         { label: "Shipped",       className: "bg-green-100 text-green-700" },
  DELIVERED:       { label: "Delivered",     className: "bg-emerald-100 text-emerald-800" },
  CANCELLED:       { label: "Cancelled",     className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-600" };
  return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase", cfg.className)}>{cfg.label}</span>;
}
