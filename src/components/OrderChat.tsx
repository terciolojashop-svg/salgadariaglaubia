import React, { useState, useEffect, useRef } from 'react';
import { Order, ChatMessage } from '../types';
import { 
  Send, Clock, Utensils, Truck, CheckCircle2, MessageSquare, 
  ArrowLeft, Phone, MapPin, Receipt, RefreshCw, Smartphone 
} from 'lucide-react';
import { motion } from 'motion/react';

interface OrderChatProps {
  orderId: string;
  onBackToMenu: () => void;
}

export default function OrderChat({ orderId, onBackToMenu }: OrderChatProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pollingError, setPollingError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for order updates and chat messages
  const fetchOrderDetails = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setPollingError(false);
      } else {
        setPollingError(true);
      }
    } catch (err) {
      console.error("Error fetching order in chat:", err);
      setPollingError(true);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails(true);

    // Setup polling every 4 seconds to simulate real-time updates!
    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 4000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Scroll to bottom when messages list changes (smart scroll)
  const messagesCount = order?.messages?.length || 0;
  const prevMessagesCountRef = useRef(0);
  const prevOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (orderId !== prevOrderIdRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      prevOrderIdRef.current = orderId;
      prevMessagesCountRef.current = messagesCount;
    } else if (messagesCount > prevMessagesCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevMessagesCountRef.current = messagesCount;
    }
  }, [orderId, messagesCount]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !order) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'client',
          text: messageText
        })
      });

      if (res.ok) {
        // Refresh right away
        await fetchOrderDetails();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-stone-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm">Carregando painel de acompanhamento...</p>
      </div>
    );
  }

  if (!order) {
    const handleInvalidOrderBack = () => {
      try {
        localStorage.removeItem('glaubia_active_order_id');
        localStorage.removeItem('glaubia_active_order_time');
      } catch (e) {}
      onBackToMenu();
      window.location.reload();
    };

    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-stone-400 space-y-4 px-4 text-center">
        <p className="text-sm text-red-400 font-semibold">Oops! Não conseguimos localizar seu pedido.</p>
        <button
          onClick={handleInvalidOrderBack}
          className="rounded-full bg-stone-900 px-6 py-2 text-xs font-semibold text-white border border-stone-800"
        >
          Voltar ao Cardápio
        </button>
      </div>
    );
  }

  // Calculate order items count
  const itemsCount = order.items.reduce((acc, curr) => acc + curr.quantity, 0);

  // Status index mapping
  const statuses = order.isScheduled
    ? (['scheduled', 'preparing', 'dispatched', 'delivered'] as const)
    : (['pending', 'preparing', 'dispatched', 'delivered'] as const);
  const currentStatusIdx = statuses.indexOf(order.status as any);

  const formatWhatsAppText = () => {
    const itemsText = order.items
      .map(i => `• ${i.quantity}x ${i.item.name} (R$ ${(i.item.price * i.quantity).toFixed(2).replace('.', ',')})`)
      .join('\n');

    let scheduleInfo = '';
    if (order.isScheduled && order.scheduledDate) {
      const formattedDate = new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR');
      scheduleInfo = `*Tipo:* 📅 Encomenda Agendada\n*Data/Hora de Entrega:* ${formattedDate} às ${order.scheduledTime || '18:00'}\n`;
    } else {
      scheduleInfo = `*Tipo:* ⚡ Entrega Imediata\n`;
    }

    const paymentDetails = order.paymentMethod.toUpperCase() +
      (order.cardBrand ? ` (${order.cardBrand})` : '') +
      (order.changeFor ? ` (Troco para R$ ${order.changeFor})` : '') +
      (order.isPaid ? ' [✓ PAGO]' : ' [✗ NÃO PAGO]');

    const rawText = `*PEDIDO CONFIRMADO - SALGADARIA GLAUBIA*\n\n` +
      `*ID do Pedido:* ${order.id}\n` +
      `*Cliente:* ${order.clientName}\n` +
      `*WhatsApp:* ${order.clientPhone}\n` +
      `*Endereço:* ${order.clientAddress}\n` +
      scheduleInfo +
      `*Pagamento:* ${paymentDetails}\n\n` +
      `*ÍTENS:*\n${itemsText}\n\n` +
      `*Total Geral:* R$ ${order.total.toFixed(2).replace('.', ',')}\n\n` +
      `_Acompanhe pelo link do cardápio digital do seu celular!_`;

    return encodeURIComponent(rawText);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={onBackToMenu}
        className="mb-4 flex items-center space-x-1.5 text-xs text-stone-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para o Cardápio</span>
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Order Progress and Info (2 Columns on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Status Card */}
          <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-orange-500/5 blur-xl"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-orange-500 bg-orange-950/40 border border-orange-900/30 px-2.5 py-1 rounded-full">
                  PEDIDO {order.id}
                </span>
                <h1 className="font-display font-black text-2xl text-white mt-2">
                  Acompanhe seu Pedido
                </h1>
                <p className="text-xs text-stone-400 mt-1">
                  Criado em: {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Quick Status Pill */}
              <div className="flex flex-wrap items-center gap-2">
                {order.isPaid && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-900/50 uppercase tracking-wide flex items-center space-x-1">
                    <span>✓ Pago</span>
                  </span>
                )}
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>
                  <span className="text-xs font-bold text-stone-300 bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700 uppercase tracking-wide">
                    {order.status === 'scheduled' && `Agendado para ${order.scheduledDate ? new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''} 📅`}
                    {order.status === 'pending' && 'Aguardando Aprovação 🕒'}
                    {order.status === 'preparing' && 'Na Cozinha 👨‍🍳'}
                    {order.status === 'dispatched' && 'Saiu para Entrega 🏍️'}
                    {order.status === 'delivered' && 'Entregue ✅'}
                    {order.status === 'cancelled' && 'Cancelado ❌'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            {order.status !== 'cancelled' && (
              <div className="mt-8">
                <div className="relative flex justify-between items-center w-full">
                  {/* Background Progress Line */}
                  <div className="absolute left-0 right-0 top-1/2 h-1 bg-stone-800 -translate-y-1/2 z-0 rounded-full"></div>
                  
                  {/* Highlighted Progress Line */}
                  <div 
                    className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-orange-600 to-amber-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                    style={{ width: `${(Math.max(0, currentStatusIdx) / (statuses.length - 1)) * 100}%` }}
                  ></div>

                  {/* Steps */}
                  {(order.isScheduled ? [
                    { key: 'scheduled', label: 'Agendado', desc: `Para ${order.scheduledDate ? new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''}`, icon: Clock },
                    { key: 'preparing', label: 'Preparo', desc: 'Na cozinha', icon: Utensils },
                    { key: 'dispatched', label: 'Entrega', desc: 'Saiu da loja', icon: Truck },
                    { key: 'delivered', label: 'Entregue', desc: 'Bom apetite!', icon: CheckCircle2 }
                  ] : [
                    { key: 'pending', label: 'Recebido', desc: 'Confirmando', icon: Clock },
                    { key: 'preparing', label: 'Preparo', desc: 'Na cozinha', icon: Utensils },
                    { key: 'dispatched', label: 'Entrega', desc: 'Saiu da loja', icon: Truck },
                    { key: 'delivered', label: 'Entregue', desc: 'Bom apetite!', icon: CheckCircle2 }
                  ]).map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = idx <= currentStatusIdx;
                    const isActive = idx === currentStatusIdx;

                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center">
                        <div 
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-950/50 scale-110' 
                              : 'bg-stone-900 border-stone-800 text-stone-500'
                          } ${isActive ? 'ring-4 ring-orange-950/60' : ''}`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <span className={`mt-2 text-xs font-bold ${isCompleted ? 'text-white' : 'text-stone-500'}`}>
                          {step.label}
                        </span>
                        <span className="hidden sm:inline text-[10px] text-stone-500 mt-0.5 max-w-[80px] text-center truncate">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Client & Delivery Info Card */}
          <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-white text-base border-b border-stone-800 pb-3">
              Detalhes da Entrega e Lanche
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-3">
                {order.isScheduled && order.scheduledDate && (
                  <div className="flex items-start space-x-2 text-stone-300 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Clock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-amber-500 font-bold uppercase">Encomenda Agendada</span>
                      <span className="font-bold text-white text-xs">
                        {new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {order.scheduledTime || '18:00'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-2 text-stone-300">
                  <Phone className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-stone-500 font-semibold uppercase">Cliente & Contato</span>
                    <span className="font-bold text-white">{order.clientName}</span>
                    <span className="block text-stone-400 mt-0.5">{order.clientPhone}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-stone-300">
                  <MapPin className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-stone-500 font-semibold uppercase">Endereço de Entrega</span>
                    <span className="font-bold text-white block">{order.clientAddress}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-stone-800 pt-3 sm:border-t-0 sm:pt-0 sm:pl-4 sm:border-l sm:border-stone-800/80">
                <div className="flex items-start space-x-2 text-stone-300">
                  <Receipt className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-stone-500 font-semibold uppercase">Forma de Pagamento</span>
                    <span className="font-bold text-white uppercase">{order.paymentMethod}</span>
                    {order.cardBrand && (
                      <span className="block text-[11px] text-orange-400 mt-0.5">{order.cardBrand}</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-stone-950 p-2.5 border border-stone-800">
                  <span className="block text-[10px] text-stone-500 font-semibold uppercase">Resumo da Compra</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-stone-400">{itemsCount} salgados/bebidas</span>
                    <span className="font-mono font-bold text-orange-400 text-sm">
                      R$ {order.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* fallback backup WhatsApp dispatch option */}
            <div className="border-t border-stone-800/60 pt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <span className="text-xs text-stone-400 text-center sm:text-left">
                💡 Quer uma via do seu pedido no WhatsApp também?
              </span>
              <a
                href={`https://wa.me/5588988086441?text=${formatWhatsAppText()}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center space-x-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition whitespace-nowrap"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Enviar p/ WhatsApp</span>
              </a>
            </div>

          </div>
        </div>

        {/* Right Side: Chat Box (1 Column on large screen) */}
        <div className="rounded-2xl bg-stone-900 border border-stone-800 shadow-xl flex flex-col h-[520px] overflow-hidden">
          {/* Chat Header */}
          <div className="bg-stone-950 px-4 py-3.5 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <span className="block text-xs font-bold text-white">Chat com o Estabelecimento</span>
                <span className="text-[10px] text-stone-400">Atendimento Salgadaria Glaubia</span>
              </div>
            </div>
            
            {/* Poll Status status display */}
            <span className="text-[9px] font-mono text-stone-500">
              {pollingError ? 'Desconectado ⚠️' : 'Online 🟢'}
            </span>
          </div>

          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-950/20">
            {order.messages.map((msg) => {
              const isSystem = msg.sender === 'system';
              const isMe = msg.sender === 'client';
              const isStore = msg.sender === 'admin';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-[10px] text-orange-400 bg-orange-950/20 px-3 py-1 rounded-full border border-orange-900/10 text-center max-w-[90%] leading-relaxed">
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
                    {isMe ? 'Você' : 'Salgadaria Glaubia'} • {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-orange-600 text-white rounded-tr-none' 
                        : 'bg-stone-800 text-stone-100 rounded-tl-none border border-stone-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-stone-950 border-t border-stone-800 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Digite sua mensagem para a loja..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-lg bg-stone-900 border border-stone-800 py-2 px-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 transition"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 transition"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
