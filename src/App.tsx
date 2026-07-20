import React, { useState, useEffect } from 'react';
import { Instagram } from 'lucide-react';
import Navbar from './components/Navbar';
import ClientMenu from './components/ClientMenu';
import CheckoutModal from './components/CheckoutModal';
import OrderChat from './components/OrderChat';
import AdminDashboard from './components/AdminDashboard';
import { MenuItem, CartItem, Order } from './types';

export default function App() {
  const [currentRole, setCurrentRole] = useState<'client' | 'admin'>('client');
  const [currentPage, setCurrentPage] = useState<'menu' | 'chat' | 'admin'>(() => {
    try {
      const saved = localStorage.getItem('glaubia_active_order_id');
      const savedTime = localStorage.getItem('glaubia_active_order_time');
      if (saved && savedTime) {
        const timeDiff = Date.now() - parseInt(savedTime, 10);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        if (hoursDiff < 168) {
          return 'chat';
        }
      }
    } catch (e) {}
    return 'menu';
  });
  
  // Menu data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Active order client side tracking with persistence (lasts for 7 days / 168 hours)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('glaubia_active_order_id');
      const savedTime = localStorage.getItem('glaubia_active_order_time');
      if (saved && savedTime) {
        const timeDiff = Date.now() - parseInt(savedTime, 10);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        if (hoursDiff < 168) {
          return saved;
        } else {
          localStorage.removeItem('glaubia_active_order_id');
          localStorage.removeItem('glaubia_active_order_time');
        }
      }
    } catch (e) {
      console.error("Erro ao ler localStorage:", e);
    }
    return null;
  });

  // Sync activeOrderId to localStorage
  useEffect(() => {
    try {
      if (activeOrderId) {
        localStorage.setItem('glaubia_active_order_id', activeOrderId);
        localStorage.setItem('glaubia_active_order_time', Date.now().toString());
      }
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }
  }, [activeOrderId]);

  // Check active order validity on mount/load
  useEffect(() => {
    if (activeOrderId) {
      fetch(`/api/orders/${activeOrderId}`)
        .then(res => {
          if (res.ok) {
            return res.json();
          } else if (res.status === 404) {
            throw new Error("Order not found");
          }
        })
        .then(order => {
          if (order) {
            const isDeliveredOrCancelled = order.status === 'delivered' || order.status === 'cancelled';
            const isOld = new Date(order.createdAt).toLocaleDateString('en-CA') < new Date().toLocaleDateString('en-CA');
            
            if (order.isArchived || (isDeliveredOrCancelled && isOld)) {
              setActiveOrderId(null);
              localStorage.removeItem('glaubia_active_order_id');
              localStorage.removeItem('glaubia_active_order_time');
              if (currentPage === 'chat') {
                setCurrentPage('menu');
              }
            }
          }
        })
        .catch(err => {
          console.log("Active order no longer valid:", err);
          setActiveOrderId(null);
          localStorage.removeItem('glaubia_active_order_id');
          localStorage.removeItem('glaubia_active_order_time');
          if (currentPage === 'chat') {
            setCurrentPage('menu');
          }
        });
    }
  }, []);

  // Fetch menu on load
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data);
        }
      } catch (err) {
        console.error("Failed to load menu from server:", err);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  const [adminAuthModalOpen, setAdminAuthModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      const authenticated = localStorage.getItem('glaubia_admin_authenticated') === 'true';
      const authDate = localStorage.getItem('glaubia_admin_authenticated_date');
      const today = new Date().toLocaleDateString('pt-BR');
      if (authenticated && authDate === today) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Sync role to page
  const handleRoleChange = (role: 'client' | 'admin') => {
    if (role === 'admin') {
      const authenticated = localStorage.getItem('glaubia_admin_authenticated') === 'true';
      const authDate = localStorage.getItem('glaubia_admin_authenticated_date');
      const today = new Date().toLocaleDateString('pt-BR');
      const isStillValid = authenticated && authDate === today;

      if (isStillValid && isAdminAuthenticated) {
        setCurrentRole('admin');
        setCurrentPage('admin');
      } else {
        setIsAdminAuthenticated(false);
        setErrorMsg('');
        setAdminAuthModalOpen(true);
      }
    } else {
      setCurrentRole('client');
      if (currentPage === 'admin') {
        setCurrentPage('menu');
      }
    }
  };

  // Add to cart helper
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.item.id === item.id);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  // Remove from cart helper
  const handleRemoveFromCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.item.id === item.id);
      if (existing && existing.quantity > 1) {
        return prev.map((cartItem) =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter((cartItem) => cartItem.item.id !== item.id);
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Submit order to API
  const handleSubmitOrder = async (formData: {
    name: string;
    phone: string;
    address: string;
    paymentMethod: 'pix' | 'card';
    changeFor?: string;
    cardBrand?: string;
    isScheduled?: boolean;
    scheduledDate?: string;
    scheduledTime?: string;
  }) => {
    const total = cart.reduce(
      (sum, cartItem) => sum + cartItem.item.price * cartItem.quantity,
      0
    );

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: formData.name,
          clientPhone: formData.phone,
          clientAddress: formData.address,
          paymentMethod: formData.paymentMethod,
          changeFor: formData.changeFor,
          cardBrand: formData.cardBrand,
          isScheduled: formData.isScheduled,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
          items: cart,
          total,
        }),
      });

      if (res.ok) {
        const newOrder: Order = await res.json();
        setActiveOrderId(newOrder.id);
        setCart([]); // clear cart
        setCheckoutOpen(false);
        setCartOpen(false);
        setCurrentPage('chat');
      } else {
        const err = await res.json();
        alert(`Erro ao criar pedido: ${err.error || 'Tente novamente.'}`);
      }
    } catch (err) {
      console.error("Error submitting order:", err);
      alert("Erro de conexão ao enviar o pedido. Verifique a rede.");
    }
  };

  const cartTotal = cart.reduce(
    (total, cartItem) => total + cartItem.item.price * cartItem.quantity,
    0
  );
  const cartCount = cart.reduce((count, cartItem) => count + cartItem.quantity, 0);

  const defaultPassword = 'glaubia123';
  let actualPassword = defaultPassword;
  try {
    actualPassword = localStorage.getItem('glaubia_admin_password') || defaultPassword;
  } catch (e) {}
  const isCustomPassword = actualPassword !== defaultPassword;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <Navbar
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        activeOrderId={activeOrderId}
        onViewActiveOrder={() => {
          setCurrentRole('client');
          setCurrentPage('chat');
        }}
        currentPage={currentPage}
        onNavigateToMenu={() => {
          setCurrentRole('client');
          setCurrentPage('menu');
        }}
      />

      <div className="flex-1">
        {loadingMenu ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-2">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></span>
            <span className="text-sm text-stone-400">Carregando cardápio digital...</span>
          </div>
        ) : (
          <>
            {/* Client Menu View */}
            {currentRole === 'client' && currentPage === 'menu' && (
              <ClientMenu
                menuItems={menuItems}
                cart={cart}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onProceedToCheckout={() => {
                  if (cartTotal < 10) {
                    alert("O valor mínimo para entrega é de R$ 10,00. Adicione mais itens à sua sacola.");
                    return;
                  }
                  setCheckoutOpen(true);
                }}
                cartOpen={cartOpen}
                setCartOpen={setCartOpen}
              />
            )}

            {/* Customer Tracking and Chat View */}
            {currentRole === 'client' && currentPage === 'chat' && activeOrderId && (
              <OrderChat
                orderId={activeOrderId}
                onBackToMenu={() => setCurrentPage('menu')}
              />
            )}

            {/* Admin Dashboard View */}
            {currentRole === 'admin' && currentPage === 'admin' && (
              <AdminDashboard />
            )}
          </>
        )}
      </div>

      {/* Checkout Modal Overlay */}
      <CheckoutModal
        cart={cart}
        cartTotal={cartTotal}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* Admin Authentication Modal Overlay */}
      {adminAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-850 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 rounded-full bg-orange-500/5 blur-xl"></div>
            
            <div className="flex items-center space-x-2 text-orange-500">
              <span className="text-xl">🔑</span>
              <h3 className="font-display font-black text-white text-base">Acesso ao Painel Admin</h3>
            </div>
            
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Este painel é exclusivo para a proprietária. Por favor, insira a senha de acesso{!isCustomPassword ? (
                <span> (padrão: <code className="text-orange-400 bg-stone-950 px-1 py-0.5 rounded font-mono">{defaultPassword}</code>)</span>
              ) : ''}:
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const password = formData.get('adminPassword') as string;
              
              if (password === actualPassword) {
                setIsAdminAuthenticated(true);
                try {
                  localStorage.setItem('glaubia_admin_authenticated', 'true');
                  localStorage.setItem('glaubia_admin_authenticated_date', new Date().toLocaleDateString('pt-BR'));
                } catch (err) {}
                setAdminAuthModalOpen(false);
                setCurrentRole('admin');
                setCurrentPage('admin');
                setErrorMsg('');
              } else {
                setErrorMsg('Senha incorreta! Por favor, tente novamente.');
              }
            }} className="mt-4 space-y-4">
              <div className="space-y-1">
                <input
                  type="password"
                  name="adminPassword"
                  required
                  autoFocus
                  placeholder="Digite a senha..."
                  className="w-full rounded-lg bg-stone-950 border border-stone-850 py-2.5 px-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-orange-500"
                />
                {errorMsg && (
                  <p className="text-[11px] text-red-500 font-bold mt-1.5 animate-pulse">
                    ⚠️ {errorMsg}
                  </p>
                )}
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAdminAuthModalOpen(false);
                    setCurrentRole('client');
                    setErrorMsg('');
                  }}
                  className="flex-1 rounded-lg border border-stone-800 py-2 text-xs font-bold text-stone-400 hover:bg-stone-800 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 py-2 text-xs font-bold text-white transition shadow-md shadow-orange-950/25"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aesthetic Footer */}
      <footer className="bg-stone-950 border-t border-stone-900 py-6 text-center text-xs text-stone-500">
        <div className="mx-auto max-w-7xl px-4 space-y-2">
          <p>© 2026 Salgadaria Glaubia. Todos os direitos reservados.</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-4 space-y-1 sm:space-y-0 text-[11px]">
            <p className="font-mono text-stone-600">Salgados e pastéis feitos com paixão. Delivery (88) 9 8808-6441</p>
            <span className="hidden sm:inline text-stone-800">|</span>
            <a 
              href="https://www.instagram.com/salgadaria_glaubia/" 
              target="_blank" 
              referrerPolicy="no-referrer"
              className="inline-flex items-center justify-center space-x-1 text-orange-500 hover:text-orange-400 transition font-medium"
            >
              <Instagram className="h-3.5 w-3.5" />
              <span>@salgadaria_glaubia</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

