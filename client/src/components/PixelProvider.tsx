/**
 * PixelProvider - Provider de contexto para gerenciar o Facebook Pixel
 * 
 * Este componente é responsável por:
 * - Carregar as configurações de tracking pixels do backend
 * - Injetar o script do Facebook Pixel no head da página
 * - Injetar scripts customizados (headerScripts e bodyScripts)
 * - Expor funções para disparar eventos do Facebook Pixel
 * 
 * O provider deve envolver toda a aplicação no App.tsx
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

// ===== TIPOS =====

/**
 * Interface para os dados de configuração dos pixels de rastreamento
 * Vem do endpoint /api/tracking-pixels
 */
interface TrackingPixelsConfig {
  facebookPixelId: string | null;
  facebookPixelEnabled: boolean;
  facebookTestEventCode: string | null;
  headerScripts: string | null;
  bodyScripts: string | null;
}

/**
 * Interface para itens de compra (usado no evento Purchase)
 */
interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

/**
 * Interface do contexto do Pixel
 * Expõe as funções de tracking e estado de carregamento
 */
interface PixelContextType {
  // Estado
  isLoaded: boolean;
  isEnabled: boolean;
  
  // Funções de tracking
  trackPageView: () => void;
  trackViewContent: (productId: string, productName: string, value: number, currency?: string, category?: string) => void;
  trackAddToCart: (productId: string, productName: string, value: number, currency?: string, quantity?: number) => void;
  trackRemoveFromCart: (productId: string, productName: string, value: number) => void;
  trackInitiateCheckout: (value: number, currency?: string, numItems?: number) => void;
  trackAddPaymentInfo: (value: number, currency?: string) => void;
  trackPurchase: (orderId: string, value: number, currency?: string, items?: PurchaseItem[]) => void;
  trackLead: (email?: string) => void;
  trackSearch: (searchQuery: string) => void;
  trackAddToWishlist: (productId: string, productName: string, value: number) => void;
  trackCompleteRegistration: () => void;
}

// ===== CONTEXTO =====

// Cria o contexto com valores padrão (funções vazias)
const PixelContext = createContext<PixelContextType>({
  isLoaded: false,
  isEnabled: false,
  trackPageView: () => {},
  trackViewContent: () => {},
  trackAddToCart: () => {},
  trackRemoveFromCart: () => {},
  trackInitiateCheckout: () => {},
  trackAddPaymentInfo: () => {},
  trackPurchase: () => {},
  trackLead: () => {},
  trackSearch: () => {},
  trackAddToWishlist: () => {},
  trackCompleteRegistration: () => {},
});

// ===== DECLARAÇÃO GLOBAL DO FBQ =====

// Tipo para a função fbq do Facebook Pixel
type FBQFunction = (
  action: string,
  eventName: string,
  params?: Record<string, unknown>
) => void;

// Declara a interface do Facebook Pixel no objeto window
declare global {
  interface Window {
    fbq?: FBQFunction;
    _fbq?: FBQFunction;
  }
}

// ===== PROVIDER =====

interface PixelProviderProps {
  children: ReactNode;
}

export function PixelProvider({ children }: PixelProviderProps) {
  // Estado para controlar se o pixel foi carregado
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Busca as configurações de tracking pixels do backend
  const { data: config } = useQuery<TrackingPixelsConfig>({
    queryKey: ["/api/tracking-pixels"],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Verifica se o Facebook Pixel está habilitado
  const isEnabled = Boolean(config?.facebookPixelEnabled && config?.facebookPixelId);

  /**
   * Efeito para injetar o script do Facebook Pixel
   * Executado quando as configurações são carregadas e o pixel está habilitado
   */
  useEffect(() => {
    // Verifica se o pixel está habilitado e tem ID válido
    if (!config?.facebookPixelEnabled || !config?.facebookPixelId) {
      return;
    }

    // Evita injetar o script mais de uma vez
    if (window.fbq) {
      setIsLoaded(true);
      return;
    }

    // Código base do Facebook Pixel (minificado)
    const pixelScript = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${config.facebookPixelId}');
      fbq('track', 'PageView');
    `;

    // Cria e injeta o script no head
    const script = document.createElement("script");
    script.id = "facebook-pixel-script";
    script.innerHTML = pixelScript;
    document.head.appendChild(script);

    // Marca como carregado
    setIsLoaded(true);

    console.log("✅ [Facebook Pixel] Inicializado com ID:", config.facebookPixelId);

    // Cleanup: remove o script quando o componente desmonta
    return () => {
      const existingScript = document.getElementById("facebook-pixel-script");
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [config?.facebookPixelEnabled, config?.facebookPixelId]);

  /**
   * Efeito para injetar scripts customizados do header
   * Scripts são adicionados ao <head> da página
   */
  useEffect(() => {
    if (!config?.headerScripts) {
      return;
    }

    // Cria um container para os scripts do header
    const container = document.createElement("div");
    container.id = "custom-header-scripts";
    container.innerHTML = config.headerScripts;
    document.head.appendChild(container);

    console.log("✅ [Pixel] Scripts de header injetados");

    // Cleanup
    return () => {
      const existingContainer = document.getElementById("custom-header-scripts");
      if (existingContainer) {
        existingContainer.remove();
      }
    };
  }, [config?.headerScripts]);

  /**
   * Efeito para injetar scripts customizados do body
   * Scripts são adicionados antes do fechamento do </body>
   */
  useEffect(() => {
    if (!config?.bodyScripts) {
      return;
    }

    // Cria um container para os scripts do body
    const container = document.createElement("div");
    container.id = "custom-body-scripts";
    container.innerHTML = config.bodyScripts;
    document.body.appendChild(container);

    console.log("✅ [Pixel] Scripts de body injetados");

    // Cleanup
    return () => {
      const existingContainer = document.getElementById("custom-body-scripts");
      if (existingContainer) {
        existingContainer.remove();
      }
    };
  }, [config?.bodyScripts]);

  // ===== FUNÇÕES DE TRACKING =====

  /**
   * Dispara o evento PageView
   * Usado para rastrear visualização de páginas
   */
  const trackPageView = useCallback(() => {
    if (!isEnabled || !window.fbq) return;
    
    window.fbq("track", "PageView");
    console.log("📊 [Pixel] PageView disparado");
  }, [isEnabled]);

  /**
   * Dispara o evento ViewContent
   * Usado quando o usuário visualiza um produto
   */
  const trackViewContent = useCallback(
    (productId: string, productName: string, value: number, currency = "BRL", category?: string) => {
      if (!isEnabled || !window.fbq) return;

      window.fbq("track", "ViewContent", {
        content_ids: [productId],
        content_name: productName,
        content_type: "product",
        content_category: category,
        value: value,
        currency: currency,
      });
      
      console.log("📊 [Pixel] ViewContent disparado:", { productId, productName, value });
    },
    [isEnabled]
  );

  /**
   * Dispara o evento AddToCart
   * Usado quando o usuário adiciona um produto ao carrinho
   */
  const trackAddToCart = useCallback(
    (productId: string, productName: string, value: number, currency = "BRL", quantity = 1) => {
      if (!isEnabled || !window.fbq) return;

      window.fbq("track", "AddToCart", {
        content_ids: [productId],
        content_name: productName,
        content_type: "product",
        value: value,
        currency: currency,
        num_items: quantity,
      });
      
      console.log("📊 [Pixel] AddToCart disparado:", { productId, productName, value, quantity });
    },
    [isEnabled]
  );

  /**
   * Dispara evento customizado RemoveFromCart
   * Usado quando o usuário remove um produto do carrinho
   * Nota: Este é um evento customizado, não padrão do Facebook
   */
  const trackRemoveFromCart = useCallback(
    (productId: string, productName: string, value: number) => {
      if (!isEnabled || !window.fbq) return;

      window.fbq("trackCustom", "RemoveFromCart", {
        content_ids: [productId],
        content_name: productName,
        value: value,
        currency: "BRL",
      });
      
      console.log("📊 [Pixel] RemoveFromCart disparado:", { productId, productName, value });
    },
    [isEnabled]
  );

  /**
   * Dispara o evento InitiateCheckout
   * Usado quando o usuário inicia o processo de checkout
   */
  const trackInitiateCheckout = useCallback(
    (value: number, currency = "BRL", numItems?: number) => {
      if (!isEnabled || !window.fbq) return;

      window.fbq("track", "InitiateCheckout", {
        value: value,
        currency: currency,
        num_items: numItems,
      });
      
      console.log("📊 [Pixel] InitiateCheckout disparado:", { value, numItems });
    },
    [isEnabled]
  );

  /**
   * Dispara o evento AddPaymentInfo
   * Usado quando o usuário adiciona informações de pagamento
   */
  const trackAddPaymentInfo = useCallback(
    (value: number, currency = "BRL") => {
      if (!isEnabled || !window.fbq) return;

      window.fbq("track", "AddPaymentInfo", {
        value: value,
        currency: currency,
      });
      
      console.log("📊 [Pixel] AddPaymentInfo disparado:", { value });
    },
    [isEnabled]
  );

  /**
   * Dispara o evento Purchase
   * Usado quando uma compra é finalizada com sucesso
   */
  const trackPurchase = useCallback(
    (orderId: string, value: number, currency = "BRL", items?: PurchaseItem[]) => {
      if (!isEnabled || !window.fbq) return;

      // Formata os IDs dos produtos para o Facebook
      const contentIds = items?.map((item) => item.id) || [];
      
      // Formata os conteúdos para o Facebook
      const contents = items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        item_price: item.price,
      })) || [];

      window.fbq("track", "Purchase", {
        value: value,
        currency: currency,
        content_ids: contentIds,
        contents: contents,
        content_type: "product",
        order_id: orderId,
        num_items: items?.reduce((acc, item) => acc + item.quantity, 0) || 0,
      });
      
      console.log("📊 [Pixel] Purchase disparado:", { orderId, value, items: items?.length });
    },
    [isEnabled]
  );

  /**
   * Dispara o evento Lead
   * Usado quando o usuário se cadastra na newsletter
   */
  const trackLead = useCallback(
    (email?: string) => {
      if (!isEnabled || !window.fbq) return;

      // Não envia o email diretamente para preservar privacidade
      // O Facebook usa o email hashado internamente
      window.fbq("track", "Lead", {
        content_name: "Newsletter",
      });
      
      console.log("📊 [Pixel] Lead disparado:", { email: email ? "***" : "não informado" });
    },
    [isEnabled]
  );

  /**
   * Dispara o evento Search
   * Usado quando o usuário realiza uma busca
   */
  const trackSearch = useCallback(
    (searchQuery: string) => {
      if (!isEnabled || !window.fbq) return;

      window.fbq("track", "Search", {
        search_string: searchQuery,
      });
      
      console.log("📊 [Pixel] Search disparado:", { searchQuery });
    },
    [isEnabled]
  );

  /**
   * Dispara o evento AddToWishlist
   * Usado quando o usuário adiciona um produto aos favoritos
   */
  const trackAddToWishlist = useCallback(
    (productId: string, productName: string, value: number) => {
      if (!isEnabled || !window.fbq) return;

      window.fbq("track", "AddToWishlist", {
        content_ids: [productId],
        content_name: productName,
        content_type: "product",
        value: value,
        currency: "BRL",
      });
      
      console.log("📊 [Pixel] AddToWishlist disparado:", { productId, productName, value });
    },
    [isEnabled]
  );

  /**
   * Dispara o evento CompleteRegistration
   * Usado quando o usuário completa o registro/cadastro
   */
  const trackCompleteRegistration = useCallback(() => {
    if (!isEnabled || !window.fbq) return;

    window.fbq("track", "CompleteRegistration");
    
    console.log("📊 [Pixel] CompleteRegistration disparado");
  }, [isEnabled]);

  // ===== VALOR DO CONTEXTO =====

  const contextValue: PixelContextType = {
    isLoaded,
    isEnabled,
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackRemoveFromCart,
    trackInitiateCheckout,
    trackAddPaymentInfo,
    trackPurchase,
    trackLead,
    trackSearch,
    trackAddToWishlist,
    trackCompleteRegistration,
  };

  return (
    <PixelContext.Provider value={contextValue}>
      {children}
    </PixelContext.Provider>
  );
}

// ===== HOOK DE ACESSO AO CONTEXTO =====

/**
 * Hook para acessar o contexto do Pixel diretamente
 * Prefira usar o hook usePixel para uma API mais limpa
 */
export function usePixelContext() {
  const context = useContext(PixelContext);
  
  if (!context) {
    throw new Error("usePixelContext deve ser usado dentro de um PixelProvider");
  }
  
  return context;
}

export default PixelProvider;
