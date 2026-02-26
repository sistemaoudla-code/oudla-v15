import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, index, unique, check, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  height: integer("height"), // cm
  weight: integer("weight"), // kg
  preferredSize: varchar("preferred_size", { length: 10 }),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: text("sku").unique(), // Stock Keeping Unit
  slug: text("slug").unique(), // Personalized URL slug
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  productType: varchar("product_type", { length: 50 }).default("tshirt"), // "tshirt" or "accessory"
  category: text("category"), // category for accessories
  colors: text("colors"), // IMPORTANT: Stored as JSON string. Format: '[{"name":"Preto","hex":"#000000"}]' (optional for accessories)
  sizes: text("sizes").array(), // ["P", "M", "G", "GG"] (optional for accessories)
  modelUrl: text("model_url"), // Path to 3D model (.glb file)
  isNew: boolean("is_new").default(false),
  displayOrder: integer("display_order").default(0), // Order priority on homepage
  customizable: boolean("customizable").default(false), // Toggle customizable options
  customizableFront: boolean("customizable_front").default(false), // Allow front customization
  customizableBack: boolean("customizable_back").default(false), // Allow back customization
  sizesEnabled: boolean("sizes_enabled").default(true), // Enable/disable sizes
  showInstallments: boolean("show_installments").default(true), // Toggle installments visibility
  fabricTech: text("fabric_tech").array(), // ["não encolhe", "seca rápido"]
  fabricDescription: text("fabric_description"),
  careInstructions: text("care_instructions"),
  sizeGuide: text("size_guide"), // JSON string with size measurements
  sizeChartImage: text("size_chart_image"), // URL to uploaded size chart image
  sizeChartEnabled: boolean("size_chart_enabled").default(false), // Enable/disable size chart display
  fabricsEnabled: boolean("fabrics_enabled").default(false), // Enable/disable fabric selection
  rating: decimal("rating", { precision: 2, scale: 1 }).default("4.5"), // Average rating (1.0 - 5.0)
  reviewsCount: integer("reviews_count").default(0), // Number of reviews
  reviewsEnabled: boolean("reviews_enabled").default(false), // Enable/disable reviews for this product
  installmentsMax: integer("installments_max").default(12), // Max installments number
  installmentsValue: decimal("installments_value", { precision: 10, scale: 2 }), // Custom installment value
  installmentsInterestFree: boolean("installments_interest_free").default(true), // Whether installments are interest-free
  fabrics: text("fabrics"), // IMPORTANT: Stored as JSON string. Format: '[{"name":"Algodão","price":0}, {"name":"Seda","price":40}]'
  sectionLabel: text("section_label"), // Small label above title (e.g. "personalize")
  sectionTitle: text("section_title"), // Main heading (e.g. "escolha os detalhes da sua peça")
  sectionSubtitle: text("section_subtitle"), // Description below title
  shippingWeight: integer("shipping_weight"),
  shippingHeight: integer("shipping_height"),
  shippingWidth: integer("shipping_width"),
  shippingLength: integer("shipping_length"),
  status: text("status").default("draft"), // "draft" or "published"
  previewToken: text("preview_token"), // Secret token for private viewing
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  priceCheck: check("products_price_check", sql`${table.price} >= 0`),
  originalPriceCheck: check("products_original_price_check", sql`${table.originalPrice} >= 0 OR ${table.originalPrice} IS NULL`),
  installmentsValueCheck: check("products_installments_value_check", sql`${table.installmentsValue} >= 0 OR ${table.installmentsValue} IS NULL`),
  ratingCheck: check("products_rating_check", sql`${table.rating} >= 1.0 AND ${table.rating} <= 5.0`),
  reviewsCountCheck: check("products_reviews_count_check", sql`${table.reviewsCount} >= 0`),
}));

// Product images table
export const productImages = pgTable("product_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  imageType: varchar("image_type", { length: 20 }).default("carousel"), // "presentation" or "carousel"
  color: text("color"), // color name for carousel images, null for presentation
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  productIdIdx: index("product_images_product_id_idx").on(table.productId),
}));

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  content: text("content").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  productIdIdx: index("reviews_product_id_idx").on(table.productId),
  userIdIdx: index("reviews_user_id_idx").on(table.userId),
  ratingCheck: check("reviews_rating_check", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
}));

// Admin product reviews table - Reviews created by admin for products
export const adminProductReviews = pgTable("admin_product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userName: text("user_name").notNull(),
  userImage: text("user_image"), // URL to user profile image
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment").notNull(),
  userCity: text("user_city"), // City/State e.g., "Maringá/PR"
  reviewImage: text("review_image"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  productIdIdx: index("admin_product_reviews_product_id_idx").on(table.productId),
  ratingCheck: check("admin_product_reviews_rating_check", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
}));

// Review images table
export const reviewImages = pgTable("review_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  reviewIdIdx: index("review_images_review_id_idx").on(table.reviewId),
}));

// Review likes table
export const reviewLikes = pgTable("review_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  reviewUserIdx: index("review_likes_review_user_idx").on(table.reviewId, table.userId),
  uniqueReviewUser: unique("review_likes_unique").on(table.reviewId, table.userId),
}));

// Review Q&A table
export const reviewQA = pgTable("review_qa", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  question: text("question"),
  answer: text("answer"),
  isQuestion: boolean("is_question").default(true),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  reviewIdIdx: index("review_qa_review_id_idx").on(table.reviewId),
  parentFk: foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: "review_qa_parent_fk"
  }),
}));

// Favorites table
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userProductIdx: index("favorites_user_product_idx").on(table.userId, table.productId),
  uniqueUserProduct: unique("favorites_unique").on(table.userId, table.productId),
}));

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  size: varchar("size", { length: 10 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(), // hex color
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index("cart_items_user_id_idx").on(table.userId),
  uniqueUserProductSizeColor: unique("cart_items_unique").on(table.userId, table.productId, table.size, table.color),
  quantityCheck: check("cart_items_quantity_check", sql`${table.quantity} >= 1`),
}));

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  passwordHash: true,
  name: true,
  height: true,
  weight: true,
});

export const updateUserMeasurementsSchema = createInsertSchema(users).pick({
  height: true,
  weight: true,
  preferredSize: true,
});

// Color schema for validation
export const colorSchema = z.object({
  name: z.string().min(1, "Nome da cor é obrigatório"),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Hexadecimal inválido (use #RRGGBB)"),
});

// Fabric schema for validation
export const fabricSchema = z.object({
  name: z.string().min(1, "Nome do tecido é obrigatório"),
  price: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]).default(0),
});

// Product schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sku: z.string().optional().nullable(),
  colors: z.union([
    z.string(),  // Accept already stringified JSON
    z.array(colorSchema)  // Accept array and transform
  ]).optional().transform((val) => {
    console.log("🔄 [SCHEMA TRANSFORM] Transformando colors");
    console.log("🔄 [SCHEMA TRANSFORM] Valor recebido:", val);
    console.log("🔄 [SCHEMA TRANSFORM] Tipo:", typeof val);
    
    if (!val) {
      console.log("🔄 [SCHEMA TRANSFORM] Valor vazio/null, retornando null");
      return null;
    }
    
    if (typeof val === 'string') {
      console.log("🔄 [SCHEMA TRANSFORM] Já é string, retornando como está:", val);
      return val;
    }
    
    if (Array.isArray(val)) {
      const stringified = JSON.stringify(val);
      console.log("🔄 [SCHEMA TRANSFORM] É array, convertendo para JSON:", stringified);
      return stringified;
    }
    
    console.log("🔄 [SCHEMA TRANSFORM] Tipo desconhecido, retornando null");
    return null;
  }),
  fabrics: z.union([
    z.string(),
    z.array(fabricSchema)
  ]).optional().nullable().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return JSON.stringify(val);
    return null;
  }),
  sizeChartImage: z.string().optional().nullable(),
  sizeChartEnabled: z.boolean().optional(),
  fabricsEnabled: z.boolean().optional(),
  reviewsCount: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]).optional(),
  rating: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]).optional(),
  installmentsMax: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]).optional(),
  installmentsValue: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]).optional().nullable(),
  installmentsInterestFree: z.boolean().optional(),
});

// Review schemas
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verified: true,
});

// Cart schemas
export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Product image schemas
export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
  createdAt: true,
});

// Admin product review schemas
export const insertAdminProductReviewSchema = createInsertSchema(adminProductReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rating: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]),
});

// Review image schemas
export const insertReviewImageSchema = createInsertSchema(reviewImages).omit({
  id: true,
  createdAt: true,
});

// Review like schemas
export const insertReviewLikeSchema = createInsertSchema(reviewLikes).omit({
  id: true,
  createdAt: true,
});

// Review Q&A schemas
export const insertReviewQASchema = createInsertSchema(reviewQA).omit({
  id: true,
  createdAt: true,
});

// Favorite schemas
export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

// Site banners table - for homepage carousel
export const siteBanners = pgTable("site_banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  ctaText: text("cta_text"), // Optional
  ctaLink: text("cta_link"), // Optional - used when productId is null
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }), // Optional - link to specific product
  imageUrl: text("image_url").notNull(),
  mobileImageUrl: text("mobile_image_url"),
  position: varchar("position", { length: 10 }).default("left"), // desktop: left, center, right
  mobilePosition: varchar("mobile_position", { length: 20 }).default("bottom-center"), // mobile: bottom-left, bottom-center, bottom-right, center-left, center-center, center-right
  showText: boolean("show_text").default(true), // Show or hide text overlay
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Site content table - for editable texts throughout the site
export const siteContent = pgTable("site_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // e.g., "newsletter_title", "footer_description"
  value: text("value").notNull(),
  section: text("section"), // e.g., "newsletter", "footer", "feature_banner"
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Site settings table - for theme and general settings
export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // e.g., "primary_color", "theme_mode", "free_shipping_enabled"
  value: text("value").notNull(),
  type: varchar("type", { length: 20 }).default("text"), // text, color, boolean, number
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Daily verses table
export const siteVerses = pgTable("site_verses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  reference: text("reference").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Admin users table - separate from regular users for security
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Site banners schemas
export const insertSiteBannerSchema = createInsertSchema(siteBanners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Site content schemas
export const insertSiteContentSchema = createInsertSchema(siteContent).omit({
  id: true,
  updatedAt: true,
});

// Site settings schemas
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

// Site verses schemas
export const insertSiteVerseSchema = createInsertSchema(siteVerses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Content cards table - for homepage feature sections
export const contentCards = pgTable("content_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardType: varchar("card_type", { length: 50 }).notNull(), // "feature" or "lifestyle"
  title: text("title"),
  subtitle: text("subtitle"),
  ctaText: text("cta_text"),
  ctaLink: text("cta_link"),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  imageUrl: text("image_url").notNull(),
  position: varchar("position", { length: 20 }).default("center"), // text position: left, right, center
  height: varchar("height", { length: 20 }).default("medium"), // small, medium, large for different card sizes
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Content card images table - for multiple images per card
export const contentCardImages = pgTable("content_card_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardId: varchar("card_id").notNull().references(() => contentCards.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Content cards schemas
export const insertContentCardSchema = createInsertSchema(contentCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentCardImageSchema = createInsertSchema(contentCardImages).omit({
  id: true,
  createdAt: true,
});

// CTA Banner Config table - for the "view all products" banner configuration
export const ctaBannerConfigs = pgTable("cta_banner_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tagLabel: text("tag_label").default("coleção completa"), // Top label like "coleção completa"
  title: text("title").notNull().default("explore toda a coleção"),
  description: text("description").default("descubra peças únicas que combinam fé, estilo e qualidade premium"),
  buttonText: text("button_text").notNull().default("ver todos os produtos"),
  buttonBgColor: text("button_bg_color").default("#ffffff"), // Hex color for button background
  backgroundImageUrl: text("background_image_url"), // URL to uploaded background image
  backgroundImageAlt: text("background_image_alt").default("banner background"),
  isActive: boolean("is_active").default(true), // Only one can be active at a time
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// CTA Banner schemas
export const insertCtaBannerConfigSchema = createInsertSchema(ctaBannerConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// FAQ table - for frequently asked questions
export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 50 }).default("geral"), // "geral", "envio", "produto", "pagamento", "devolucao"
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// FAQ schemas
export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Product installments configuration
export const productInstallmentOptions = pgTable("product_installment_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  installments: integer("installments").notNull(),
  isInterestFree: boolean("is_interest_free").default(true),
  customValue: decimal("custom_value", { precision: 10, scale: 2 }), // Optional custom value per installment
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  productIdIdx: index("product_installment_options_product_idx").on(table.productId),
}));

// Product measurement fields table - defines which measurement fields a product uses
export const productMeasurementFields = pgTable("product_measurement_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  fieldName: text("field_name").notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  productIdIdx: index("product_measurement_fields_product_idx").on(table.productId),
}));

// Product size measurements table - actual measurement values per size
export const productSizeMeasurements = pgTable("product_size_measurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sizeName: varchar("size_name", { length: 10 }).notNull(),
  fieldId: varchar("field_id").notNull().references(() => productMeasurementFields.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  productIdIdx: index("product_size_measurements_product_idx").on(table.productId),
  fieldIdIdx: index("product_size_measurements_field_idx").on(table.fieldId),
}));

// Product measurement field schemas
export const insertProductMeasurementFieldSchema = createInsertSchema(productMeasurementFields).omit({
  id: true,
  createdAt: true,
});

// Product size measurement schemas
export const insertProductSizeMeasurementSchema = createInsertSchema(productSizeMeasurements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Footer pages table - for managing footer content (about, policies, returns, etc)
export const footerPages = pgTable("footer_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // "about", "policies", "returns", "shipping", "privacy"
  title: text("title").notNull(),
  content: text("content").notNull(), // HTML allowed
  description: text("description"), // Short description for meta tags
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Newsletter subscribers table
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  status: text("status").default('active'),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Newsletter settings table
export const newsletterSettings = pgTable("newsletter_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().default("fique por dentro"),
  description: text("description").notNull().default("inscreva-se para receber novidades, lançamentos e conteúdos exclusivos."),
  buttonText: text("button_text").notNull().default("inscrever"),
  disclaimerText: text("disclaimer_text").notNull().default("sem spam. cancele quando quiser."),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Company info table - for managing footer company information (CNPJ, address, copyright)
export const companyInfo = pgTable("company_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  cnpj: text("cnpj").notNull(),
  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zipCode: varchar("zip_code", { length: 9 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: text("email"),
  copyrightYear: integer("copyright_year").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Newsletter schemas
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("E-mail inválido"),
});

export const insertNewsletterSettingsSchema = createInsertSchema(newsletterSettings).omit({
  id: true,
  updatedAt: true,
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSettings = typeof newsletterSettings.$inferSelect;
export type InsertNewsletterSettings = z.infer<typeof insertNewsletterSettingsSchema>;

// Admin user schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

// Footer pages schemas
export const insertFooterPageSchema = createInsertSchema(footerPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Company info schemas
export const insertCompanyInfoSchema = createInsertSchema(companyInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyName: z.string().optional().default(""),
  cnpj: z.string().optional().default(""),
  street: z.string().optional().default(""),
  number: z.string().optional().default(""),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zipCode: z.string().optional().default(""),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

// Orders table - for customer orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(), // Human-readable order number
  
  // Customer information
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerCpf: varchar("customer_cpf", { length: 14 }).notNull(), // Format: 000.000.000-00
  
  // Delivery address
  zipCode: varchar("zip_code", { length: 9 }).notNull(), // Format: 00000-000
  street: text("street").notNull(),
  number: varchar("number", { length: 20 }).notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: varchar("state", { length: 2 }).notNull(), // Format: SP, RJ, etc.
  
  // Order totals
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Payment information - Generic (prepared for any payment gateway)
  // Note: Column names are legacy from previous integration, kept for backward compatibility
  paymentPreferenceId: text("mercado_pago_preference_id"), // Payment session/preference ID
  paymentId: text("mercado_pago_payment_id"), // Payment transaction ID
  paymentStatus: varchar("mercado_pago_payment_status", { length: 50 }), // approved, pending, rejected, etc.
  paymentMethod: text("mercado_pago_payment_method"), // credit_card, pix, boleto, etc.
  paymentTypeId: varchar("mercado_pago_payment_type_id", { length: 50 }), // credit_card, debit_card, ticket, etc.
  paymentInstallments: integer("mercado_pago_installments"), // Number of installments
  
  // Order status
  orderStatus: varchar("order_status", { length: 50 }).default("pending"), // pending, paid, processing, shipped, delivered, cancelled, failed
  
  // Shipping tracking
  trackingCode: varchar("tracking_code", { length: 50 }), // Correios tracking code
  refundReason: text("refund_reason"), // Reason for refund
  shippingMethod: varchar("shipping_method", { length: 100 }), // PAC, SEDEX, etc.
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  
  // Admin management
  internalNotes: text("internal_notes"), // Admin-only notes about the order
  archivedAt: timestamp("archived_at"), // When the order was archived
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp
  
  // Customer tracking information
  customerIp: text("customer_ip"),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type", { length: 50 }), // mobile, tablet, desktop
  browserName: varchar("browser_name", { length: 100 }),
  browserVersion: varchar("browser_version", { length: 50 }),
  osName: varchar("os_name", { length: 100 }),
  osVersion: varchar("os_version", { length: 50 }),
  screenResolution: varchar("screen_resolution", { length: 50 }), // e.g., "1920x1080"
  
  // Verification code - random unique code generated on payment approval for anti-fraud
  verificationCode: varchar("verification_code", { length: 20 }),
  
  // Email timestamps
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at"),
  trackingEmailSentAt: timestamp("tracking_email_sent_at"),
  emailDeliveredAt: timestamp("email_delivered_at"),
  emailOpenedAt: timestamp("email_opened_at"),
  emailComplainedAt: timestamp("email_complained_at"),
  emailFailedAt: timestamp("email_failed_at"),
  emailFailureReason: text("email_failure_reason"),
  
  // Timestamps
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  paidAt: timestamp("paid_at"),
}, (table) => ({
  orderNumberIdx: index("orders_order_number_idx").on(table.orderNumber),
  customerEmailIdx: index("orders_customer_email_idx").on(table.customerEmail),
  orderStatusIdx: index("orders_order_status_idx").on(table.orderStatus),
  paymentPreferenceIdx: index("orders_mp_preference_idx").on(table.paymentPreferenceId),
  subtotalCheck: check("orders_subtotal_check", sql`${table.subtotal} >= 0`),
  shippingCostCheck: check("orders_shipping_cost_check", sql`${table.shippingCost} >= 0`),
  totalAmountCheck: check("orders_total_amount_check", sql`${table.totalAmount} >= 0`),
}));

// Product coupons table - individual coupons per product
export const productCoupons = pgTable("product_coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  discountType: varchar("discount_type", { length: 20 }).default("percentage"), // "percentage" or "fixed"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  productIdIdx: index("product_coupons_product_id_idx").on(table.productId),
  codeIdx: index("product_coupons_code_idx").on(table.code),
  discountValueCheck: check("product_coupons_discount_value_check", sql`${table.discountValue} > 0`),
}));

// Global coupon table - single coupon for free shipping or discounts
export const globalCoupon = pgTable("global_coupon", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  discountType: varchar("discount_type", { length: 20 }).default("percentage"), // "percentage" or "fixed"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  description: text("description"), // e.g., "frete grátis"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  codeIdx: index("global_coupon_code_idx").on(table.code),
  discountValueCheck: check("global_coupon_discount_value_check", sql`${table.discountValue} > 0`),
}));

// Order items table - items in each order
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  
  // Product details at time of purchase (snapshot)
  productName: text("product_name").notNull(),
  productImage: text("product_image").notNull(),
  
  // Variant details
  size: varchar("size", { length: 10 }).notNull(),
  color: text("color").notNull(), // JSON string: {"name":"Preto","hex":"#000000"}
  fabric: text("fabric"), // JSON string: {"name":"Algodão","price":0}
  printPosition: varchar("print_position", { length: 20 }), // "frente" or "costas"
  
  // Pricing
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // unitPrice * quantity
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
  productIdIdx: index("order_items_product_id_idx").on(table.productId),
  unitPriceCheck: check("order_items_unit_price_check", sql`${table.unitPrice} >= 0`),
  quantityCheck: check("order_items_quantity_check", sql`${table.quantity} >= 1`),
  subtotalCheck: check("order_items_subtotal_check", sql`${table.subtotal} >= 0`),
}));

// Order schemas
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
}).extend({
  customerCpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido (use 000.000.000-00)"),
  zipCode: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido (use 00000-000)"),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
  customerEmail: z.string().email("Email inválido"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

// Coupon schemas
export const insertProductCouponSchema = createInsertSchema(productCoupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  code: z.string().min(2).max(50),
  discountValue: z.string().transform(v => parseFloat(v)),
});

export const insertGlobalCouponSchema = createInsertSchema(globalCoupon).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  code: z.string().min(2).max(50),
  discountValue: z.string().transform(v => parseFloat(v)),
});

// Types
export type Color = z.infer<typeof colorSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ReviewImage = typeof reviewImages.$inferSelect;
export type InsertReviewImage = z.infer<typeof insertReviewImageSchema>;
export type ReviewLike = typeof reviewLikes.$inferSelect;
export type InsertReviewLike = z.infer<typeof insertReviewLikeSchema>;
export type ReviewQA = typeof reviewQA.$inferSelect;
export type InsertReviewQA = z.infer<typeof insertReviewQASchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type UpdateUserMeasurements = z.infer<typeof updateUserMeasurementsSchema>;
export type SiteBanner = typeof siteBanners.$inferSelect;
export type InsertSiteBanner = z.infer<typeof insertSiteBannerSchema>;
export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteVerse = typeof siteVerses.$inferSelect;
export type InsertSiteVerse = z.infer<typeof insertSiteVerseSchema>;
export type ContentCard = typeof contentCards.$inferSelect;
export type InsertContentCard = z.infer<typeof insertContentCardSchema>;
export type ContentCardImage = typeof contentCardImages.$inferSelect;
export type InsertContentCardImage = z.infer<typeof insertContentCardImageSchema>;
export type CtaBannerConfig = typeof ctaBannerConfigs.$inferSelect;
export type InsertCtaBannerConfig = z.infer<typeof insertCtaBannerConfigSchema>;
export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type ProductMeasurementField = typeof productMeasurementFields.$inferSelect;
export type InsertProductMeasurementField = z.infer<typeof insertProductMeasurementFieldSchema>;
export type ProductSizeMeasurement = typeof productSizeMeasurements.$inferSelect;
export type InsertProductSizeMeasurement = z.infer<typeof insertProductSizeMeasurementSchema>;
export type CompanyInfo = typeof companyInfo.$inferSelect;
export type InsertCompanyInfo = z.infer<typeof insertCompanyInfoSchema>;
export type AdminProductReview = typeof adminProductReviews.$inferSelect;
export type InsertAdminProductReview = z.infer<typeof insertAdminProductReviewSchema>;
export type ProductCoupon = typeof productCoupons.$inferSelect;
export type InsertProductCoupon = z.infer<typeof insertProductCouponSchema>;
export type GlobalCoupon = typeof globalCoupon.$inferSelect;
export type InsertGlobalCoupon = z.infer<typeof insertGlobalCouponSchema>;

/**
 * Tabela de Pixels de Rastreamento e Scripts
 * 
 * Armazena configurações de pixels de rastreamento (Facebook, Google, TikTok)
 * e scripts customizados para header/body do site.
 * 
 * Facebook Pixel Events rastreados automaticamente:
 * - PageView: Visualização de página
 * - ViewContent: Visualização de produto
 * - AddToCart: Adicionar ao carrinho
 * - RemoveFromCart: Remover do carrinho
 * - InitiateCheckout: Iniciar checkout
 * - AddPaymentInfo: Adicionar info de pagamento
 * - Purchase: Compra concluída
 * - Lead: Cadastro newsletter
 * - Search: Busca de produtos
 * - AddToWishlist: Adicionar aos favoritos
 * - CompleteRegistration: Registro completo
 * 
 * Exemplo de uso:
 * - Facebook Pixel ID: 123456789012345
 * - Google Ads Conversion ID: AW-123456789
 * - TikTok Pixel ID: CXXXXXXXXXXXXXXXXXX
 */
export const trackingPixels = pgTable("tracking_pixels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // ===== FACEBOOK PIXEL =====
  facebookPixelId: text("facebook_pixel_id"), // ID do pixel (ex: 123456789012345)
  facebookPixelEnabled: boolean("facebook_pixel_enabled").default(false),
  facebookTestEventCode: text("facebook_test_event_code"), // Código de teste para debug (ex: TEST12345)
  
  // ===== GOOGLE ADS =====
  googleAdsConversionId: text("google_ads_conversion_id"), // ID de conversão (ex: AW-123456789)
  googleAdsConversionLabel: text("google_ads_conversion_label"), // Label de conversão
  googleAdsEnabled: boolean("google_ads_enabled").default(false),
  
  // ===== GOOGLE ANALYTICS 4 =====
  googleAnalyticsId: text("google_analytics_id"), // ID do GA4 (ex: G-XXXXXXXXXX)
  googleAnalyticsEnabled: boolean("google_analytics_enabled").default(false),
  
  // ===== TIKTOK PIXEL =====
  tiktokPixelId: text("tiktok_pixel_id"), // ID do pixel TikTok
  tiktokPixelEnabled: boolean("tiktok_pixel_enabled").default(false),
  
  // ===== SCRIPTS CUSTOMIZADOS =====
  // Scripts injetados no <head> do site (ex: Hotjar, Clarity, etc)
  headerScripts: text("header_scripts"),
  // Scripts injetados no final do <body> do site
  bodyScripts: text("body_scripts"),
  
  // ===== MERCADO PAGO TRACKING =====
  mercadoPagoTrackingEnabled: boolean("mercado_pago_tracking_enabled").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertTrackingPixelsSchema = createInsertSchema(trackingPixels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TrackingPixels = typeof trackingPixels.$inferSelect;
export type InsertTrackingPixels = z.infer<typeof insertTrackingPixelsSchema>;

// Email templates table - for customizable transactional emails
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateKey: varchar("template_key", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Email templates schemas
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Cookie consent settings
export const paymentBrands = pgTable("payment_brands", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  iconKey: text("icon_key").notNull(),
  category: text("category").notNull().default("card"),
  enabled: boolean("enabled").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertPaymentBrandSchema = createInsertSchema(paymentBrands);
export type PaymentBrand = typeof paymentBrands.$inferSelect;
export type InsertPaymentBrand = z.infer<typeof insertPaymentBrandSchema>;

export const cookieSettings = pgTable("cookie_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enabled: boolean("enabled").default(true),
  title: text("title").default("usamos cookies").notNull(),
  description: text("description").default("utilizamos cookies para melhorar sua experiência de navegação, personalizar conteúdo e analisar nosso tráfego.").notNull(),
  buttonAcceptText: text("button_accept_text").default("aceitar todos").notNull(),
  buttonRejectText: text("button_reject_text").default("recusar").notNull(),
  buttonCustomizeText: text("button_customize_text").default("personalizar").notNull(),
  showCustomizeButton: boolean("show_customize_button").default(false),
  privacyPolicyUrl: text("privacy_policy_url").default("/privacidade"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCookieSettingsSchema = createInsertSchema(cookieSettings).omit({
  id: true,
  updatedAt: true,
});

export type CookieSettings = typeof cookieSettings.$inferSelect;
export type InsertCookieSettings = z.infer<typeof insertCookieSettingsSchema>;
