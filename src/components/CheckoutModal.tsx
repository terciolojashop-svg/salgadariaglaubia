import React, { useState } from 'react';
import { ShoppingBag, Landmark, CreditCard, DollarSign, ChevronRight, MapPin, Phone, User, CheckCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';

interface CheckoutModalProps {
  cart: CartItem[];
  cartTotal: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (formData: {
    name: string;
    phone: string;
    address: string;
    paymentMethod: 'pix' | 'card' | 'money';
    changeFor?: string;
    cardBrand?: string;
    isScheduled?: boolean;
    scheduledDate?: string;
    scheduledTime?: string;
  }) => void;
}

export default function CheckoutModal({
  cart,
  cartTotal,
  isOpen,
  onClose,
  onSubmitOrder,
}: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'money'>('pix');
  
  // Scheduled pre-order state (encomendas)
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('18:00');
  
  // Extra details
  const [cardBrand, setCardBrand] = useState('Máquina de Cartão na Entrega (Visa/Master)');
  const [changeFor, setChangeFor] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartTotal < 10) {
      alert("O valor mínimo para entrega é de R$ 10,00. Adicione mais itens à sua sacola.");
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      alert("Por favor, preencha a data e horário para a encomenda.");
      return;
    }

    setIsSubmitting(true);
    // Simulate slight server latency for high fidelity
    setTimeout(() => {
      onSubmitOrder({
        name,
        phone,
        address,
        paymentMethod,
        changeFor: paymentMethod === 'money' ? changeFor : undefined,
        cardBrand: paymentMethod === 'card' ? cardBrand : undefined,
        isScheduled,
        scheduledDate: isScheduled ? scheduledDate : undefined,
        scheduledTime: isScheduled ? scheduledTime : undefined,
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText("88988086441");
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm"
      ></div>

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl text-stone-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-4 bg-stone-950/40">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-orange-500" />
            <h3 className="font-display text-lg font-bold text-white">Finalizar Pedido</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Order Summary Summary */}
          <div className="rounded-xl bg-stone-950/40 border border-stone-800/40 p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Resumo da Sacola</h4>
            <div className="text-xs text-stone-300 divide-y divide-stone-800/30">
              {cart.map((cartItem) => (
                <div key={cartItem.item.id} className="flex justify-between py-1.5 first:pt-0">
                  <span>{cartItem.quantity}x {cartItem.item.name}</span>
                  <span className="font-mono text-stone-400">R$ {(cartItem.item.price * cartItem.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-800/60 pt-2 flex justify-between text-sm font-extrabold text-white">
              <span>Total dos Lanches</span>
              <span className="font-mono text-orange-500">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {/* Customer Info Sections */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-l-2 border-orange-500 pl-2">
              Informações para Entrega
            </h4>

            {/* Delivery Type Selector */}
            <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                type="button"
                onClick={() => setIsScheduled(false)}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  !isScheduled
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                🏍️ Entrega Imediata
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsScheduled(true);
                  if (!scheduledDate) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    setScheduledDate(todayStr);
                  }
                }}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  isScheduled
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                📅 Encomenda Futura
              </button>
            </div>

            {/* Scheduled inputs */}
            {isScheduled && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-orange-950/10 border border-orange-900/20 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Data da Entrega *
                  </label>
                  <input
                    type="date"
                    required={isScheduled}
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 px-3 text-xs text-stone-100 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Horário Limite *
                  </label>
                  <input
                    type="time"
                    required={isScheduled}
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 px-3 text-xs text-stone-100 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-300">
                Seu Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Souza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600 focus:border-orange-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-300">
                WhatsApp / Celular *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <input
                  type="tel"
                  required
                  placeholder="Ex: (88) 99988-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600 focus:border-orange-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Address Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-300">
                Endereço de Entrega Completo *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Rua São Francisco, 120 - Centro (Apto 2B)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600 focus:border-orange-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Payment Sections */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-500 border-l-2 border-orange-500 pl-2">
              Forma de Pagamento
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {/* PIX selector */}
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 border text-center transition ${
                  paymentMethod === 'pix'
                    ? 'border-orange-500 bg-orange-950/20 text-white'
                    : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:bg-stone-900/50'
                }`}
              >
                <Landmark className="h-5 w-5 text-orange-500 mb-1.5" />
                <span className="text-[10px] sm:text-xs font-bold leading-tight">PIX</span>
                <span className="text-[8px] text-stone-400 mt-0.5 leading-none">Imediato</span>
              </button>

              {/* Card selector */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 border text-center transition ${
                  paymentMethod === 'card'
                    ? 'border-orange-500 bg-orange-950/20 text-white'
                    : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:bg-stone-900/50'
                }`}
              >
                <CreditCard className="h-5 w-5 text-orange-500 mb-1.5" />
                <span className="text-[10px] sm:text-xs font-bold leading-tight">Cartão</span>
                <span className="text-[8px] text-stone-400 mt-0.5 leading-none">Na Entrega</span>
              </button>

              {/* Dinheiro selector */}
              <button
                type="button"
                onClick={() => setPaymentMethod('money')}
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 border text-center transition ${
                  paymentMethod === 'money'
                    ? 'border-orange-500 bg-orange-950/20 text-white'
                    : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:bg-stone-900/50'
                }`}
              >
                <DollarSign className="h-5 w-5 text-orange-500 mb-1.5" />
                <span className="text-[10px] sm:text-xs font-bold leading-tight">Dinheiro</span>
                <span className="text-[8px] text-stone-400 mt-0.5 leading-none">Com Troco</span>
              </button>
            </div>

            {/* Payment Details details display */}
            <AnimatePresence mode="wait">
              {paymentMethod === 'pix' && (
                <motion.div
                  key="pix-desc"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-orange-950/10 border border-orange-900/20 p-4 space-y-3"
                >
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Você pode efetuar o PIX agora ou enviar o comprovante no chat após o pedido. 
                    Nossa chave PIX celular oficial:
                  </p>
                  <div className="flex items-center justify-between rounded-lg bg-stone-950 border border-stone-800 px-3 py-2.5">
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      (88) 9 8808-6441
                    </span>
                    <button
                      type="button"
                      onClick={copyPixKey}
                      className="flex items-center space-x-1.5 rounded-md bg-stone-900 hover:bg-stone-800 px-2.5 py-1 text-[11px] font-semibold text-orange-400 transition"
                    >
                      {copiedPix ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-500 block">
                    Nome do Beneficiário: Glaubia Salgados Eireli
                  </span>
                </motion.div>
              )}

              {paymentMethod === 'card' && (
                <motion.div
                  key="card-desc"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-300">
                      Bandeira e Tipo de Cartão / Informação
                    </label>
                    <select
                      value={cardBrand}
                      onChange={(e) => setCardBrand(e.target.value)}
                      className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2 px-3 text-sm text-stone-100 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="Máquina de Cartão na Entrega (Visa/Master/Elo)">Levar Máquina na Entrega (Crédito/Débito)</option>
                      <option value="Online - Visa Crédito">Pagar pelo App (Visa Crédito)</option>
                      <option value="Online - Mastercard Crédito">Pagar pelo App (Mastercard Crédito)</option>
                      <option value="Online - Elo Débito">Pagar pelo App (Elo Débito)</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {paymentMethod === 'money' && (
                <motion.div
                  key="money-desc"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-300">
                      Precisa de troco para quanto? (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Troco para R$ 50,00 ou R$ 100,00. Deixe em branco se não precisar de troco."
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      className="w-full rounded-lg bg-stone-950 border border-stone-800 py-2.5 px-3 text-sm text-stone-100 placeholder-stone-600 focus:border-orange-500 focus:outline-none transition"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 py-3.5 text-sm font-bold text-white shadow-xl hover:brightness-110 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <span>Processando pedido...</span>
              ) : (
                <>
                  <span>Enviar Pedido & Abrir Chat</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
