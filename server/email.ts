import FormData from "form-data";
import Mailgun from "mailgun.js";
import { storage } from "./storage";
import { db } from "./db";
import { emailTemplates, siteSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "";
const MAILGUN_DOMAIN = (process.env.MAILGUN_DOMAIN || "").toLowerCase();

let mgClient: any = null;

function getMailgunClient() {
  if (!mgClient) {
    const mailgun = new Mailgun(FormData);
    mgClient = mailgun.client({
      username: "api",
      key: MAILGUN_API_KEY,
      url: "https://api.eu.mailgun.net",
    });
  }
  return mgClient;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error("❌ [EMAIL] Mailgun não configurado: API_KEY ou DOMAIN ausente");
      return false;
    }

    const mg = getMailgunClient();
    const result = await mg.messages.create(MAILGUN_DOMAIN, {
      from: `OUDLA <postmaster@${MAILGUN_DOMAIN}>`,
      to: [to],
      subject,
      html,
    });

    console.log("✅ [EMAIL] Email enviado:", { to, subject, id: result.id });
    return true;
  } catch (error) {
    console.error("❌ [EMAIL] Erro ao enviar email:", error);
    return false;
  }
}

export function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value || "");
  }
  return result;
}

async function getTemplate(templateKey: string) {
  try {
    const results = await db.select().from(emailTemplates).where(eq(emailTemplates.templateKey, templateKey)).limit(1);
    return results[0] || null;
  } catch (error) {
    console.error(`❌ [EMAIL] Erro ao buscar template ${templateKey}:`, error);
    return null;
  }
}

function buildItemsHtml(items: any[]): string {
  return items.map(item => {
    const color = item.color ? (() => { try { return JSON.parse(item.color); } catch { return null; } })() : null;
    return `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 0;">
        <strong>${item.productName}</strong><br/>
        <span style="color: #666; font-size: 13px;">
          Tam: ${item.size}${color?.name ? ` | Cor: ${color.name}` : ""}${item.printPosition ? ` | Estampa: ${item.printPosition}` : ""}
        </span>
      </td>
      <td style="padding: 12px 0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; text-align: right;">R$ ${item.unitPrice}</td>
      <td style="padding: 12px 0; text-align: right; font-weight: bold;">R$ ${item.subtotal}</td>
    </tr>`;
  }).join("");
}

async function getEmailLogoUrl(): Promise<string> {
  try {
    const results = await db.select().from(siteSettings).where(eq(siteSettings.key, "email_logo_url")).limit(1);
    return results[0]?.value || "";
  } catch {
    return "";
  }
}

async function buildOrderVariables(order: any, items?: any[]): Promise<Record<string, string>> {
  const address = [
    order.street,
    order.number,
    order.complement ? `- ${order.complement}` : "",
    `\n${order.neighborhood}`,
    `\n${order.city} - ${order.state}`,
    `\nCEP: ${order.zipCode}`
  ].filter(Boolean).join(", ").replace(", \n", "\n");

  const logoUrl = await getEmailLogoUrl();

  const variables: Record<string, string> = {
    logo_url: logoUrl,
    nome: order.customerName || "",
    email: order.customerEmail || "",
    cpf: order.customerCpf || "",
    telefone: order.customerPhone || "",
    endereco: address,
    numero_pedido: order.orderNumber || "",
    subtotal: `R$ ${order.subtotal}`,
    frete: `R$ ${order.shippingCost}`,
    total: `R$ ${order.totalAmount}`,
    metodo_pagamento: order.paymentMethod || "Não informado",
    codigo_rastreio: order.trackingCode || "",
    data_pedido: order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR"),
    link_rastreio: (() => {
      let baseUrl = process.env.APP_URL 
        || (process.env.REPL_SLUG && process.env.REPL_OWNER 
          ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
          : (process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
            : "http://localhost:5000"));
      baseUrl = baseUrl.replace(/\/+$/, '');
      const code = order.trackingCode || order.orderNumber || "";
      return code ? `${baseUrl}/rastreio?codigo=${encodeURIComponent(code)}` : `${baseUrl}/rastreio`;
    })(),
  };

  if (items && items.length > 0) {
    variables.itens = `<table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #ddd;">
          <th style="padding: 8px 0; text-align: left;">Produto</th>
          <th style="padding: 8px 0; text-align: center;">Qtd</th>
          <th style="padding: 8px 0; text-align: right;">Preço</th>
          <th style="padding: 8px 0; text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${buildItemsHtml(items)}</tbody>
    </table>`;
  }

  return variables;
}

export async function sendOrderConfirmationEmail(order: any, items: any[]): Promise<boolean> {
  try {
    const template = await getTemplate("order_confirmation");
    if (!template || !template.enabled) {
      console.log("⚠️ [EMAIL] Template de confirmação desabilitado ou não encontrado");
      return false;
    }

    const variables = await buildOrderVariables(order, items);
    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.htmlContent, variables);

    const result = await sendEmail(order.customerEmail, subject, html);
    if (result) {
      await storage.updateOrder(order.id, { confirmationEmailSentAt: new Date() });
    }
    return result;
  } catch (error) {
    console.error("❌ [EMAIL] Erro ao enviar confirmação de pedido:", error);
    return false;
  }
}

export async function sendTrackingCodeEmail(order: any): Promise<boolean> {
  try {
    const template = await getTemplate("tracking_code");
    if (!template || !template.enabled) {
      console.log("⚠️ [EMAIL] Template de rastreio desabilitado ou não encontrado");
      return false;
    }

    const variables = await buildOrderVariables(order);
    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.htmlContent, variables);

    const result = await sendEmail(order.customerEmail, subject, html);
    if (result) {
      await storage.updateOrder(order.id, { trackingEmailSentAt: new Date() });
    }
    return result;
  } catch (error) {
    console.error("❌ [EMAIL] Erro ao enviar código de rastreio:", error);
    return false;
  }
}

export async function sendNewsletterWelcomeEmail(subscriberEmail: string): Promise<boolean> {
  try {
    const template = await getTemplate("newsletter_welcome");
    if (!template || !template.enabled) {
      console.log("⚠️ [EMAIL] Template de boas-vindas newsletter desabilitado ou não encontrado");
      return false;
    }

    const logoUrl = await getEmailLogoUrl();
    const variables: Record<string, string> = {
      logo_url: logoUrl,
      email: subscriberEmail,
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.htmlContent, variables);

    return await sendEmail(subscriberEmail, subject, html);
  } catch (error) {
    console.error("❌ [EMAIL] Erro ao enviar email de boas-vindas newsletter:", error);
    return false;
  }
}
