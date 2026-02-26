/**
 * usePixel - Hook para disparar eventos do Facebook Pixel
 * 
 * Este hook expõe todas as funções de rastreamento do Facebook Pixel
 * de forma simples e tipada. Deve ser usado em componentes que
 * estejam dentro do PixelProvider.
 * 
 * Exemplo de uso:
 * ```tsx
 * const { trackAddToCart, trackViewContent } = usePixel();
 * 
 * // Quando o usuário visualiza um produto
 * trackViewContent(product.id, product.name, product.price, "BRL", "camisetas");
 * 
 * // Quando o usuário adiciona ao carrinho
 * trackAddToCart(product.id, product.name, product.price, "BRL", 1);
 * ```
 */

import { usePixelContext } from "@/components/PixelProvider";

/**
 * Interface para itens de compra (usado no evento Purchase)
 */
export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

/**
 * Hook principal para rastreamento de eventos do Facebook Pixel
 * 
 * @returns Objeto com todas as funções de tracking e estado
 */
export function usePixel() {
  // Obtém o contexto do PixelProvider
  const {
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
  } = usePixelContext();

  return {
    // ===== ESTADO =====
    
    /**
     * Indica se o script do Facebook Pixel foi carregado
     */
    isLoaded,
    
    /**
     * Indica se o Facebook Pixel está habilitado nas configurações
     */
    isEnabled,

    // ===== EVENTOS DE PÁGINA =====

    /**
     * Dispara o evento PageView
     * Rastreia visualização de páginas
     * 
     * @example
     * trackPageView();
     */
    trackPageView,

    /**
     * Dispara o evento Search
     * Rastreia buscas realizadas pelo usuário
     * 
     * @param searchQuery - Termo de busca digitado
     * 
     * @example
     * trackSearch("camiseta preta");
     */
    trackSearch,

    // ===== EVENTOS DE PRODUTO =====

    /**
     * Dispara o evento ViewContent
     * Rastreia visualização de produtos
     * 
     * @param productId - ID único do produto
     * @param productName - Nome do produto
     * @param value - Valor/preço do produto
     * @param currency - Moeda (padrão: "BRL")
     * @param category - Categoria do produto (opcional)
     * 
     * @example
     * trackViewContent("123", "Camiseta Premium", 149.90, "BRL", "camisetas");
     */
    trackViewContent,

    /**
     * Dispara o evento AddToWishlist
     * Rastreia quando usuário adiciona aos favoritos
     * 
     * @param productId - ID único do produto
     * @param productName - Nome do produto
     * @param value - Valor/preço do produto
     * 
     * @example
     * trackAddToWishlist("123", "Camiseta Premium", 149.90);
     */
    trackAddToWishlist,

    // ===== EVENTOS DE CARRINHO =====

    /**
     * Dispara o evento AddToCart
     * Rastreia adição de produto ao carrinho
     * 
     * @param productId - ID único do produto
     * @param productName - Nome do produto
     * @param value - Valor/preço unitário do produto
     * @param currency - Moeda (padrão: "BRL")
     * @param quantity - Quantidade adicionada (padrão: 1)
     * 
     * @example
     * trackAddToCart("123", "Camiseta Premium", 149.90, "BRL", 2);
     */
    trackAddToCart,

    /**
     * Dispara evento customizado RemoveFromCart
     * Rastreia remoção de produto do carrinho
     * Nota: Este é um evento customizado, não padrão do Facebook
     * 
     * @param productId - ID único do produto
     * @param productName - Nome do produto
     * @param value - Valor/preço do produto removido
     * 
     * @example
     * trackRemoveFromCart("123", "Camiseta Premium", 149.90);
     */
    trackRemoveFromCart,

    // ===== EVENTOS DE CHECKOUT =====

    /**
     * Dispara o evento InitiateCheckout
     * Rastreia início do processo de checkout
     * 
     * @param value - Valor total do carrinho
     * @param currency - Moeda (padrão: "BRL")
     * @param numItems - Número de itens no carrinho (opcional)
     * 
     * @example
     * trackInitiateCheckout(299.80, "BRL", 2);
     */
    trackInitiateCheckout,

    /**
     * Dispara o evento AddPaymentInfo
     * Rastreia quando usuário adiciona informações de pagamento
     * 
     * @param value - Valor da compra
     * @param currency - Moeda (padrão: "BRL")
     * 
     * @example
     * trackAddPaymentInfo(299.80, "BRL");
     */
    trackAddPaymentInfo,

    /**
     * Dispara o evento Purchase
     * Rastreia compra finalizada com sucesso
     * 
     * @param orderId - ID único do pedido
     * @param value - Valor total da compra
     * @param currency - Moeda (padrão: "BRL")
     * @param items - Lista de itens comprados (opcional)
     * 
     * @example
     * trackPurchase("ORDER-123", 299.80, "BRL", [
     *   { id: "prod-1", name: "Camiseta", quantity: 2, price: 149.90 }
     * ]);
     */
    trackPurchase,

    // ===== EVENTOS DE CONVERSÃO =====

    /**
     * Dispara o evento Lead
     * Rastreia cadastro na newsletter
     * 
     * @param email - Email do usuário (opcional, não é enviado ao Facebook)
     * 
     * @example
     * trackLead("usuario@email.com");
     */
    trackLead,

    /**
     * Dispara o evento CompleteRegistration
     * Rastreia conclusão de cadastro/registro
     * 
     * @example
     * trackCompleteRegistration();
     */
    trackCompleteRegistration,
  };
}

export default usePixel;
