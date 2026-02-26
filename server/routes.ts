import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq, desc } from "drizzle-orm";
import { storage } from "./storage";
import { db } from "./db";
import { orders } from "@shared/schema";
import { rateLimit } from 'express-rate-limit';
import { cache, CACHE_TTL } from "./cache";
import { 
  insertProductSchema, 
  insertReviewSchema,
  insertReviewImageSchema,
  insertReviewLikeSchema,
  insertReviewQASchema,
  insertProductImageSchema,
  insertAdminProductReviewSchema,
  insertProductCouponSchema,
  insertGlobalCouponSchema,
  insertSiteBannerSchema,
  insertContentCardSchema,
  insertSiteContentSchema,
  insertSiteSettingSchema,
  insertSiteVerseSchema,
  insertFaqSchema,
  insertProductMeasurementFieldSchema,
  insertProductSizeMeasurementSchema,
  insertNewsletterSubscriberSchema,
  insertNewsletterSettingsSchema,
  insertTrackingPixelsSchema,
  insertEmailTemplateSchema
} from "@shared/schema";
import { requireAdmin, loginAdmin, setAdminSession, clearAdminSession } from "./admin-middleware";
import { invalidateSEOCache, writeHardcodedSEO } from "./seo-inject";
import bcrypt from "bcrypt";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { uploadToStorage, deleteFromStorage, isStorageEnabled } from "./supabase-storage";
import { calculateShipping as calcCorreios, isCorreiosConfigured } from "./correios";

// Newsletter rate limiter: max 3 requests per IP per 15 minutes
const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "muitos cadastros realizados. tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Use JPEG, PNG, GIF ou WebP.'));
    }
  }
});

async function initializeAdminUser() {
  // ❌ REMOVED: Temporary admin user with weak credentials
  // Admin users must be created securely via database management tools
  console.log('✅ Admin initialization: Use secure credentials only');
}

import checkoutRoutes from "./checkout-routes";
import { sendOrderConfirmationEmail, sendTrackingCodeEmail, sendNewsletterWelcomeEmail } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  await initializeAdminUser();

  // Newsletter routes
  app.get("/api/newsletter/settings", async (_req, res) => {
    try {
      let settings = await storage.getNewsletterSettings();
      if (!settings) {
        settings = await storage.upsertNewsletterSettings({
          title: "fique por dentro",
          description: "inscreva-se para receber novidades, lançamentos e conteúdos exclusivos.",
          buttonText: "inscrever"
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "erro ao buscar configurações da newsletter" });
    }
  });

  app.post("/api/newsletter/subscribe", newsletterLimiter, async (req, res) => {
    try {
      console.log("📥 [NEWSLETTER] Tentativa de cadastro:", req.body);
      const data = insertNewsletterSubscriberSchema.parse(req.body);
      const ip = req.ip || req.headers['x-forwarded-for']?.toString() || "unknown";
      
      const subscriber = await storage.addNewsletterSubscriber({
        ...data,
        ipAddress: ip
      });
      console.log("✅ [NEWSLETTER] Cadastro realizado:", subscriber.email);

      // Send welcome email (non-blocking)
      try {
        await sendNewsletterWelcomeEmail(subscriber.email);
        console.log("✅ [EMAIL] Email de boas-vindas newsletter enviado para", subscriber.email);
      } catch (emailError) {
        console.error("❌ [EMAIL] Falha ao enviar email de boas-vindas:", emailError);
      }

      res.json(subscriber);
    } catch (error: any) {
      console.error("❌ [NEWSLETTER] Erro no cadastro:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "dados inválidos.", 
          details: error.errors.map((e: any) => e.message) 
        });
      }
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: "este e-mail já está cadastrado." });
      }
      res.status(400).json({ error: "e-mail inválido ou erro no cadastro." });
    }
  });

  // Protected Admin Newsletter routes
  app.get("/api/admin/newsletter/subscribers", requireAdmin, async (req, res) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers();
      res.json({ subscribers });
    } catch (error) {
      res.status(500).json({ error: "erro ao buscar inscritos" });
    }
  });

  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const { search, status, filter, sortField, sortDirection, includeAll } = req.query;
      console.log("📦 [ADMIN_ORDERS] Buscando pedidos com filtros:", { search, status, filter, sortField, sortDirection, includeAll });
      
      if (includeAll === 'true') {
        const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
        return res.json(allOrders);
      }
      
      const result = await storage.getOrders({
        search: search as string,
        status: status as string,
        filter: filter as 'all' | 'archived' | 'deleted' | 'shipped' | 'delivered' | 'refunded',
        sortField: sortField as string,
        sortDirection: sortDirection as 'asc' | 'desc'
      });
      
      res.json(result);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/newsletter/subscribers/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await storage.updateNewsletterSubscriberStatus(id, status);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "erro ao atualizar status" });
    }
  });

  app.delete("/api/admin/newsletter/subscribers/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNewsletterSubscriber(id);
      res.status(204).end();
    } catch (error) {
      res.status(400).json({ error: "erro ao deletar inscrito" });
    }
  });

  app.patch("/api/admin/newsletter/settings", requireAdmin, async (req, res) => {
    try {
      const data = insertNewsletterSettingsSchema.partial().parse(req.body);
      const settings = await storage.upsertNewsletterSettings(data);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "erro ao atualizar configurações" });
    }
  });

  // ===== ROTAS DE TRACKING PIXELS =====
  
  // Rota PÚBLICA para buscar configuração dos pixels de rastreamento
  // Usada pelo frontend para carregar os scripts de tracking (Facebook Pixel, Google Analytics, etc.)
  app.get("/api/tracking-pixels", async (_req, res) => {
    try {
      const config = await storage.getTrackingPixels();
      
      // Se não existir configuração, retorna objeto vazio com valores padrão
      if (!config) {
        return res.json({
          facebookPixelId: null,
          facebookPixelEnabled: false,
          facebookTestEventCode: null,
          googleAdsConversionId: null,
          googleAdsConversionLabel: null,
          googleAdsEnabled: false,
          googleAnalyticsId: null,
          googleAnalyticsEnabled: false,
          tiktokPixelId: null,
          tiktokPixelEnabled: false,
          headerScripts: null,
          bodyScripts: null,
          mercadoPagoTrackingEnabled: true
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("❌ [TRACKING_PIXELS] Erro ao buscar configuração:", error);
      res.status(500).json({ error: "Erro ao buscar configuração de tracking" });
    }
  });

  // Rota PROTEGIDA (admin) para atualizar configuração dos pixels de rastreamento
  // Apenas administradores podem alterar os IDs dos pixels e scripts
  app.put("/api/tracking-pixels", requireAdmin, async (req, res) => {
    try {
      // Valida os dados de entrada usando o schema Zod
      const data = insertTrackingPixelsSchema.partial().parse(req.body);
      
      // Atualiza ou cria a configuração no banco de dados
      const config = await storage.updateTrackingPixels(data);
      
      console.log("✅ [TRACKING_PIXELS] Configuração atualizada via API");
      res.json(config);
    } catch (error: any) {
      console.error("❌ [TRACKING_PIXELS] Erro ao atualizar configuração:", error);
      
      // Trata erros de validação do Zod
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: error.errors.map((e: any) => e.message)
        });
      }
      
      res.status(500).json({ error: "Erro ao atualizar configuração de tracking" });
    }
  });

  // ===== COOKIE SETTINGS ROUTES =====
  app.get("/api/cookie-settings", async (_req, res) => {
    try {
      const settings = await storage.getCookieSettings();
      res.json(settings || { enabled: true, title: "usamos cookies", description: "utilizamos cookies para melhorar sua experiência de navegação, personalizar conteúdo e analisar nosso tráfego.", buttonAcceptText: "aceitar todos", buttonRejectText: "recusar", buttonCustomizeText: "personalizar", showCustomizeButton: false, privacyPolicyUrl: "/privacidade" });
    } catch (error) {
      console.error("Cookie settings error:", error);
      res.status(500).json({ error: "Erro ao buscar configurações de cookies" });
    }
  });

  app.put("/api/admin/cookie-settings", requireAdmin, async (req, res) => {
    try {
      const { enabled, title, description, buttonAcceptText, buttonRejectText, buttonCustomizeText, showCustomizeButton, privacyPolicyUrl } = req.body;
      const settings = await storage.updateCookieSettings({ enabled, title, description, buttonAcceptText, buttonRejectText, buttonCustomizeText, showCustomizeButton, privacyPolicyUrl });
      res.json(settings);
    } catch (error) {
      console.error("Update cookie settings error:", error);
      res.status(500).json({ error: "Erro ao atualizar configurações de cookies" });
    }
  });

  // ===== EMAIL TEMPLATE ROUTES =====
  
  app.get("/api/admin/email-templates", requireAdmin, async (_req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json({ templates });
    } catch (error) {
      console.error("Get email templates error:", error);
      res.status(500).json({ error: "Erro ao buscar templates de email" });
    }
  });

  app.get("/api/admin/email-templates/:key", requireAdmin, async (req, res) => {
    try {
      const template = await storage.getEmailTemplateByKey(req.params.key);
      if (!template) {
        return res.status(404).json({ error: "Template não encontrado" });
      }
      res.json(template);
    } catch (error) {
      console.error("Get email template error:", error);
      res.status(500).json({ error: "Erro ao buscar template" });
    }
  });

  app.put("/api/admin/email-templates/:key", requireAdmin, async (req, res) => {
    try {
      const { name, subject, htmlContent, enabled } = req.body;
      const template = await storage.upsertEmailTemplate(req.params.key, {
        name,
        subject,
        htmlContent,
        enabled,
      });
      res.json(template);
    } catch (error) {
      console.error("Update email template error:", error);
      res.status(500).json({ error: "Erro ao atualizar template" });
    }
  });

  app.post("/api/admin/email-templates/:key/test", requireAdmin, async (req, res) => {
    try {
      const { to } = req.body;
      if (!to) {
        return res.status(400).json({ error: "Email de destino é obrigatório" });
      }
      
      const template = await storage.getEmailTemplateByKey(req.params.key);
      if (!template) {
        return res.status(404).json({ error: "Template não encontrado" });
      }

      const { sendEmail, replaceTemplateVariables } = await import("./email");
      
      const testVariables: Record<string, string> = {
        nome: "João da Silva",
        email: "joao@exemplo.com",
        cpf: "123.456.789-00",
        telefone: "(11) 99999-9999",
        endereco: "Rua Exemplo, 123\nCentro\nSão Paulo - SP\nCEP: 01001-000",
        numero_pedido: "OUDLA-20250212-0001",
        subtotal: "R$ 199,90",
        frete: "R$ 19,90",
        total: "R$ 219,80",
        metodo_pagamento: "Cartão de Crédito",
        codigo_rastreio: "BR123456789BR",
        data_pedido: new Date().toLocaleDateString("pt-BR"),
        itens: '<table style="width: 100%; border-collapse: collapse;"><thead><tr style="border-bottom: 2px solid #ddd;"><th style="padding: 8px 0; text-align: left;">Produto</th><th style="padding: 8px 0; text-align: center;">Qtd</th><th style="padding: 8px 0; text-align: right;">Preço</th><th style="padding: 8px 0; text-align: right;">Subtotal</th></tr></thead><tbody><tr style="border-bottom: 1px solid #eee;"><td style="padding: 12px 0;"><strong>Camiseta OUDLA Premium</strong><br/><span style="color: #666; font-size: 13px;">Tam: M | Cor: Preto</span></td><td style="padding: 12px 0; text-align: center;">1</td><td style="padding: 12px 0; text-align: right;">R$ 99,90</td><td style="padding: 12px 0; text-align: right; font-weight: bold;">R$ 99,90</td></tr><tr style="border-bottom: 1px solid #eee;"><td style="padding: 12px 0;"><strong>Camiseta OUDLA Classic</strong><br/><span style="color: #666; font-size: 13px;">Tam: G | Cor: Branco</span></td><td style="padding: 12px 0; text-align: center;">1</td><td style="padding: 12px 0; text-align: right;">R$ 99,90</td><td style="padding: 12px 0; text-align: right; font-weight: bold;">R$ 99,90</td></tr></tbody></table>',
      };

      const subject = replaceTemplateVariables(template.subject, testVariables);
      const html = replaceTemplateVariables(template.htmlContent, testVariables);
      
      const success = await sendEmail(to, `[TESTE] ${subject}`, html);
      
      if (success) {
        res.json({ success: true, message: "Email de teste enviado com sucesso" });
      } else {
        res.status(500).json({ error: "Falha ao enviar email de teste" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Erro ao enviar email de teste" });
    }
  });
  
  // Public banner route
  app.get("/api/banners", async (req, res) => {
    try {
      const cacheKey = "banners:active";
      const cached = cache.get<{ banners: any[] }>(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const allBanners = await storage.getSiteBanners();
      const banners = allBanners.filter(b => b.isActive);
      const response = { banners };
      cache.set(cacheKey, response, CACHE_TTL.BANNERS);
      res.json(response);
    } catch (error) {
      console.error("Get banners error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const cacheKey = "products:list";
      const cached = cache.get<{ products: any[] }>(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const productsWithImages = await storage.getProductsWithPresentationImages();
      const response = { products: productsWithImages };
      cache.set(cacheKey, response, CACHE_TTL.PRODUCTS);
      res.json(response);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin route to get all products (for selects in forms) - includes drafts
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      
      // Add first presentation image to each product (for product selectors)
      const productsWithImages = await Promise.all(
        products.map(async (product) => {
          const images = await storage.getProductPresentationImages(product.id);
          return {
            ...product,
            imageUrl: images.length > 0 ? images[0].imageUrl : null
          };
        })
      );
      
      res.json({ products: productsWithImages });
    } catch (error) {
      console.error("Get admin products error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin route to get single product by ID (includes drafts)
  app.get("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      const images = await storage.getProductImages(product.id);
      res.json({ product: { ...product, images } });
    } catch (error) {
      console.error("Get admin product error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 [GET_PRODUCT] Buscando produto: "${id}"`);
      
      // Get all products to check for Slug or SKU match
      const allProducts = await storage.getProducts();
      
      // 1. Try by Slug (highest priority)
      let product = allProducts.find(p => p.slug?.trim().toLowerCase() === id.trim().toLowerCase());
      
      // 2. Try by SKU (fallback)
      if (!product) {
        product = allProducts.find(p => p.sku?.trim().toLowerCase() === id.trim().toLowerCase());
      }
      
      // 3. Try by internal ID (UUID fallback)
      if (!product) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
          product = await storage.getProduct(id);
        }
      }
      
      if (!product) {
        console.log(`❌ [GET_PRODUCT] Produto não encontrado para o ID: "${id}"`);
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      const images = await storage.getProductImages(product.id);
      res.json({ product: { ...product, images } });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Product creation
  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json({ product });
    } catch (error) {
      console.error("Create product error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/products/:id/images", async (req, res) => {
    try {
      const imageData = insertProductImageSchema.parse({
        ...req.body,
        productId: req.params.id
      });
      
      const image = await storage.addProductImage(imageData);
      res.status(201).json({ image });
    } catch (error) {
      console.error("Add product image error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });



  // Review routes
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviews(req.params.productId);
      res.json({ reviews });
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/products/:productId/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        productId: req.params.productId
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json({ review });
    } catch (error) {
      console.error("Create review error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/reviews/:reviewId/images", async (req, res) => {
    try {
      const imageData = insertReviewImageSchema.parse({
        ...req.body,
        reviewId: req.params.reviewId
      });
      
      const image = await storage.addReviewImage(imageData);
      res.status(201).json({ image });
    } catch (error) {
      console.error("Add review image error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/reviews/:reviewId/like", async (req, res) => {
    try {
      const likeData = insertReviewLikeSchema.parse({
        ...req.body,
        reviewId: req.params.reviewId
      });
      const like = await storage.likeReview(likeData);
      res.status(201).json({ like });
    } catch (error) {
      console.error("Like review error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/reviews/:reviewId/like", async (req, res) => {
    try {
      if (!req.body.userId) {
        return res.status(400).json({ error: "userId é obrigatório" });
      }
      const success = await storage.unlikeReview(req.body.userId, req.params.reviewId);
      res.json({ success });
    } catch (error) {
      console.error("Unlike review error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/reviews/:reviewId/qa", async (req, res) => {
    try {
      const qaData = insertReviewQASchema.parse({
        ...req.body,
        reviewId: req.params.reviewId
      });

      const qa = await storage.addReviewQA(qaData);
      res.status(201).json({ qa });
    } catch (error) {
      console.error("Add review QA error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/reviews/:reviewId/qa", async (req, res) => {
    try {
      const qa = await storage.getReviewQA(req.params.reviewId);
      res.json({ qa });
    } catch (error) {
      console.error("Get review QA error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/settings/free_shipping", async (req, res) => {
    try {
      const cacheKey = "settings:free_shipping";
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const [system, threshold, defaultShippingValue, minDays, maxDays, shippingMode, originCep, defaultWeight, defaultHeight, defaultWidth, defaultLength, correiosServices, correiosExtraDays] = await Promise.all([
        storage.getSiteSettingByKey("free_shipping_system"),
        storage.getSiteSettingByKey("free_shipping_threshold"),
        storage.getSiteSettingByKey("default_shipping_value"),
        storage.getSiteSettingByKey("shipping_min_days"),
        storage.getSiteSettingByKey("shipping_max_days"),
        storage.getSiteSettingByKey("shipping_mode"),
        storage.getSiteSettingByKey("shipping_origin_cep"),
        storage.getSiteSettingByKey("shipping_default_weight"),
        storage.getSiteSettingByKey("shipping_default_height"),
        storage.getSiteSettingByKey("shipping_default_width"),
        storage.getSiteSettingByKey("shipping_default_length"),
        storage.getSiteSettingByKey("shipping_correios_services"),
        storage.getSiteSettingByKey("shipping_correios_extra_days"),
      ]);
      const response = {
        system: system?.value || "threshold",
        threshold: threshold?.value || "200",
        shippingValue: defaultShippingValue?.value || "19.99",
        shippingMinDays: minDays?.value || "9",
        shippingMaxDays: maxDays?.value || "15",
        shippingMode: shippingMode?.value || "flat",
        originCep: originCep?.value || "",
        correiosReady: isCorreiosConfigured() && !!(originCep?.value),
        correiosExtraDays: correiosExtraDays?.value || "0",
        defaultWeight: defaultWeight?.value || "300",
        defaultHeight: defaultHeight?.value || "4",
        defaultWidth: defaultWidth?.value || "30",
        defaultLength: defaultLength?.value || "40",
        correiosServices: correiosServices?.value || "03298,03220",
      };
      cache.set(cacheKey, response, CACHE_TTL.FREE_SHIPPING);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "erro ao buscar configurações de frete" });
    }
  });

  app.post("/api/shipping/calculate", async (req, res) => {
    try {
      const { cep, items: cartItems } = req.body;
      if (!cep || cep.replace(/\D/g, "").length !== 8) {
        return res.status(400).json({ error: "CEP inválido" });
      }

      const [shippingMode, originCep, defaultWeight, defaultHeight, defaultWidth, defaultLength, correiosServices, correiosExtraDays, freeSystem, freeThreshold, defaultShippingValue, minDays, maxDays] = await Promise.all([
        storage.getSiteSettingByKey("shipping_mode"),
        storage.getSiteSettingByKey("shipping_origin_cep"),
        storage.getSiteSettingByKey("shipping_default_weight"),
        storage.getSiteSettingByKey("shipping_default_height"),
        storage.getSiteSettingByKey("shipping_default_width"),
        storage.getSiteSettingByKey("shipping_default_length"),
        storage.getSiteSettingByKey("shipping_correios_services"),
        storage.getSiteSettingByKey("shipping_correios_extra_days"),
        storage.getSiteSettingByKey("free_shipping_system"),
        storage.getSiteSettingByKey("free_shipping_threshold"),
        storage.getSiteSettingByKey("default_shipping_value"),
        storage.getSiteSettingByKey("shipping_min_days"),
        storage.getSiteSettingByKey("shipping_max_days"),
      ]);

      const mode = shippingMode?.value || "flat";
      const origin = originCep?.value || "";
      const services = (correiosServices?.value || "03298,03220").split(",").map(s => s.trim());
      const extraDays = parseInt(correiosExtraDays?.value || "0");

      let totalWeight = parseInt(defaultWeight?.value || "300");
      let maxHeight = parseInt(defaultHeight?.value || "4");
      let maxWidth = parseInt(defaultWidth?.value || "30");
      let maxLength = parseInt(defaultLength?.value || "40");

      if (Array.isArray(cartItems) && cartItems.length > 0) {
        const productIds = [...new Set(cartItems.map((i: any) => i.productId).filter(Boolean))];
        if (productIds.length > 0) {
          const products = await Promise.all(productIds.map((id: string) => storage.getProduct(id)));
          const productMap = new Map(products.filter(Boolean).map(p => [p!.id, p!]));

          totalWeight = 0;
          maxHeight = 0;
          maxWidth = 0;
          maxLength = 0;

          for (const item of cartItems) {
            const product = productMap.get(item.productId);
            const qty = item.quantity || 1;
            const w = product?.shippingWeight ?? parseInt(defaultWeight?.value || "300");
            const h = product?.shippingHeight ?? parseInt(defaultHeight?.value || "4");
            const wd = product?.shippingWidth ?? parseInt(defaultWidth?.value || "30");
            const l = product?.shippingLength ?? parseInt(defaultLength?.value || "40");

            totalWeight += w * qty;
            maxHeight += h * qty;
            if (wd > maxWidth) maxWidth = wd;
            if (l > maxLength) maxLength = l;
          }
        }
      }

      if (mode === "correios" && isCorreiosConfigured() && origin) {
        const options = await calcCorreios({
          originCep: origin,
          destinationCep: cep.replace(/\D/g, ""),
          weight: totalWeight,
          height: maxHeight,
          width: maxWidth,
          length: maxLength,
          services,
        });

        if (options.length > 0) {
          return res.json({
            mode: "correios",
            options: options.map(opt => ({
              service: opt.service,
              serviceCode: opt.serviceCode,
              price: opt.price,
              deadline: opt.deadline + extraDays,
            })),
            freeShippingSystem: freeSystem?.value || "threshold",
            freeShippingThreshold: parseFloat(freeThreshold?.value || "200"),
          });
        }
      }

      res.json({
        mode: "flat",
        options: [{
          service: "Padrão",
          serviceCode: "flat",
          price: parseFloat(defaultShippingValue?.value || "19.99"),
          deadline: parseInt(maxDays?.value || "15"),
        }],
        freeShippingSystem: freeSystem?.value || "threshold",
        freeShippingThreshold: parseFloat(freeThreshold?.value || "200"),
        minDays: parseInt(minDays?.value || "9"),
        maxDays: parseInt(maxDays?.value || "15"),
      });
    } catch (error) {
      console.error("Shipping calculation error:", error);
      res.status(500).json({ error: "Erro ao calcular frete" });
    }
  });

  app.get("/api/settings/cta", async (req, res) => {
    try {
      const cacheKey = "settings:cta";
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const shippingLabel = await storage.getSiteSettingByKey("cta_shipping_label");
      const buyNowText = await storage.getSiteSettingByKey("cta_buy_now_text");
      const buyNowBg = await storage.getSiteSettingByKey("cta_buy_now_bg");
      const buyNowTextColor = await storage.getSiteSettingByKey("cta_buy_now_text_color");
      const addToCartText = await storage.getSiteSettingByKey("cta_add_to_cart_text");
      const addToCartBorder = await storage.getSiteSettingByKey("cta_add_to_cart_border");
      const addToCartTextColor = await storage.getSiteSettingByKey("cta_add_to_cart_text_color");
      const trustText = await storage.getSiteSettingByKey("cta_trust_text");
      const trustIcon = await storage.getSiteSettingByKey("cta_trust_icon");
      const ctaShippingFreeText = await storage.getSiteSettingByKey("cta_shipping_free_text");
      const ctaShippingPaidText = await storage.getSiteSettingByKey("cta_shipping_paid_text");
      const mochilaShippingFreeText = await storage.getSiteSettingByKey("mochila_shipping_free_text");
      const mochilaShippingPaidText = await storage.getSiteSettingByKey("mochila_shipping_paid_text");
      
      const response = {
        shippingLabel: shippingLabel?.value || "frete padrão",
        buyNowText: buyNowText?.value || "comprar agora",
        buyNowBg: buyNowBg?.value || "#ffffff",
        buyNowTextColor: buyNowTextColor?.value || "#1d1d1f",
        addToCartText: addToCartText?.value || "adicionar à mochila",
        addToCartBorder: addToCartBorder?.value || "rgba(255,255,255,0.12)",
        addToCartTextColor: addToCartTextColor?.value || "rgba(255,255,255,0.9)",
        trustText: trustText?.value || "pagamento seguro via mercado pago",
        trustIcon: trustIcon?.value || "lock",
        ctaShippingFreeText: ctaShippingFreeText?.value || "chegará grátis",
        ctaShippingPaidText: ctaShippingPaidText?.value || "chegará por",
        mochilaShippingFreeText: mochilaShippingFreeText?.value || "entrega grátis",
        mochilaShippingPaidText: mochilaShippingPaidText?.value || "entrega por",
      };
      cache.set(cacheKey, response, 300000);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "erro ao buscar configurações de cta" });
    }
  });

  app.get("/api/settings/seo", async (req, res) => {
    try {
      const cacheKey = "settings:seo";
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const seoTitle = await storage.getSiteSettingByKey("seo_title");
      const seoDescription = await storage.getSiteSettingByKey("seo_description");
      const seoKeywords = await storage.getSiteSettingByKey("seo_keywords");
      const ogTitle = await storage.getSiteSettingByKey("seo_og_title");
      const ogDescription = await storage.getSiteSettingByKey("seo_og_description");
      const ogType = await storage.getSiteSettingByKey("seo_og_type");
      const ogSiteName = await storage.getSiteSettingByKey("seo_og_site_name");

      const response = {
        seoTitle: seoTitle?.value || "oudla",
        seoDescription: seoDescription?.value || "oudla é uma marca focada no público jovem e descolado. camisetas premium com design minimalista e estética sofisticada.",
        seoKeywords: seoKeywords?.value || "oudla, camisetas, moda cristã, roupas premium, moda jovem",
        ogTitle: ogTitle?.value || "oudla",
        ogDescription: ogDescription?.value || "camisetas de luxo para jovens descolados. design minimalista, qualidade premium.",
        ogType: ogType?.value || "website",
        ogSiteName: ogSiteName?.value || "oudla",
      };
      cache.set(cacheKey, response, 300000);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "erro ao buscar configurações de seo" });
    }
  });

  const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post("/api/admin/login", adminLoginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
      }

      const isValid = await loginAdmin(username, password);
      
      if (!isValid) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      setAdminSession(req, username);
      
      // Force session to regenerate with new data
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regenerate error:", err);
          return res.status(500).json({ error: "Erro ao criar sessão" });
        }
        
        // Set admin session again after regeneration
        setAdminSession(req, username);
        
        // Force save and send cookie
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Erro ao salvar sessão" });
          }
          
          // Manually set cookie to ensure it's sent
          res.cookie('connect.sid', req.sessionID, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000, // 60 minutes
            sameSite: 'lax',
            path: '/',
            secure: process.env.NODE_ENV === 'production'
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ Sessão admin criada. SessionID:", req.sessionID.substring(0, 8) + "...");
          }
          
          res.json({ 
            success: true, 
            message: "Login realizado com sucesso",
            sessionId: req.sessionID
          });
        });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    clearAdminSession(req);
    res.json({ success: true, message: "Logout realizado com sucesso" });
  });

  app.get("/api/admin/check", (req, res) => {
    console.log("🔍 Admin check:", {
      hasSession: !!req.session,
      isAdmin: req.session?.isAdmin,
      sessionID: req.sessionID,
      cookies: req.headers.cookie,
      cookie: req.session?.cookie
    });
    
    // Prevent caching of admin check
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({ isAdmin: !!req.session?.isAdmin });
  });

  app.get("/api/admin/settings/:key", requireAdmin, async (req, res) => {
    try {
      const setting = await storage.getSiteSettingByKey(req.params.key);
      res.json(setting || { value: "" });
    } catch (error) {
      res.status(500).json({ error: "erro ao buscar configuração" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const data = insertSiteSettingSchema.parse(req.body);
      const setting = await storage.upsertSiteSetting(data);
      
      // Invalidate cache for free_shipping related settings
      if (data.key && (data.key === "free_shipping_system" || 
          data.key === "free_shipping_threshold" || 
          data.key === "default_shipping_value" ||
          data.key === "shipping_min_days" ||
          data.key === "shipping_max_days")) {
        cache.invalidate("settings:free_shipping");
      }
      
      if (data.key && data.key.startsWith("cta_")) {
        cache.invalidate("settings:cta");
      }

      if (data.key && data.key.startsWith("seo_")) {
        cache.invalidate("settings:seo");
        invalidateSEOCache();
        writeHardcodedSEO().catch(err => console.error("SEO write error:", err));
      }
      
      res.json(setting);
    } catch (error) {
      res.status(400).json({ error: "erro ao salvar configuração" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSiteSettingByKey(req.params.key);
      res.json(setting || { value: "" });
    } catch (error) {
      res.status(500).json({ error: "erro ao buscar configuração" });
    }
  });
  app.get("/api/admin/banners", requireAdmin, async (req, res) => {
    try {
      const banners = await storage.getSiteBanners();
      res.json({ banners });
    } catch (error) {
      console.error("Get banners error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/banners", requireAdmin, async (req, res) => {
    try {
      const bannerData = insertSiteBannerSchema.parse(req.body);
      const banner = await storage.createSiteBanner(bannerData);
      cache.invalidate("banners:active");
      res.status(201).json({ banner });
    } catch (error) {
      console.error("Create banner error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/banners/:id", requireAdmin, async (req, res) => {
    try {
      const banner = await storage.updateSiteBanner(req.params.id, req.body);
      if (!banner) {
        return res.status(404).json({ error: "Banner não encontrado" });
      }
      cache.invalidate("banners:active");
      res.json({ banner });
    } catch (error) {
      console.error("Update banner error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/banners/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteSiteBanner(req.params.id);
      cache.invalidate("banners:active");
      res.json({ success });
    } catch (error) {
      console.error("Delete banner error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Upload banner image with WebP conversion
  app.post("/api/admin/upload-banner", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const isMobile = req.body.variant === 'mobile';
      const filename = isMobile
        ? `banner-mobile-${randomUUID()}.webp`
        : `banner-${randomUUID()}.webp`;

      const resizeWidth = isMobile ? 1080 : 1920;
      const resizeHeight = isMobile ? 1920 : 800;

      const processedBuffer = await sharp(req.file.buffer)
        .resize(resizeWidth, resizeHeight, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toBuffer();

      let imageUrl: string;
      if (isStorageEnabled()) {
        imageUrl = await uploadToStorage(processedBuffer, "banners", filename);
      } else {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, filename), processedBuffer);
        imageUrl = `/uploads/banners/${filename}`;
      }

      res.json({ imageUrl });
    } catch (error) {
      console.error("Upload banner image error:", error);
      res.status(500).json({ error: "Erro ao fazer upload da imagem" });
    }
  });

  // Admin - Content Cards routes
  app.get("/api/admin/content-cards", requireAdmin, async (req, res) => {
    try {
      const cards = await storage.getContentCards();
      res.json({ cards });
    } catch (error) {
      console.error("Get content cards error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Public verse route - returns the single current verse
  app.get("/api/verse", async (req, res) => {
    try {
      const cacheKey = "verse:current";
      const cached = cache.get<{ verse: any }>(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const allVerses = await storage.getSiteVerses();
      const activeVerses = allVerses.filter(v => v.isActive);
      
      // Return the most recently updated verse, or null if none exist
      const verse = activeVerses.length > 0 
        ? activeVerses.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
          })[0]
        : null;
      
      const response = { verse };
      cache.set(cacheKey, response, CACHE_TTL.VERSE);
      res.json(response);
    } catch (error) {
      console.error("Get verse error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Legacy public verses route - returns single verse for backward compatibility
  app.get("/api/verses", async (req, res) => {
    try {
      const allVerses = await storage.getSiteVerses();
      const activeVerses = allVerses.filter(v => v.isActive);
      
      // Return the most recently updated verse as an array for backward compatibility
      const verse = activeVerses.length > 0 
        ? activeVerses.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
          })[0]
        : null;
      
      res.json({ verses: verse ? [verse] : [] });
    } catch (error) {
      console.error("Get verses error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/content-cards", async (req, res) => {
    try {
      const allCards = await storage.getContentCards();
      const cards = allCards.filter(c => c.isActive);
      
      // Add images to each card
      const cardsWithImages = await Promise.all(
        cards.map(async (card) => {
          const images = await storage.getContentCardImages(card.id);
          return {
            ...card,
            images: images.map(img => img.imageUrl)
          };
        })
      );
      
      res.json({ cards: cardsWithImages });
    } catch (error) {
      console.error("Get public content cards error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Public CTA Banner route
  app.get("/api/cta-banner", async (req, res) => {
    try {
      const config = await storage.getCtaBannerConfig();
      res.json({ config });
    } catch (error) {
      console.error("Get CTA banner config error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/content-cards", requireAdmin, async (req, res) => {
    try {
      const cardData = insertContentCardSchema.parse(req.body);
      const card = await storage.createContentCard(cardData);
      res.status(201).json({ card });
    } catch (error) {
      console.error("Create content card error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/content-cards/:id", requireAdmin, async (req, res) => {
    try {
      const card = await storage.updateContentCard(req.params.id, req.body);
      if (!card) {
        return res.status(404).json({ error: "Card não encontrado" });
      }
      res.json({ card });
    } catch (error) {
      console.error("Update content card error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/content-cards/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteContentCard(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete content card error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Content card images routes
  app.get("/api/admin/content-cards/:cardId/images", requireAdmin, async (req, res) => {
    try {
      const images = await storage.getContentCardImages(req.params.cardId);
      res.json({ images });
    } catch (error) {
      console.error("Get content card images error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/content-cards/:cardId/images", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }

      const cardId = req.params.cardId;
      const imageFileName = `card-${cardId}-${randomUUID()}.webp`;

      const processedBuffer = await sharp(req.file.buffer)
        .resize(1920, 1080, { fit: "cover", position: "center" })
        .webp({ quality: 85 })
        .toBuffer();

      let imageUrl: string;
      if (isStorageEnabled()) {
        imageUrl = await uploadToStorage(processedBuffer, "cards", imageFileName);
      } else {
        const imagePath = path.join(process.cwd(), "public", "uploads", "cards", imageFileName);
        await fs.mkdir(path.dirname(imagePath), { recursive: true });
        await fs.writeFile(imagePath, processedBuffer);
        imageUrl = `/uploads/cards/${imageFileName}`;
      }

      const sortOrder = parseInt(req.body.sortOrder || "0", 10);
      const image = await storage.addContentCardImage({
        cardId,
        imageUrl,
        sortOrder
      });

      res.status(201).json({ image });
    } catch (error) {
      console.error("Upload content card image error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/content-cards/images/:imageId", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteContentCardImage(req.params.imageId);
      res.json({ success });
    } catch (error) {
      console.error("Delete content card image error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin - Site Content routes
  app.get("/api/admin/content", requireAdmin, async (req, res) => {
    try {
      const content = await storage.getSiteContent();
      res.json({ content });
    } catch (error) {
      console.error("Get content error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/content", requireAdmin, async (req, res) => {
    try {
      const contentData = insertSiteContentSchema.parse(req.body);
      const content = await storage.upsertSiteContent(contentData);
      res.json({ content });
    } catch (error) {
      console.error("Upsert content error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin - Site Settings routes
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json({ settings });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settingData = insertSiteSettingSchema.parse(req.body);
      const setting = await storage.upsertSiteSetting(settingData);
      if (settingData.key && settingData.key.startsWith("seo_")) {
        cache.invalidate("settings:seo");
        invalidateSEOCache();
      }
      res.json({ setting });
    } catch (error) {
      console.error("Upsert setting error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin - Site Verses routes
  app.get("/api/admin/verses", requireAdmin, async (req, res) => {
    try {
      const verses = await storage.getSiteVerses();
      res.json({ verses });
    } catch (error) {
      console.error("Get verses error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/verses", requireAdmin, async (req, res) => {
    try {
      const verseData = insertSiteVerseSchema.parse(req.body);
      const verse = await storage.createSiteVerse(verseData);
      cache.invalidate("verse:current");
      res.status(201).json({ verse });
    } catch (error) {
      console.error("Create verse error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/verses/:id", requireAdmin, async (req, res) => {
    try {
      const verse = await storage.updateSiteVerse(req.params.id, req.body);
      if (!verse) {
        return res.status(404).json({ error: "Verso não encontrado" });
      }
      cache.invalidate("verse:current");
      res.json({ verse });
    } catch (error) {
      console.error("Update verse error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/verses/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteSiteVerse(req.params.id);
      cache.invalidate("verse:current");
      res.json({ success });
    } catch (error) {
      console.error("Delete verse error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin - Single verse management
  app.post("/api/admin/verse", requireAdmin, async (req, res) => {
    try {
      const { text, reference } = req.body;
      
      if (!text || !reference) {
        return res.status(400).json({ error: "Texto e referência são obrigatórios" });
      }

      // Get all verses
      const allVerses = await storage.getSiteVerses();
      
      if (allVerses.length > 0) {
        // Update the most recent verse
        const mostRecent = allVerses.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        })[0];
        
        const verse = await storage.updateSiteVerse(mostRecent.id, { text, reference, isActive: true });
        cache.invalidate("verse:current");
        res.json({ verse });
      } else {
        // Create new verse if none exists
        const verseData = insertSiteVerseSchema.parse({ text, reference, isActive: true });
        const verse = await storage.createSiteVerse(verseData);
        cache.invalidate("verse:current");
        res.status(201).json({ verse });
      }
    } catch (error) {
      console.error("Save verse error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin - CTA Banner config routes
  app.get("/api/admin/cta-banner", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getCtaBannerConfig();
      res.json({ config });
    } catch (error) {
      console.error("Get CTA banner config error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/cta-banner", requireAdmin, async (req, res) => {
    try {
      const config = await storage.upsertCtaBannerConfig(req.body);
      res.json({ config });
    } catch (error) {
      console.error("Upsert CTA banner config error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Public FAQ routes
  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await storage.getActiveFaqs();
      res.json({ faqs });
    } catch (error) {
      console.error("Get FAQs error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin FAQ routes
  app.get("/api/admin/faqs", requireAdmin, async (req, res) => {
    try {
      const faqs = await storage.getFaqs();
      res.json({ faqs });
    } catch (error) {
      console.error("Get admin FAQs error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/faqs", requireAdmin, async (req, res) => {
    try {
      const faqData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(faqData);
      res.status(201).json({ faq });
    } catch (error) {
      console.error("Create FAQ error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/faqs/:id", requireAdmin, async (req, res) => {
    try {
      // Validate partial update data
      const partialFaqSchema = insertFaqSchema.partial();
      const validatedData = partialFaqSchema.parse(req.body);
      
      const faq = await storage.updateFaq(req.params.id, validatedData);
      if (!faq) {
        return res.status(404).json({ error: "FAQ não encontrado" });
      }
      res.json({ faq });
    } catch (error) {
      console.error("Update FAQ error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos" });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/faqs/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteFaq(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete FAQ error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/cta-banner/image", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const filename = `${randomUUID()}.webp`;

      const processedBuffer = await sharp(req.file.buffer)
        .resize(1920, 800, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toBuffer();

      let imageUrl: string;
      if (isStorageEnabled()) {
        imageUrl = await uploadToStorage(processedBuffer, "cta-banner", filename);
      } else {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'cta-banner');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, filename), processedBuffer);
        imageUrl = `/uploads/cta-banner/${filename}`;
      }

      const config = await storage.upsertCtaBannerConfig({
        backgroundImageUrl: imageUrl
      });
      
      res.json({ imageUrl, config });
    } catch (error) {
      console.error("Upload CTA banner image error:", error);
      res.status(500).json({ error: "Erro ao fazer upload da imagem" });
    }
  });

  // Admin - Product management routes
  
  // Upload product image with WebP conversion
  app.post("/api/admin/products/:id/upload", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const productId = req.params.id;
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      const filename = `${randomUUID()}.webp`;

      const processedBuffer = await sharp(req.file.buffer)
        .webp({ quality: 85 })
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();

      let imageUrl: string;
      if (isStorageEnabled()) {
        imageUrl = await uploadToStorage(processedBuffer, "products", filename);
      } else {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, filename), processedBuffer);
        imageUrl = `/uploads/products/${filename}`;
      }

      const existingImages = await storage.getProductImages(productId);
      const maxOrder = existingImages.length > 0 
        ? Math.max(...existingImages.map(img => img.sortOrder || 0))
        : -1;

      const imageData = {
        productId,
        imageUrl,
        altText: req.body.altText || product.name,
        color: req.body.color || null,
        sortOrder: maxOrder + 1,
      };

      const image = await storage.addProductImage(imageData);
      res.status(201).json({ image });
    } catch (error) {
      console.error("Upload image error:", error);
      res.status(500).json({ error: "Erro ao fazer upload da imagem" });
    }
  });

  // Upload size chart image for product
  app.post("/api/admin/products/:id/upload-size-chart", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const productId = req.params.id;
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      const filename = `size-chart-${randomUUID()}.webp`;

      const processedBuffer = await sharp(req.file.buffer)
        .webp({ quality: 90 })
        .resize(1920, 1920, { 
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();

      let sizeChartImage: string;
      if (isStorageEnabled()) {
        sizeChartImage = await uploadToStorage(processedBuffer, "size-charts", filename);
      } else {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'size-charts');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, filename), processedBuffer);
        sizeChartImage = `/uploads/size-charts/${filename}`;
      }

      await storage.updateProduct(productId, { sizeChartImage });
      
      res.status(201).json({ sizeChartImage });
    } catch (error) {
      console.error("Upload size chart error:", error);
      res.status(500).json({ error: "Erro ao fazer upload da tabela de medidas" });
    }
  });

  // Update product image (reorder, change color, etc)
  app.patch("/api/admin/products/images/:id", requireAdmin, async (req, res) => {
    try {
      const image = await storage.updateProductImage(req.params.id, req.body);
      if (!image) {
        return res.status(404).json({ error: "Imagem não encontrada" });
      }
      res.json({ image });
    } catch (error) {
      console.error("Update image error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/products/images/:id", requireAdmin, async (req, res) => {
    try {
      const image = await storage.getProductImages(req.params.id);
      const success = await storage.deleteProductImage(req.params.id);
      
      if (success && image.length > 0) {
        const imgUrl = image[0].imageUrl;
        if (imgUrl.startsWith("/uploads/") || imgUrl.startsWith("/reviews/")) {
          try {
            const filepath = path.join(process.cwd(), 'public', imgUrl);
            await fs.unlink(filepath);
          } catch (err) {}
        } else {
          await deleteFromStorage(imgUrl);
        }
      }
      
      res.json({ success });
    } catch (error) {
      console.error("Delete image error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Public endpoint to get admin reviews for a product
  app.get("/api/products/:productId/admin-reviews", async (req, res) => {
    try {
      const reviews = await storage.getAdminProductReviews(req.params.productId);
      res.json({ reviews });
    } catch (error) {
      console.error("Get admin reviews error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin product review routes
  app.get("/api/admin/products/:productId/reviews", requireAdmin, async (req, res) => {
    try {
      const reviews = await storage.getAdminProductReviews(req.params.productId);
      res.json({ reviews });
    } catch (error) {
      console.error("Get admin reviews error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/products/:productId/reviews", requireAdmin, async (req, res) => {
    try {
      const { productId } = req.params;
      if (!productId || productId === 'undefined') {
        return res.status(400).json({ error: "ID do produto inválido" });
      }

      const reviewData = insertAdminProductReviewSchema.parse({
        ...req.body,
        productId
      });
      const review = await storage.createAdminProductReview(reviewData);
      const allReviews = await storage.getAdminProductReviews(productId);
      const avgRating = allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : "4.5";
      
      await storage.updateProduct(productId, { rating: parseFloat(avgRating), reviewsCount: allReviews.length });
      res.status(201).json({ review });
    } catch (error) {
      console.error("Create admin review error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/products/:productId/reviews/:reviewId", requireAdmin, async (req, res) => {
    try {
      const { productId, reviewId } = req.params;
      const partialSchema = insertAdminProductReviewSchema.partial();
      const reviewData = partialSchema.parse(req.body);
      const review = await storage.updateAdminProductReview(reviewId, reviewData);
      if (!review) return res.status(404).json({ error: "Avaliação não encontrada" });
      
      const allReviews = await storage.getAdminProductReviews(productId);
      const avgRating = allReviews.length > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : "4.5";
      
      await storage.updateProduct(productId, { rating: parseFloat(avgRating), reviewsCount: allReviews.length });
      res.json({ review });
    } catch (error) {
      console.error("Update admin review error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/products/:productId/reviews/:reviewId/reorder", requireAdmin, async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { sortOrder } = req.body;
      if (typeof sortOrder !== 'number') return res.status(400).json({ error: "sortOrder inválido" });
      const review = await storage.updateAdminProductReview(reviewId, { sortOrder } as any);
      if (!review) return res.status(404).json({ error: "Avaliação não encontrada" });
      res.json({ review });
    } catch (error) {
      console.error("Reorder admin review error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/products/:productId/reviews/:reviewId", requireAdmin, async (req, res) => {
    try {
      const { productId, reviewId } = req.params;
      const success = await storage.deleteAdminProductReview(reviewId);
      if (!success) return res.status(404).json({ error: "Avaliação não encontrada" });
      
      const allReviews = await storage.getAdminProductReviews(productId);
      const avgRating = allReviews.length > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : "4.5";
      
      await storage.updateProduct(productId, { rating: parseFloat(avgRating), reviewsCount: allReviews.length });
      res.json({ success });
    } catch (error) {
      console.error("Delete admin review error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Upload review user image
  app.post("/api/admin/reviews/upload-user-image", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "nenhum arquivo foi enviado" });
      }

      const filename = `user-${randomUUID()}.webp`;

      const processedBuffer = await sharp(req.file.buffer)
        .webp({ quality: 80 })
        .toBuffer();

      let userImage: string;
      if (isStorageEnabled()) {
        userImage = await uploadToStorage(processedBuffer, "reviews", filename);
      } else {
        const filepath = path.join(process.cwd(), 'public', 'reviews', filename);
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, processedBuffer);
        userImage = `/reviews/${filename}`;
      }

      res.json({ userImage });
    } catch (error) {
      console.error("Upload user image error:", error);
      res.status(500).json({ error: "erro ao fazer upload da imagem" });
    }
  });

  app.post("/api/admin/reviews/upload-review-image", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "nenhum arquivo foi enviado" });
      }

      const filename = `review-${randomUUID()}.webp`;

      const processedBuffer = await sharp(req.file.buffer)
        .webp({ quality: 80 })
        .toBuffer();

      let reviewImage: string;
      if (isStorageEnabled()) {
        reviewImage = await uploadToStorage(processedBuffer, "reviews", filename);
      } else {
        const filepath = path.join(process.cwd(), 'public', 'reviews', filename);
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, processedBuffer);
        reviewImage = `/reviews/${filename}`;
      }

      res.json({ reviewImage });
    } catch (error) {
      console.error("Upload review image error:", error);
      res.status(500).json({ error: "erro ao fazer upload da imagem" });
    }
  });

  // Coupon endpoints
  app.get("/api/products/:productId/coupon", async (req, res) => {
    try {
      const coupon = await storage.getProductCoupon(req.params.productId);
      res.json({ coupon });
    } catch (error) {
      console.error("Get coupon error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/products/:productId/coupons", requireAdmin, async (req, res) => {
    try {
      const coupons = await storage.getProductCoupons(req.params.productId);
      res.json({ coupons });
    } catch (error) {
      console.error("Get coupons error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/products/:productId/coupons", requireAdmin, async (req, res) => {
    try {
      const couponData = insertProductCouponSchema.parse({
        ...req.body,
        productId: req.params.productId
      });
      const coupon = await storage.createProductCoupon(couponData);
      res.status(201).json({ coupon });
    } catch (error) {
      console.error("Create coupon error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/coupons/:couponId", requireAdmin, async (req, res) => {
    try {
      const partialSchema = insertProductCouponSchema.partial();
      const couponData = partialSchema.parse(req.body);
      const coupon = await storage.updateProductCoupon(req.params.couponId, couponData);
      if (!coupon) return res.status(404).json({ error: "Cupom não encontrado" });
      res.json({ coupon });
    } catch (error) {
      console.error("Update coupon error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/coupons/:couponId", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProductCoupon(req.params.couponId);
      if (!success) return res.status(404).json({ error: "Cupom não encontrado" });
      res.json({ success });
    } catch (error) {
      console.error("Delete coupon error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Global coupon endpoints
  app.get("/api/global-coupon", async (req, res) => {
    try {
      const coupon = await storage.getGlobalCoupon();
      res.json({ coupon });
    } catch (error) {
      console.error("Get global coupon error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Código do cupom é obrigatório" });
      }

      const coupon = await storage.getCouponByCode(code);
      if (coupon) {
        return res.json({ valid: true, coupon });
      }

      res.status(404).json({ valid: false, error: "cupom inválido ou expirado" });
    } catch (error) {
      console.error("Validate coupon error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/global-coupons", requireAdmin, async (req, res) => {
    try {
      const coupons = await storage.getAllGlobalCoupons();
      res.json({ coupons });
    } catch (error) {
      console.error("Get global coupons error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/global-coupons", requireAdmin, async (req, res) => {
    try {
      const { fromZodError } = await import("zod-validation-error");
      const z = (await import("zod")).z;
      const { globalCoupon } = await import("@shared/schema");
      const { createInsertSchema } = await import("drizzle-zod");
      
      const insertGlobalCouponSchema = createInsertSchema(globalCoupon).omit({
        id: true,
        createdAt: true,
        updatedAt: true
      }).extend({
        discountValue: z.coerce.number().min(0, "o desconto não pode ser negativo").max(90, "o desconto máximo é 90%"),
      });

      const validatedData = insertGlobalCouponSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: fromZodError(validatedData.error).message });
      }

      const coupon = await storage.createGlobalCoupon(validatedData.data);
      res.status(201).json({ coupon });
    } catch (error) {
      console.error("Create global coupon error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/global-coupons/:couponId", requireAdmin, async (req, res) => {
    try {
      const { fromZodError } = await import("zod-validation-error");
      const z = (await import("zod")).z;
      const { globalCoupon } = await import("@shared/schema");
      const { createInsertSchema } = await import("drizzle-zod");

      const updateGlobalCouponSchema = createInsertSchema(globalCoupon).omit({
        id: true,
        createdAt: true,
        updatedAt: true
      }).extend({
        discountValue: z.coerce.number().min(0, "o desconto não pode ser negativo").max(90, "o desconto máximo é 90%").optional(),
      }).partial();

      const validatedData = updateGlobalCouponSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: fromZodError(validatedData.error).message });
      }

      const coupon = await storage.updateGlobalCoupon(req.params.couponId, validatedData.data);
      if (!coupon) return res.status(404).json({ error: "Cupom global não encontrado" });
      res.json({ coupon });
    } catch (error) {
      console.error("Update global coupon error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/global-coupons/:couponId", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteGlobalCoupon(req.params.couponId);
      if (!success) return res.status(404).json({ error: "Cupom global não encontrado" });
      res.json({ success });
    } catch (error) {
      console.error("Delete global coupon error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Update product
  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      console.log("=".repeat(80));
      console.log("📝 [PATCH /api/admin/products/:id] Recebendo requisição de atualização");
      console.log("📝 [PATCH] Product ID:", req.params.id);
      console.log("📝 [PATCH] Body recebido:", JSON.stringify(req.body, null, 2));
      console.log("📝 [PATCH] Colors no body:", req.body.colors);
      console.log("📝 [PATCH] Colors é array?", Array.isArray(req.body.colors));
      
      if (req.body.colors && Array.isArray(req.body.colors)) {
        req.body.colors = JSON.stringify(req.body.colors);
      }
      if (req.body.fabrics && Array.isArray(req.body.fabrics)) {
        req.body.fabrics = JSON.stringify(req.body.fabrics);
      }
      const numericFields = ['price', 'originalPrice', 'rating', 'reviewsCount', 'displayOrder', 'installmentsMax', 'installmentsValue'];
      for (const field of numericFields) {
        if (req.body[field] === '' || req.body[field] === undefined) {
          delete req.body[field];
        }
      }
      const shippingNumericFields = ['shippingWeight', 'shippingHeight', 'shippingWidth', 'shippingLength'];
      for (const field of shippingNumericFields) {
        if (req.body[field] === '' || req.body[field] === undefined || req.body[field] === null) {
          req.body[field] = null;
        } else {
          req.body[field] = Number(req.body[field]);
        }
      }
      const optionalStringFields = ['category', 'sectionLabel', 'sectionTitle', 'sectionSubtitle'];
      for (const field of optionalStringFields) {
        if (req.body[field] === '') {
          req.body[field] = null;
        }
      }
      if (req.body.fabricDescription === '') {
        req.body.fabricDescription = null;
      }
      if (req.body.careInstructions === '') {
        req.body.careInstructions = null;
      }
      
      console.log("✅ [PATCH] Iniciando parsing do schema");
      const productData = insertProductSchema.partial().parse(req.body);
      console.log("✅ [PATCH] Schema parseado com sucesso:", JSON.stringify(productData, null, 2));
      console.log("✅ [PATCH] Colors no productData:", productData.colors);
      
      console.log("💾 [PATCH] Chamando storage.updateProduct...");
      const product = await storage.updateProduct(req.params.id, productData);
      console.log("💾 [PATCH] Produto retornado do storage:", JSON.stringify(product, null, 2));
      console.log("💾 [PATCH] Colors no produto retornado:", product?.colors);
      
      if (!product) {
        console.log("❌ [PATCH] Produto não encontrado");
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      
      cache.invalidate("products:list");
      console.log("✅ [PATCH] Enviando resposta de sucesso");
      console.log("=".repeat(80));
      res.json({ product });
    } catch (error) {
      console.error("❌ [PATCH] Erro ao atualizar produto:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Create new product
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      console.log("=".repeat(80));
      console.log("📦 [POST /api/admin/products] Recebendo requisição de criação");
      console.log("📦 [POST] Body recebido:", JSON.stringify(req.body, null, 2));
      console.log("📦 [POST] Colors no body:", req.body.colors);
      console.log("📦 [POST] Colors é array?", Array.isArray(req.body.colors));
      
      if (req.body.colors && Array.isArray(req.body.colors)) {
        req.body.colors = JSON.stringify(req.body.colors);
      }
      if (req.body.fabrics && Array.isArray(req.body.fabrics)) {
        req.body.fabrics = JSON.stringify(req.body.fabrics);
      }
      const numericFields = ['price', 'originalPrice', 'rating', 'reviewsCount', 'displayOrder', 'installmentsMax', 'installmentsValue'];
      for (const field of numericFields) {
        if (req.body[field] === '' || req.body[field] === undefined) {
          delete req.body[field];
        }
      }
      const shippingNumericFields = ['shippingWeight', 'shippingHeight', 'shippingWidth', 'shippingLength'];
      for (const field of shippingNumericFields) {
        if (req.body[field] === '' || req.body[field] === undefined || req.body[field] === null) {
          req.body[field] = null;
        } else {
          req.body[field] = Number(req.body[field]);
        }
      }
      const optionalStringFields = ['category', 'sectionLabel', 'sectionTitle', 'sectionSubtitle'];
      for (const field of optionalStringFields) {
        if (req.body[field] === '') {
          req.body[field] = null;
        }
      }
      if (req.body.fabricDescription === '') {
        req.body.fabricDescription = null;
      }
      if (req.body.careInstructions === '') {
        req.body.careInstructions = null;
      }
      
      console.log("✅ [POST] Iniciando parsing do schema");
      const productData = insertProductSchema.parse(req.body);
      console.log("✅ [POST] Schema parseado com sucesso:", JSON.stringify(productData, null, 2));
      console.log("✅ [POST] Colors no productData:", productData.colors);
      
      console.log("💾 [POST] Chamando storage.createProduct...");
      const product = await storage.createProduct(productData);
      console.log("💾 [POST] Produto criado e retornado do storage:", JSON.stringify(product, null, 2));
      console.log("💾 [POST] Colors no produto criado:", product?.colors);
      
      cache.invalidate("products:list");
      console.log("✅ [POST] Enviando resposta de sucesso");
      console.log("=".repeat(80));
      res.status(201).json({ product });
    } catch (error: any) {
      console.error("❌ [POST] Erro ao criar produto:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      // Verifica erro de constraint unique (slug ou sku duplicado)
      if (error?.code === '23505') {
        if (error?.constraint?.includes('slug')) {
          return res.status(400).json({ error: "Já existe um produto com este slug. Por favor, escolha outro." });
        }
        if (error?.constraint?.includes('sku')) {
          return res.status(400).json({ error: "Já existe um produto com este SKU. Por favor, escolha outro." });
        }
        return res.status(400).json({ error: "Já existe um produto com estes dados. Por favor, verifique." });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Delete product
  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const images = await storage.getProductImages(req.params.id);
      const success = await storage.deleteProduct(req.params.id);
      
      if (success) {
        for (const img of images) {
          const imgUrl = img.imageUrl;
          if (imgUrl.startsWith("/uploads/") || imgUrl.startsWith("/reviews/")) {
            try {
              const filepath = path.join(process.cwd(), 'public', imgUrl);
              await fs.unlink(filepath);
            } catch (err) {}
          } else {
            await deleteFromStorage(imgUrl);
          }
        }
        cache.invalidate("products:list");
      }
      
      res.json({ success });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.use("/api/checkout", checkoutRoutes);

  // Admin orders routes
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const { search, status, filter, sortField, sortDirection } = req.query;
      console.log(`[GET_ORDERS] Filter: ${filter}, Search: ${search}, Status: ${status}`);
      
      const orders = await storage.getOrders({
        search: search as string,
        status: status as string,
        filter: (filter as any) || 'all',
        sortField: sortField as string,
        sortDirection: sortDirection as 'asc' | 'desc'
      });
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const updatedOrder = await storage.updateOrder(req.params.id, req.body);
      if (!updatedOrder) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/orders/:id/archive", requireAdmin, async (req, res) => {
    try {
      const updatedOrder = await storage.archiveOrder(req.params.id);
      if (!updatedOrder) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Archive order error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/orders/:id/unarchive", requireAdmin, async (req, res) => {
    try {
      const updatedOrder = await storage.unarchiveOrder(req.params.id);
      if (!updatedOrder) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Unarchive order error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status, trackingCode, refundReason } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status é obrigatório" });
      }

      console.log(`[ORDER_STATUS] Updating order ${req.params.id} to ${status}`);
      
      const updateData: any = { orderStatus: status };
      
      if (status === 'shipped' && trackingCode) {
        updateData.trackingCode = trackingCode;
      }

      if (status === 'refunded' && refundReason) {
        updateData.refundReason = refundReason;
      }
      
      // Set delivery date if status is delivered
      if (status === 'delivered') {
        updateData.actualDeliveryDate = new Date();
      }

      const updatedOrder = await storage.updateOrder(req.params.id, updateData);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      console.log(`[ORDER_STATUS] Order ${req.params.id} updated successfully`);

      if (status === 'shipped' && trackingCode && updatedOrder) {
        try {
          await sendTrackingCodeEmail(updatedOrder);
          console.log(`✅ [EMAIL] Email de rastreio enviado para pedido ${req.params.id}`);
        } catch (emailError) {
          console.error(`❌ [EMAIL] Falha ao enviar email de rastreio:`, emailError);
        }
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/orders/bulk/status", requireAdmin, async (req, res) => {
    try {
      const { orderIds, status, refundReason } = req.body;
      if (!Array.isArray(orderIds) || !status) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      console.log(`[ORDER_STATUS] Bulk updating ${orderIds.length} orders to ${status}`);
      
      const updateData: any = { orderStatus: status };
      if (status === 'delivered') {
        updateData.actualDeliveryDate = new Date();
      }
      if (status === 'refunded' && refundReason) {
        updateData.refundReason = refundReason;
      }
      
      const results = await Promise.all(
        orderIds.map(id => storage.updateOrder(id, updateData))
      );
      
      const successCount = results.filter(Boolean).length;
      console.log(`[ORDER_STATUS] Bulk update completed. ${successCount}/${orderIds.length} successful`);
      
      res.json({ success: true, count: successCount });
    } catch (error) {
      console.error("Bulk status update error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const updatedOrder = await storage.softDeleteOrder(req.params.id);
      if (!updatedOrder) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Delete order error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/orders/:id/permanent", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }
      if (!order.deletedAt) {
        return res.status(400).json({ error: "Pedido precisa estar removido antes de deletar permanentemente" });
      }
      await storage.hardDeleteOrder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Hard delete order error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/orders/bulk/archive", requireAdmin, async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "IDs de pedidos inválidos" });
      }
      
      const results = await Promise.all(
        orderIds.map(id => storage.archiveOrder(id))
      );
      
      res.json({ 
        success: true, 
        count: results.filter(r => r !== null).length 
      });
    } catch (error) {
      console.error("Bulk archive error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/orders/bulk/unarchive", requireAdmin, async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "IDs de pedidos inválidos" });
      }
      
      const results = await Promise.all(
        orderIds.map(id => storage.unarchiveOrder(id))
      );
      
      res.json({ 
        success: true, 
        count: results.filter(r => r !== null).length 
      });
    } catch (error) {
      console.error("Bulk unarchive error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/orders/bulk/delete", requireAdmin, async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "IDs de pedidos inválidos" });
      }
      
      const results = await Promise.all(
        orderIds.map(id => storage.softDeleteOrder(id))
      );
      
      res.json({ 
        success: true, 
        count: results.filter(r => r !== null).length 
      });
    } catch (error) {
      console.error("Bulk delete error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/orders/bulk/restore", requireAdmin, async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "IDs de pedidos inválidos" });
      }
      
      const results = await Promise.all(
        orderIds.map(id => storage.restoreOrder(id))
      );
      
      res.json({ 
        success: true, 
        count: results.filter(r => r !== null).length 
      });
    } catch (error) {
      console.error("Bulk restore error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/orders/bulk/permanent-delete", requireAdmin, async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "IDs de pedidos inválidos" });
      }
      
      // Check all orders are deleted before hard deleting
      const orders = await Promise.all(
        orderIds.map(id => storage.getOrder(id))
      );
      
      const notDeleted = orders.filter(order => order && !order.deletedAt);
      if (notDeleted.length > 0) {
        return res.status(400).json({ 
          error: "Todos os pedidos precisam estar removidos antes de deletar permanentemente" 
        });
      }
      
      await Promise.all(
        orderIds.map(id => storage.hardDeleteOrder(id))
      );
      
      res.json({ 
        success: true, 
        count: orderIds.length 
      });
    } catch (error) {
      console.error("Bulk permanent delete error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/tracking/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      if (!identifier || identifier.trim().length === 0) {
        return res.status(400).json({ error: "Código de rastreio ou número do pedido é obrigatório" });
      }

      const order = await storage.getOrderByNumberOrTracking(identifier.trim());
      
      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      if (order.deletedAt) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      res.json({ order });
    } catch (error) {
      console.error("Tracking error:", error);
      res.status(500).json({ error: "Erro ao buscar informações do pedido" });
    }
  });

  // Product Measurement Routes (Public)
  app.get("/api/products/:productId/measurements", async (req, res) => {
    try {
      const { productId } = req.params;
      const fields = await storage.getProductMeasurementFields(productId);
      const measurements = await storage.getProductSizeMeasurements(productId);
      res.json({ fields, measurements });
    } catch (error) {
      console.error("Get product measurements error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/products/:productId/measurement-fields", async (req, res) => {
    try {
      const { productId } = req.params;
      const fields = await storage.getProductMeasurementFields(productId);
      res.json({ fields });
    } catch (error) {
      console.error("Get measurement fields error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/products/:productId/size-measurements", async (req, res) => {
    try {
      const { productId } = req.params;
      const measurements = await storage.getProductSizeMeasurements(productId);
      res.json({ measurements });
    } catch (error) {
      console.error("Get size measurements error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Product Measurement Routes (Admin)
  app.get("/api/admin/products/:productId/measurement-fields", requireAdmin, async (req, res) => {
    try {
      const { productId } = req.params;
      const fields = await storage.getProductMeasurementFields(productId);
      res.json({ fields });
    } catch (error) {
      console.error("Get measurement fields error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/products/:productId/measurement-fields", requireAdmin, async (req, res) => {
    try {
      const { productId } = req.params;
      const fieldData = insertProductMeasurementFieldSchema.parse({
        ...req.body,
        productId
      });
      const field = await storage.createProductMeasurementField(fieldData);
      res.status(201).json({ field });
    } catch (error) {
      console.error("Create measurement field error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/measurement-fields/:id", requireAdmin, async (req, res) => {
    try {
      const field = await storage.updateProductMeasurementField(req.params.id, req.body);
      if (!field) {
        return res.status(404).json({ error: "Campo não encontrado" });
      }
      res.json({ field });
    } catch (error) {
      console.error("Update measurement field error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/measurement-fields/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProductMeasurementField(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete measurement field error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/products/:productId/size-measurements", requireAdmin, async (req, res) => {
    try {
      const { productId } = req.params;
      const measurements = await storage.getProductSizeMeasurements(productId);
      res.json({ measurements });
    } catch (error) {
      console.error("Get size measurements error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/products/:productId/size-measurements", requireAdmin, async (req, res) => {
    try {
      const { productId } = req.params;
      const measurementData = insertProductSizeMeasurementSchema.parse({
        ...req.body,
        productId
      });
      const measurement = await storage.upsertProductSizeMeasurement(measurementData);
      res.status(201).json({ measurement });
    } catch (error) {
      console.error("Create size measurement error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Dados inválidos", details: error.message });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/size-measurements/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProductSizeMeasurement(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete size measurement error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Footer pages routes - public read
  app.get("/api/footer-page/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const { db } = await import('./db');
      const { footerPages } = await import('@shared/schema');
      const page = await db.query.footerPages.findFirst({
        where: (fp: any) => eq(fp.slug, slug),
      });
      if (!page) {
        return res.status(404).json({ error: "página não encontrada" });
      }
      res.json(page);
    } catch (error) {
      console.error("Get footer page error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Footer pages routes - admin edit
  app.post("/api/footer-page/:slug", requireAdmin, async (req, res) => {
    try {
      const { slug } = req.params;
      const { title, content, description } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: "título e conteúdo são obrigatórios" });
      }

      const { db } = await import('./db');
      const { footerPages } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const existing = await db.query.footerPages.findFirst({
        where: (fp: any) => eq(fp.slug, slug),
      });

      let result;
      if (existing) {
        result = await db.update(footerPages)
          .set({
            title,
            content,
            description,
            updatedAt: new Date(),
          })
          .where(eq(footerPages.slug, slug))
          .returning();
      } else {
        result = await db.insert(footerPages)
          .values({
            slug,
            title,
            content,
            description,
          })
          .returning();
      }

      res.json(result[0] || {});
    } catch (error) {
      console.error("Update footer page error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Public company info endpoint
  app.get("/api/company-info", async (req, res) => {
    try {
      const cacheKey = "company:info";
      const cached = cache.get<{ company: any }>(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      const company = await storage.getCompanyInfo();
      const response = { company: company || null };
      cache.set(cacheKey, response, CACHE_TTL.COMPANY_INFO);
      res.json(response);
    } catch (error) {
      console.error("Get company info error:", error);
      res.status(500).json({ error: "Erro ao buscar informações da empresa" });
    }
  });

  // Admin company info endpoint
  app.get("/api/admin/company-info", requireAdmin, async (req, res) => {
    try {
      const company = await storage.getCompanyInfo();
      res.json({ company: company || null });
    } catch (error) {
      console.error("Get admin company info error:", error);
      res.status(500).json({ error: "Erro ao buscar informações da empresa" });
    }
  });

  // Admin update company info endpoint
  app.post("/api/admin/company-info", requireAdmin, async (req, res) => {
    try {
      const companyData = req.body;
      const { insertCompanyInfoSchema } = await import("@shared/schema");
      const validatedData = insertCompanyInfoSchema.parse(companyData);
      const company = await storage.updateCompanyInfo(validatedData);
      cache.invalidate("company:info");
      res.json({ company });
    } catch (error) {
      console.error("Update company info error:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ error: "Dados inválidos" });
      } else {
        res.status(500).json({ error: "Erro ao atualizar informações da empresa" });
      }
    }
  });

  // Installment Options endpoints
  app.get("/api/products/:id/installments", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      
      const options = await storage.getInstallmentOptions(req.params.id);
      const productPrice = parseFloat(product.price) || 0;
      
      // Transform options to include calculated values
      const transformedOptions = options.map(opt => {
        const customValue = opt.customValue ? parseFloat(opt.customValue) : null;
        const installmentValue = customValue || (productPrice / opt.installments);
        const totalPrice = installmentValue * opt.installments;
        
        return {
          installments: opt.installments,
          installmentValue: installmentValue,
          totalPrice: totalPrice,
          isInterestFree: opt.isInterestFree,
          customValue: opt.customValue
        };
      });
      
      res.json(transformedOptions);
    } catch (error) {
      console.error("Get installment options error:", error);
      res.status(500).json({ error: "Erro ao buscar opções de parcelamento" });
    }
  });

  app.post("/api/admin/products/:id/installments", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || id === 'undefined') {
        return res.status(400).json({ error: "ID do produto inválido" });
      }
      const options = req.body;
      if (!Array.isArray(options)) {
        return res.status(400).json({ error: "Dados inválidos: esperado um array" });
      }
      await storage.updateInstallmentOptions(id, options);
      res.json({ success: true });
    } catch (error) {
      console.error("Update installment options error:", error);
      res.status(500).json({ error: "Erro ao atualizar opções de parcelamento" });
    }
  });

  app.post("/api/webhooks/mailgun", async (req, res) => {
    try {
      const { signature, "event-data": eventData } = req.body;
      
      const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
      if (!signingKey) {
        console.log("❌ [MAILGUN WEBHOOK] MAILGUN_WEBHOOK_SIGNING_KEY not configured");
        return res.status(403).json({ error: "Webhook signing key not configured" });
      }
      if (signature) {
        const crypto = await import("crypto");
        const encodedToken = crypto.default
          .createHmac("sha256", signingKey)
          .update(signature.timestamp.concat(signature.token))
          .digest("hex");
        
        if (encodedToken !== signature.signature) {
          console.log("❌ [MAILGUN WEBHOOK] Invalid signature");
          return res.status(406).json({ error: "Invalid signature" });
        }
      }

      if (!eventData) {
        return res.status(400).json({ error: "No event data" });
      }

      const event = eventData.event;
      const recipientEmail = eventData.recipient;
      
      console.log(`📧 [MAILGUN WEBHOOK] Event: ${event}, Recipient: ${recipientEmail}`);

      const allOrders = await storage.getOrders({ search: recipientEmail });
      const order = allOrders
        .filter(o => o.customerEmail === recipientEmail)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];

      if (!order) {
        console.log(`⚠️ [MAILGUN WEBHOOK] No order found for ${recipientEmail}`);
        return res.json({ status: "ok", message: "No matching order" });
      }

      const updateData: any = {};

      switch (event) {
        case "delivered":
          updateData.emailDeliveredAt = new Date();
          break;
        case "opened":
          updateData.emailOpenedAt = new Date();
          break;
        case "complained":
          updateData.emailComplainedAt = new Date();
          break;
        case "failed":
          updateData.emailFailedAt = new Date();
          updateData.emailFailureReason = eventData["delivery-status"]?.message || eventData["delivery-status"]?.description || "Unknown failure";
          break;
        case "rejected":
          updateData.emailFailedAt = new Date();
          updateData.emailFailureReason = eventData.reject?.reason || "Rejected by Mailgun";
          break;
        default:
          console.log(`ℹ️ [MAILGUN WEBHOOK] Unhandled event type: ${event}`);
          return res.json({ status: "ok", message: "Event type not tracked" });
      }

      await storage.updateOrder(order.id, updateData);
      console.log(`✅ [MAILGUN WEBHOOK] Order ${order.orderNumber} updated with ${event} event`);

      res.json({ status: "ok" });
    } catch (error) {
      console.error("❌ [MAILGUN WEBHOOK] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== PAYMENT BRANDS ROUTES =====

  app.get("/api/payment-brands", async (_req, res) => {
    try {
      const brands = await storage.getEnabledPaymentBrands();
      res.json({ brands });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar bandeiras" });
    }
  });

  app.get("/api/admin/payment-brands", requireAdmin, async (_req, res) => {
    try {
      const brands = await storage.getPaymentBrands();
      res.json({ brands });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar bandeiras" });
    }
  });

  app.put("/api/admin/payment-brands", requireAdmin, async (req, res) => {
    try {
      const { brands } = req.body;
      if (!Array.isArray(brands)) return res.status(400).json({ error: "brands deve ser um array" });
      const result = await storage.upsertPaymentBrands(brands);
      res.json({ brands: result });
    } catch (error) {
      res.status(500).json({ error: "Erro ao salvar bandeiras" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
