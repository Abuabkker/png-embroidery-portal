import { cn } from "@/lib/utils";
export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: ["text-xl", "text-base"], md: ["text-2xl", "text-lg"], lg: ["text-3xl", "text-2xl"] };
  const [pngSize, embSize] = sizes[size];
  return (
    <div className={cn("flex flex-col items-end leading-none", className)}>
      <span className={cn("font-extrabold text-navy tracking-tight", pngSize)}>PNG</span>
      <span className={cn("font-serif italic text-brand-red", embSize)}>Embroidery</span>
    </div>
  );
}
