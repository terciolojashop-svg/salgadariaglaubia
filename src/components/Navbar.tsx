import React from 'react';
import { ShoppingBag, Shield, User, MessageCircle, Phone } from 'lucide-react';
import BrandLogo from './BrandLogo';

interface NavbarProps {
  currentRole: 'client' | 'admin';
  onChangeRole: (role: 'client' | 'admin') => void;
  cartCount: number;
  onOpenCart: () => void;
  activeOrderId: string | null;
  onViewActiveOrder: () => void;
  currentPage: 'menu' | 'chat' | 'admin';
  onNavigateToMenu: () => void;
}

export default function Navbar({
  currentRole,
  onChangeRole,
  cartCount,
  onOpenCart,
  activeOrderId,
  onViewActiveOrder,
  currentPage,
  onNavigateToMenu,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-stone-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <BrandLogo 
          variant="compact" 
          onClick={onNavigateToMenu} 
          className="flex-shrink-0"
        />

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Active Order / Chat Link */}
          {activeOrderId && currentPage !== 'chat' && currentRole !== 'admin' && (
            <button
              onClick={onViewActiveOrder}
              className="relative flex items-center space-x-1.5 rounded-full bg-orange-950/50 px-3 py-1.5 text-xs font-medium text-orange-400 border border-orange-900/30 hover:bg-orange-900/40 transition"
            >
              <MessageCircle className="h-3.5 w-3.5 animate-bounce" />
              <span>Acompanhar Pedido</span>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            </button>
          )}

          {/* Contact Header */}
          <a
            href="https://wa.me/5588988086441"
            target="_blank"
            referrerPolicy="no-referrer"
            className="hidden items-center space-x-1 text-xs text-stone-300 hover:text-orange-400 transition lg:flex"
          >
            <Phone className="h-3.5 w-3.5 text-orange-500" />
            <span>(88) 9 8808-6441</span>
          </a>

          {/* Role Switcher */}
          <div className="flex items-center rounded-full bg-stone-900 p-0.5 border border-stone-800">
            <button
              onClick={() => onChangeRole('client')}
              className={`flex items-center space-x-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                currentRole === 'client'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <User className="h-3 w-3" />
              <span className="hidden sm:inline">Cliente</span>
            </button>
            <button
              onClick={() => onChangeRole('admin')}
              className={`flex items-center space-x-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                currentRole === 'admin'
                  ? 'bg-stone-800 text-amber-400 shadow-sm border border-stone-700'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Shield className="h-3 w-3" />
              <span className="hidden sm:inline">Painel Admin</span>
            </button>
          </div>

          {/* Cart Icon */}
          {currentRole === 'client' && currentPage === 'menu' && (
            <button
              id="cart-btn"
              onClick={onOpenCart}
              className="relative rounded-full bg-stone-900 p-2.5 text-stone-200 border border-stone-800 hover:bg-stone-800 hover:text-white transition"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 font-mono text-[9px] font-bold text-white ring-2 ring-stone-950 animate-scaleIn">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
