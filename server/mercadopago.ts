/**
 * Módulo de integração com Mercado Pago
 * 
 * Este arquivo gerencia toda a comunicação com a API do Mercado Pago,
 * incluindo detecção automática de ambiente (produção vs sandbox),
 * criação de clientes e validação de webhooks.
 * 
 * O sistema detecta automaticamente se está em produção ou desenvolvimento
 * e usa as credenciais apropriadas.
 */

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import crypto from "crypto";

/**
 * Detecta se a aplicação está rodando em ambiente de produção.
 * 
 * Critérios para produção:
 * 1. Domínio Replit termina em .replit.app (sem domínio de dev)
 * 2. NODE_ENV está definido como "production"
 * 
 * @returns true se estiver em produção, false para desenvolvimento/sandbox
 */
function isProduction(): boolean {
  if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
    return true;
  }

  const replitDomain = process.env.REPLIT_DOMAINS || "";
  const devDomain = process.env.REPLIT_DEV_DOMAIN || "";
  if (replitDomain.includes(".replit.app") && !devDomain) {
    return true;
  }
  
  return false;
}

/**
 * Obtém o Access Token apropriado para o ambiente atual.
 * 
 * Em produção: usa MERCADOPAGO_ACCESS_TOKEN
 * Em desenvolvimento: usa MERCADOPAGO_ACCESS_TOKEN_SANDBOX
 * 
 * Se a credencial de sandbox não existir, usa a de produção como fallback.
 * 
 * @returns Access Token do Mercado Pago
 * @throws Error se nenhum token estiver configurado
 */
function getAccessToken(): string {
  const isProd = isProduction();
  
  if (isProd) {
    // Ambiente de PRODUÇÃO - usa credenciais reais
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado para produção");
    }
    console.log("🔑 [MP] Usando credenciais de PRODUÇÃO");
    return token;
  } else {
    // Ambiente de DESENVOLVIMENTO/SANDBOX - usa credenciais de teste
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN_SANDBOX;
    if (!token) {
      console.warn("⚠️ [MP] MERCADOPAGO_ACCESS_TOKEN_SANDBOX não configurado, usando produção");
      const prodToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!prodToken) {
        throw new Error("Nenhum token do Mercado Pago configurado");
      }
      return prodToken;
    }
    console.log("🧪 [MP] Usando credenciais de SANDBOX/TESTE");
    return token;
  }
}

/**
 * Obtém a Public Key apropriada para o ambiente atual.
 * Usada no frontend para inicializar o SDK do Mercado Pago.
 * 
 * @returns Public Key do Mercado Pago
 */
export function getPublicKey(): string {
  const isProd = isProduction();
  
  if (isProd) {
    return process.env.MERCADOPAGO_PUBLIC_KEY || "";
  } else {
    // Em sandbox, tenta usar a key de sandbox primeiro, depois a de produção
    return process.env.MERCADOPAGO_PUBLIC_KEY_SANDBOX || process.env.MERCADOPAGO_PUBLIC_KEY || "";
  }
}

/**
 * Obtém o segredo do webhook para validação de assinaturas.
 * Usado para garantir que as notificações vieram realmente do Mercado Pago.
 * 
 * @returns Segredo do webhook
 */
export function getWebhookSecret(): string {
  return process.env.MERCADOPAGO_WEBHOOK_SECRET || "";
}

/**
 * Cria e retorna um cliente configurado do Mercado Pago.
 * Este cliente é a base para todas as operações com a API.
 * 
 * @returns Instância configurada do MercadoPagoConfig
 */
export function getMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = getAccessToken();
  return new MercadoPagoConfig({ accessToken });
}

/**
 * Cria um cliente para gerenciar preferências de pagamento.
 * Preferências são usadas no Checkout Pro para definir itens, valores e URLs de retorno.
 * 
 * @returns Cliente de Preferência do Mercado Pago
 */
export function createPreferenceClient(): Preference {
  const client = getMercadoPagoClient();
  return new Preference(client);
}

/**
 * Cria um cliente para consultar informações de pagamentos.
 * Usado principalmente para processar webhooks e verificar status.
 * 
 * @returns Cliente de Pagamento do Mercado Pago
 */
export function createPaymentClient(): Payment {
  const client = getMercadoPagoClient();
  return new Payment(client);
}

/**
 * Valida a assinatura de um webhook do Mercado Pago.
 * 
 * O Mercado Pago envia um header x-signature com cada notificação.
 * Este header contém um timestamp (ts) e um hash (v1) que devemos verificar
 * para garantir que a notificação é autêntica.
 * 
 * Algoritmo de validação:
 * 1. Extrai ts e v1 do header x-signature
 * 2. Monta o template: "id:{dataId};request-id:{xRequestId};ts:{ts};"
 * 3. Calcula HMAC-SHA256 do template usando o webhook secret
 * 4. Compara o hash calculado com o v1 recebido
 * 
 * @param xSignature - Header x-signature da requisição
 * @param xRequestId - Header x-request-id da requisição
 * @param dataId - ID do recurso (payment, merchant_order, etc.)
 * @returns true se a assinatura for válida
 */
export function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = getWebhookSecret();
  if (!secret) {
    console.warn("⚠️ [MP] Webhook secret não configurado, pulando validação");
    return true; // Se não tem secret, aceita (não recomendado em produção)
  }

  try {
    // Extrai timestamp (ts) e hash (v1) do header
    const parts = xSignature.split(",");
    let ts: string | null = null;
    let hash: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split("=").map(s => s.trim());
      if (key === "ts") ts = value;
      if (key === "v1") hash = value;
    }

    if (!ts || !hash) {
      console.error("❌ [MP] Assinatura do webhook inválida - ts ou hash ausente");
      return false;
    }

    // Monta o template para calcular o hash
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Calcula o HMAC-SHA256 usando o webhook secret
    const computedHash = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    // Compara os hashes
    const isValid = computedHash === hash;
    
    if (!isValid) {
      console.error("❌ [MP] Assinatura do webhook não confere");
      console.error("   Esperado:", computedHash);
      console.error("   Recebido:", hash);
    }

    return isValid;
  } catch (error) {
    console.error("❌ [MP] Erro ao validar assinatura:", error);
    return false;
  }
}

/**
 * Retorna informações sobre o ambiente atual.
 * Usado pelo frontend para saber qual public key usar.
 * 
 * @returns Objeto com isProduction e publicKey
 */
export function getEnvironmentInfo(): { isProduction: boolean; publicKey: string } {
  return {
    isProduction: isProduction(),
    publicKey: getPublicKey()
  };
}
