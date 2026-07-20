import React, { useState } from 'react';
import { MenuItem, CartItem } from '../types';
import { Plus, Minus, ShoppingCart, Trash2, Heart, Award, Sparkles, Send, Instagram } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BrandLogo from './BrandLogo';

interface ClientMenuProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (item: MenuItem) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CATEGORY_ICONS: { [key: string]: string } = {
  'Salgados Tradicionais': '🥟',
  'Salgados Massa de Batata': '🥔',
  'Salgados Pequenos Comum': '🍿',
  'Salgados Pequenos Batata': '🍢',
  'Pastéis': '🌮',
  'Refrigerante 1 Litro': '🥤',
  'Refrigerante 2 Litros': '🍾',
  'Refrigerante Lata': '🥫',
  'Sucos': '🍹'
};

// Caminhos locais das imagens se o usuário colocar os arquivos dentro da pasta 'public/categories/'
const LOCAL_CATEGORY_IMAGES: { [key: string]: string } = {
  'Salgados Tradicionais': '/categories/salgados_tradicionais.jpg',
  'Salgados Massa de Batata': '/categories/salgados_massa_de_batata.jpg',
  'Salgados Pequenos Comum': '/categories/salgados_pequenos_comum.jpg',
  'Salgados Pequenos Batata': '/categories/salgados_pequenos_batata.jpg',
  'Pastéis': '/categories/pasteis.jpg',
  'Refrigerante 1 Litro': '/categories/refrigerante_1_litro.jpg',
  'Refrigerante 2 Litros': '/categories/refrigerante_2_litros.jpg',
  'Refrigerante Lata': '/categories/refrigerante_lata.jpg',
  'Sucos': '/categories/sucos.jpg'
};

// Imagens premium de alta qualidade do Unsplash para carregar como fallback se o arquivo local não existir
const FALLBACK_CATEGORY_IMAGES: { [key: string]: string } = {
  'Salgados Tradicionais': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80',
  'Salgados Massa de Batata': 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=1200&q=80',
  'Salgados Pequenos Comum': 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=1200&q=80',
  'Salgados Pequenos Batata': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80',
  'Pastéis': 'https://images.unsplash.com/photo-1589187151053-5ec8818e661b?auto=format&fit=crop&w=1200&q=80',
  'Refrigerante 1 Litro': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80',
  'Refrigerante 2 Litros': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80',
  'Refrigerante Lata': 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=1200&q=80',
  'Sucos': 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=1200&q=80'
};

export default function ClientMenu({
  menuItems,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onProceedToCheckout,
  cartOpen,
  setCartOpen
}: ClientMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Salgados Tradicionais');
  
  // Controlamos qual URL estamos tentando carregar para cada categoria
  const [categoryImageSrcs, setCategoryImageSrcs] = useState<{ [key: string]: string }>(LOCAL_CATEGORY_IMAGES);
  const [failedCategories, setFailedCategories] = useState<{ [key: string]: boolean }>({});

  const handleImageError = (category: string) => {
    const currentSrc = categoryImageSrcs[category];
    const localSrc = LOCAL_CATEGORY_IMAGES[category];
    
    if (currentSrc === localSrc) {
      // Se a imagem local na pasta public falhar (não existir), carrega o fallback de alta qualidade do Unsplash
      setCategoryImageSrcs(prev => ({
        ...prev,
        [category]: FALLBACK_CATEGORY_IMAGES[category]
      }));
    } else {
      // Se até a imagem do Unsplash falhar, ocultamos a imagem dessa categoria para não quebrar o layout
      setFailedCategories(prev => ({
        ...prev,
        [category]: true
      }));
    }
  };

  // Get unique categories
  const categories = Array.from(new Set(menuItems.map(item => item.category)));
  const midIndex = Math.ceil(categories.length / 2);
  const row1 = categories.slice(0, midIndex);
  const row2 = categories.slice(midIndex);

  // Filter items by category
  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  // Cart math
  const cartTotal = cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  const cartCount = cart.reduce((count, cartItem) => count + cartItem.quantity, 0);

  const getCartItemQty = (itemId: string) => {
    const found = cart.find(c => c.item.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-stone-950 font-sans text-stone-100">
      
      {/* Banner / Hero Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-950/40 via-stone-950 to-stone-950 py-12 px-4 text-center sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent"></div>
        <div className="relative mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 border border-orange-500/20">
              <Sparkles className="h-3 w-3 animate-spin" />
              <span>Salgados Fritinhos na Hora & Pastéis Crocantes</span>
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mx-auto mt-6 max-w-md"
          >
            <BrandLogo variant="full" className="w-full transform hover:scale-[1.02] transition duration-300" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mx-auto mt-4 max-w-lg text-sm text-stone-400 sm:text-base animate-fadeIn"
          >
            Perfeitos para o seu lanche ou evento. Faça o seu pedido diretamente aqui na nossa plataforma e acompanhe em tempo real!
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-4 flex justify-center"
          >
            <a
              href="https://www.instagram.com/salgadaria_glaubia/"
              target="_blank"
              referrerPolicy="no-referrer"
              className="inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-pink-600/10 via-orange-600/10 to-amber-500/10 hover:from-pink-600/20 hover:to-amber-500/20 px-4 py-1.5 text-xs font-semibold text-orange-400 border border-orange-500/20 shadow-sm hover:border-orange-500/40 transition duration-300"
            >
              <Instagram className="h-4 w-4 text-pink-500 animate-pulse" />
              <span>Siga-nos no Instagram @salgadaria_glaubia</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        
        {/* Categories Tab Bar */}
        <div className="sticky top-16 z-30 -mx-4 bg-stone-950/80 backdrop-blur px-4 py-3 border-b border-stone-900/60 space-y-2">
          {/* Row 1 */}
          <div className="flex space-x-2 overflow-x-auto scrollbar-none md:justify-center pb-1">
            {row1.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center space-x-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50 scale-105'
                    : 'bg-stone-900 text-stone-400 border border-stone-800 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <span>{CATEGORY_ICONS[cat] || '🍽️'}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
          {/* Row 2 */}
          <div className="flex space-x-2 overflow-x-auto scrollbar-none md:justify-center">
            {row2.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center space-x-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50 scale-105'
                    : 'bg-stone-900 text-stone-400 border border-stone-800 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <span>{CATEGORY_ICONS[cat] || '🍽️'}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="mt-8">
          {/* Banner de Categoria com suporte para imagem na pasta public/categories */}
          <div className="relative h-32 sm:h-40 w-full overflow-hidden rounded-2xl border border-stone-800 bg-gradient-to-r from-orange-950/40 via-stone-900/40 to-stone-900 mb-8 flex items-end p-6 group">
            {/* Imagem de Fundo (Tenta carregar local da pasta public, cai para Unsplash se não existir) */}
            {!failedCategories[selectedCategory] && (
              <img
                src={categoryImageSrcs[selectedCategory]}
                alt={selectedCategory}
                onError={() => handleImageError(selectedCategory)}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            )}
            
            {/* Gradiente escuro para garantir leitura perfeita do texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent"></div>
            
            {/* Detalhe de luz sutil no fundo */}
            <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl"></div>

            {/* Conteúdo do Banner */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl filter drop-shadow-md">{CATEGORY_ICONS[selectedCategory]}</span>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                    {selectedCategory}
                  </h2>
                  <p className="text-[11px] text-stone-300 font-medium drop-shadow mt-0.5">
                    {selectedCategory.includes('Salgados') ? 'Feitos artesanalmente e fritos na hora com muito amor' : 'Gelados e refrescantes para acompanhar seu lanche'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => {
                const qtyInCart = getCartItemQty(item.id);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    className="relative overflow-hidden rounded-2xl bg-stone-900/40 border border-stone-800 p-5 flex flex-col justify-between hover:border-stone-700/80 transition-all duration-300 shadow-xl group"
                  >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-orange-500/5 blur-2xl group-hover:bg-orange-500/10 transition-colors duration-500"></div>
                    
                    {/* Item Details */}
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-display font-bold text-white text-base tracking-tight group-hover:text-orange-400 transition-colors">
                          {item.name}
                        </h3>
                        <span className="font-mono text-base font-extrabold text-orange-400 whitespace-nowrap">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Quantity Selector / Add button */}
                    <div className="mt-5 flex items-center justify-end border-t border-stone-800/60 pt-4">
                      
                      {qtyInCart > 0 ? (
                        <div className="flex items-center space-x-3 rounded-full bg-stone-900 p-1 border border-stone-800 shadow-inner">
                          <button
                            onClick={() => onRemoveFromCart(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-800 text-stone-300 hover:bg-stone-700 active:scale-95 transition"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center font-mono text-sm font-bold text-white">
                            {qtyInCart}
                          </span>
                          <button
                            onClick={() => onAddToCart(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-500 active:scale-95 transition"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddToCart(item)}
                          className="flex items-center space-x-1.5 rounded-full bg-orange-600 hover:bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md active:scale-95 transition duration-200"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Adicionar</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Simple visual menu card reference */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-950 border border-stone-800/80 p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-display font-bold text-white text-base">Garantia de Qualidade Glaubia</h4>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">Todos os nossos salgados são produzidos artesanalmente, com ingredientes selecionados e fritos em óleo limpo, garantindo crocância e sabor sem igual!</p>
          </div>
        </div>
      </main>

      {/* Floating View Bag Button */}
      {cartCount > 0 && !cartOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm"
        >
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-full bg-gradient-to-r from-orange-600 to-amber-500 p-4 text-white shadow-2xl shadow-orange-600/30 hover:shadow-orange-600/50 hover:brightness-110 active:scale-95 transition-all duration-300"
          >
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="text-xs font-mono font-bold bg-white/20 rounded-full px-2 py-0.5">
                {cartCount} {cartCount === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <span className="font-display text-sm font-bold">Ver Sacola</span>
            <span className="font-mono font-black text-sm">
              R$ {cartTotal.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </motion.div>
      )}

      {/* Cart Sidebar / Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-50 bg-stone-950"
            ></motion.div>

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-stone-900 shadow-2xl border-l border-stone-800"
            >
              {/* Cart Header */}
              <div className="flex h-16 items-center justify-between px-6 border-b border-stone-800">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-orange-500" />
                  <h3 className="font-display text-lg font-bold text-white">Minha Sacola</h3>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition"
                >
                  Fechar
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-800 text-stone-500 mb-4">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                    <h4 className="font-display font-bold text-white text-sm">Sua sacola está vazia</h4>
                    <p className="text-xs text-stone-400 mt-2 max-w-[240px]">
                      Navegue pelo cardápio e adicione salgados ou bebidas maravilhosas.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-xs text-stone-400 border-b border-stone-800/40 pb-2">
                      <span>Produtos Escolhidos</span>
                      <button 
                        onClick={onClearCart}
                        className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Esvaziar</span>
                      </button>
                    </div>

                    <div className="divide-y divide-stone-800/40 space-y-3">
                      {cart.map((cartItem) => (
                        <div key={cartItem.item.id} className="flex items-center justify-between pt-3 first:pt-0">
                          <div className="flex-1 pr-3">
                            <h4 className="font-display text-xs font-bold text-white leading-tight">
                              {cartItem.item.name}
                            </h4>
                            <span className="font-mono text-[11px] text-stone-400 mt-1 block">
                              R$ {cartItem.item.price.toFixed(2).replace('.', ',')} cada
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Qty edit */}
                            <div className="flex items-center space-x-2 rounded-full bg-stone-950 p-0.5 border border-stone-800">
                              <button
                                onClick={() => onRemoveFromCart(cartItem.item)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-stone-400 hover:text-white"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-4 text-center font-mono text-xs font-bold text-white">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => onAddToCart(cartItem.item)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-stone-400 hover:text-white"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            
                            {/* Total item price */}
                            <span className="w-16 text-right font-mono text-xs font-bold text-white">
                              R$ {(cartItem.item.price * cartItem.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-stone-800 bg-stone-950 p-6 space-y-4">
                  <div className="space-y-1.5 text-xs text-stone-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de entrega</span>
                      <span className="text-emerald-400 font-semibold">A combinar</span>
                    </div>
                    <div className="border-t border-stone-800/60 my-2 pt-2 flex justify-between text-base font-extrabold text-white">
                      <span className="font-display">Total do Pedido</span>
                      <span className="font-mono text-orange-400">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {cartTotal < 10 && (
                    <div className="rounded-lg bg-rose-950/20 border border-rose-900/30 p-2.5 text-[11px] text-rose-400 font-semibold flex items-center justify-center space-x-1 animate-pulse">
                      <span>⚠️ Pedido mínimo para entrega é R$ 10,00</span>
                    </div>
                  )}

                  <button
                    onClick={onProceedToCheckout}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 py-3.5 text-sm font-bold text-white shadow-lg hover:brightness-110 active:scale-98 transition duration-200"
                  >
                    <span>Prosseguir para Entrega</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
