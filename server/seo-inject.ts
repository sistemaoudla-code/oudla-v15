import { storage } from "./storage";
import fs from "fs";
import path from "path";

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSEOHead(seo: Record<string, string>, baseUrl: string): string {
  const ogImageUrl = `${baseUrl}/og-icon.png`;

  let tags = '';
  tags += `    <title>${escapeHtml(seo.title)}</title>\n`;
  tags += `    <meta name="description" content="${escapeHtml(seo.description)}" />\n`;
  if (seo.keywords) {
    tags += `    <meta name="keywords" content="${escapeHtml(seo.keywords)}" />\n`;
  }
  tags += `    <meta property="og:title" content="${escapeHtml(seo.ogTitle)}" />\n`;
  tags += `    <meta property="og:description" content="${escapeHtml(seo.ogDescription)}" />\n`;
  tags += `    <meta property="og:type" content="${escapeHtml(seo.ogType)}" />\n`;
  if (seo.ogSiteName) {
    tags += `    <meta property="og:site_name" content="${escapeHtml(seo.ogSiteName)}" />\n`;
  }
  tags += `    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />\n`;
  tags += `    <meta property="og:image:type" content="image/png" />\n`;
  tags += `    <meta property="og:image:width" content="1200" />\n`;
  tags += `    <meta property="og:image:height" content="630" />\n`;
  tags += `    <meta name="twitter:card" content="summary_large_image" />\n`;
  tags += `    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />\n`;
  tags += `    <meta property="og:url" content="${escapeHtml(baseUrl)}" />`;
  return tags;
}

function buildProductOGHead(product: { name: string; description?: string | null; price?: string | null }, imageUrl: string, productUrl: string, siteName: string): string {
  const title = `${product.name} | ${siteName}`;
  const desc = product.description || product.name;
  const priceText = product.price ? ` - R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}` : '';
  const fullDesc = `${desc}${priceText}`;

  let tags = '';
  tags += `    <title>${escapeHtml(title)}</title>\n`;
  tags += `    <meta name="description" content="${escapeHtml(fullDesc)}" />\n`;
  tags += `    <meta property="og:title" content="${escapeHtml(product.name)}" />\n`;
  tags += `    <meta property="og:description" content="${escapeHtml(fullDesc)}" />\n`;
  tags += `    <meta property="og:type" content="product" />\n`;
  tags += `    <meta property="og:site_name" content="${escapeHtml(siteName)}" />\n`;
  tags += `    <meta property="og:image" content="${escapeHtml(imageUrl)}" />\n`;
  tags += `    <meta property="og:image:width" content="1200" />\n`;
  tags += `    <meta property="og:image:height" content="630" />\n`;
  tags += `    <meta name="twitter:card" content="summary_large_image" />\n`;
  tags += `    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />\n`;
  tags += `    <meta property="og:url" content="${escapeHtml(productUrl)}" />`;
  if (product.price) {
    tags += `\n    <meta property="product:price:amount" content="${escapeHtml(product.price)}" />\n`;
    tags += `    <meta property="product:price:currency" content="BRL" />`;
  }
  return tags;
}

export async function injectProductOG(html: string, productIdentifier: string): Promise<string | null> {
  try {
    const baseUrl = (process.env.SITE_URL || "https://oudla.com.br").replace(/\/$/, '');
    const ogSiteNameSetting = await storage.getSiteSettingByKey("seo_og_site_name");
    const siteName = ogSiteNameSetting?.value || "oudla";

    const allProducts = await storage.getProducts();
    const id = productIdentifier.trim().toLowerCase();

    let product = allProducts.find(p => p.slug?.trim().toLowerCase() === id);
    if (!product) {
      product = allProducts.find(p => p.sku?.trim().toLowerCase() === id);
    }
    if (!product) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(productIdentifier)) {
        product = allProducts.find(p => p.id === productIdentifier);
      }
    }

    if (!product) return null;

    const images = await storage.getProductImages(product.id);
    const mainImage = images.length > 0 ? images[0].imageUrl : `${baseUrl}/og-icon.png`;
    const ogImage = mainImage.startsWith("http") ? mainImage : `${baseUrl}${mainImage}`;
    const productUrl = `${baseUrl}/produto/${product.slug || product.id}`;

    const ogBlock = buildProductOGHead(product, ogImage, productUrl, siteName);
    return replaceMetaBlock(html, ogBlock);
  } catch (err) {
    console.error("Error injecting product OG:", err);
    return null;
  }
}

function replaceMetaBlock(html: string, newBlock: string): string {
  const seoStart = '<!-- SEO_START -->';
  const seoEnd = '<!-- SEO_END -->';

  if (html.includes(seoStart) && html.includes(seoEnd)) {
    const regex = new RegExp(`${seoStart}[\\s\\S]*?${seoEnd}`);
    return html.replace(regex, `${seoStart}\n${newBlock}\n    ${seoEnd}`);
  }

  const oldTags = [
    /<title>.*?<\/title>\n?/,
    /<meta name="description" content="[^"]*" \/>\n?/,
    /<meta name="keywords" content="[^"]*" \/>\n?/,
    /<meta property="og:title" content="[^"]*" \/>\n?/,
    /<meta property="og:description" content="[^"]*" \/>\n?/,
    /<meta property="og:type" content="[^"]*" \/>\n?/,
    /<meta property="og:site_name" content="[^"]*" \/>\n?/,
    /<meta property="og:image" content="[^"]*" \/>\n?/,
    /<meta property="og:image:width" content="[^"]*" \/>\n?/,
    /<meta property="og:image:height" content="[^"]*" \/>\n?/,
    /<meta name="twitter:card" content="[^"]*" \/>\n?/,
    /<meta name="twitter:image" content="[^"]*" \/>\n?/,
    /<meta property="og:url" content="[^"]*" \/>\n?/,
  ];

  for (const regex of oldTags) {
    html = html.replace(regex, '');
  }

  html = html.replace(
    /(<link rel="icon")/,
    `${seoStart}\n${newBlock}\n    ${seoEnd}\n    $1`
  );

  return html;
}


export async function writeHardcodedSEO(): Promise<void> {
  try {
    const [title, description, keywords, ogTitle, ogDesc, ogType, ogSiteName] = await Promise.all([
      storage.getSiteSettingByKey("seo_title"),
      storage.getSiteSettingByKey("seo_description"),
      storage.getSiteSettingByKey("seo_keywords"),
      storage.getSiteSettingByKey("seo_og_title"),
      storage.getSiteSettingByKey("seo_og_description"),
      storage.getSiteSettingByKey("seo_og_type"),
      storage.getSiteSettingByKey("seo_og_site_name"),
    ]);

    const seo: Record<string, string> = {
      title: title?.value || "oudla",
      description: description?.value || "oudla é uma marca focada no público jovem e descolado. camisetas premium com design minimalista e estética sofisticada.",
      keywords: keywords?.value || "oudla, camisetas, moda cristã, roupas premium, moda jovem",
      ogTitle: ogTitle?.value || "oudla",
      ogDescription: ogDesc?.value || "camisetas de luxo para jovens descolados. design minimalista, qualidade premium.",
      ogType: ogType?.value || "website",
      ogSiteName: ogSiteName?.value || "oudla",
    };

    const baseUrl = (process.env.SITE_URL || "https://oudla.com.br").replace(/\/$/, '');
    const newBlock = buildSEOHead(seo, baseUrl);

    const clientHtml = path.resolve(import.meta.dirname, "..", "client", "index.html");
    const distHtml = path.resolve(import.meta.dirname, "public", "index.html");

    const isDev = process.env.NODE_ENV !== "production" && !process.env.APP_ENV;

    for (const filePath of [clientHtml, distHtml]) {
      if (filePath === clientHtml && isDev) {
        console.log(`⏭️ Skipping client/index.html in dev (Vite watches it)`);
        continue;
      }
      if (fs.existsSync(filePath)) {
        let html = fs.readFileSync(filePath, "utf-8");
        html = replaceMetaBlock(html, newBlock);
        fs.writeFileSync(filePath, html, "utf-8");
        console.log(`✅ SEO tags written to ${filePath}`);
      }
    }
  } catch (err) {
    console.error("❌ Error writing SEO tags to HTML:", err);
  }
}

export async function initSEO(): Promise<void> {
  await writeHardcodedSEO();
}

export function invalidateSEOCache() {
}
