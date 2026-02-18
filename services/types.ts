
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  isSpicy?: boolean;
  isVeg?: boolean;
  gstRate: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Offer {
  id: string;
  code: string;
  description: string;
  type: 'percent' | 'fixed';
  value: number;
  minCartValue: number;
  maxDiscount?: number; // Added: Maximum cap for percentage discounts
  isActive: boolean;
}

export interface DetailedAddress {
  houseNo: string;
  floor?: string;
  area: string;
  landmark?: string;
  fullAddress: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemGstBreakdown: { name: string; amount: number; rate: number }[];
  totalGst: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  status: OrderStatus;
  timestamp: number;
  customerName: string;
  address: DetailedAddress;
  phone: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export type ViewMode = 'auth' | 'customer' | 'owner';

export interface UserSession {
  phone: string;
  role: 'customer' | 'owner';
}
