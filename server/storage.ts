import { 
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Favorite,
  type InsertFavorite,
  type Review,
  type InsertReview,
  type ReviewImage,
  type InsertReviewImage,
  type ReviewLike,
  type InsertReviewLike,
  type ReviewQA,
  type InsertReviewQA,
  type ProductImage,
  type InsertProductImage,
  type UpdateUserMeasurements,
  type SiteBanner,
  type InsertSiteBanner,
  type SiteContent,
  type InsertSiteContent,
  type SiteSetting,
  type InsertSiteSetting,
  type SiteVerse,
  type InsertSiteVerse,
  type ContentCard,
  type InsertContentCard,
  type ContentCardImage,
  type InsertContentCardImage,
  type CtaBannerConfig,
  type InsertCtaBannerConfig,
  type Faq,
  type InsertFaq,
  type AdminUser,
  type InsertAdminUser,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ProductMeasurementField,
  type InsertProductMeasurementField,
  type ProductSizeMeasurement,
  type InsertProductSizeMeasurement,
  type CompanyInfo,
  type InsertCompanyInfo,
  type AdminProductReview,
  type InsertAdminProductReview,
  type ProductCoupon,
  type InsertProductCoupon,
  type GlobalCoupon,
  type InsertGlobalCoupon,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type NewsletterSettings,
  type InsertNewsletterSettings,
  type TrackingPixels,
  type InsertTrackingPixels,
  type EmailTemplate,
  type InsertEmailTemplate,
  type CookieSettings,
  type InsertCookieSettings,
  type PaymentBrand,
  type InsertPaymentBrand,
  users,
  products,
  cartItems,
  favorites,
  reviews,
  reviewImages,
  reviewLikes,
  reviewQA,
  productImages,
  adminProductReviews,
  siteBanners,
  siteContent,
  siteSettings,
  siteVerses,
  contentCards,
  contentCardImages,
  ctaBannerConfigs,
  faqs,
  adminUsers,
  orders,
  orderItems,
  productMeasurementFields,
  productSizeMeasurements,
  companyInfo,
  productCoupons,
  globalCoupon,
  newsletterSubscribers,
  newsletterSettings,
  productInstallmentOptions,
  trackingPixels,
  emailTemplates,
  cookieSettings,
  paymentBrands
} from "@shared/schema";
import { randomUUID } from "crypto";
import { eq, and, or, desc, asc, sql, inArray } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserMeasurements(userId: string, measurements: UpdateUserMeasurements): Promise<User | undefined>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  getProductsWithPresentationImages(): Promise<(Product & { images: string[] })[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductImages(productId: string): Promise<ProductImage[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  addProductImage(image: InsertProductImage): Promise<ProductImage>;
  
  // Cart methods
  getCartItems(userId: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number, userId: string): Promise<CartItem | undefined>;
  removeFromCart(id: string, userId: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  
  // Favorites methods
  getFavorites(userId: string): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, productId: string): Promise<boolean>;
  isFavorite(userId: string, productId: string): Promise<boolean>;
  
  // Review methods
  getReviews(productId: string): Promise<Review[]>;
  getReview(id: string): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  addReviewImage(image: InsertReviewImage): Promise<ReviewImage>;
  getReviewImages(reviewId: string): Promise<ReviewImage[]>;
  likeReview(like: InsertReviewLike): Promise<ReviewLike>;
  unlikeReview(userId: string, reviewId: string): Promise<boolean>;
  getReviewLikes(reviewId: string): Promise<ReviewLike[]>;
  addReviewQA(qa: InsertReviewQA): Promise<ReviewQA>;
  getReviewQA(reviewId: string): Promise<ReviewQA[]>;

  // Admin product review methods
  getAdminProductReviews(productId: string): Promise<AdminProductReview[]>;
  getAdminProductReview(id: string): Promise<AdminProductReview | undefined>;
  createAdminProductReview(review: InsertAdminProductReview): Promise<AdminProductReview>;
  updateAdminProductReview(id: string, review: Partial<InsertAdminProductReview>): Promise<AdminProductReview | undefined>;
  deleteAdminProductReview(id: string): Promise<boolean>;

  // Admin - Site banner methods
  getSiteBanners(): Promise<SiteBanner[]>;
  getSiteBanner(id: string): Promise<SiteBanner | undefined>;
  createSiteBanner(banner: InsertSiteBanner): Promise<SiteBanner>;
  updateSiteBanner(id: string, banner: Partial<InsertSiteBanner>): Promise<SiteBanner | undefined>;
  deleteSiteBanner(id: string): Promise<boolean>;

  // Admin - Site content methods
  getSiteContent(): Promise<SiteContent[]>;
  getSiteContentByKey(key: string): Promise<SiteContent | undefined>;
  upsertSiteContent(content: InsertSiteContent): Promise<SiteContent>;
  deleteSiteContent(key: string): Promise<boolean>;

  // Admin - Site settings methods
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSettingByKey(key: string): Promise<SiteSetting | undefined>;
  upsertSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting>;

  // Admin - Site verses methods
  getSiteVerses(): Promise<SiteVerse[]>;
  getActiveSiteVerse(): Promise<SiteVerse | undefined>;
  createSiteVerse(verse: InsertSiteVerse): Promise<SiteVerse>;
  updateSiteVerse(id: string, verse: Partial<InsertSiteVerse>): Promise<SiteVerse | undefined>;
  deleteSiteVerse(id: string): Promise<boolean>;

  // Admin - Content cards methods
  getContentCards(): Promise<ContentCard[]>;
  getContentCard(id: string): Promise<ContentCard | undefined>;
  createContentCard(card: InsertContentCard): Promise<ContentCard>;
  updateContentCard(id: string, card: Partial<InsertContentCard>): Promise<ContentCard | undefined>;
  deleteContentCard(id: string): Promise<boolean>;
  
  // Content card images
  getContentCardImages(cardId: string): Promise<ContentCardImage[]>;
  addContentCardImage(image: InsertContentCardImage): Promise<ContentCardImage>;
  deleteContentCardImage(id: string): Promise<boolean>;

  // Admin - CTA Banner config methods
  getCtaBannerConfig(): Promise<CtaBannerConfig | undefined>;
  upsertCtaBannerConfig(config: Partial<InsertCtaBannerConfig>): Promise<CtaBannerConfig>;

  // Installment Options methods
  getInstallmentOptions(productId: string): Promise<any[]>;
  updateInstallmentOptions(productId: string, options: any[]): Promise<void>;

  // Admin - FAQ methods
  getFaqs(): Promise<Faq[]>;
  getActiveFaqs(): Promise<Faq[]>;
  getFaq(id: string): Promise<Faq | undefined>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<boolean>;

  // Admin - Product management
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductImage(id: string, image: Partial<InsertProductImage>): Promise<ProductImage | undefined>;
  deleteProductImage(id: string): Promise<boolean>;

  // Admin user authentication
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  updateAdminLastLogin(username: string): Promise<void>;

  // Orders methods
  createOrder(orderData: Omit<InsertOrder, 'id' | 'createdAt' | 'updatedAt' | 'paidAt'>, items: Omit<InsertOrderItem, 'id' | 'createdAt' | 'orderId'>[]): Promise<Order & { items: OrderItem[] }>;
  getOrders(options?: { search?: string; status?: string; filter?: 'all' | 'archived' | 'deleted'; sortField?: string; sortDirection?: 'asc' | 'desc' }): Promise<Order[]>;
  getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined>;
  getOrderByNumberOrTracking(identifier: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  getOrderByPaymentPreferenceId(preferenceId: string): Promise<Order | undefined>;
  updateOrderPaymentStatus(id: string, paymentStatus: string, paymentId?: string, paymentMethod?: string, paymentTypeId?: string, installments?: number): Promise<Order | undefined>;
  updateOrderPreference(id: string, preferenceId: string): Promise<Order | undefined>;
  markOrderAsPaid(id: string): Promise<Order | undefined>;
  updateOrder(id: string, data: Partial<Pick<Order, 'customerName' | 'customerEmail' | 'customerPhone' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'zipCode' | 'internalNotes' | 'orderStatus' | 'trackingCode' | 'shippingMethod' | 'estimatedDeliveryDate' | 'actualDeliveryDate' | 'confirmationEmailSentAt' | 'trackingEmailSentAt' | 'emailDeliveredAt' | 'emailOpenedAt' | 'emailComplainedAt' | 'emailFailedAt' | 'emailFailureReason'>>): Promise<Order | undefined>;
  archiveOrder(id: string): Promise<Order | undefined>;
  unarchiveOrder(id: string): Promise<Order | undefined>;
  softDeleteOrder(id: string): Promise<Order | undefined>;
  restoreOrder(id: string): Promise<Order | undefined>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  // Product measurement methods
  getProductMeasurementFields(productId: string): Promise<ProductMeasurementField[]>;
  createProductMeasurementField(field: InsertProductMeasurementField): Promise<ProductMeasurementField>;
  updateProductMeasurementField(id: string, data: Partial<InsertProductMeasurementField>): Promise<ProductMeasurementField | undefined>;
  deleteProductMeasurementField(id: string): Promise<boolean>;
  getProductSizeMeasurements(productId: string): Promise<ProductSizeMeasurement[]>;
  upsertProductSizeMeasurement(measurement: InsertProductSizeMeasurement): Promise<ProductSizeMeasurement>;
  deleteProductSizeMeasurement(id: string): Promise<boolean>;
  deleteProductSizeMeasurementsByField(fieldId: string): Promise<boolean>;
  // Newsletter methods
  getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  addNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getNewsletterSettings(): Promise<NewsletterSettings | undefined>;
  upsertNewsletterSettings(settings: Partial<InsertNewsletterSettings>): Promise<NewsletterSettings>;

  // Métodos de Tracking Pixels (pixels de rastreamento)
  getTrackingPixels(): Promise<TrackingPixels | undefined>;
  updateTrackingPixels(data: Partial<InsertTrackingPixels>): Promise<TrackingPixels>;

  // Email template methods
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplateByKey(templateKey: string): Promise<EmailTemplate | undefined>;
  upsertEmailTemplate(templateKey: string, data: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;

  // Cookie settings methods
  getCookieSettings(): Promise<CookieSettings | undefined>;
  updateCookieSettings(data: Partial<InsertCookieSettings>): Promise<CookieSettings>;

  // Payment brands methods
  getPaymentBrands(): Promise<PaymentBrand[]>;
  getEnabledPaymentBrands(): Promise<PaymentBrand[]>;
  upsertPaymentBrands(brands: InsertPaymentBrand[]): Promise<PaymentBrand[]>;
}

export class DbStorage implements IStorage {
  // Newsletter methods
  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    try {
      return await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
    } catch (e) {
      console.error("Error getting subscribers:", e);
      return [];
    }
  }

  async addNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const result = await db.insert(newsletterSubscribers).values(subscriber).returning();
    return result[0];
  }

  async getNewsletterSettings(): Promise<NewsletterSettings | undefined> {
    try {
      const result = await db.select().from(newsletterSettings).limit(1);
      return result[0];
    } catch (e) {
      console.error("Error getting newsletter settings:", e);
      return undefined;
    }
  }

  async updateNewsletterSubscriberStatus(id: string, status: string): Promise<NewsletterSubscriber | undefined> {
    const result = await db.update(newsletterSubscribers)
      .set({ status })
      .where(eq(newsletterSubscribers.id, id))
      .returning();
    return result[0];
  }

  async deleteNewsletterSubscriber(id: string): Promise<boolean> {
    const result = await db.delete(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, id))
      .returning();
    return result.length > 0;
  }

  async upsertNewsletterSettings(settings: Partial<InsertNewsletterSettings>): Promise<NewsletterSettings> {
    const existing = await this.getNewsletterSettings();
    if (existing) {
      const result = await db.update(newsletterSettings)
        .set({ ...settings, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(newsletterSettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(newsletterSettings)
        .values({
          title: settings.title || "fique por dentro",
          description: settings.description || "inscreva-se para receber novidades, lançamentos e conteúdos exclusivos.",
          buttonText: settings.buttonText || "inscrever",
        } as any)
        .returning();
      return result[0];
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserMeasurements(userId: string, measurements: UpdateUserMeasurements): Promise<User | undefined> {
    const result = await db.update(users)
      .set(measurements)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Helper to parse product colors from JSON string
  private parseProductColors(product: Product): Product {
    if (!product.colors) {
      return product;
    }
    
    if (typeof product.colors === 'string') {
      try {
        const parsed = JSON.parse(product.colors);
        return {
          ...product,
          colors: parsed
        };
      } catch (error) {
        console.error("❌ [parseProductColors] Failed to parse colors JSON:", (error as Error).message);
        return product;
      }
    }
    
    // Handle legacy array format (should not happen with current schema, but kept for safety)
    const colorsAny = product.colors as any;
    if (Array.isArray(colorsAny)) {
      // Check if it's legacy format (array of hex strings) and convert to new format
      if (colorsAny.length > 0 && typeof colorsAny[0] === 'string') {
        const convertedColors = colorsAny.map((hex: string) => ({
          name: hex,
          hex: hex
        }));
        return {
          ...product,
          colors: convertedColors as any
        };
      }
    }
    
    return product;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    const results = await db.select().from(products)
      .where(eq(products.status, "published"))
      .orderBy(desc(products.displayOrder));
    return results.map((p: Product) => this.parseProductColors(p));
  }

  async getAllProducts(): Promise<Product[]> {
    const results = await db.select().from(products)
      .orderBy(desc(products.displayOrder));
    return results.map((p: Product) => this.parseProductColors(p));
  }

  async getProductsWithPresentationImages(): Promise<(Product & { images: string[] })[]> {
    const [productsList, allImages] = await Promise.all([
      db.select().from(products)
        .where(eq(products.status, "published"))
        .orderBy(desc(products.displayOrder)),
      db.select().from(productImages).where(eq(productImages.imageType, "presentation")).orderBy(productImages.sortOrder)
    ]);
    
    const imagesByProductId = new Map<string, string[]>();
    for (const img of allImages) {
      const existing = imagesByProductId.get(img.productId) || [];
      existing.push(img.imageUrl);
      imagesByProductId.set(img.productId, existing);
    }
    
    return productsList.map((p: Product) => ({
      ...this.parseProductColors(p),
      images: imagesByProductId.get(p.id) || []
    }));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products)
      .where(and(eq(products.id, id), eq(products.status, "published")))
      .limit(1);
    return result[0] ? this.parseProductColors(result[0]) : undefined;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products)
      .where(eq(products.id, id))
      .limit(1);
    return result[0] ? this.parseProductColors(result[0]) : undefined;
  }

  async getProductBySlugOrSku(identifier: string): Promise<Product | undefined> {
    const result = await db.select().from(products)
      .where(and(
        or(eq(products.slug, identifier), eq(products.sku, identifier)),
        eq(products.status, "published")
      ))
      .limit(1);
    return result[0] ? this.parseProductColors(result[0]) : undefined;
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    return await db.select().from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.sortOrder);
  }

  async getProductPresentationImages(productId: string): Promise<ProductImage[]> {
    return await db.select().from(productImages)
      .where(and(
        eq(productImages.productId, productId),
        eq(productImages.imageType, "presentation")
      ))
      .orderBy(productImages.sortOrder);
  }

  async getProductCarouselImages(productId: string, color?: string): Promise<ProductImage[]> {
    const conditions = [
      eq(productImages.productId, productId),
      eq(productImages.imageType, "carousel")
    ];
    
    if (color) {
      conditions.push(eq(productImages.color, color));
    }
    
    return await db.select().from(productImages)
      .where(and(...conditions))
      .orderBy(productImages.sortOrder);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Ensure colors is properly stored as text (already handled by schema transform)
    const result = await db.insert(products).values(product as any).returning();
    return this.parseProductColors(result[0]);
  }

  async addProductImage(image: InsertProductImage): Promise<ProductImage> {
    const result = await db.insert(productImages).values(image).returning();
    return result[0];
  }

  // Cart methods
  async getCartItems(userId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems)
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Try to update existing item first
    const existing = await db.select().from(cartItems)
      .where(and(
        eq(cartItems.userId, item.userId),
        eq(cartItems.productId, item.productId),
        eq(cartItems.size, item.size),
        eq(cartItems.color, item.color)
      )).limit(1);

    if (existing[0]) {
      const result = await db.update(cartItems)
        .set({ quantity: existing[0].quantity + (item.quantity || 1) })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await db.insert(cartItems).values(item).returning();
    return result[0];
  }

  async updateCartItem(id: string, quantity: number, userId: string): Promise<CartItem | undefined> {
    const result = await db.update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .returning();
    return result[0];
  }

  async removeFromCart(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId)).returning();
    return result.length > 0;
  }

  // Favorites methods
  async getFavorites(userId: string): Promise<Favorite[]> {
    return await db.select().from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const result = await db.insert(favorites).values(favorite).returning();
    return result[0];
  }

  async removeFavorite(userId: string, productId: string): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
      .returning();
    return result.length > 0;
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const result = await db.select().from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
      .limit(1);
    return result.length > 0;
  }

  // Review methods
  async getReviews(productId: string): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReview(id: string): Promise<Review | undefined> {
    const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    return result[0];
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  async addReviewImage(image: InsertReviewImage): Promise<ReviewImage> {
    const result = await db.insert(reviewImages).values(image).returning();
    return result[0];
  }

  async getReviewImages(reviewId: string): Promise<ReviewImage[]> {
    return await db.select().from(reviewImages)
      .where(eq(reviewImages.reviewId, reviewId))
      .orderBy(reviewImages.createdAt);
  }

  async likeReview(like: InsertReviewLike): Promise<ReviewLike> {
    const result = await db.insert(reviewLikes).values(like).returning();
    return result[0];
  }

  async unlikeReview(userId: string, reviewId: string): Promise<boolean> {
    const result = await db.delete(reviewLikes)
      .where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)))
      .returning();
    return result.length > 0;
  }

  async getReviewLikes(reviewId: string): Promise<ReviewLike[]> {
    return await db.select().from(reviewLikes)
      .where(eq(reviewLikes.reviewId, reviewId))
      .orderBy(reviewLikes.createdAt);
  }

  async addReviewQA(qa: InsertReviewQA): Promise<ReviewQA> {
    const result = await db.insert(reviewQA).values(qa).returning();
    return result[0];
  }

  async getReviewQA(reviewId: string): Promise<ReviewQA[]> {
    return await db.select().from(reviewQA)
      .where(eq(reviewQA.reviewId, reviewId))
      .orderBy(reviewQA.createdAt);
  }

  // Admin product review methods
  async getAdminProductReviews(productId: string): Promise<AdminProductReview[]> {
    return await db.select().from(adminProductReviews)
      .where(eq(adminProductReviews.productId, productId))
      .orderBy(adminProductReviews.sortOrder, adminProductReviews.createdAt);
  }

  async getAdminProductReview(id: string): Promise<AdminProductReview | undefined> {
    const result = await db.select().from(adminProductReviews)
      .where(eq(adminProductReviews.id, id))
      .limit(1);
    return result[0];
  }

  async createAdminProductReview(review: InsertAdminProductReview): Promise<AdminProductReview> {
    const result = await db.insert(adminProductReviews).values(review).returning();
    return result[0];
  }

  async updateAdminProductReview(id: string, review: Partial<InsertAdminProductReview>): Promise<AdminProductReview | undefined> {
    const result = await db.update(adminProductReviews)
      .set({ ...review, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(adminProductReviews.id, id))
      .returning();
    return result[0];
  }

  async deleteAdminProductReview(id: string): Promise<boolean> {
    const result = await db.delete(adminProductReviews)
      .where(eq(adminProductReviews.id, id))
      .returning();
    return result.length > 0;
  }

  // Admin - Site banner methods
  async getSiteBanners(): Promise<SiteBanner[]> {
    return await db.select().from(siteBanners).orderBy(desc(siteBanners.sortOrder));
  }

  async getSiteBanner(id: string): Promise<SiteBanner | undefined> {
    const result = await db.select().from(siteBanners).where(eq(siteBanners.id, id)).limit(1);
    return result[0];
  }

  async createSiteBanner(banner: InsertSiteBanner): Promise<SiteBanner> {
    const result = await db.insert(siteBanners).values(banner).returning();
    return result[0];
  }

  async updateSiteBanner(id: string, banner: Partial<InsertSiteBanner>): Promise<SiteBanner | undefined> {
    const result = await db.update(siteBanners)
      .set({ ...banner, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(siteBanners.id, id))
      .returning();
    return result[0];
  }

  async deleteSiteBanner(id: string): Promise<boolean> {
    const result = await db.delete(siteBanners).where(eq(siteBanners.id, id)).returning();
    return result.length > 0;
  }

  // Admin - Site content methods
  async getSiteContent(): Promise<SiteContent[]> {
    return await db.select().from(siteContent);
  }

  async getSiteContentByKey(key: string): Promise<SiteContent | undefined> {
    const result = await db.select().from(siteContent).where(eq(siteContent.key, key)).limit(1);
    return result[0];
  }

  async upsertSiteContent(content: InsertSiteContent): Promise<SiteContent> {
    const result = await db.insert(siteContent)
      .values(content)
      .onConflictDoUpdate({
        target: siteContent.key,
        set: { value: content.value, updatedAt: sql`CURRENT_TIMESTAMP` }
      })
      .returning();
    return result[0];
  }

  async deleteSiteContent(key: string): Promise<boolean> {
    const result = await db.delete(siteContent).where(eq(siteContent.key, key)).returning();
    return result.length > 0;
  }

  // Admin - Site settings methods
  async getSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async getSiteSettingByKey(key: string): Promise<SiteSetting | undefined> {
    const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return result[0];
  }

  async upsertSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting> {
    const result = await db.insert(siteSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: setting.value, type: setting.type, updatedAt: sql`CURRENT_TIMESTAMP` }
      })
      .returning();
    return result[0];
  }

  // Admin - Site verses methods
  async getSiteVerses(): Promise<SiteVerse[]> {
    return await db.select().from(siteVerses).orderBy(desc(siteVerses.createdAt));
  }

  async getActiveSiteVerse(): Promise<SiteVerse | undefined> {
    const result = await db.select().from(siteVerses)
      .where(eq(siteVerses.isActive, true))
      .orderBy(desc(siteVerses.createdAt))
      .limit(1);
    return result[0];
  }

  async createSiteVerse(verse: InsertSiteVerse): Promise<SiteVerse> {
    const result = await db.insert(siteVerses).values(verse).returning();
    return result[0];
  }

  async updateSiteVerse(id: string, verse: Partial<InsertSiteVerse>): Promise<SiteVerse | undefined> {
    const result = await db.update(siteVerses)
      .set({ ...verse, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(siteVerses.id, id))
      .returning();
    return result[0];
  }

  async deleteSiteVerse(id: string): Promise<boolean> {
    const result = await db.delete(siteVerses).where(eq(siteVerses.id, id)).returning();
    return result.length > 0;
  }

  // Admin - Content cards methods
  async getContentCards(): Promise<ContentCard[]> {
    return await db.select().from(contentCards).orderBy(contentCards.sortOrder);
  }

  async getContentCard(id: string): Promise<ContentCard | undefined> {
    const result = await db.select().from(contentCards).where(eq(contentCards.id, id)).limit(1);
    return result[0];
  }

  async createContentCard(card: InsertContentCard): Promise<ContentCard> {
    const result = await db.insert(contentCards).values(card).returning();
    return result[0];
  }

  async updateContentCard(id: string, card: Partial<InsertContentCard>): Promise<ContentCard | undefined> {
    const result = await db.update(contentCards)
      .set({ ...card, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(contentCards.id, id))
      .returning();
    return result[0];
  }

  async deleteContentCard(id: string): Promise<boolean> {
    const result = await db.delete(contentCards).where(eq(contentCards.id, id)).returning();
    return result.length > 0;
  }

  async getContentCardImages(cardId: string): Promise<ContentCardImage[]> {
    return await db.select().from(contentCardImages)
      .where(eq(contentCardImages.cardId, cardId))
      .orderBy(contentCardImages.sortOrder);
  }

  async addContentCardImage(image: InsertContentCardImage): Promise<ContentCardImage> {
    const result = await db.insert(contentCardImages).values(image).returning();
    return result[0];
  }

  async deleteContentCardImage(id: string): Promise<boolean> {
    const result = await db.delete(contentCardImages).where(eq(contentCardImages.id, id)).returning();
    return result.length > 0;
  }

  // Admin - CTA Banner config methods
  async getCtaBannerConfig(): Promise<CtaBannerConfig | undefined> {
    try {
      const result = await db.select().from(ctaBannerConfigs)
        .where(eq(ctaBannerConfigs.isActive, true))
        .orderBy(desc(ctaBannerConfigs.updatedAt))
        .limit(1);
      return result[0];
    } catch (e) {
      console.error("Error getting CTA banner config:", e);
      return undefined;
    }
  }

  async upsertCtaBannerConfig(config: Partial<InsertCtaBannerConfig>): Promise<CtaBannerConfig> {
    const existing = await this.getCtaBannerConfig();
    if (existing) {
      const result = await db.update(ctaBannerConfigs)
        .set({ ...config, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(ctaBannerConfigs.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(ctaBannerConfigs)
        .values({ ...config, isActive: true })
        .returning();
      return result[0];
    }
  }

  // Installment Options methods
  async getInstallmentOptions(productId: string): Promise<any[]> {
    return await db.select().from(productInstallmentOptions)
      .where(eq(productInstallmentOptions.productId, productId))
      .orderBy(asc(productInstallmentOptions.installments));
  }

  async updateInstallmentOptions(productId: string, options: any[]): Promise<void> {
    await db.delete(productInstallmentOptions).where(eq(productInstallmentOptions.productId, productId));
    if (options && options.length > 0) {
      await db.insert(productInstallmentOptions).values(
        options.map(opt => ({
          productId,
          installments: opt.installments,
          isInterestFree: opt.isInterestFree,
          customValue: opt.customValue?.toString() || null,
        }))
      );
    }
  }

  // Admin - FAQ methods
  async getFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs).orderBy(faqs.category, faqs.sortOrder);
  }

  async getActiveFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs)
      .where(eq(faqs.isActive, true))
      .orderBy(faqs.category, faqs.sortOrder);
  }

  async getFaq(id: string): Promise<Faq | undefined> {
    const result = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
    return result[0];
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const result = await db.insert(faqs).values(faq).returning();
    return result[0];
  }

  async updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq | undefined> {
    const result = await db.update(faqs)
      .set({ ...faq, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(faqs.id, id))
      .returning();
    return result[0];
  }

  async deleteFaq(id: string): Promise<boolean> {
    const result = await db.delete(faqs).where(eq(faqs.id, id)).returning();
    return result.length > 0;
  }

  // Admin - Product management
  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const updateData = { ...product, updatedAt: sql`CURRENT_TIMESTAMP` };
    // Convert rating to string if it's a number to satisfy PG decimal type
    if (typeof updateData.rating === 'number') {
      (updateData as any).rating = updateData.rating.toString();
    }
    const result = await db.update(products)
      .set(updateData as any)
      .where(eq(products.id, id))
      .returning();
    
    return result[0] ? this.parseProductColors(result[0]) : undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async updateProductImage(id: string, image: Partial<InsertProductImage>): Promise<ProductImage | undefined> {
    const result = await db.update(productImages)
      .set(image)
      .where(eq(productImages.id, id))
      .returning();
    return result[0];
  }

  async deleteProductImage(id: string): Promise<boolean> {
    const result = await db.delete(productImages).where(eq(productImages.id, id)).returning();
    return result.length > 0;
  }

  // Admin user authentication
  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
    return result[0];
  }

  async updateAdminLastLogin(username: string): Promise<void> {
    await db.update(adminUsers)
      .set({ lastLogin: sql`CURRENT_TIMESTAMP` })
      .where(eq(adminUsers.username, username));
  }

  // Orders methods
  async createOrder(orderData: Omit<InsertOrder, 'id' | 'createdAt' | 'updatedAt' | 'paidAt'>, items: Omit<InsertOrderItem, 'id' | 'createdAt' | 'orderId'>[]): Promise<Order & { items: OrderItem[] }> {
    const [order] = await db.insert(orders).values(orderData as any).returning();
    
    const orderItemsData = items.map(item => ({
      ...item,
      orderId: order.id
    }));
    
    const createdItems = await db.insert(orderItems).values(orderItemsData as any).returning();
    
    return {
      ...order,
      items: createdItems
    };
  }

  async getOrders(options?: { 
    search?: string; 
    status?: string; 
    filter?: 'all' | 'archived' | 'deleted' | 'shipped' | 'delivered' | 'refunded'; 
    sortField?: string; 
    sortDirection?: 'asc' | 'desc' 
  }): Promise<Order[]> {
    const conditions: any[] = [];
    
    // Aplicar filtros baseados no tipo
    if (options?.filter === 'archived') {
      conditions.push(sql`${orders.archivedAt} IS NOT NULL AND ${orders.deletedAt} IS NULL`);
    } else if (options?.filter === 'deleted') {
      conditions.push(sql`${orders.deletedAt} IS NOT NULL`);
    } else if (options?.filter === 'shipped') {
      conditions.push(eq(orders.orderStatus, 'shipped'), sql`${orders.archivedAt} IS NULL AND ${orders.deletedAt} IS NULL`);
    } else if (options?.filter === 'delivered') {
      conditions.push(eq(orders.orderStatus, 'delivered'), sql`${orders.archivedAt} IS NULL AND ${orders.deletedAt} IS NULL`);
    } else if (options?.filter === 'refunded') {
      conditions.push(eq(orders.orderStatus, 'refunded'), sql`${orders.archivedAt} IS NULL AND ${orders.deletedAt} IS NULL`);
    } else {
      // 'all' - mostrar apenas não arquivados e não deletados
      conditions.push(sql`${orders.archivedAt} IS NULL AND ${orders.deletedAt} IS NULL`);
    }
    
    // Aplicar busca se fornecida
    if (options?.search && options.search.trim()) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      
      // Buscar em itens por SKU
      const itemsWithSkuMatch = await db.select({ orderId: orderItems.orderId })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(sql`LOWER(${products.sku}) LIKE ${searchTerm}`);
      
      const orderIdsFromSku = itemsWithSkuMatch.map((i: { orderId: string }) => i.orderId);

      const searchConditions = [
        sql`LOWER(${orders.orderNumber}) LIKE ${searchTerm}`,
        sql`LOWER(${orders.customerName}) LIKE ${searchTerm}`,
        sql`LOWER(${orders.customerEmail}) LIKE ${searchTerm}`,
        sql`LOWER(${orders.customerCpf}) LIKE ${searchTerm}`,
        sql`LOWER(${orders.customerPhone}) LIKE ${searchTerm}`,
        sql`LOWER(${orders.city}) LIKE ${searchTerm}`,
        sql`LOWER(${orders.state}) LIKE ${searchTerm}`
      ];

      if (orderIdsFromSku.length > 0) {
        searchConditions.push(inArray(orders.id, orderIdsFromSku));
      }

      conditions.push(sql`(${sql.join(searchConditions, sql` OR `)})`);
    }
    
    // Aplicar filtro de status se fornecido
    if (options?.status && options.status !== 'all') {
      if (options.status === 'paid') {
        // Pedidos pagos devem ter o status de pagamento aprovado no Mercado Pago
        // Independentemente do status do pedido (paid, shipped, delivered)
        conditions.push(eq(orders.paymentStatus, 'approved'));
      } else {
        // Se o status for diferente de 'paid', filtramos estritamente pelo status do pedido
        conditions.push(eq(orders.orderStatus, options.status));
      }
    }
    
    // Aplicar ordenação
    const sortFieldMap: Record<string, any> = {
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      createdAt: orders.createdAt,
      totalAmount: orders.totalAmount,
      orderStatus: orders.orderStatus,
      paymentStatus: orders.paymentStatus,
    };
    
    const sortField = options?.sortField && sortFieldMap[options.sortField] ? options.sortField : 'createdAt';
    const sortDirection = options?.sortDirection === 'asc' ? asc : desc;
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const result = await db.select()
      .from(orders)
      .where(whereClause)
      .orderBy(sortDirection(sortFieldMap[sortField]));
    
    return result;
  }

  async getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return undefined;
    
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    
    return {
      ...order,
      items
    };
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    return order;
  }

  async getOrderByNumberOrTracking(identifier: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const [order] = await db.select()
      .from(orders)
      .where(
        sql`${orders.orderNumber} = ${identifier} OR ${orders.trackingCode} = ${identifier}`
      )
      .limit(1);
    
    if (!order) return undefined;
    
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    
    return {
      ...order,
      items
    };
  }

  async getOrderByPaymentPreferenceId(preferenceId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.paymentPreferenceId, preferenceId)).limit(1);
    return order;
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: string, paymentId?: string, paymentMethod?: string, paymentTypeId?: string, installments?: number): Promise<Order | undefined> {
    const updateData: any = {
      paymentStatus: paymentStatus,
      updatedAt: sql`CURRENT_TIMESTAMP`
    };

    if (paymentId) {
      updateData.paymentId = paymentId;
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (paymentTypeId) {
      updateData.paymentTypeId = paymentTypeId;
    }

    if (installments !== undefined) {
      updateData.paymentInstallments = installments;
    }

    if (paymentStatus === 'approved') {
      updateData.orderStatus = 'paid';
      updateData.paidAt = sql`CURRENT_TIMESTAMP`;
      const existingOrder = await this.getOrder(id);
      if (!existingOrder?.verificationCode) {
        updateData.verificationCode = this.generateVerificationCode();
      }
    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
      updateData.orderStatus = 'failed';
    }

    const [updated] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Atualiza o ID da preferência do Mercado Pago no pedido.
   * Chamado após criar a preferência de pagamento no MP.
   */
  async updateOrderPreference(id: string, preferenceId: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({
        paymentPreferenceId: preferenceId,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Marca um pedido como pago, atualizando o status e a data de pagamento.
   * Chamado quando o webhook confirma que o pagamento foi aprovado.
   */
  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async markOrderAsPaid(id: string): Promise<Order | undefined> {
    const existingOrder = await this.getOrder(id);
    const updateData: any = {
      orderStatus: 'paid',
      paidAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`
    };
    if (!existingOrder?.verificationCode) {
      updateData.verificationCode = this.generateVerificationCode();
    }
    const [updated] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    
    return updated;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return items;
  }

  async updateOrder(id: string, data: Partial<Pick<Order, 'customerName' | 'customerEmail' | 'customerPhone' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'zipCode' | 'internalNotes' | 'orderStatus' | 'trackingCode' | 'refundReason' | 'actualDeliveryDate' | 'confirmationEmailSentAt' | 'trackingEmailSentAt' | 'emailDeliveredAt' | 'emailOpenedAt' | 'emailComplainedAt' | 'emailFailedAt' | 'emailFailureReason'>>): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({
        ...data,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updated;
  }

  async archiveOrder(id: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({
        archivedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updated;
  }

  async unarchiveOrder(id: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({
        archivedAt: null,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updated;
  }

  async softDeleteOrder(id: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updated;
  }

  async restoreOrder(id: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({
        deletedAt: null,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updated;
  }

  async hardDeleteOrder(id: string): Promise<boolean> {
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    const result = await db.delete(orders).where(eq(orders.id, id));
    return true;
  }

  // Product measurement methods
  async getProductMeasurementFields(productId: string): Promise<ProductMeasurementField[]> {
    return await db.select().from(productMeasurementFields)
      .where(eq(productMeasurementFields.productId, productId))
      .orderBy(productMeasurementFields.sortOrder);
  }

  async createProductMeasurementField(field: InsertProductMeasurementField): Promise<ProductMeasurementField> {
    const result = await db.insert(productMeasurementFields).values(field).returning();
    return result[0];
  }

  async updateProductMeasurementField(id: string, data: Partial<InsertProductMeasurementField>): Promise<ProductMeasurementField | undefined> {
    const result = await db.update(productMeasurementFields)
      .set(data)
      .where(eq(productMeasurementFields.id, id))
      .returning();
    return result[0];
  }

  async deleteProductMeasurementField(id: string): Promise<boolean> {
    // First delete all measurements for this field
    await db.delete(productSizeMeasurements).where(eq(productSizeMeasurements.fieldId, id));
    // Then delete the field itself
    const result = await db.delete(productMeasurementFields).where(eq(productMeasurementFields.id, id)).returning();
    return result.length > 0;
  }

  async getProductSizeMeasurements(productId: string): Promise<ProductSizeMeasurement[]> {
    return await db.select().from(productSizeMeasurements)
      .where(eq(productSizeMeasurements.productId, productId));
  }

  async upsertProductSizeMeasurement(measurement: InsertProductSizeMeasurement): Promise<ProductSizeMeasurement> {
    // Check if measurement already exists for this product/size/field combination
    const existing = await db.select().from(productSizeMeasurements)
      .where(and(
        eq(productSizeMeasurements.productId, measurement.productId),
        eq(productSizeMeasurements.sizeName, measurement.sizeName),
        eq(productSizeMeasurements.fieldId, measurement.fieldId)
      ))
      .limit(1);

    if (existing[0]) {
      // Update existing
      const result = await db.update(productSizeMeasurements)
        .set({ value: measurement.value, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(productSizeMeasurements.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new
      const result = await db.insert(productSizeMeasurements).values(measurement).returning();
      return result[0];
    }
  }

  async deleteProductSizeMeasurement(id: string): Promise<boolean> {
    const result = await db.delete(productSizeMeasurements).where(eq(productSizeMeasurements.id, id)).returning();
    return result.length > 0;
  }

  async deleteProductSizeMeasurementsByField(fieldId: string): Promise<boolean> {
    const result = await db.delete(productSizeMeasurements).where(eq(productSizeMeasurements.fieldId, fieldId)).returning();
    return result.length > 0;
  }

  async getCompanyInfo(): Promise<CompanyInfo | undefined> {
    const result = await db.select().from(companyInfo).limit(1);
    return result[0];
  }

  async updateCompanyInfo(data: Partial<InsertCompanyInfo>): Promise<CompanyInfo> {
    const existing = await this.getCompanyInfo();
    if (existing) {
      const result = await db.update(companyInfo).set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(companyInfo.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(companyInfo).values(data as InsertCompanyInfo).returning();
      return result[0];
    }
  }

  // Coupon methods
  async getProductCoupon(productId: string): Promise<ProductCoupon | undefined> {
    const coupons = await db.select().from(productCoupons)
      .where(and(
        eq(productCoupons.productId, productId),
        eq(productCoupons.isActive, true)
      ))
      .limit(1);
    return coupons[0];
  }

  async createProductCoupon(coupon: InsertProductCoupon): Promise<ProductCoupon> {
    const result = await db.insert(productCoupons).values({
      ...coupon,
      discountValue: String(coupon.discountValue)
    } as any).returning();
    return result[0];
  }

  async updateProductCoupon(id: string, data: Partial<InsertProductCoupon>): Promise<ProductCoupon | undefined> {
    const result = await db.update(productCoupons)
      .set({ 
        ...data,
        ...(data.discountValue && { discountValue: String(data.discountValue) }),
        updatedAt: sql`CURRENT_TIMESTAMP` 
      } as any)
      .where(eq(productCoupons.id, id))
      .returning();
    return result[0];
  }

  async deleteProductCoupon(id: string): Promise<boolean> {
    const result = await db.delete(productCoupons).where(eq(productCoupons.id, id)).returning();
    return result.length > 0;
  }

  async getProductCoupons(productId: string): Promise<ProductCoupon[]> {
    return await db.select().from(productCoupons)
      .where(eq(productCoupons.productId, productId))
      .orderBy(desc(productCoupons.createdAt));
  }

  // Global coupon methods
  async getGlobalCoupon(): Promise<GlobalCoupon | undefined> {
    const coupons = await db.select().from(globalCoupon)
      .where(eq(globalCoupon.isActive, true))
      .limit(1);
    return coupons[0];
  }

  async getAllGlobalCoupons(): Promise<GlobalCoupon[]> {
    return await db.select().from(globalCoupon)
      .orderBy(desc(globalCoupon.createdAt));
  }

  async createGlobalCoupon(coupon: InsertGlobalCoupon): Promise<GlobalCoupon> {
    const result = await db.insert(globalCoupon).values({
      ...coupon,
      discountValue: String(coupon.discountValue)
    } as any).returning();
    return result[0];
  }

  async updateGlobalCoupon(id: string, data: Partial<InsertGlobalCoupon>): Promise<GlobalCoupon | undefined> {
    const result = await db.update(globalCoupon)
      .set({ 
        ...data,
        ...(data.discountValue && { discountValue: String(data.discountValue) }),
        updatedAt: sql`CURRENT_TIMESTAMP` 
      } as any)
      .where(eq(globalCoupon.id, id))
      .returning();
    return result[0];
  }

  async deleteGlobalCoupon(id: string): Promise<boolean> {
    const result = await db.delete(globalCoupon).where(eq(globalCoupon.id, id)).returning();
    return result.length > 0;
  }

  async getCouponByCode(code: string): Promise<GlobalCoupon | undefined> {
    const results = await db.select().from(globalCoupon)
      .where(and(
        eq(globalCoupon.code, code.toUpperCase()),
        eq(globalCoupon.isActive, true)
      ))
      .limit(1);
    return results[0];
  }

  // ===== MÉTODOS DE TRACKING PIXELS =====
  
  // Busca a configuração de tracking pixels (retorna o primeiro registro ou undefined)
  async getTrackingPixels(): Promise<TrackingPixels | undefined> {
    try {
      const results = await db.select().from(trackingPixels).limit(1);
      return results[0];
    } catch (e) {
      console.error("❌ [TRACKING_PIXELS] Erro ao buscar configuração:", e);
      return undefined;
    }
  }

  // Atualiza ou cria a configuração de tracking pixels (upsert)
  async updateTrackingPixels(data: Partial<InsertTrackingPixels>): Promise<TrackingPixels> {
    try {
      // Verifica se já existe uma configuração
      const existing = await this.getTrackingPixels();
      
      if (existing) {
        // Atualiza o registro existente
        const result = await db.update(trackingPixels)
          .set({
            ...data,
            updatedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(eq(trackingPixels.id, existing.id))
          .returning();
        console.log("✅ [TRACKING_PIXELS] Configuração atualizada");
        return result[0];
      } else {
        // Cria um novo registro
        const result = await db.insert(trackingPixels)
          .values(data as InsertTrackingPixels)
          .returning();
        console.log("✅ [TRACKING_PIXELS] Nova configuração criada");
        return result[0];
      }
    } catch (e) {
      console.error("❌ [TRACKING_PIXELS] Erro ao atualizar configuração:", e);
      throw e;
    }
  }

  // ===== EMAIL TEMPLATE METHODS =====

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      return await db.select().from(emailTemplates).orderBy(emailTemplates.templateKey);
    } catch (e) {
      console.error("❌ [EMAIL_TEMPLATES] Erro ao buscar templates:", e);
      return [];
    }
  }

  async getEmailTemplateByKey(templateKey: string): Promise<EmailTemplate | undefined> {
    try {
      const results = await db.select().from(emailTemplates).where(eq(emailTemplates.templateKey, templateKey)).limit(1);
      return results[0];
    } catch (e) {
      console.error("❌ [EMAIL_TEMPLATES] Erro ao buscar template:", e);
      return undefined;
    }
  }

  async upsertEmailTemplate(templateKey: string, data: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const existing = await this.getEmailTemplateByKey(templateKey);
    if (existing) {
      const result = await db.update(emailTemplates)
        .set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(emailTemplates.templateKey, templateKey))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(emailTemplates)
        .values({
          templateKey,
          name: data.name || templateKey,
          subject: data.subject || "",
          htmlContent: data.htmlContent || "",
          enabled: data.enabled ?? true,
        })
        .returning();
      return result[0];
    }
  }
  async getCookieSettings(): Promise<CookieSettings | undefined> {
    try {
      const results = await db.select().from(cookieSettings).limit(1);
      return results[0];
    } catch (e) {
      console.error("❌ [COOKIE_SETTINGS] Erro ao buscar configuração:", e);
      return undefined;
    }
  }

  async updateCookieSettings(data: Partial<InsertCookieSettings>): Promise<CookieSettings> {
    try {
      const existing = await this.getCookieSettings();
      
      if (existing) {
        const result = await db.update(cookieSettings)
          .set({
            ...data,
            updatedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(eq(cookieSettings.id, existing.id))
          .returning();
        return result[0];
      } else {
        const result = await db.insert(cookieSettings)
          .values(data as any)
          .returning();
        return result[0];
      }
    } catch (e) {
      console.error("❌ [COOKIE_SETTINGS] Erro ao atualizar configuração:", e);
      throw e;
    }
  }

  async getPaymentBrands(): Promise<PaymentBrand[]> {
    try {
      return await db.select().from(paymentBrands).orderBy(asc(paymentBrands.displayOrder));
    } catch (e) {
      return [];
    }
  }

  async getEnabledPaymentBrands(): Promise<PaymentBrand[]> {
    try {
      return await db
        .select()
        .from(paymentBrands)
        .where(eq(paymentBrands.enabled, true))
        .orderBy(asc(paymentBrands.displayOrder));
    } catch (e) {
      return [];
    }
  }

  async upsertPaymentBrands(brands: InsertPaymentBrand[]): Promise<PaymentBrand[]> {
    try {
      const results: PaymentBrand[] = [];
      for (const brand of brands) {
        const [result] = await db
          .insert(paymentBrands)
          .values(brand)
          .onConflictDoUpdate({
            target: paymentBrands.id,
            set: {
              label: brand.label,
              iconKey: brand.iconKey,
              category: brand.category,
              enabled: brand.enabled,
              displayOrder: brand.displayOrder,
            },
          })
          .returning();
        results.push(result);
      }
      return results;
    } catch (e) {
      console.error("❌ [PAYMENT_BRANDS] Erro ao salvar:", e);
      throw e;
    }
  }
}

export const storage = new DbStorage();
