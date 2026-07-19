import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Order, MenuItem, DashboardStats } from "./src/types";

// Hardcoded initial menu items exactly as shown in the images
const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Salgados Tradicionais
  { id: 'trad_coxinha', name: 'Coxinha Tradicional', price: 5.00, description: 'Salgado frito clássico recheado com frango desfiado temperado', category: 'Salgados Tradicionais' },
  { id: 'trad_bola', name: 'Bola Mista', price: 5.00, description: 'Salgado frito em formato de bola recheado com presunto e queijo', category: 'Salgados Tradicionais' },
  { id: 'trad_kibe', name: 'Kibe de Carne', price: 6.00, description: 'Salgado frito de trigo com carne moída, hortelã e temperos especiais', category: 'Salgados Tradicionais' },
  { id: 'trad_enrolado', name: 'Enrolado de Salsicha', price: 5.00, description: 'Salgado frito com massa clássica e recheio de salsicha', category: 'Salgados Tradicionais' },

  // Salgados Massa de Batata
  { id: 'batata_coxinha', name: 'Coxinha (Massa de Batata)', price: 6.00, description: 'Coxinha premium com massa super leve e cremosa de batata', category: 'Salgados Massa de Batata' },
  { id: 'batata_bola', name: 'Bola Mista (Massa de Batata)', price: 6.00, description: 'Salgado de bola premium com massa leve de batata', category: 'Salgados Massa de Batata' },
  { id: 'batata_risole', name: 'Risole Especial', price: 7.00, description: 'Risole frito sequinho com massa de batata e recheio especial', category: 'Salgados Massa de Batata' },

  // Salgados Pequenos Comum
  { id: 'comum_20', name: '20 Salgados Pequenos (Comum)', price: 10.00, description: 'Porção com 20 mini salgados fritos tradicionais (tamanho festa)', category: 'Salgados Pequenos Comum' },
  { id: 'comum_30', name: '30 Salgados Pequenos (Comum)', price: 15.00, description: 'Porção com 30 mini salgados fritos tradicionais (tamanho festa)', category: 'Salgados Pequenos Comum' },
  { id: 'comum_50', name: '50 Salgados Pequenos (Comum)', price: 25.00, description: 'Porção com 50 mini salgados fritos tradicionais (tamanho festa)', category: 'Salgados Pequenos Comum' },
  { id: 'comum_100', name: '100 Salgados Pequenos (Comum)', price: 40.00, description: 'Cento completo (100 unidades) de mini salgados fritos tradicionais', category: 'Salgados Pequenos Comum' },

  // Salgados Pequenos Batata
  { id: 'batata_20', name: '20 Salgados Pequenos (Massa de Batata)', price: 15.00, description: '20 unidades de mini salgados premium feitos com massa de batata', category: 'Salgados Pequenos Batata' },
  { id: 'batata_30', name: '30 Salgados Pequenos (Massa de Batata)', price: 20.00, description: '30 unidades de mini salgados premium feitos com massa de batata', category: 'Salgados Pequenos Batata' },
  { id: 'batata_50', name: '50 Salgados Pequenos (Massa de Batata)', price: 35.00, description: '50 unidades de mini salgados premium feitos com massa de batata', category: 'Salgados Pequenos Batata' },
  { id: 'batata_100', name: '100 Salgados Pequenos (Massa de Batata)', price: 60.00, description: 'Cento completo (100 unidades) de mini salgados premium com massa de batata', category: 'Salgados Pequenos Batata' },

  // Pastéis
  { id: 'pastel_frango', name: 'Pastel de Frango', price: 6.00, description: 'Frango desfiado suculento com requeijão cremoso', category: 'Pastéis' },
  { id: 'pastel_misto', name: 'Pastel Misto', price: 6.00, description: 'Recheio clássico de presunto e queijo derretido', category: 'Pastéis' },
  { id: 'pastel_carne_sol', name: 'Pastel de Carne do Sol', price: 7.00, description: 'Carne do sol desfiada acebolada com queijo coalho', category: 'Pastéis' },
  { id: 'pastel_carne_moida', name: 'Pastel de Carne Moída', price: 7.00, description: 'Carne moída temperada com queijo derretido', category: 'Pastéis' },
  { id: 'pastel_queijo', name: 'Pastel de Queijo', price: 6.00, description: 'Bastante queijo muçarela derretido com orégano', category: 'Pastéis' },
  { id: 'pastel_pizza', name: 'Pastel de Pizza', price: 8.00, description: 'Presunto, queijo, rodelas de tomate fresco e orégano', category: 'Pastéis' },
  { id: 'pastel_calabresa', name: 'Pastel de Calabresa', price: 8.00, description: 'Calabresa moída com queijo muçarela derretido', category: 'Pastéis' },
  { id: 'pastel_pastelao', name: 'Pastelão da Casa', price: 12.00, description: 'Pastel gigante recheado com presunto, queijo, frango, requeijão e orégano', category: 'Pastéis' },

  // Refrigerante 1 Litro
  { id: 'refri_1l_cocazero', name: 'Coca-Cola Zero 1L', price: 10.00, description: 'Refrigerante garrafa de 1 litro sem açúcar gelado', category: 'Refrigerante 1 Litro' },
  { id: 'refri_1l_cocacomum', name: 'Coca-Cola Comum 1L', price: 10.00, description: 'Refrigerante garrafa de 1 litro original gelado', category: 'Refrigerante 1 Litro' },
  { id: 'refri_1l_guarana', name: 'Guaraná Antarctica 1L', price: 8.00, description: 'Refrigerante garrafa de 1 litro gelado', category: 'Refrigerante 1 Litro' },
  { id: 'refri_1l_cajuina', name: 'Cajuína São Geraldo 1L', price: 10.00, description: 'Cajuína tradicional nordestina garrafa de 1 litro gelada', category: 'Refrigerante 1 Litro' },

  // Refrigerante 2 Litros
  { id: 'refri_2l_cocazero', name: 'Coca-Cola Zero 2L', price: 14.00, description: 'Refrigerante garrafa de 2 litros sem açúcar gelado', category: 'Refrigerante 2 Litros' },
  { id: 'refri_2l_cocacomum', name: 'Coca-Cola Comum 2L', price: 14.00, description: 'Refrigerante garrafa de 2 litros original gelado', category: 'Refrigerante 2 Litros' },
  { id: 'refri_2l_guarana', name: 'Guaraná Antarctica 2L', price: 14.00, description: 'Refrigerante garrafa de 2 litros original gelado', category: 'Refrigerante 2 Litros' },
  { id: 'refri_2l_cajuina', name: 'Cajuína São Geraldo 2L', price: 14.00, description: 'Cajuína garrafa de 2 litros gelada', category: 'Refrigerante 2 Litros' },

  // Refrigerante Lata
  { id: 'refri_lata_cocazero', name: 'Coca-Cola Zero Lata', price: 6.00, description: 'Lata 350ml gelada sem açúcar', category: 'Refrigerante Lata' },
  { id: 'refri_lata_cocacomum', name: 'Coca-Cola Comum Lata', price: 6.00, description: 'Lata 350ml gelada sabor original', category: 'Refrigerante Lata' },
  { id: 'refri_lata_guarana', name: 'Guaraná Antarctica Lata', price: 6.00, description: 'Lata 350ml gelada', category: 'Refrigerante Lata' },
  { id: 'refri_lata_fantauva', name: 'Fanta Uva Lata', price: 6.00, description: 'Lata 350ml gelada', category: 'Refrigerante Lata' },
  { id: 'refri_lata_fantalaranja', name: 'Fanta Laranja Lata', price: 6.00, description: 'Lata 350ml gelada', category: 'Refrigerante Laranja' },
  { id: 'refri_lata_cajuina', name: 'Cajuína São Geraldo Lata', price: 6.00, description: 'Lata 350ml gelada', category: 'Refrigerante Lata' },

  // Sucos
  { id: 'suco_maracuja', name: 'Suco de Maracujá 500ml', price: 6.00, description: 'Suco natural da fruta bem gelado', category: 'Sucos' },
  { id: 'suco_goiaba', name: 'Suco de Goiaba 500ml', price: 5.00, description: 'Suco natural da fruta bem gelado', category: 'Sucos' },
  { id: 'suco_manga', name: 'Suco de Manga 500ml', price: 5.00, description: 'Suco natural da fruta bem gelado', category: 'Sucos' },
  { id: 'suco_caja', name: 'Suco de Cajá 500ml', price: 5.00, description: 'Suco natural da fruta bem gelado', category: 'Sucos' }
];

const MENU_FILE = path.join(process.cwd(), "menu.json");
let MENU_ITEMS: MenuItem[] = [];

if (fs.existsSync(MENU_FILE)) {
  try {
    const raw = fs.readFileSync(MENU_FILE, "utf-8");
    MENU_ITEMS = JSON.parse(raw);
    console.log(`Loaded ${MENU_ITEMS.length} items from menu.json`);
  } catch (err) {
    console.error("Error reading menu.json, using defaults", err);
    MENU_ITEMS = [...INITIAL_MENU_ITEMS];
  }
} else {
  MENU_ITEMS = [...INITIAL_MENU_ITEMS];
  try {
    fs.writeFileSync(MENU_FILE, JSON.stringify(MENU_ITEMS, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write initial menu.json", err);
  }
}

function saveMenu() {
  try {
    fs.writeFileSync(MENU_FILE, JSON.stringify(MENU_ITEMS, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to menu.json", err);
  }
}

const DB_FILE = path.join(process.cwd(), "orders.json");

// Load initial orders
let orders: Order[] = [];
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    orders = JSON.parse(raw);
    console.log(`Loaded ${orders.length} orders from orders.json`);
  } catch (err) {
    console.error("Error reading orders.json database file. Starting fresh.", err);
    orders = [];
  }
} else {
  // Add 3 beautiful mock orders so the Admin dashboard is immediately populated and looks gorgeous on first load!
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const hoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  orders = [
    {
      id: "PED-1024",
      clientName: "Maria Eduarda Silva",
      clientPhone: "(88) 9 9988-1234",
      clientAddress: "Rua Padre Cícero, 450 - Centro",
      paymentMethod: "pix",
      items: [
        {
          item: MENU_ITEMS[0], // Coxinha tradicional (5.00)
          quantity: 4
        },
        {
          item: MENU_ITEMS[15], // Pastel de Frango (6.00)
          quantity: 2
        },
        {
          item: MENU_ITEMS[29], // Cajuina Garrafa (14.00)
          quantity: 1
        }
      ],
      total: 46.00,
      status: "delivered",
      createdAt: dayAgo.toISOString(),
      messages: [
        { id: "m1", sender: "system", text: "Pedido recebido com sucesso!", createdAt: dayAgo.toISOString() },
        { id: "m2", sender: "client", text: "Olá! Gostaria que os pastéis fossem bem fritos e crocantes.", createdAt: new Date(dayAgo.getTime() + 120000).toISOString() },
        { id: "m3", sender: "admin", text: "Olá Maria! Com certeza, prepararemos bem caprichados para você!", createdAt: new Date(dayAgo.getTime() + 300000).toISOString() },
        { id: "m4", sender: "system", text: "Status alterado para: Em Preparo 👨‍🍳", createdAt: new Date(dayAgo.getTime() + 600000).toISOString() },
        { id: "m5", sender: "system", text: "Status alterado para: Saiu para Entrega 🏍️", createdAt: new Date(dayAgo.getTime() + 1800000).toISOString() },
        { id: "m6", sender: "system", text: "Status alterado para: Entregue ✅", createdAt: new Date(dayAgo.getTime() + 2700000).toISOString() },
        { id: "m7", sender: "client", text: "Salgados incríveis! O pastelão estava delicioso.", createdAt: new Date(dayAgo.getTime() + 3000000).toISOString() }
      ]
    },
    {
      id: "PED-1025",
      clientName: "João Pedro Santos",
      clientPhone: "(88) 9 8112-5678",
      clientAddress: "Av. Leão Sampaio, 1200 - Triângulo",
      paymentMethod: "card",
      cardBrand: "Visa / Crédito",
      items: [
        {
          item: MENU_ITEMS[10], // Cento de salgados fritos comum (40.00)
          quantity: 1
        },
        {
          item: MENU_ITEMS[25], // Coca 2L (14.00)
          quantity: 2
        }
      ],
      total: 68.00,
      status: "preparing",
      createdAt: hoursAgo.toISOString(),
      messages: [
        { id: "m1", sender: "system", text: "Pedido recebido com sucesso!", createdAt: hoursAgo.toISOString() },
        { id: "m2", sender: "system", text: "Status alterado para: Em Preparo 👨‍🍳", createdAt: new Date(hoursAgo.getTime() + 300000).toISOString() }
      ]
    },
    {
      id: "PED-1026",
      clientName: "Ana Clara Oliveira",
      clientPhone: "(88) 9 9654-9876",
      clientAddress: "Rua São Pedro, 105 - Salesianos",
      paymentMethod: "pix",
      items: [
        {
          item: MENU_ITEMS[4], // Coxinha Massa Batata (6.00)
          quantity: 5
        },
        {
          item: MENU_ITEMS[22], // Pastelão da Casa (12.00)
          quantity: 2
        },
        {
          item: MENU_ITEMS[30], // Guaraná 2L (14.00)
          quantity: 1
        }
      ],
      total: 68.00,
      status: "pending",
      createdAt: now.toISOString(),
      messages: [
        { id: "m1", sender: "system", text: "Pedido recebido com sucesso! Aguardando confirmação da cozinha.", createdAt: now.toISOString() }
      ]
    }
  ];
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write initial seed orders", err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to orders.json", err);
  }
}

function archiveOldDeliveredOrders() {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // "YYYY-MM-DD" local format
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  let changed = false;

  // 1. Permanently delete cancelled orders older than 24 hours
  const initialLength = orders.length;
  orders = orders.filter(order => {
    if (order.status === 'cancelled') {
      try {
        const orderDate = new Date(order.createdAt);
        if (orderDate < twentyFourHoursAgo) {
          console.log(`[Auto-Delete] Deleting cancelled order ${order.id} older than 24 hours`);
          return false;
        }
      } catch (err) {
        console.error(`Error checking deletion for order ${order.id}:`, err);
      }
    }
    return true;
  });

  if (orders.length !== initialLength) {
    changed = true;
  }

  // 2. Auto-archive cancelled orders immediately so they "disappear" from active views,
  // and archive old delivered orders from previous days.
  orders = orders.map(order => {
    if (order.status === 'cancelled' && !order.isArchived) {
      console.log(`[Auto-Archive] Archiving cancelled order ${order.id} to make it disappear`);
      changed = true;
      return { ...order, isArchived: true };
    }

    if (order.status === 'delivered' && !order.isArchived) {
      try {
        const orderDate = new Date(order.createdAt);
        const orderDateStr = orderDate.toLocaleDateString('en-CA');
        
        if (orderDateStr < todayStr) {
          console.log(`[Auto-Archive] Archiving delivered order ${order.id} (created: ${orderDateStr}, today: ${todayStr})`);
          changed = true;
          return { ...order, isArchived: true };
        }
      } catch (err) {
        console.error(`Error archiving check for order ${order.id}:`, err);
      }
    }
    return order;
  });
  
  if (changed) {
    saveDB();
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Run auto-archiving on startup
  archiveOldDeliveredOrders();

  // 1. GET /api/menu - Get all menu items
  app.get("/api/menu", (req, res) => {
    res.json(MENU_ITEMS);
  });

  // 1b. POST /api/menu - Add or update a menu item
  app.post("/api/menu", (req, res) => {
    const { id, name, price, description, category } = req.body;
    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: "Nome, preço e categoria são obrigatórios" });
    }

    if (id) {
      const index = MENU_ITEMS.findIndex(item => item.id === id);
      if (index !== -1) {
        MENU_ITEMS[index] = {
          id,
          name,
          price: Number(price),
          description: description || "",
          category
        };
        saveMenu();
        return res.json(MENU_ITEMS[index]);
      }
    }

    // Create brand new product
    const newId = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newItem: MenuItem = {
      id: newId,
      name,
      price: Number(price),
      description: description || "",
      category
    };

    MENU_ITEMS.push(newItem);
    saveMenu();
    res.status(201).json(newItem);
  });

  // 1c. DELETE /api/menu/:id - Delete a menu item
  app.delete("/api/menu/:id", (req, res) => {
    const { id } = req.params;
    const index = MENU_ITEMS.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const deleted = MENU_ITEMS.splice(index, 1)[0];
    saveMenu();
    res.json({ success: true, deleted });
  });

  // 2. GET /api/orders - Get all orders
  app.get("/api/orders", (req, res) => {
    archiveOldDeliveredOrders();
    res.json(orders);
  });

  // 3. POST /api/orders - Create a new order
  app.post("/api/orders", (req, res) => {
    const { 
      clientName, 
      clientPhone, 
      clientAddress, 
      paymentMethod, 
      items, 
      total, 
      changeFor, 
      cardBrand,
      isScheduled,
      scheduledDate,
      scheduledTime
    } = req.body;
    
    if (!clientName || !clientPhone || !clientAddress || !paymentMethod || !items || !items.length) {
      return res.status(400).json({ error: "Parâmetros obrigatórios ausentes" });
    }

    const orderId = `PED-${1000 + orders.length + Math.floor(Math.random() * 100)}`;
    const initialStatus = isScheduled ? "scheduled" : "pending";
    
    let welcomeText = `Pedido #${orderId} recebido com sucesso! Aguardando confirmação da Salgadaria Glaubia.`;
    if (isScheduled && scheduledDate) {
      try {
        const formattedDate = new Date(scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR');
        welcomeText = `Sua encomenda para o dia ${formattedDate} (às ${scheduledTime || '18:00'}) foi recebida com sucesso! Aguardando confirmação da Salgadaria Glaubia.`;
      } catch (e) {
        welcomeText = `Sua encomenda foi recebida com sucesso! Aguardando confirmação da Salgadaria Glaubia.`;
      }
    }

    const paymentInfoText = paymentMethod === 'pix' 
      ? "Forma de Pagamento: PIX" 
      : paymentMethod === 'card' 
        ? `Forma de Pagamento: Cartão (${cardBrand || 'Levar maquininha na entrega'})` 
        : `Forma de Pagamento: Dinheiro${changeFor ? ` (Troco para: ${changeFor})` : ' (Não precisa de troco)'}`;

    const newOrder: Order = {
      id: orderId,
      clientName,
      clientPhone,
      clientAddress,
      paymentMethod,
      changeFor,
      cardBrand,
      items,
      total,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      isScheduled: !!isScheduled,
      scheduledDate,
      scheduledTime,
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: "system",
          text: welcomeText,
          createdAt: new Date().toISOString()
        },
        {
          id: `msg-${Date.now()}-2`,
          sender: "system",
          text: paymentInfoText,
          createdAt: new Date().toISOString()
        }
      ]
    };

    orders.unshift(newOrder); // Add to beginning of array
    saveDB();

    res.status(201).json(newOrder);
  });

  // 4. GET /api/orders/:id - Get a single order
  app.get("/api/orders/:id", (req, res) => {
    archiveOldDeliveredOrders();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    res.json(order);
  });

  // 5. POST /api/orders/:id/status - Update order status
  app.post("/api/orders/:id/status", (req, res) => {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório" });
    }

    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    orders[orderIndex].status = status;
    if (status !== "delivered") {
      orders[orderIndex].isArchived = false;
    }

    // Add status update system message to the chat
    let statusText = "";
    switch (status) {
      case "preparing":
        statusText = "Seu pedido está sendo preparado na cozinha! 👨‍🍳";
        break;
      case "dispatched":
        statusText = "Seu pedido saiu para entrega! O entregador está a caminho. 🏍️";
        break;
      case "delivered":
        statusText = "Pedido entregue! Muito obrigado pela preferência! Bom apetite! ❤️";
        break;
      case "cancelled":
        statusText = "Infelizmente, seu pedido foi cancelado. Se tiver dúvidas, entre em contato.";
        break;
      case "pending":
        statusText = "Pedido retornado ao status pendente.";
        break;
      case "scheduled":
        statusText = "Seu pedido foi agendado como encomenda.";
        break;
    }

    orders[orderIndex].messages.push({
      id: `system-${Date.now()}`,
      sender: "system",
      text: statusText,
      createdAt: new Date().toISOString()
    });

    saveDB();
    res.json(orders[orderIndex]);
  });

  // 6. POST /api/orders/:id/messages - Send a message
  app.post("/api/orders/:id/messages", (req, res) => {
    const { sender, text } = req.body;
    if (!sender || !text) {
      return res.status(400).json({ error: "Remetente (sender) e texto são obrigatórios" });
    }

    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: sender as 'client' | 'admin' | 'system',
      text,
      createdAt: new Date().toISOString()
    };

    orders[orderIndex].messages.push(newMessage);
    saveDB();

    res.status(201).json(newMessage);
  });

  // 6b. POST /api/orders/:id/archive - Manually archive or unarchive an order
  app.post("/api/orders/:id/archive", (req, res) => {
    const { isArchived } = req.body;
    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    orders[orderIndex].isArchived = !!isArchived;
    saveDB();
    res.json(orders[orderIndex]);
  });

  // 6c. POST /api/orders/:id/paid - Toggle payment status
  app.post("/api/orders/:id/paid", (req, res) => {
    const { isPaid } = req.body;
    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    orders[orderIndex].isPaid = !!isPaid;
    saveDB();
    res.json(orders[orderIndex]);
  });

  // 7. GET /api/reports - Admin Reports
  app.get("/api/reports", (req, res) => {
    archiveOldDeliveredOrders();
    const totalSales = orders
      .filter(o => o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const scheduledOrders = orders.filter(o => o.status === "scheduled").length;
    const preparingOrders = orders.filter(o => o.status === "preparing").length;
    const dispatchedOrders = orders.filter(o => o.status === "dispatched").length;
    const completedOrders = orders.filter(o => o.status === "delivered").length;

    const pixOrders = orders.filter(o => o.paymentMethod === "pix").length;
    const cardOrders = orders.filter(o => o.paymentMethod === "card").length;
    const moneyOrders = orders.filter(o => o.paymentMethod === "money").length;

    // Top items count
    const itemMap: { [key: string]: { quantity: number; revenue: number } } = {};
    orders.forEach(o => {
      o.items.forEach(cartItem => {
        const name = cartItem.item.name;
        if (!itemMap[name]) {
          itemMap[name] = { quantity: 0, revenue: 0 };
        }
        itemMap[name].quantity += cartItem.quantity;
        itemMap[name].revenue += cartItem.quantity * cartItem.item.price;
      });
    });

    const topItems = Object.keys(itemMap)
      .map(name => ({
        name,
        quantity: itemMap[name].quantity,
        revenue: itemMap[name].revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    // Sales by day (grouped by last 7 days)
    const salesByDayMap: { [key: string]: { sales: number; count: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      salesByDayMap[dateStr] = { sales: 0, count: 0 };
    }

    orders.forEach(o => {
      const dateStr = new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (salesByDayMap[dateStr] !== undefined) {
        salesByDayMap[dateStr].count += 1;
        if (o.status === "delivered") {
          salesByDayMap[dateStr].sales += o.total;
        }
      }
    });

    const salesByDay = Object.keys(salesByDayMap).map(date => ({
      date,
      sales: Number(salesByDayMap[date].sales.toFixed(2)),
      count: salesByDayMap[date].count
    }));

    const reports: DashboardStats = {
      totalSales: Number(totalSales.toFixed(2)),
      totalOrders,
      pendingOrders,
      scheduledOrders,
      preparingOrders,
      dispatchedOrders,
      completedOrders,
      paymentStats: {
        pix: pixOrders,
        card: cardOrders,
        money: moneyOrders
      },
      topItems,
      salesByDay
    };

    res.json(reports);
  });

  // Vite development vs production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
