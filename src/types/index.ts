import { Role, OrderStatus, PaymentStatus, CustomizationStatus } from "@prisma/client";

export type { Role, OrderStatus, PaymentStatus, CustomizationStatus };

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
}

export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  customSurcharge: number;
  isCustomizable: boolean;
  stockQty: number;
  imageUrl?: string | null;
  sizes: string[];
  colors: string[];
  category: { id: string; name: string; slug: string };
}

export interface CartItemWithProduct {
  id: string;
  quantity: number;
  customization?: any;
  product: ProductWithCategory;
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  total: number;
  createdAt: Date;
  items: {
    id: string;
    productName: string;
    productImage?: string | null;
    quantity: number;
    unitPrice: number;
    customSurcharge: number;
    lineTotal: number;
    customization?: any;
  }[];
  address?: {
    fullName: string;
    street: string;
    city: string;
    province?: string | null;
    country: string;
  } | null;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}
