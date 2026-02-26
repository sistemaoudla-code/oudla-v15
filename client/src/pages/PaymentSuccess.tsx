/**
 * Página de Sucesso do Pagamento
 * 
 * Exibida quando o pagamento é aprovado pelo Mercado Pago.
 * Mostra os detalhes do pedido e permite download do comprovante em PDF.
 */

import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { usePixel } from "@/hooks/usePixel";
import { useMochila } from "@/contexts/MochilaContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle, Download, Home, Package } from "lucide-react";
import { motion } from "framer-motion";

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  paymentMethod: string;
  paymentInstallments: number;
  orderStatus: string;
  paymentStatus: string;
  paidAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }>;
}

export default function PaymentSuccess() {
  const [location] = useLocation();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const { items, clearAll } = useMochila();
  const { trackPurchase } = usePixel();
  const purchaseTrackedRef = useRef(false);
  const clearedRef = useRef(false);

  useEffect(() => {
    localStorage.removeItem("oudla_pending_order");
    const params = new URLSearchParams(window.location.search);
    const order = params.get("order");
    if (order) {
      setOrderNumber(order);
    }
    if (items.length > 0 && !clearedRef.current) {
      clearedRef.current = true;
      clearAll();
    }
  }, [location, items, clearAll]);

  // Busca os dados do pedido
  const { data: orderData, isLoading } = useQuery<{ success: boolean; order: OrderData }>({
    queryKey: ["/api/checkout/order", orderNumber],
    enabled: !!orderNumber,
  });

  // Dispara o evento Purchase do Facebook Pixel quando os dados do pedido carregam
  // Este evento rastreia compras finalizadas com sucesso
  useEffect(() => {
    const order = orderData?.order;
    
    // Verifica se o pedido existe e se o evento ainda não foi disparado
    if (order && !purchaseTrackedRef.current) {
      // Marca como disparado para evitar duplicação
      purchaseTrackedRef.current = true;
      
      // Prepara a lista de itens comprados para o evento
      const purchaseItems = order.items?.map((item) => ({
        id: item.productName, // Usa o nome do produto como ID
        name: item.productName,
        quantity: item.quantity,
        price: parseFloat(item.unitPrice),
      })) || [];
      
      // Dispara o evento Purchase com orderId, valor total e itens
      trackPurchase(
        order.orderNumber,
        parseFloat(order.totalAmount),
        "BRL",
        purchaseItems
      );
    }
  }, [orderData?.order, trackPurchase]);

  // Função para baixar o comprovante em PDF
  const handleDownloadPDF = () => {
    if (orderNumber) {
      window.open(`/api/checkout/receipt/${orderNumber}`, "_blank");
    }
  };

  // Formata preço em Real brasileiro
  const formatPrice = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground lowercase">carregando pedido...</p>
        </div>
      </div>
    );
  }

  const order = orderData?.order;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Ícone de sucesso animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </motion.div>

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold lowercase mb-2">pagamento aprovado!</h1>
          <p className="text-muted-foreground lowercase">
            obrigado pela sua compra. seu pedido foi confirmado.
          </p>
        </motion.div>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground lowercase">número do pedido</p>
                    <p className="text-xl font-bold">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground lowercase">total</p>
                    <p className="text-xl font-bold text-primary">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Detalhes do cliente */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground lowercase mb-1">enviamos a confirmação para</p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>

                {/* Método de pagamento */}
                {order.paymentMethod && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground lowercase">método de pagamento</span>
                    <span className="font-medium">
                      {order.paymentMethod}
                      {order.paymentInstallments > 1 && ` (${order.paymentInstallments}x)`}
                    </span>
                  </div>
                )}

                {/* Itens do pedido */}
                <div className="space-y-2">
                  <p className="text-sm font-medium lowercase">itens do pedido</p>
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm py-1">
                      <span>
                        {item.productName} x{item.quantity}
                      </span>
                      <span>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="flex-1 h-12 rounded-full"
                data-testid="button-download-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="lowercase">baixar comprovante</span>
              </Button>
              <Link href="/" className="flex-1">
                <Button className="w-full h-12 rounded-full" data-testid="button-back-home">
                  <Home className="w-4 h-4 mr-2" />
                  <span className="lowercase">voltar à loja</span>
                </Button>
              </Link>
            </div>

            {/* Informação sobre acompanhamento */}
            <div className="mt-8 p-4 bg-muted/20 rounded-xl text-center">
              <Package className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground lowercase">
                você receberá atualizações sobre o envio no seu e-mail.
              </p>
            </div>
          </motion.div>
        )}

        {!order && !isLoading && (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground lowercase mb-4">
                pedido não encontrado
              </p>
              <Link href="/">
                <Button className="rounded-full">
                  <Home className="w-4 h-4 mr-2" />
                  <span className="lowercase">voltar à loja</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
