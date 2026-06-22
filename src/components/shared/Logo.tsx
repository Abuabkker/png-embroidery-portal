import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = { sm: 80, md: 100, lg: 130 };

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const w = sizes[size];
  return (
    <Image
      src="/logo-new.webp"
      alt="PNG Embroidery"
      width={w}
      height={w}
      className={cn("object-contain", className)}
      priority
    />
  );
}
