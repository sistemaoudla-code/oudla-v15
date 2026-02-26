/**
 * Página de Falha no Pagamento
 * 
 * Exibida quando o pagamento é rejeitado ou ocorre algum erro.
 * Oferece opções para tentar novamente ou entrar em contato.
 */

import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { XCircle, Home, RefreshCw, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface OrderData {
  orderNumber: string;
  customerEmail: string;
  totalAmount: string;
  paymentStatus: string;
  orderStatus: string;
}

export default function PaymentFailure() {
  const [location] = useLocation();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Extrai o número do pedido da URL
  useEffect(() => {
    localStorage.removeItem("oudla_pending_order");
    const params = new URLSearchParams(window.location.search);
    const order = params.get("order");
    if (order) {
      setOrderNumber(order);
    }
  }, [location]);

  // Busca os dados do pedido
  const { data: orderData, isLoading } = useQuery<{ success: boolean; order: OrderData }>({
    queryKey: ["/api/checkout/order", orderNumber],
    enabled: !!orderNumber,
  });

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
          <p className="text-muted-foreground lowercase">carregando...</p>
        </div>
      </div>
    );
  }

  const order = orderData?.order;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Ícone de erro animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </motion.div>

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold lowercase mb-2">pagamento não aprovado</h1>
          <p className="text-muted-foreground lowercase">
            infelizmente não foi possível processar seu pagamento.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6">
            <CardHeader className="pb-4">
              {order && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground lowercase">pedido</p>
                    <p className="text-xl font-bold">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground lowercase">valor</p>
                    <p className="text-xl font-bold">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Possíveis motivos */}
              <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/10">
                <p className="text-sm font-medium lowercase mb-2">possíveis motivos:</p>
                <ul className="text-sm text-muted-foreground space-y-1 lowercase">
                  <li>• cartão sem limite disponível</li>
                  <li>• dados do cartão incorretos</li>
                  <li>• transação bloqueada pelo banco</li>
                  <li>• cartão vencido</li>
                </ul>
              </div>

              {/* Sugestões */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium lowercase mb-2">o que você pode fazer:</p>
                <ul className="text-sm text-muted-foreground space-y-1 lowercase">
                  <li>• tente usar outro cartão ou forma de pagamento</li>
                  <li>• verifique se os dados estão corretos</li>
                  <li>• entre em contato com seu banco</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex flex-col gap-3">
            <Link href="/checkout">
              <Button className="w-full h-12 rounded-full" data-testid="button-try-again">
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="lowercase">tentar novamente</span>
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full h-12 rounded-full" data-testid="button-back-home">
                <Home className="w-4 h-4 mr-2" />
                <span className="lowercase">voltar à loja</span>
              </Button>
            </Link>
          </div>

          {/* Contato para ajuda */}
          <div className="mt-8 p-4 bg-muted/20 rounded-xl text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground lowercase">
              precisa de ajuda? entre em contato conosco pelo whatsapp
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
