import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Package, MapPin, Download, Home } from "lucide-react";
import { useMochila } from "@/contexts/MochilaContext";

interface OrderItem {
  productName: string;
  productImage: string;
  size: string;
  color: { name: string; hex: string } | null;
  printPosition: string | null;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  subtotal: string;
  shippingCost: string;
  totalAmount: string;
  orderStatus: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  paymentInstallments: number | null;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
}

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, any>) => void;
  }
}

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const { items, clearAll } = useMochila();
  const [orderNumber, setOrderNumber] = useState<string>("");
  const clearedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const externalReference = params.get("external_reference");
    if (externalReference) {
      setOrderNumber(externalReference);
    }
    
    if (items.length > 0 && !clearedRef.current) {
      clearedRef.current = true;
      clearAll();
    }
  }, [items, clearAll]);

  const { data: orderData, isLoading } = useQuery<{ success: boolean; order: OrderData }>({
    queryKey: ['/api/checkout/order', orderNumber],
    enabled: !!orderNumber,
    queryFn: async () => {
      const response = await fetch(`/api/checkout/order/${orderNumber}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar pedido');
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (orderData?.order && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: parseFloat(orderData.order.totalAmount),
        currency: 'BRL',
        content_ids: orderData.order.items.map(item => item.productName),
        content_type: 'product',
        num_items: orderData.order.items.reduce((acc, item) => acc + item.quantity, 0)
      });
    }
  }, [orderData]);

  const handleDownloadReceipt = () => {
    if (orderNumber) {
      window.open(`/api/checkout/receipt/${orderNumber}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <Card className="max-w-2xl w-full p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    );
  }

  const order = orderData?.order;

  return (
    <div className="min-h-screen px-4 py-12 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-primary" data-testid="icon-success" />
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-light lowercase">pagamento aprovado!</h1>
            <p className="text-muted-foreground lowercase">
              seu pedido foi confirmado com sucesso
            </p>
          </div>

          {orderNumber && (
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground lowercase mb-1">
                número do pedido
              </p>
              <p className="text-2xl font-medium" data-testid="text-order-number">
                {orderNumber}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground lowercase">
              enviamos um email para <strong>{order?.customerEmail}</strong> com os detalhes do seu pedido
            </p>
          </div>
        </Card>

        {order && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 lowercase">
                  <Package className="h-5 w-5" />
                  itens do pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4" data-testid={`order-item-${index}`}>
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-md"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium lowercase">{item.productName}</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>tamanho: {item.size}</p>
                        {item.color && (
                          <p className="flex items-center gap-2">
                            cor: {item.color.name}
                            <span
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: item.color.hex }}
                            />
                          </p>
                        )}
                        {item.printPosition && <p>estampa: {item.printPosition}</p>}
                        <p>quantidade: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {item.subtotal}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground lowercase">subtotal</span>
                    <span>R$ {order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground lowercase">frete</span>
                    <span>R$ {order.shippingCost}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="lowercase">total</span>
                    <span data-testid="text-total">R$ {order.totalAmount}</span>
                  </div>
                </div>

                {order.paymentMethod && (
                  <div className="bg-muted/30 rounded-lg p-4 text-sm">
                    <p className="text-muted-foreground lowercase mb-1">forma de pagamento</p>
                    <p className="font-medium lowercase">
                      {order.paymentMethod}
                      {order.paymentInstallments && order.paymentInstallments > 1 && 
                        ` (${order.paymentInstallments}x)`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 lowercase">
                  <MapPin className="h-5 w-5" />
                  endereço de entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.customerName}</p>
                  <p>{order.street}, {order.number}</p>
                  {order.complement && <p>{order.complement}</p>}
                  <p>{order.neighborhood}</p>
                  <p>{order.city} - {order.state}</p>
                  <p>CEP: {order.zipCode}</p>
                  <p className="pt-2 text-muted-foreground">Telefone: {order.customerPhone}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadReceipt}
            data-testid="button-download-receipt"
          >
            <Download className="mr-2 h-4 w-4" />
            baixar comprovante
          </Button>
          <Button
            className="flex-1"
            onClick={() => setLocation("/")}
            data-testid="button-go-home"
          >
            <Home className="mr-2 h-4 w-4" />
            voltar para a home
          </Button>
        </div>
      </div>
    </div>
  );
}
