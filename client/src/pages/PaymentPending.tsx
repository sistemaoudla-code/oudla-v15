/**
 * Página de Pagamento Pendente
 * 
 * Exibida quando o pagamento ainda está sendo processado (PIX, Boleto, etc).
 * Orienta o cliente sobre como finalizar o pagamento.
 */

import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Home, RefreshCw, Download } from "lucide-react";
import { motion } from "framer-motion";

interface OrderData {
  orderNumber: string;
  customerEmail: string;
  totalAmount: string;
  paymentStatus: string;
  orderStatus: string;
}

export default function PaymentPending() {
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
  const { data: orderData, isLoading, refetch } = useQuery<{ success: boolean; order: OrderData }>({
    queryKey: ["/api/checkout/order", orderNumber],
    enabled: !!orderNumber,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  // Formata preço em Real brasileiro
  const formatPrice = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  // Função para baixar o comprovante em PDF
  const handleDownloadPDF = () => {
    if (orderNumber) {
      window.open(`/api/checkout/receipt/${orderNumber}`, "_blank");
    }
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

  // Se o pagamento foi aprovado, redireciona para sucesso
  if (order?.paymentStatus === "approved" || order?.orderStatus === "paid") {
    window.location.href = `/pagamento/sucesso?order=${orderNumber}`;
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Ícone de pendente animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center">
            <Clock className="w-12 h-12 text-yellow-500" />
          </div>
        </motion.div>

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold lowercase mb-2">pagamento pendente</h1>
          <p className="text-muted-foreground lowercase">
            estamos aguardando a confirmação do seu pagamento.
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
                    <p className="text-sm text-muted-foreground lowercase">valor</p>
                    <p className="text-xl font-bold text-primary">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instruções */}
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm lowercase">
                    <strong>importante:</strong> se você escolheu pagar com pix ou boleto, 
                    siga as instruções enviadas para seu e-mail para completar o pagamento.
                  </p>
                </div>

                {/* Email de confirmação */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground lowercase mb-1">
                    enviamos as instruções para
                  </p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>

                {/* Status atual */}
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground lowercase">status</span>
                  <span className="text-yellow-600 font-medium lowercase">aguardando pagamento</span>
                </div>
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="flex-1 h-12 rounded-full"
                data-testid="button-refresh-status"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="lowercase">atualizar status</span>
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="flex-1 h-12 rounded-full"
                data-testid="button-download-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="lowercase">baixar pedido</span>
              </Button>
            </div>

            <div className="mt-4">
              <Link href="/">
                <Button variant="ghost" className="w-full h-12 rounded-full" data-testid="button-back-home">
                  <Home className="w-4 h-4 mr-2" />
                  <span className="lowercase">voltar à loja</span>
                </Button>
              </Link>
            </div>

            {/* Info de atualização automática */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground lowercase">
                esta página atualiza automaticamente a cada 10 segundos
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
