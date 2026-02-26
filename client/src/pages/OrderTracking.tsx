import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Truck, MapPin, Calendar, ExternalLink, CheckCircle2, Clock, XCircle, PackageCheck, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Footer from "@/components/Footer";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  subtotal: string;
  shippingCost: string;
  totalAmount: string;
  orderStatus: string;
  trackingCode?: string;
  shippingMethod?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  createdAt: string;
  paidAt?: string;
  items: Array<{
    id: string;
    productName: string;
    productImage: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }>;
};

const orderStatusMap: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "aguardando pagamento", icon: Clock, color: "bg-yellow-500/90" },
  paid: { label: "pagamento aprovado", icon: CheckCircle2, color: "bg-green-500/90" },
  processing: { label: "em processamento", icon: Package, color: "bg-blue-500/90" },
  shipped: { label: "em transporte", icon: Truck, color: "bg-purple-500/90" },
  delivered: { label: "entregue", icon: PackageCheck, color: "bg-green-600/90" },
  cancelled: { label: "cancelado", icon: XCircle, color: "bg-red-500/90" },
  failed: { label: "pagamento reprovado", icon: XCircle, color: "bg-red-500/90" },
};

function detectCarrier(trackingCode: string): { name: string; url: string } | null {
  if (!trackingCode) return null;
  const code = trackingCode.toUpperCase().trim().replace(/\s/g, '');
  if (code.length < 5) return null;

  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(code)) return { name: "Correios", url: `https://rastreamento.correios.com.br/app/index.php?codigo=${code}` };
  if (/^1Z[A-Z0-9]{16}$/.test(code)) return { name: "UPS", url: `https://www.ups.com/track?tracknum=${code}` };
  if (/^\d{3}-\d{8}$/.test(code)) return { name: "LATAM Cargo", url: `https://www.latamcargo.com/en/trackshipment?docNumber=${code}` };
  if (/^ME\d{8,}$/.test(code)) return { name: "Melhor Envio", url: `https://melhorrastreio.com.br/rastreio/${code}` };
  if (/^MND[A-Z0-9]+$/.test(code)) return { name: "Mandae", url: `https://rastreae.com.br/resultado/${code}` };
  if (/^JT\d{10,}$/.test(code)) return { name: "J&T Express", url: `https://www.jtexpress.com.br/trajectoryQuery?waybillNo=${code}` };
  if (/^KG[A-Z0-9]+$/.test(code)) return { name: "Kangu", url: `https://www.kangu.com.br/rastreio/${code}` };
  if (/^AZ[A-Z0-9]+$/.test(code)) return { name: "Azul Cargo", url: `https://www.azulcargoexpress.com.br/rastreamento?tracking=${code}` };
  if (/^JD\d{10,}$/.test(code)) return { name: "DHL", url: `https://www.dhl.com/br-pt/home/rastreamento.html?tracking-id=${code}` };
  if (/^LOG[A-Z0-9]{6,}$/.test(code)) return { name: "Loggi", url: `https://www.loggi.com/rastreamento/${code}` };
  if (/^DT[A-Z0-9]{10,}$/.test(code)) return { name: "FedEx", url: `https://www.fedex.com/fedextrack/?trknbr=${code}` };
  if (/^SEQ[A-Z0-9]+$/.test(code)) return { name: "Sequoia", url: `https://sequoialog.com.br/rastreamento/?code=${code}` };
  if (/^BUS[A-Z0-9]+$/.test(code)) return { name: "Buslog", url: `https://buslog.com.br/rastreamento?codigo=${code}` };
  if (/^82\d{8,13}$/.test(code)) return { name: "J&T Express", url: `https://www.jtexpress.com.br/trajectoryQuery?waybillNo=${code}` };
  if (/^6\d{11,21}$/.test(code)) return { name: "FedEx", url: `https://www.fedex.com/fedextrack/?trknbr=${code}` };
  if (/^\d{15,}$/.test(code)) return { name: "Aramex", url: `https://www.aramex.com/track/results?ShipmentNumber=${code}` };
  if (/^\d{10,14}$/.test(code)) return { name: "Jadlog", url: `https://www.jadlog.com.br/tracking?cte=${code}` };
  if (/^\d{8,9}$/.test(code)) return { name: "TNT", url: `https://www.fedex.com/fedextrack/?trknbr=${code}` };
  if (/^\d{5,7}$/.test(code)) return { name: "Total Express", url: `https://status.totalexpress.com.br/tracking/${code}` };

  return null;
}

function TimelineStep({ icon: Icon, label, date, color, isLast }: { icon: any; label: string; date?: string; color: string; isLast?: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className={`${isLast ? '' : 'pb-6'}`}>
        <p className="text-sm font-medium lowercase">{label}</p>
        {date && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
          </p>
        )}
      </div>
    </div>
  );
}

export default function OrderTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSearch, setCurrentSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get("codigo");
    if (codigo) {
      setSearchTerm(codigo);
      setCurrentSearch(codigo);
    }
  }, []);

  const { data, isLoading, error } = useQuery<{ order: Order }>({
    queryKey: ['/api/tracking', currentSearch],
    queryFn: async () => {
      const res = await fetch(`/api/tracking/${encodeURIComponent(currentSearch)}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao buscar pedido');
      }
      return res.json();
    },
    enabled: !!currentSearch && currentSearch.trim().length > 0,
    retry: false,
  });

  const order = data?.order;
  const carrier = order?.trackingCode ? detectCarrier(order.trackingCode) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) return;
    queryClient.removeQueries({ queryKey: ['/api/tracking'] });
    setCurrentSearch(trimmedSearch);
  };

  const statusInfo = order ? orderStatusMap[order.orderStatus] || orderStatusMap.pending : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="pt-16 pb-8 md:pt-24 md:pb-12">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/50 mb-6">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-3 lowercase" data-testid="text-tracking-title">
            rastrear pedido
          </h1>
          <p className="text-muted-foreground text-sm lowercase">
            insira o numero do pedido ou codigo de rastreamento
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-lg mx-auto px-4 mb-12">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-tracking-search"
              placeholder="codigo de rastreio ou numero do pedido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
          <Button
            data-testid="button-search-tracking"
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="h-11 px-6 lowercase"
          >
            {isLoading ? "..." : "rastrear"}
          </Button>
        </form>
      </div>

      {/* Error */}
      {error && currentSearch && !order && (
        <div className="max-w-lg mx-auto px-4 mb-8">
          <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/5 text-destructive text-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            <p data-testid="text-error-message" className="lowercase">
              {(error as any)?.message || "pedido nao encontrado. verifique o numero e tente novamente."}
            </p>
          </div>
        </div>
      )}

      {/* Order Result */}
      {order && (
        <div className="max-w-2xl mx-auto px-4 space-y-6 pb-16">
          {/* Status Header */}
          <div className="text-center space-y-3">
            <Badge
              data-testid={`badge-status-${order.orderStatus}`}
              className="text-white text-xs lowercase"
              style={{ backgroundColor: statusInfo?.color?.replace('/90', '') }}
            >
              {statusInfo?.label}
            </Badge>
            <h2 className="text-2xl font-light tracking-tight lowercase">
              pedido {order.orderNumber}
            </h2>
            <p className="text-xs text-muted-foreground lowercase">
              {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* Tracking Card */}
          {order.trackingCode && (
            <Card className="overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground lowercase mb-1">codigo de rastreio</p>
                    <p data-testid="text-tracking-code" className="font-mono text-sm font-medium">
                      {order.trackingCode}
                    </p>
                  </div>
                  {carrier && (
                    <Badge variant="secondary" className="text-xs lowercase">{carrier.name}</Badge>
                  )}
                </div>

                {carrier && (
                  <Button
                    data-testid="button-track-carrier"
                    className="w-full h-11 lowercase gap-2"
                    asChild
                  >
                    <a href={carrier.url} target="_blank" rel="noopener noreferrer">
                      rastrear na {carrier.name.toLowerCase()}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}

                {order.estimatedDeliveryDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="lowercase">
                      previsao: {format(new Date(order.estimatedDeliveryDate), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                )}

                {order.actualDeliveryDate && (
                  <div className="flex items-center gap-2 text-xs text-green-600 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="lowercase" data-testid="text-actual-delivery">
                      entregue em {format(new Date(order.actualDeliveryDate), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">timeline</p>
              <div>
                {order.actualDeliveryDate && (
                  <TimelineStep
                    icon={PackageCheck}
                    label="entregue"
                    date={order.actualDeliveryDate}
                    color="bg-green-600"
                  />
                )}
                {order.trackingCode && (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') && (
                  <TimelineStep
                    icon={Truck}
                    label="em transporte"
                    color="bg-purple-500"
                  />
                )}
                {order.paidAt && (
                  <TimelineStep
                    icon={CheckCircle2}
                    label="pagamento confirmado"
                    date={order.paidAt}
                    color="bg-green-500"
                  />
                )}
                <TimelineStep
                  icon={Package}
                  label="pedido realizado"
                  date={order.createdAt}
                  color="bg-blue-500"
                  isLast
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">entrega</p>
              </div>
              <div className="text-sm space-y-0.5 lowercase">
                <p data-testid="text-delivery-address" className="font-medium">{order.customerName}</p>
                <p className="text-muted-foreground">
                  {order.street}, {order.number}
                  {order.complement && ` - ${order.complement}`}
                </p>
                <p className="text-muted-foreground">
                  {order.neighborhood} - {order.city}/{order.state}
                </p>
                <p className="text-muted-foreground">cep {order.zipCode}</p>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">itens</p>
              <div className="space-y-3">
                {order.items.map((item) => {
                  let color: any;
                  try {
                    color = typeof item.color === 'string' ? JSON.parse(item.color) : item.color;
                  } catch {
                    color = { name: item.color, hex: '#000000' };
                  }

                  return (
                    <div
                      key={item.id}
                      data-testid={`order-item-${item.id}`}
                      className="flex gap-3"
                    >
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-14 w-14 rounded-md object-cover bg-muted"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate lowercase">{item.productName}</p>
                        <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground lowercase">
                          <span>{item.size}</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full border border-border"
                              style={{ backgroundColor: color.hex }}
                            />
                            {color.name}
                          </span>
                          <span>x{item.quantity}</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium shrink-0 normal-case">
                        R$ {parseFloat(item.subtotal).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground lowercase">
                  <span>subtotal</span>
                  <span data-testid="text-subtotal" className="normal-case">R$ {parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground lowercase">
                  <span>frete</span>
                  <span data-testid="text-shipping-cost" className="normal-case">R$ {parseFloat(order.shippingCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 lowercase">
                  <span>total</span>
                  <span data-testid="text-total-amount" className="normal-case">R$ {parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state when no search */}
      {!order && !error && !currentSearch && (
        <div className="max-w-sm mx-auto px-4 pb-24 text-center">
          <div className="space-y-6 text-muted-foreground/50">
            <Truck className="h-12 w-12 mx-auto" />
            <p className="text-sm lowercase">
              seus detalhes de envio aparecerao aqui
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
