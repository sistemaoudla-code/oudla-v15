import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import PDFDocument from "pdfkit";
import rateLimit from "express-rate-limit";
import { sendOrderConfirmationEmail } from "./email";
import {
  createPreferenceClient,
  createPaymentClient,
  validateWebhookSignature,
  getEnvironmentInfo,
  getPublicKey
} from "./mercadopago";

const router = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas de checkout. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    console.warn(`Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests. Try again later.' });
  }
});

function validateCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;
  
  return true;
}

const checkoutItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productImage: z.string(),
  size: z.string().optional().nullable(),
  color: z.object({
    name: z.string(),
    hex: z.string(),
  }).optional().nullable(),
  fabric: z.object({
    name: z.string(),
    price: z.number(),
  }).optional().nullable(),
  printPosition: z.string().optional().nullable(),
  unitPrice: z.string(),
  quantity: z.number().int().positive(),
  subtotal: z.string(),
});

const checkoutSchema = z.object({
  customerName: z.string().min(3),
  customerEmail: z.string().email(),
  customerPhone: z.string().refine((val) => {
    const numbers = val.replace(/\D/g, '');
    return numbers.length === 10 || numbers.length === 11;
  }, "Telefone deve ter 10 ou 11 dígitos"),
  customerCpf: z.string().refine((val) => {
    return validateCPF(val);
  }, "CPF inválido"),
  zipCode: z.string().refine((val) => {
    const numbers = val.replace(/\D/g, '');
    return numbers.length === 8;
  }, "CEP deve ter 8 dígitos"),
  street: z.string().min(3),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
  items: z.array(checkoutItemSchema).min(1),
  subtotal: z.string(),
  discountAmount: z.string().optional(),
  shippingCost: z.string(),
  totalAmount: z.string(),
  userAgent: z.string().optional(),
  deviceType: z.string().optional(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  osName: z.string().optional(),
  osVersion: z.string().optional(),
  screenResolution: z.string().optional(),
});

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `OUDLA-${dateStr}-${random}`;
}

router.post("/create-order", checkoutLimiter, async (req, res) => {
  try {
    const data = checkoutSchema.parse(req.body);

    const itemsSubtotal = data.items.reduce((sum, item) => {
      const unitPrice = parseFloat(item.unitPrice);
      const itemTotal = unitPrice * item.quantity;
      return sum + itemTotal;
    }, 0);
    
    const discountAmount = parseFloat(data.discountAmount || "0");
    const shippingCost = parseFloat(data.shippingCost);
    const expectedTotal = itemsSubtotal - discountAmount + shippingCost;
    const clientTotal = parseFloat(data.totalAmount);
    
    const priceDifference = Math.abs(expectedTotal - clientTotal);
    if (priceDifference > 0.01) {
      console.error("Preço total não corresponde aos itens:", {
        expectedTotal: expectedTotal.toFixed(2),
        clientTotal: clientTotal.toFixed(2),
        difference: priceDifference.toFixed(2),
        items: data.items.length
      });
      return res.status(400).json({ 
        error: "Preço total inválido.",
        expected: expectedTotal.toFixed(2),
        received: clientTotal.toFixed(2)
      });
    }

    const orderNumber = generateOrderNumber();

    const orderItemsForDb = data.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      size: item.size || "Padrão",
      color: item.color ? JSON.stringify(item.color) : JSON.stringify({ name: "Padrão", hex: "#000000" }),
      fabric: item.fabric ? JSON.stringify(item.fabric) : null,
      printPosition: item.printPosition,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    
    const order = await storage.createOrder(
      {
        orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerCpf: data.customerCpf,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        subtotal: data.subtotal,
        discountAmount: data.discountAmount || "0",
        shippingCost: data.shippingCost,
        totalAmount: data.totalAmount,
        orderStatus: "pending",
        customerIp: typeof clientIp === 'string' ? clientIp : clientIp[0],
        userAgent: data.userAgent,
        deviceType: data.deviceType,
        browserName: data.browserName,
        browserVersion: data.browserVersion,
        osName: data.osName,
        osVersion: data.osVersion,
        screenResolution: data.screenResolution,
      },
      orderItemsForDb
    );
    
    console.log("Pedido criado:", {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    res.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      message: "Pedido criado com sucesso. Aguardando integração com gateway de pagamento.",
    });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Erro ao processar pedido",
    });
  }
});

function validateOrderNumber(orderNumber: string): boolean {
  return /^OUDLA-\d{8}-\d{4}$/.test(orderNumber);
}

router.get("/order/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    if (!validateOrderNumber(orderNumber)) {
      return res.status(400).json({
        success: false,
        error: "Número de pedido inválido"
      });
    }
    
    const order = await storage.getOrderByOrderNumber(orderNumber);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Pedido não encontrado"
      });
    }
    
    const items = await storage.getOrderItems(order.id);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        street: order.street,
        number: order.number,
        complement: order.complement,
        neighborhood: order.neighborhood,
        city: order.city,
        state: order.state,
        zipCode: order.zipCode,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentInstallments: order.paymentInstallments,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        items: items.map(item => ({
          productName: item.productName,
          productImage: item.productImage,
          size: item.size,
          color: item.color ? JSON.parse(item.color as string) : null,
          printPosition: item.printPosition,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        }))
      }
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar pedido"
    });
  }
});

router.get("/receipt/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    if (!validateOrderNumber(orderNumber)) {
      return res.status(400).json({
        success: false,
        error: "Número de pedido inválido"
      });
    }
    
    const order = await storage.getOrderByOrderNumber(orderNumber);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Pedido não encontrado"
      });
    }
    
    const items = await storage.getOrderItems(order.id);
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprovante-${orderNumber}.pdf`);
    
    doc.pipe(res);
    
    doc.fontSize(20).text('OUDLA', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text('Comprovante de Pedido', { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(12).font('Helvetica-Bold').text(`Pedido: ${order.orderNumber}`);
    doc.font('Helvetica');
    doc.fontSize(10).text(`Data: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'N/A'}`);
    if (order.paidAt) {
      const paidDate = new Date(order.paidAt);
      doc.text(`Pago em: ${paidDate.toLocaleDateString('pt-BR')}`);
    }
    doc.moveDown(1.5);
    
    doc.fontSize(14).text('Dados do Cliente', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Nome: ${order.customerName}`);
    doc.text(`Email: ${order.customerEmail}`);
    doc.text(`Telefone: ${order.customerPhone}`);
    doc.moveDown(1.5);
    
    doc.fontSize(14).text('Endereço de Entrega', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`${order.street}, ${order.number}`);
    if (order.complement) {
      doc.text(order.complement);
    }
    doc.text(`${order.neighborhood}`);
    doc.text(`${order.city} - ${order.state}`);
    doc.text(`CEP: ${order.zipCode}`);
    doc.moveDown(1.5);
    
    doc.fontSize(14).text('Itens do Pedido', { underline: true });
    doc.moveDown(0.5);
    
    items.forEach((item, index) => {
      const color = item.color ? JSON.parse(item.color as string) : null;
      doc.fontSize(10);
      doc.text(`${index + 1}. ${item.productName}`, { continued: false });
      doc.fontSize(9);
      doc.text(`   Tamanho: ${item.size} | Quantidade: ${item.quantity}`);
      if (color) {
        doc.text(`   Cor: ${color.name}`);
      }
      if (item.printPosition) {
        doc.text(`   Estampa: ${item.printPosition}`);
      }
      doc.text(`   Valor unitário: R$ ${item.unitPrice}`);
      doc.font('Helvetica-Bold').text(`   Subtotal: R$ ${item.subtotal}`);
      doc.font('Helvetica');
      doc.moveDown(0.5);
    });
    
    doc.moveDown(1);
    doc.fontSize(10);
    doc.text(`Subtotal: R$ ${order.subtotal}`, { align: 'right' });
    doc.text(`Frete: R$ ${order.shippingCost}`, { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`TOTAL: R$ ${order.totalAmount}`, { align: 'right' });
    doc.font('Helvetica');
    
    if (order.paymentMethod) {
      doc.moveDown(1.5);
      doc.fontSize(14).text('Forma de Pagamento', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Método: ${order.paymentMethod}`);
      if (order.paymentInstallments && order.paymentInstallments > 1) {
        doc.text(`Parcelas: ${order.paymentInstallments}x`);
      }
      doc.text(`Status: ${order.paymentStatus || 'Pendente'}`);
    }
    
    if (order.verificationCode) {
      doc.moveDown(1.5);
      doc.fontSize(14).text('Código de Verificação', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(order.verificationCode, { align: 'center' });
      doc.font('Helvetica');
      doc.fontSize(8).fillColor('gray');
      doc.text('Use este código para validar a autenticidade do seu pedido.', { align: 'center' });
      doc.fillColor('black');
    }

    doc.moveDown(2);
    doc.fillColor('gray');
    doc.fontSize(8).text('Este é um documento gerado automaticamente.', { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.fillColor('black');
    
    doc.end();
  } catch (error) {
    console.error("Erro ao gerar comprovante:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao gerar comprovante"
    });
  }
});

router.get("/mp-config", (req, res) => {
  try {
    const envInfo = getEnvironmentInfo();
    res.json({
      success: true,
      publicKey: envInfo.publicKey,
      isProduction: envInfo.isProduction
    });
  } catch (error) {
    console.error("Erro ao obter configuração MP:", error);
    res.status(500).json({ success: false, error: "Erro ao obter configuração" });
  }
});

router.get("/gateway-settings", async (req, res) => {
  try {
    const keys = [
      "gateway_pix_enabled", "gateway_credit_card_enabled",
      "gateway_debit_card_enabled", "gateway_boleto_enabled",
      "gateway_max_installments", "gateway_free_installments",
      "gateway_auto_return", "gateway_expiration_hours",
      "gateway_statement_descriptor", "gateway_binary_mode",
      "gateway_excluded_methods", "gateway_excluded_types"
    ];
    const settings: Record<string, string> = {};
    for (const key of keys) {
      const setting = await storage.getSiteSettingByKey(key);
      settings[key] = setting?.value || "";
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro ao buscar configurações" });
  }
});

router.post("/create-preference", checkoutLimiter, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ success: false, error: "orderId é obrigatório" });
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido não encontrado" });
    }

    const items = await storage.getOrderItems(orderId);
    if (!items.length) {
      return res.status(400).json({ success: false, error: "Pedido sem itens" });
    }

    const baseUrl = process.env.APP_URL
      || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : null)
      || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null)
      || "http://localhost:5000";

    const gatewayKeys = [
      "gateway_pix_enabled", "gateway_credit_card_enabled",
      "gateway_debit_card_enabled", "gateway_boleto_enabled",
      "gateway_max_installments", "gateway_free_installments",
      "gateway_auto_return", "gateway_expiration_hours",
      "gateway_statement_descriptor", "gateway_binary_mode",
      "gateway_excluded_methods", "gateway_excluded_types"
    ];
    const gatewaySettings: Record<string, string> = {};
    for (const key of gatewayKeys) {
      const setting = await storage.getSiteSettingByKey(key);
      gatewaySettings[key] = setting?.value || "";
    }

    const excludedMethods: Array<{ id: string }> = [];
    if (gatewaySettings.gateway_pix_enabled === "false") excludedMethods.push({ id: "pix" });
    if (gatewaySettings.gateway_credit_card_enabled === "false") {
      excludedMethods.push({ id: "visa" }, { id: "master" }, { id: "amex" }, { id: "elo" }, { id: "hipercard" });
    }
    if (gatewaySettings.gateway_debit_card_enabled === "false") {
      excludedMethods.push({ id: "debvisa" }, { id: "debmaster" }, { id: "debelo" });
    }
    const customExcluded = gatewaySettings.gateway_excluded_methods;
    if (customExcluded) {
      customExcluded.split(",").map(m => m.trim()).filter(Boolean).forEach(m => excludedMethods.push({ id: m }));
    }

    const excludedTypes: Array<{ id: string }> = [];
    if (gatewaySettings.gateway_boleto_enabled === "false") excludedTypes.push({ id: "ticket" });
    const customExcludedTypes = gatewaySettings.gateway_excluded_types;
    if (customExcludedTypes) {
      customExcludedTypes.split(",").map(t => t.trim()).filter(Boolean).forEach(t => excludedTypes.push({ id: t }));
    }

    const maxInstallments = parseInt(gatewaySettings.gateway_max_installments) || 12;
    const expirationHours = parseInt(gatewaySettings.gateway_expiration_hours) || 24;
    const statementDescriptor = gatewaySettings.gateway_statement_descriptor || "OUDLA";
    const autoReturn = gatewaySettings.gateway_auto_return || "approved";
    const binaryMode = gatewaySettings.gateway_binary_mode === "true";

    const discountAmount = parseFloat(order.discountAmount as string || "0");
    const itemsSubtotal = items.reduce((sum, item) => {
      return sum + parseFloat(item.unitPrice as string) * item.quantity;
    }, 0);
    const discountRatio = itemsSubtotal > 0 && discountAmount > 0 ? discountAmount / itemsSubtotal : 0;

    const preferenceItems = items.map(item => {
      const unitPrice = parseFloat(item.unitPrice as string);
      const discountedPrice = discountRatio > 0
        ? Math.round((unitPrice * (1 - discountRatio)) * 100) / 100
        : unitPrice;
      const colorData = item.color ? (() => { try { return JSON.parse(item.color as string); } catch { return null; } })() : null;
      const fabricData = item.fabric ? (() => { try { return JSON.parse(item.fabric as string); } catch { return null; } })() : null;
      
      const descParts = [
        item.size ? `Tam: ${item.size}` : null,
        colorData?.name ? `Cor: ${colorData.name}` : null,
        fabricData?.name ? `Tecido: ${fabricData.name}` : null,
        item.printPosition ? `Estampa: ${item.printPosition}` : null,
      ].filter(Boolean).join(' | ');
      
      return {
        id: item.productId,
        title: item.productName,
        description: descParts || item.productName,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: discountedPrice,
        picture_url: item.productImage || undefined,
      };
    });

    const shippingCost = parseFloat(order.shippingCost as string || "0");
    if (shippingCost > 0) {
      preferenceItems.push({
        id: "shipping",
        title: "Frete - Entrega",
        description: `Entrega para ${order.city} - ${order.state} (CEP: ${order.zipCode})`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: shippingCost,
        picture_url: undefined,
      });
    }

    const preference = createPreferenceClient();

    const preferenceBody: any = {
      items: preferenceItems,
      payer: {
        name: order.customerName.split(" ")[0],
        surname: order.customerName.split(" ").slice(1).join(" ") || "",
        email: order.customerEmail,
        phone: {
          area_code: order.customerPhone?.substring(0, 2) || "",
          number: order.customerPhone?.substring(2) || ""
        },
        address: {
          zip_code: order.zipCode.replace(/\D/g, ""),
          street_name: order.street,
          street_number: order.number
        }
      },
      back_urls: {
        success: `${baseUrl}/pagamento/sucesso?order=${order.orderNumber}`,
        failure: `${baseUrl}/pagamento/falha?order=${order.orderNumber}`,
        pending: `${baseUrl}/pagamento/pendente?order=${order.orderNumber}`
      },
      statement_descriptor: statementDescriptor.substring(0, 16),
      external_reference: order.orderNumber,
      notification_url: `${baseUrl}/api/checkout/webhook`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString(),
      binary_mode: binaryMode,
    };

    if (autoReturn && autoReturn !== "none") {
      preferenceBody.auto_return = autoReturn;
    }

    if (excludedMethods.length > 0) {
      preferenceBody.payment_methods = {
        ...preferenceBody.payment_methods,
        excluded_payment_methods: excludedMethods
      };
    }
    if (excludedTypes.length > 0) {
      preferenceBody.payment_methods = {
        ...preferenceBody.payment_methods,
        excluded_payment_types: excludedTypes
      };
    }
    preferenceBody.payment_methods = {
      ...preferenceBody.payment_methods,
      installments: maxInstallments,
    };
    
    const preferenceData = await preference.create({
      body: preferenceBody
    });

    if (!preferenceData.id) {
      throw new Error("Falha ao criar preferência no Mercado Pago");
    }

    await storage.updateOrderPreference(order.id, preferenceData.id);

    const envInfo = getEnvironmentInfo();

    console.log("✅ [MP] Preferência criada:", {
      preferenceId: preferenceData.id,
      orderNumber: order.orderNumber,
      total: order.totalAmount,
      initPoint: preferenceData.init_point,
      sandboxInitPoint: preferenceData.sandbox_init_point,
      isProduction: envInfo.isProduction
    });
    
    res.json({
      success: true,
      preferenceId: preferenceData.id,
      initPoint: preferenceData.init_point,
      sandboxInitPoint: preferenceData.sandbox_init_point,
      isProduction: envInfo.isProduction
    });
  } catch (error: any) {
    console.error("❌ [MP] Erro ao criar preferência:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar preferência de pagamento",
      details: error.message
    });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const xSignature = req.headers["x-signature"] as string;
    const xRequestId = req.headers["x-request-id"] as string;
    const dataId = req.query["data.id"] as string || req.body?.data?.id;
    const type = req.query.type as string || req.body?.type;

    console.log("📥 [MP] Webhook recebido:", { type, dataId });

    if (xSignature && xRequestId && dataId) {
      const isValid = validateWebhookSignature(xSignature, xRequestId, dataId);
      if (!isValid) {
        console.error("❌ [MP] Assinatura do webhook inválida");
        return res.status(401).send("Unauthorized");
      }
    }

    if (type === "payment" && dataId) {
      try {
        const paymentClient = createPaymentClient();
        const payment = await paymentClient.get({ id: dataId });

        if (!payment) {
          console.error("❌ [MP] Pagamento não encontrado:", dataId);
          return res.status(200).send("OK");
        }

        const externalReference = payment.external_reference;
        if (!externalReference) {
          console.error("❌ [MP] Pagamento sem external_reference");
          return res.status(200).send("OK");
        }

        const order = await storage.getOrderByOrderNumber(externalReference);
        if (!order) {
          console.error("❌ [MP] Pedido não encontrado:", externalReference);
          return res.status(200).send("OK");
        }

        const status = payment.status;
        const paymentMethod = payment.payment_method_id;
        const paymentTypeId = payment.payment_type_id;
        const installments = payment.installments;

        let orderStatus = order.orderStatus;
        if (status === "approved") {
          orderStatus = "paid";
        } else if (status === "rejected" || status === "cancelled") {
          orderStatus = "failed";
        } else if (status === "pending" || status === "in_process") {
          orderStatus = "pending";
        }

        await storage.updateOrderPaymentStatus(
          order.id,
          status || "unknown",
          dataId,
          paymentMethod || undefined,
          paymentTypeId || undefined,
          installments || undefined
        );

        if (orderStatus !== order.orderStatus) {
          await storage.updateOrder(order.id, { orderStatus });
        }

        if (status === "approved" && order.paymentStatus !== "approved") {
          await storage.markOrderAsPaid(order.id);
          
          try {
            const paidOrder = await storage.getOrder(order.id);
            if (paidOrder) {
              const orderItems = await storage.getOrderItems(order.id);
              await sendOrderConfirmationEmail(paidOrder, orderItems);
              console.log("✅ [EMAIL] Email de confirmação enviado para", order.customerEmail);
            }
          } catch (emailError) {
            console.error("❌ [EMAIL] Falha ao enviar email de confirmação:", emailError);
          }
        } else if (status === "approved") {
          await storage.markOrderAsPaid(order.id);
        }

        console.log("✅ [MP] Pedido atualizado:", {
          orderNumber: externalReference,
          paymentStatus: status,
          orderStatus
        });
      } catch (paymentError) {
        console.error("❌ [MP] Erro ao processar pagamento:", paymentError);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ [MP] Erro no webhook:", error);
    res.status(200).send("OK");
  }
});

router.get("/payment-status/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    if (!validateOrderNumber(orderNumber)) {
      return res.status(400).json({ success: false, error: "Número de pedido inválido" });
    }

    const order = await storage.getOrderByOrderNumber(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido não encontrado" });
    }

    res.json({
      success: true,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentInstallments: order.paymentInstallments,
      totalAmount: order.totalAmount,
      paidAt: order.paidAt,
      verificationCode: order.verificationCode
    });
  } catch (error) {
    console.error("Erro ao buscar status:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar status" });
  }
});

export default router;
