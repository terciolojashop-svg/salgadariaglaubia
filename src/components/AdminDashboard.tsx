import React, { useState, useEffect, useRef } from 'react';
import { Order, DashboardStats } from '../types';
import { 
  DollarSign, ShoppingBag, Clock, Utensils, Truck, CheckCircle, 
  Search, Filter, Send, MessageSquare, MapPin, Phone, RefreshCw, Landmark, CreditCard, ChevronRight,
  Plus, Trash2, Edit, Settings
} from 'lucide-react';
import { MenuItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderSort, setOrderSort] = useState<'newest' | 'oldest'>('newest');
  
  // Active Admin Tabs
  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'menu' | 'cashier' | 'settings'>('orders');

  // Password change form states
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Payment confirmation popup state
  const [confirmPaymentState, setConfirmPaymentState] = useState<{
    orderId: string;
    currentPaid: boolean;
    clientName: string;
  } | null>(null);

  // Menu items list and loading
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  // Add/Edit Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<MenuItem> | null>(null);

  // Unaltered active orders delay alerts (5 minutes check)
  const [screenFlash, setScreenFlash] = useState(false);
  const [hasDelayedOrders, setHasDelayedOrders] = useState(false);
  const lastBeepTimeRef = useRef<number>(0);

  // Selected order for Chat and detailed management
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const selectedOrderIdRef = useRef(selectedOrderId);

  useEffect(() => {
    selectedOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId]);

  const fetchDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      
      const ordersRes = await fetch('/api/orders');
      const statsRes = await fetch('/api/reports');
      
      if (ordersRes.ok && statsRes.ok) {
        const ordersData = await ordersRes.json();
        const statsData = await statsRes.json();
        setOrders(ordersData);
        setStats(statsData);

        // If there's an active selected order, sync its data too
        const activeId = selectedOrderIdRef.current;
        if (activeId) {
          const currentSelected = ordersData.find((o: Order) => o.id === activeId);
          if (!currentSelected) {
            setSelectedOrderId(null);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    setMenuLoading(true);
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (e) {
      console.error("Error fetching menu items:", e);
    } finally {
      setMenuLoading(false);
    }
  };

  // Play a soft high pitch beep using the browser's Web Audio API (totally autonomous)
  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz crystal clear tone
      gain.gain.setValueAtTime(0.12, ctx.currentTime); // pleasant sound level
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35); // smooth fade out
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    fetchMenuItems();

    // Dynamic polling every 4 seconds to see live orders coming in and live messages!
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Check for unaltered active orders older than 5 minutes
  useEffect(() => {
    const checkDelayedOrders = () => {
      const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
      let foundDelayed = false;
      const nowTime = Date.now();
      
      activeOrders.forEach(order => {
        const orderTime = new Date(order.createdAt).getTime();
        const diffMinutes = (nowTime - orderTime) / (1000 * 60);
        if (diffMinutes >= 5) {
          foundDelayed = true;
        }
      });

      setHasDelayedOrders(foundDelayed);

      if (foundDelayed) {
        // Flash screen borders
        setScreenFlash(true);
        setTimeout(() => setScreenFlash(false), 500);
        setTimeout(() => setScreenFlash(true), 1000);
        setTimeout(() => setScreenFlash(false), 1500);

        // Sound beep alert every 5 minutes (300000ms)
        if (nowTime - lastBeepTimeRef.current >= 5 * 60 * 1000) {
          playBeep();
          lastBeepTimeRef.current = nowTime;
        }
      }
    };

    checkDelayedOrders();
    const interval = setInterval(checkDelayedOrders, 12000);
    return () => clearInterval(interval);
  }, [orders]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const messagesCount = selectedOrder?.messages?.length || 0;
  const prevMessagesCountRef = useRef(0);
  const prevSelectedOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedOrderId !== prevSelectedOrderIdRef.current) {
      // Quando seleciona um chat novo, rola rápido para o lugar certo
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
      prevSelectedOrderIdRef.current = selectedOrderId;
      prevMessagesCountRef.current = messagesCount;
    } else if (messagesCount > prevMessagesCountRef.current) {
      // Quando chega mensagem nova, rola suavemente
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevMessagesCountRef.current = messagesCount;
    }
  }, [selectedOrderId, messagesCount]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleToggleArchive = async (orderId: string, currentArchived: boolean) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !currentArchived })
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Error toggling archive:", err);
    }
  };

  const handleTogglePayment = (orderId: string, currentPaid: boolean, clientName: string) => {
    setConfirmPaymentState({ orderId, currentPaid, clientName });
  };

  const executeTogglePayment = async () => {
    if (!confirmPaymentState) return;
    const { orderId, currentPaid } = confirmPaymentState;
    try {
      const res = await fetch(`/api/orders/${orderId}/paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !currentPaid })
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Error toggling payment status:", err);
    } finally {
      setConfirmPaymentState(null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || editingProduct?.price === undefined || !editingProduct?.category) {
      alert("Por favor, preencha nome, preço e categoria!");
      return;
    }

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      
      if (res.ok) {
        await fetchMenuItems();
        setProductModalOpen(false);
        setEditingProduct(null);
      } else {
        const error = await res.json();
        alert(`Erro ao salvar produto: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error("Error saving product:", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza absoluta de que deseja excluir este produto do cardápio?")) return;
    try {
      const res = await fetch(`/api/menu/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchMenuItems();
      } else {
        alert("Erro ao excluir o produto.");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleAdminSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedOrderId) return;

    const msgText = chatInput.trim();
    setChatInput('');

    try {
      const res = await fetch(`/api/orders/${selectedOrderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'admin',
          text: msgText
        })
      });

      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Error sending admin message:", err);
    }
  };

  // Filter orders based on search and status tabs
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientPhone.includes(searchTerm);
    
    if (statusFilter === 'archived') {
      return matchesSearch && o.isArchived;
    } else {
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus && !o.isArchived;
    }
  });

  // Sort orders based on user preference (newest vs oldest)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return orderSort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Helper function to check if a scheduled order is on the day of or eve of delivery
  const isEveOrDayOfDelivery = (scheduledDate?: string) => {
    if (!scheduledDate) return false;
    try {
      const [year, month, day] = scheduledDate.split('-').map(Number);
      const deliveryDate = new Date(year, month - 1, day);
      deliveryDate.setHours(0,0,0,0);
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const diffTime = deliveryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0 && diffDays <= 1;
    } catch (e) {
      return false;
    }
  };

  // Calcule as estatísticas detalhadas de cada situação de movimentação
  const pendingCount = orders.filter(o => o.status === 'pending' && !o.isArchived).length;
  const pendingTotal = orders.filter(o => o.status === 'pending' && !o.isArchived).reduce((sum, o) => sum + o.total, 0);

  const scheduledCount = orders.filter(o => o.status === 'scheduled' && !o.isArchived).length;
  const scheduledTotal = orders.filter(o => o.status === 'scheduled' && !o.isArchived).reduce((sum, o) => sum + o.total, 0);

  const preparingCount = orders.filter(o => o.status === 'preparing' && !o.isArchived).length;
  const preparingTotal = orders.filter(o => o.status === 'preparing' && !o.isArchived).reduce((sum, o) => sum + o.total, 0);

  const dispatchedCount = orders.filter(o => o.status === 'dispatched' && !o.isArchived).length;
  const dispatchedTotal = orders.filter(o => o.status === 'dispatched' && !o.isArchived).reduce((sum, o) => sum + o.total, 0);

  const deliveredCount = orders.filter(o => o.status === 'delivered' && !o.isArchived).length;
  const deliveredTotal = orders.filter(o => o.status === 'delivered' && !o.isArchived).reduce((sum, o) => sum + o.total, 0);

  const cancelledCount = orders.filter(o => o.status === 'cancelled' && !o.isArchived).length;
  const cancelledTotal = orders.filter(o => o.status === 'cancelled' && !o.isArchived).reduce((sum, o) => sum + o.total, 0);

  const archivedCount = orders.filter(o => o.isArchived).length;
  const archivedTotal = orders.filter(o => o.isArchived).reduce((sum, o) => sum + o.total, 0);

  // Unique categories of menu items
  const CATEGORIES = [
    "Salgados Tradicionais",
    "Salgados Massa de Batata",
    "Salgados Pequenos Comum",
    "Salgados Pequenos Batata",
    "Pastéis",
    "Refrigerante 1 Litro",
    "Refrigerante 2 Litros",
    "Refrigerante Lata",
    "Sucos"
  ];

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-stone-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm">Abrindo o painel da gerência...</p>
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 font-sans text-stone-100 bg-stone-950 transition-all duration-300 ${
      screenFlash ? 'ring-4 ring-red-600/40' : ''
    }`}>
      
      {/* 5-Min Inactive Order Alert Banner */}
      {hasDelayedOrders && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 ${
          screenFlash 
            ? 'bg-red-950/90 border-red-500 text-red-100 shadow-xl shadow-red-950/70 scale-[1.01]' 
            : 'bg-red-950/40 border-red-900/60 text-red-400'
        }`}>
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">⚠️ Alerta da Cozinha - Pedidos Pendentes!</span>
              <span className="text-xs text-stone-300 mt-0.5 block">Existem pedidos ativos aguardando alteração de status há mais de 5 minutos!</span>
            </div>
          </div>
          <button 
            onClick={playBeep}
            className="text-[10px] font-bold uppercase tracking-widest bg-red-900/55 hover:bg-red-800/60 px-3.5 py-1.5 rounded-lg border border-red-800 transition"
          >
            🔊 Forçar Bip de Teste
          </button>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-900 pb-6">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-white">
            Painel da Gerência ⚙️
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Faturamento, relatórios de vendas e central de atendimento ao cliente em tempo real.
          </p>
        </div>
        
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              fetchDashboardData(true);
              fetchMenuItems();
            }}
            className="flex items-center space-x-1.5 rounded-lg bg-stone-900 border border-stone-800 px-4 py-2 text-xs font-semibold hover:bg-stone-800 transition text-white"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-pulse" />
            <span>Sincronizar Dados</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-stone-900 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveAdminTab('orders')}
          className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap rounded-t-lg ${
            activeAdminTab === 'orders'
              ? 'border-orange-500 text-orange-400 bg-orange-950/10'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>📦 Pedidos e Atendimento</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('menu')}
          className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap rounded-t-lg ${
            activeAdminTab === 'menu'
              ? 'border-orange-500 text-orange-400 bg-orange-950/10'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Utensils className="h-4 w-4" />
          <span>🍽️ Gerenciar Cardápio</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('cashier')}
          className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap rounded-t-lg ${
            activeAdminTab === 'cashier'
              ? 'border-orange-500 text-orange-400 bg-orange-950/10'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>💰 Caixa e Relatórios</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap rounded-t-lg ${
            activeAdminTab === 'settings'
              ? 'border-orange-500 text-orange-400 bg-orange-950/10'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>⚙️ Alterar Senha</span>
        </button>
      </div>

      {activeAdminTab === 'orders' && (
        <>
          {/* Orders Management and Live Chat split screen */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Order list section (2/3 columns) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-900 p-4 rounded-xl border border-stone-800">
                <h3 className="font-display font-bold text-base text-white">Lista de Pedidos</h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <div className="relative shrink-0">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-500" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente/id..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="rounded-lg bg-stone-950 border border-stone-800 py-1.5 pl-8 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Order direction filter */}
                  <select
                    value={orderSort}
                    onChange={(e) => setOrderSort(e.target.value as 'newest' | 'oldest')}
                    className="rounded-lg bg-stone-950 border border-stone-800 py-1.5 px-2 text-xs text-stone-300 font-bold"
                  >
                    <option value="newest">🕒 Mais recente primeiro</option>
                    <option value="oldest">⌛ Mais antigo primeiro</option>
                  </select>

                  {/* Status tabs */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg bg-stone-950 border border-stone-800 py-1.5 px-2.5 text-xs text-stone-300"
                  >
                    <option value="all">Todos Status</option>
                    <option value="pending">🕒 Pendentes</option>
                    <option value="scheduled">📅 Encomendas</option>
                    <option value="preparing">👨‍🍳 Em Preparo</option>
                    <option value="dispatched">🏍️ Saiu para Entrega</option>
                    <option value="delivered">✅ Entregues</option>
                    <option value="cancelled">❌ Cancelados</option>
                    <option value="archived">📦 Arquivados</option>
                  </select>
                </div>
              </div>

              {/* Orders stream in Column Layout for PC Desktop / Grid */}
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {sortedOrders.map((order) => {
                  const isSelected = selectedOrderId === order.id;
                  const itemsCount = order.items.reduce((acc, curr) => acc + curr.quantity, 0);

                  // Calcule o tempo do pedido para alerta visual específico no card
                  const diffMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
                  const isUnalteredWarning = diffMinutes >= 5 && order.status !== 'delivered' && order.status !== 'cancelled';

                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl border p-5 transition-all duration-200 bg-stone-900/60 flex flex-col justify-between ${
                        isSelected 
                          ? 'border-orange-500/80 shadow-orange-950/20 shadow-lg ring-1 ring-orange-500/40' 
                          : order.isScheduled && isEveOrDayOfDelivery(order.scheduledDate)
                            ? 'border-yellow-500/90 bg-yellow-950/15 shadow-yellow-950/10 shadow-lg ring-1 ring-yellow-500/30'
                            : isUnalteredWarning
                              ? 'border-red-500/80 bg-red-950/10 shadow-red-950/25 shadow-lg animate-pulse'
                              : 'border-stone-800/80 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                              isUnalteredWarning 
                                ? 'text-red-200 bg-red-950 border border-red-850' 
                                : order.isScheduled
                                  ? 'text-yellow-400 bg-yellow-950/50 border border-yellow-900/40'
                                  : 'text-orange-400 bg-orange-950/50 border border-orange-900/40'
                            }`}>
                              {order.id}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              {new Date(order.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          {/* Indicators */}
                          <div className="flex items-center space-x-1.5">
                            {order.isScheduled && (
                              <span className="text-[9px] bg-yellow-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                📅 Encomenda
                              </span>
                            )}
                            {isUnalteredWarning && (
                              <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                                ⚠️ Parado +5 Min
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <h4 className="font-display font-bold text-white text-sm mt-3 flex items-center space-x-1.5">
                          <span>{order.clientName}</span>
                          <a 
                            href={`tel:${order.clientPhone}`} 
                            className="text-stone-500 hover:text-orange-400 transition"
                            title="Ligar"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </h4>

                        <p className="text-[11px] text-stone-400 mt-1 flex items-start space-x-1 line-clamp-2" title={order.clientAddress}>
                          <MapPin className="h-3 w-3 text-orange-500/80 mt-0.5 shrink-0" />
                          <span>{order.clientAddress}</span>
                        </p>

                        {/* Scheduled date & time display */}
                        {order.isScheduled && order.scheduledDate && (
                          <div className="mt-2.5 p-2 rounded bg-yellow-950/30 border border-yellow-900/20 text-xs">
                            <div className="text-yellow-400 font-bold flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Entrega Agendada:</span>
                            </div>
                            <div className="text-stone-200 font-bold mt-0.5">
                              {new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {order.scheduledTime || '18:00'}
                            </div>
                          </div>
                        )}

                        {/* Order items listing */}
                        {order.paymentMethod === 'money' && (
                          <div className="mt-2.5 p-2 rounded bg-emerald-950/20 border border-emerald-900/20 text-xs">
                            <span className="text-emerald-400 font-bold">💵 Troco:</span>
                            <span className="text-stone-200 ml-1.5 font-bold font-mono">
                              {order.changeFor ? order.changeFor : 'Não precisa de troco'}
                            </span>
                          </div>
                        )}
                        {order.paymentMethod === 'card' && order.cardBrand && (
                          <div className="mt-2.5 p-2 rounded bg-stone-950 border border-stone-800/40 text-[11px]">
                            <span className="text-stone-400 font-bold">💳 Bandeira:</span>
                            <span className="text-stone-200 ml-1.5 font-semibold">{order.cardBrand}</span>
                          </div>
                        )}

                        <div className="mt-3 border-t border-stone-800/40 pt-2">
                          <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Itens ({itemsCount}):</span>
                          <div className="text-[11px] text-stone-300 mt-1 space-y-1 max-h-24 overflow-y-auto">
                            {order.items.map((cartItem, idx) => (
                              <div key={idx} className="flex justify-between bg-stone-950/40 px-2 py-0.5 rounded">
                                <span className="truncate pr-1">{cartItem.quantity}x {cartItem.item.name}</span>
                                <span className="font-mono text-stone-500 shrink-0">R$ {(cartItem.item.price * cartItem.quantity).toFixed(2).replace('.', ',')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-stone-800/40 pt-2.5">
                        {/* Status select & Total */}
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] text-stone-400">
                            Total: <span className="font-mono font-extrabold text-orange-400">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                          </div>
                          
                          <select
                            value={order.status}
                            disabled={updatingStatus === order.id}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="rounded-lg bg-stone-950 border border-stone-800 py-1 px-1.5 text-[11px] text-stone-300 font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
                          >
                            <option value="pending">🕒 Pendente</option>
                            <option value="scheduled">📅 Encomenda</option>
                            <option value="preparing">👨‍🍳 Em Preparo</option>
                            <option value="dispatched">🏍️ Saiu p/ Entrega</option>
                            <option value="delivered">✅ Entregue</option>
                            <option value="cancelled">❌ Cancelado</option>
                          </select>
                        </div>

                        {/* Card footer details and Chat Link */}
                        <div className="mt-3 pt-2 border-t border-stone-950 flex items-center justify-between">
                          <div className="flex items-center space-x-2.5 text-[10px] text-stone-400 font-mono">
                            <div className="flex items-center space-x-1">
                              <span>Meio:</span>
                              <span className="uppercase text-stone-200 font-bold flex items-center space-x-0.5">
                                {order.paymentMethod === 'pix' ? (
                                  <Landmark className="h-2.5 w-2.5 text-orange-500" />
                                ) : order.paymentMethod === 'card' ? (
                                  <CreditCard className="h-2.5 w-2.5 text-orange-500" />
                                ) : (
                                  <DollarSign className="h-2.5 w-2.5 text-orange-500" />
                                )}
                                <span>{order.paymentMethod === 'money' ? 'dinheiro' : order.paymentMethod}</span>
                              </span>
                            </div>

                            {/* Checkbox de Pagamento */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePayment(order.id, !!order.isPaid, order.clientName);
                              }}
                              className="flex items-center space-x-1.5 cursor-pointer select-none border border-stone-800 bg-stone-950 px-2 py-0.5 rounded hover:border-stone-700 transition active:scale-95"
                            >
                              <div className={`h-3 w-3 rounded flex items-center justify-center border text-[9px] ${order.isPaid ? 'bg-emerald-500 border-emerald-400' : 'bg-stone-900 border-stone-700'}`}>
                                {order.isPaid && <span className="text-[8px] text-stone-950 font-black leading-none">✓</span>}
                              </div>
                              <span className={`font-sans font-bold text-[8.5px] uppercase ${order.isPaid ? 'text-emerald-400' : 'text-stone-400'}`}>
                                {order.isPaid ? '✅ Pago' : '❌ Não Pago'}
                              </span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleToggleArchive(order.id, !!order.isArchived)}
                              title={order.isArchived ? "Desarquivar pedido" : "Arquivar pedido"}
                              className={`flex items-center space-x-1 rounded px-2 py-1 text-[9px] font-bold transition border ${
                                order.isArchived
                                  ? 'bg-amber-650 hover:bg-amber-600 text-stone-100 border-amber-800'
                                  : 'bg-stone-950 hover:bg-stone-900 text-stone-400 border-stone-800'
                              }`}
                            >
                              <span>{order.isArchived ? "Desarquivar" : "Arquivar"}</span>
                            </button>

                            <button
                              onClick={() => setSelectedOrderId(order.id)}
                              className="flex items-center space-x-1 rounded bg-orange-600/95 hover:bg-orange-500 px-2 py-1 text-[10px] font-bold text-white transition"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Abrir Chat</span>
                              {order.messages.filter(m => m.sender === 'client').length > 0 && (
                                <span className="bg-white text-orange-600 font-bold font-mono text-[8px] rounded-full h-3 w-3 flex items-center justify-center">
                                  {order.messages.filter(m => m.sender === 'client').length}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <div className="col-span-full text-center py-12 text-stone-500 bg-stone-900/20 rounded-xl border border-stone-800/60">
                    <ShoppingBag className="h-10 w-10 mx-auto text-stone-700 mb-2" />
                    <p className="text-sm">Nenhum pedido encontrado com os filtros atuais.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Chat & Customer Support Panel (1/3 column) */}
            <div className="rounded-2xl bg-stone-900 border border-stone-800 shadow-xl overflow-hidden flex flex-col h-[650px]">
              {selectedOrder ? (
                <>
                  {/* Active customer info */}
                  <div className="bg-stone-950 px-4 py-4 border-b border-stone-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-orange-400 font-mono font-bold">CONVERSA DO PEDIDO {selectedOrder.id}</span>
                      <button 
                        onClick={() => setSelectedOrderId(null)}
                        className="text-stone-400 hover:text-white text-xs font-semibold"
                      >
                        Fechar
                      </button>
                    </div>
                    <h4 className="font-display font-bold text-white text-base truncate">{selectedOrder.clientName}</h4>
                <div className="flex items-center space-x-2 text-[11px] text-stone-400 font-mono">
                  <span>{selectedOrder.clientPhone}</span>
                  <span>•</span>
                  <span className="uppercase text-orange-500 font-semibold">{selectedOrder.status}</span>
                  <span>•</span>
                  <span className={`font-bold ${selectedOrder.isPaid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedOrder.isPaid ? '✓ PAGO' : '✗ NÃO PAGO'}
                  </span>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-950/20">
                {selectedOrder.messages.map((msg) => {
                  const isSystem = msg.sender === 'system';
                  const isMe = msg.sender === 'admin';
                  const isStore = msg.sender === 'client';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <span className="text-[9px] text-orange-400 bg-orange-950/25 px-2.5 py-0.5 rounded-full border border-orange-900/10 text-center max-w-[90%] font-mono">
                          📢 {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[9px] text-stone-500 mb-0.5 px-1 font-mono">
                        {isMe ? 'Você (Admin)' : 'Cliente'} • {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div 
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-amber-600 text-white rounded-tr-none' 
                            : 'bg-stone-800 text-stone-100 rounded-tl-none border border-stone-700/60'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Admin reply entry */}
              <form onSubmit={handleAdminSendMessage} className="p-3 bg-stone-950 border-t border-stone-800 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Responder cliente..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 rounded-lg bg-stone-900 border border-stone-800 py-2 px-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-3">
              <MessageSquare className="h-12 w-12 text-stone-700 animate-pulse" />
              <h4 className="font-display font-bold text-white text-sm">Selecione uma Conversa</h4>
              <p className="text-xs text-stone-400 max-w-[200px] leading-relaxed mx-auto">
                Clique no botão "Ver Chat" em qualquer pedido para conversar em tempo real com o cliente.
              </p>
            </div>
          )}
        </div>

      </div>
        </>
      )}

      {activeAdminTab === 'menu' && (
        /* MENU MANAGEMENT TAB VIEW */
        <div className="bg-stone-900 rounded-2xl border border-stone-850 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className="font-display font-black text-lg text-white">Cardápio Digital da Casa 🍽️</h3>
              <p className="text-xs text-stone-400 mt-1">Gerencie os lanches, tamanhos, preços e descrições disponíveis para o cliente comprar.</p>
            </div>
            
            <button
              onClick={() => {
                setEditingProduct({ name: '', price: 0, description: '', category: CATEGORIES[0] });
                setProductModalOpen(true);
              }}
              className="flex items-center justify-center space-x-1.5 self-start sm:self-auto rounded-lg bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-bold text-white transition shadow-lg shadow-orange-950/25"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Novo Produto</span>
            </button>
          </div>

          {menuLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400 space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
              <p className="text-xs font-mono">Carregando cardápio...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {CATEGORIES.map((category) => {
                const itemsInCategory = menuItems.filter(item => item.category === category);

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center space-x-2 border-b border-stone-800/60 pb-1.5">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                      <h4 className="font-display font-black text-sm text-stone-200 uppercase tracking-wider">{category}</h4>
                      <span className="text-[10px] bg-stone-950 px-2 py-0.5 rounded text-stone-500 font-mono">
                        {itemsInCategory.length} produtos
                      </span>
                    </div>

                    {itemsInCategory.length === 0 ? (
                      <div className="text-center py-6 text-stone-500 text-xs border border-dashed border-stone-800 rounded-xl bg-stone-950/20">
                        Nenhum produto cadastrado nesta categoria.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {itemsInCategory.map((item) => (
                          <div 
                            key={item.id} 
                            className="p-4 rounded-xl border border-stone-800/80 bg-stone-950/40 hover:border-stone-850 transition flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="font-bold text-stone-100 text-xs sm:text-sm line-clamp-1">{item.name}</h5>
                                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/10 shrink-0">
                                  R$ {item.price.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-400 line-clamp-2 min-h-8">
                                {item.description || "Sem descrição disponível."}
                              </p>
                            </div>

                            <div className="flex items-center justify-end space-x-1.5 mt-3 pt-2.5 border-t border-stone-800/30">
                              <button
                                onClick={() => {
                                  setEditingProduct(item);
                                  setProductModalOpen(true);
                                }}
                                className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider bg-stone-900 hover:bg-stone-800 hover:text-white text-stone-300 px-2.5 py-1 rounded transition border border-stone-800"
                              >
                                <Edit className="h-3 w-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(item.id)}
                                className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider bg-red-950/40 hover:bg-red-900/40 text-red-400 hover:text-red-300 px-2.5 py-1 rounded transition border border-red-900/30"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'cashier' && (
        <div className="space-y-8 animate-fade-in">
          {/* Analytics Overview Cards */}
          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Sales Revenue */}
              <div className="rounded-xl bg-stone-900 border border-stone-800 p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-stone-800">
                  <DollarSign className="h-10 w-10 text-stone-800" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Faturamento Realizado</span>
                <div className="font-mono text-2xl font-black text-emerald-400 mt-2">
                  R$ {stats.totalSales.toFixed(2).replace('.', ',')}
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">Somente pedidos entregues</span>
              </div>

              {/* Total orders */}
              <div className="rounded-xl bg-stone-900 border border-stone-800 p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-stone-800">
                  <ShoppingBag className="h-10 w-10 text-stone-800" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total de Pedidos</span>
                <div className="font-mono text-2xl font-black text-white mt-2">
                  {stats.totalOrders}
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">Registrados na base de dados</span>
              </div>

              {/* Active Orders */}
              <div className="rounded-xl bg-stone-900 border border-stone-800 p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-stone-800">
                  <Clock className="h-10 w-10 text-stone-800" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Pedidos Ativos</span>
                <div className="font-mono text-2xl font-black text-orange-500 mt-2">
                  {stats.pendingOrders + stats.scheduledOrders + stats.preparingOrders + stats.dispatchedOrders}
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">
                  {stats.pendingOrders} pendentes, {stats.scheduledOrders} encomendas, {stats.preparingOrders} em preparo
                </span>
              </div>

              {/* Avg Ticket */}
              <div className="rounded-xl bg-stone-900 border border-stone-800 p-5 shadow-lg relative overflow-hidden">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Ticket Médio</span>
                <div className="font-mono text-2xl font-black text-amber-500 mt-2">
                  R$ {stats.totalOrders > 0 ? (stats.totalSales / stats.totalOrders).toFixed(2).replace('.', ',') : '0,00'}
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">Faturamento médio por lanche</span>
              </div>
            </div>
          )}

          {/* Situação de Movimentação dos Pedidos (NEW CASHIER COMPONENT) */}
          <div className="rounded-xl bg-stone-900 border border-stone-800 p-6 shadow-lg space-y-6">
            <div>
              <h3 className="font-display font-bold text-base text-white flex items-center space-x-2">
                <Landmark className="h-4 w-4 text-orange-500" />
                <span>Movimentação por Status dos Pedidos</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Acompanhamento financeiro e volumétrico em tempo real de cada estágio operacional.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 font-sans">
              {/* Pendentes */}
              <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase font-black">Pendente</span>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-amber-400">{pendingCount} <span className="text-xs text-stone-500">pedidos</span></div>
                  <div className="text-xs text-stone-400 font-mono mt-0.5">Total: R$ {pendingTotal.toFixed(2).replace('.', ',')}</div>
                </div>
                <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${orders.length > 0 ? (pendingCount / orders.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Encomendas */}
              <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase font-black">Encomendas</span>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-yellow-400">{scheduledCount} <span className="text-xs text-stone-500">pedidos</span></div>
                  <div className="text-xs text-stone-400 font-mono mt-0.5">Total: R$ {scheduledTotal.toFixed(2).replace('.', ',')}</div>
                </div>
                <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: `${orders.length > 0 ? (scheduledCount / orders.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Em Preparo */}
              <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase font-black">No Preparo</span>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-orange-400">{preparingCount} <span className="text-xs text-stone-500">pedidos</span></div>
                  <div className="text-xs text-stone-400 font-mono mt-0.5">Total: R$ {preparingTotal.toFixed(2).replace('.', ',')}</div>
                </div>
                <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${orders.length > 0 ? (preparingCount / orders.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Saiu para Entrega */}
              <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Truck className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase font-black">Na Entrega</span>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-blue-400">{dispatchedCount} <span className="text-xs text-stone-500">pedidos</span></div>
                  <div className="text-xs text-stone-400 font-mono mt-0.5">Total: R$ {dispatchedTotal.toFixed(2).replace('.', ',')}</div>
                </div>
                <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${orders.length > 0 ? (dispatchedCount / orders.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Entregues */}
              <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase font-black">Entregues</span>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-emerald-400">{deliveredCount} <span className="text-xs text-stone-500">pedidos</span></div>
                  <div className="text-xs text-stone-400 font-mono mt-0.5">Total: R$ {deliveredTotal.toFixed(2).replace('.', ',')}</div>
                  {archivedCount > 0 && (
                    <div className="text-[9px] text-stone-500 font-mono mt-1 flex items-center space-x-1">
                      <span>📦 +{archivedCount} arquivados</span>
                    </div>
                  )}
                </div>
                <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${orders.length > 0 ? (deliveredCount / orders.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Cancelados */}
              <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase font-black">Cancelados</span>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-red-400">{cancelledCount} <span className="text-xs text-stone-500">pedidos</span></div>
                  <div className="text-xs text-stone-400 font-mono mt-0.5">Total: R$ {cancelledTotal.toFixed(2).replace('.', ',')}</div>
                </div>
                <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${orders.length > 0 ? (cancelledCount / orders.length) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Reports and Charts */}
          {stats && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Chart 1: Sales By Day (Beautiful customized SVG Bars) */}
              <div className="rounded-xl bg-stone-900 border border-stone-800 p-5 shadow-lg space-y-4 md:col-span-2">
                <h3 className="font-display font-bold text-sm text-stone-300">Faturamento por Dia</h3>
                
                <div className="h-44 flex items-end justify-between gap-2 pt-4">
                  {stats.salesByDay.map((d, i) => {
                    const maxVal = Math.max(...stats.salesByDay.map(day => day.sales), 1);
                    const heightPct = (d.sales / maxVal) * 80; // Scale to max 80% height

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                        {/* Tooltip value */}
                        <span className="opacity-0 group-hover:opacity-100 bg-stone-950 border border-stone-800 text-[10px] font-mono text-orange-400 font-bold px-1.5 py-0.5 rounded -translate-y-2 transition-opacity duration-200">
                          R$ {d.sales.toFixed(0)}
                        </span>
                        {/* Bar */}
                        <div 
                          className="w-full bg-orange-600/30 group-hover:bg-orange-500/80 rounded-t-md transition-all duration-300"
                          style={{ height: `${Math.max(4, heightPct)}%` }}
                        ></div>
                        {/* Date label */}
                        <span className="text-[9px] font-mono text-stone-500 mt-2">{d.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Payment and Top Sold items */}
              <div className="rounded-xl bg-stone-900 border border-stone-800 p-5 shadow-lg space-y-4">
                <h3 className="font-display font-bold text-sm text-stone-300">Salgados Mais Vendidos</h3>
                
                <div className="space-y-3">
                  {stats.topItems.map((item, idx) => {
                    const maxQty = Math.max(...stats.topItems.map(t => t.quantity), 1);
                    const widthPct = (item.quantity / maxQty) * 100;

                    return (
                      <div key={idx} className="text-xs space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-stone-300 truncate max-w-[180px]">{item.name}</span>
                          <span className="font-mono text-stone-400">{item.quantity} unidades</span>
                        </div>
                        {/* Progress Bar background */}
                        <div className="h-1.5 w-full bg-stone-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${widthPct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  {stats.topItems.length === 0 && (
                    <div className="text-center py-6 text-stone-500 text-xs">Nenhum salgado vendido ainda.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'settings' && (
        <div className="max-w-md mx-auto rounded-xl bg-stone-900 border border-stone-800 p-6 shadow-lg space-y-6">
          <div className="flex items-center space-x-2 border-b border-stone-800 pb-3">
            <Settings className="h-5 w-5 text-orange-500" />
            <h3 className="font-display font-black text-base text-white">Alterar Senha do Admin</h3>
          </div>

          <p className="text-xs text-stone-400 leading-relaxed">
            Configure uma nova senha para acessar o Painel da Gerência. A senha atual é necessária para confirmar a alteração.
          </p>

          <form onSubmit={(e) => {
            e.preventDefault();
            setPasswordChangeError('');
            setPasswordChangeSuccess('');

            const actualPassword = localStorage.getItem('glaubia_admin_password') || 'glaubia123';
            if (currentPasswordInput !== actualPassword) {
              setPasswordChangeError('Senha atual incorreta!');
              return;
            }

            if (!newPasswordInput.trim()) {
              setPasswordChangeError('A nova senha não pode ser em branco!');
              return;
            }

            if (newPasswordInput !== confirmNewPasswordInput) {
              setPasswordChangeError('A nova senha e a confirmação não conferem!');
              return;
            }

            localStorage.setItem('glaubia_admin_password', newPasswordInput);
            setPasswordChangeSuccess('Senha alterada com sucesso!');
            setCurrentPasswordInput('');
            setNewPasswordInput('');
            setConfirmNewPasswordInput('');
          }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300 block">Senha Atual</label>
              <input
                type="password"
                required
                placeholder="Digite a senha atual..."
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300 block">Nova Senha</label>
              <input
                type="password"
                required
                placeholder="Digite a nova senha..."
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300 block">Confirmar Nova Senha</label>
              <input
                type="password"
                required
                placeholder="Confirme a nova senha..."
                value={confirmNewPasswordInput}
                onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            {passwordChangeError && (
              <p className="text-[11px] text-rose-500 font-bold">
                ⚠️ {passwordChangeError}
              </p>
            )}

            {passwordChangeSuccess && (
              <p className="text-[11px] text-emerald-500 font-bold">
                ✅ {passwordChangeSuccess}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-orange-600 hover:bg-orange-500 py-2.5 text-xs font-bold text-white transition shadow-md shadow-orange-950/25 cursor-pointer"
            >
              Salvar Nova Senha
            </button>
          </form>
        </div>
      )}

      {/* POPUP / MODAL PARA ADICIONAR E EDITAR PRODUTO */}
      <AnimatePresence>
        {productModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="font-display font-black text-base text-white">
                  {editingProduct.id ? "Alterar Lanche / Bebida" : "Cadastrar Novo Salgado/Bebida"}
                </h3>
                <button
                  onClick={() => {
                    setProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="text-stone-400 hover:text-white text-sm font-semibold"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                {/* Nome do Produto */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300 block">Nome do Lanche/Bebida *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pastel de Frango com Queijo"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Preço e Categoria */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-300 block">Preço de Venda (R$) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="Ex: 12.00"
                      value={editingProduct.price !== undefined ? editingProduct.price : ''}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-300 block">Categoria no Cardápio *</label>
                    <select
                      value={editingProduct.category || CATEGORIES[0]}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 px-3 text-xs text-stone-300 focus:outline-none focus:border-orange-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300 block">Descrição dos Ingredientes / Tamanho</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Salgado frito premium na hora com massa de batata recheado de frango caipira..."
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Botões do Modal */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setProductModalOpen(false);
                      setEditingProduct(null);
                    }}
                    className="rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 px-4 py-2 text-xs font-semibold text-stone-300 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-orange-600 hover:bg-orange-500 px-5 py-2 text-xs font-bold text-white transition shadow-lg shadow-orange-950/20"
                  >
                    Salvar Alteração
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP / MODAL PARA CONFIRMAÇÃO DE PAGAMENTO */}
      <AnimatePresence>
        {confirmPaymentState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl space-y-4 text-center"
            >
              <h3 className="font-display font-black text-base text-white">
                Confirmar Pagamento
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Você tem certeza que deseja <strong className="text-orange-500">{confirmPaymentState.currentPaid ? 'DESMARCAR o pagamento' : 'CONFIRMAR o pagamento'}</strong> do pedido de <strong>{confirmPaymentState.clientName}</strong>?
              </p>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmPaymentState(null)}
                  className="rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 px-4 py-2 text-xs font-semibold text-stone-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeTogglePayment}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white transition shadow-lg shadow-emerald-950/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
