export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  sender: 'client' | 'admin' | 'system';
  text: string;
  createdAt: string;
}

export interface Order {
  id: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  paymentMethod: 'pix' | 'card' | 'money';
  items: CartItem[];
  total: number;
  status: 'pending' | 'scheduled' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
  createdAt: string;
  messages: ChatMessage[];
  changeFor?: string; // Troco para
  cardBrand?: string; // bandeira ou tipo se for cartão
  isScheduled?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  isArchived?: boolean;
  isPaid?: boolean;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  scheduledOrders: number;
  preparingOrders: number;
  dispatchedOrders: number;
  completedOrders: number;
  paymentStats: {
    pix: number;
    card: number;
    money: number;
  };
  topItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  salesByDay: {
    date: string;
    sales: number;
    count: number;
  }[];
}
