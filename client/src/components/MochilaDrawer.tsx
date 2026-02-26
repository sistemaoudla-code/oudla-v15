import { X, Plus, Minus, ChevronRight, Truck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMochila } from "@/contexts/MochilaContext";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
// Importa o hook do Facebook Pixel para rastreamento de eventos
import { usePixel } from "@/hooks/usePixel";

interface ShippingOption {
  service: string;
  serviceCode: string;
  price: number;
  deadline: number;
}

interface ShippingResult {
  price: number;
  days: string;
  options?: ShippingOption[];
  mode?: string;
  selectedService?: string;
}

export default function MochilaDrawer() {
  const { 
    items, 
    isDrawerOpen, 
    setIsDrawerOpen, 
    updateQuantity, 
    clearAll,
    appliedCoupon,
    setAppliedCoupon,
    appliedDiscount,
    zipCode,
    setZipCode,
    setShippingPrice
  } = useMochila();
  
  // Inicializa o hook do Facebook Pixel para rastreamento de eventos
  const { trackRemoveFromCart } = usePixel();
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [localCep, setLocalCep] = useState(zipCode || "");
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingResult, setShippingResult] = useState<ShippingResult | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const { data: freeShippingConfig } = useQuery<{ system: string; threshold: string; shippingValue: string; shippingMinDays: string; shippingMaxDays: string; shippingMode: string; correiosReady: boolean }>({
    queryKey: ['/api/settings/free_shipping'],
  });

  const { data: ctaConfig } = useQuery<{ mochilaShippingFreeText: string; mochilaShippingPaidText: string }>({
    queryKey: ['/api/settings/cta'],
  });

  const calculateShipping = async (val: string) => {
    const cleanCep = val.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsCalculating(true);
    setShippingError(null);
    setShippingResult(null);
    
    try {
      const viacepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const viacepData = await viacepRes.json();
      
      if (viacepData.erro) {
        setShippingError("cep não encontrado");
        setIsCalculating(false);
        return;
      }

      const calcRes = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: cleanCep,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const calcData = await calcRes.json();

      const isFreeForAll = freeShippingConfig?.system === "all";
      const isThresholdSystem = freeShippingConfig?.system === "threshold" || !freeShippingConfig?.system;
      const threshold = parseFloat(freeShippingConfig?.threshold || "200");
      const currentSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const isFreeByThreshold = isThresholdSystem && currentSubtotal >= threshold;
      const isFree = isFreeForAll || isFreeByThreshold;

      if (calcData.mode === "correios" && calcData.options?.length > 0) {
        const cheapest = calcData.options.reduce((a: ShippingOption, b: ShippingOption) => a.price < b.price ? a : b);
        const price = isFree ? 0 : cheapest.price;
        const deadline = cheapest.deadline;

        const addBusinessDays = (startDate: Date, numDays: number) => {
          const result = new Date(startDate);
          let added = 0;
          while (added < numDays) {
            result.setDate(result.getDate() + 1);
            if (result.getDay() !== 0 && result.getDay() !== 6) added++;
          }
          return result;
        };

        const today = new Date();
        const dateMax = addBusinessDays(today, deadline);
        const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
        const formatDate = (date: Date) => {
          const dia = diasSemana[date.getDay()];
          const d = date.getDate().toString().padStart(2, '0');
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          return `${dia}, ${d}/${m}`;
        };

        const days = `até ${formatDate(dateMax)}`;

        setZipCode(val);
        setShippingPrice(price);
        setShippingResult({
          price,
          days,
          options: calcData.options,
          mode: "correios",
          selectedService: cheapest.service,
        });
      } else {
        const flatPrice = calcData.options?.[0]?.price ?? parseFloat(freeShippingConfig?.shippingValue || "19.99");
        const price = isFree ? 0 : flatPrice;

        const minDays = calcData.minDays ?? parseInt(freeShippingConfig?.shippingMinDays || "9");
        const maxDays = calcData.maxDays ?? parseInt(freeShippingConfig?.shippingMaxDays || "15");

        const addBusinessDays = (startDate: Date, numDays: number) => {
          const result = new Date(startDate);
          let added = 0;
          while (added < numDays) {
            result.setDate(result.getDate() + 1);
            if (result.getDay() !== 0 && result.getDay() !== 6) added++;
          }
          return result;
        };

        const today = new Date();
        const dateMin = addBusinessDays(today, minDays);
        const dateMax = addBusinessDays(today, maxDays);

        const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
        const formatDate = (date: Date) => {
          const dia = diasSemana[date.getDay()];
          const d = date.getDate().toString().padStart(2, '0');
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          return `${dia}, ${d}/${m}`;
        };

        const days = `entre ${formatDate(dateMin)} a ${formatDate(dateMax)}`;

        setZipCode(val);
        setShippingPrice(price);
        setShippingResult({ price, days, mode: "flat" });
      }
    } catch (e) {
      console.error(e);
      setShippingError("erro ao calcular frete");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = val;
    if (val.length > 5) formatted = `${val.slice(0, 5)}-${val.slice(5)}`;
    setLocalCep(formatted);
    if (val.length === 8) calculateShipping(formatted);
  };

  const { data: couponResponse } = useQuery<{ coupon?: any }>({
    queryKey: ['/api/global-coupon'],
  });

  const globalCoupon = couponResponse?.coupon;

  // "all" = frete grátis para todos, "threshold" = frete grátis a partir de R$200
  const isFreeShippingForAll = freeShippingConfig?.system === "all";
  const isShippingSystemThreshold = freeShippingConfig?.system === "threshold" || !freeShippingConfig?.system;
  const thresholdValue = parseFloat(freeShippingConfig?.threshold || "200");
  const defaultShippingValue = parseFloat(freeShippingConfig?.shippingValue || "19.99");
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isFreeShippingByValue = isShippingSystemThreshold && subtotal >= thresholdValue;
  const shipping = isFreeShippingForAll || isFreeShippingByValue ? 0 : (zipCode ? defaultShippingValue : 0);
  const discountAmount = appliedDiscount ? (subtotal * (Number(appliedDiscount) / 100)) : 0;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const total = subtotalAfterDiscount + shipping;
  
  const applyCoupon = async () => {
    if (!couponCode) return;
    
    setIsApplying(true);
    setCouponError(null);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode })
      });
      
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setAppliedCoupon(data.coupon.code, Number(data.coupon.discountValue));
        setCouponCode("");
      } else {
        if (globalCoupon && couponCode.toLowerCase() === globalCoupon.code.toLowerCase()) {
          setAppliedCoupon(globalCoupon.code, Number(globalCoupon.discountValue));
          setCouponCode("");
        } else {
          setCouponError(data.error || "cupom inválido");
        }
      }
    } catch (error) {
      if (globalCoupon && couponCode.toLowerCase() === globalCoupon.code.toLowerCase()) {
        setAppliedCoupon(globalCoupon.code, Number(globalCoupon.discountValue));
        setCouponCode("");
      } else {
        setCouponError("erro ao validar cupom");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    if (zipCode) {
      setLocalCep(zipCode);
      // Calculate shipping when drawer opens with saved CEP
      if (isDrawerOpen && !shippingResult && !isCalculating) {
        calculateShipping(zipCode);
      }
    }
  }, [zipCode, isDrawerOpen]);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            data-testid="backdrop-mochila"
          />

          {/* Menu Panel - Popup Style */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.1, right: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) {
                setIsDrawerOpen(false);
              }
            }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-4 top-4 bottom-4 w-[calc(100%-2rem)] max-w-md bg-background/95 backdrop-blur-xl z-[61] shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col border border-white/10 touch-none"
            data-testid="drawer-mochila"
          >
            {/* Header / Close handle */}
            <div className="flex items-center justify-center pt-4 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight lowercase">minha mochila</h2>
                    {items.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full opacity-30 hover:opacity-100 transition-opacity"
                        onClick={clearAll}
                        data-testid="button-clear-mochila"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full bg-muted/20 hover:bg-muted/40 transition-colors"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {items.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center rounded-[2rem] bg-muted/20 border border-dashed border-muted">
                    <p className="text-sm text-muted-foreground lowercase">sua mochila está vazia</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex gap-3 md:gap-4 p-2.5 md:p-3 rounded-2xl md:rounded-3xl bg-muted/10 border border-transparent hover:border-white/5 transition-all"
                        data-testid={`mochila-item-${item.id}`}
                      >
                        <Link 
                          href={`/produto/${item.productId}`}
                          onClick={() => setIsDrawerOpen(false)}
                          className="flex gap-4 flex-1 min-w-0 cursor-pointer"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-2xl shadow-sm"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                            <h3 className="font-medium text-sm lowercase truncate">{item.name}</h3>
                            <p className="text-xs text-muted-foreground font-medium">{formatPrice(item.price)}</p>
                            
                            {(item.color || item.size) && (
                              <div className="flex items-center gap-2 mt-1">
                                {item.color && (
                                  <div
                                    className="w-3 h-3 rounded-full border border-white/10"
                                    style={{ backgroundColor: item.color.hex }}
                                  />
                                )}
                                {item.size && (
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                    {item.size}
                                  </span>
                                )}
                                {item.fabric && (
                                  <>
                                    <span className="text-[10px] text-muted-foreground/40">•</span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                      {item.fabric.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="flex flex-col items-center justify-between py-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-background/50 hover:bg-background shadow-sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-bold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-background/50 hover:bg-background shadow-sm"
                            onClick={() => {
                              // Quando a quantidade chegar a 0, o item será removido - dispara evento RemoveFromCart
                              if (item.quantity === 1) {
                                trackRemoveFromCart(String(item.productId), item.name, item.price);
                              }
                              updateQuantity(item.id, item.quantity - 1);
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary & Coupon */}
              {items.length > 0 && (
                <div className="mt-8 space-y-6 pb-20">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold lowercase px-2">cupom e frete</h3>
                    
                    <div className="px-2 space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Truck className="h-4 w-4" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">calcular frete e prazo</span>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="00000-000"
                          value={localCep}
                          onChange={handleCepChange}
                          className="h-12 rounded-2xl bg-muted/10 border-transparent lowercase text-sm"
                          maxLength={9}
                          data-testid="input-cep-drawer"
                        />
                        {isCalculating && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {shippingError && (
                        <p className="text-xs text-destructive lowercase ml-1">{shippingError}</p>
                      )}
                      {shippingResult && (
                        <div className="p-3 rounded-xl bg-muted/20 space-y-2">
                          {shippingResult.mode === "correios" && shippingResult.options && shippingResult.options.length > 1 ? (
                            shippingResult.options.map((opt) => {
                              const isFree = isFreeShippingForAll || isFreeShippingByValue;
                              return (
                                <div key={opt.serviceCode} className="flex items-center justify-between text-sm lowercase">
                                  <span className="text-muted-foreground">{opt.service.toLowerCase()}</span>
                                  <span>
                                    {isFree ? (ctaConfig?.mochilaShippingFreeText || "entrega grátis") : <span className="normal-case">{formatPrice(opt.price)}</span>}
                                    {" "}({opt.deadline} dias úteis)
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm lowercase">
                              {isFreeShippingForAll || isFreeShippingByValue
                                ? `${ctaConfig?.mochilaShippingFreeText || "entrega grátis"} ${shippingResult.days}`
                                : <>{ctaConfig?.mochilaShippingPaidText || "entrega por"} <span className="normal-case">{formatPrice(shippingResult.price)}</span> {shippingResult.days}</>}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {!appliedCoupon && (
                      <div className="flex gap-2 px-2">
                        <Input
                          placeholder="digite o cupom"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            if (couponError) setCouponError(null);
                          }}
                          className="h-12 rounded-2xl bg-muted/10 border-transparent lowercase text-sm"
                        />
                        <Button
                          onClick={applyCoupon}
                          disabled={!couponCode || isApplying}
                          className="h-12 rounded-2xl px-6 lowercase"
                        >
                          {isApplying ? "..." : "aplicar"}
                        </Button>
                      </div>
                    )}

                    {appliedCoupon && (
                      <div className="mx-2 p-4 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground lowercase">cupom ativo</span>
                          <span className="text-sm font-bold uppercase">{appliedCoupon} (-{appliedDiscount}%)</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={removeCoupon}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/10 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground lowercase">
                      <span>subtotal</span>
                      <span className="font-medium normal-case">{formatPrice(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-500 lowercase">
                        <span>desconto</span>
                        <span className="font-medium normal-case">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-muted-foreground lowercase">
                      <span>frete</span>
                      <span className="font-medium">{isFreeShippingForAll || isFreeShippingByValue ? "grátis" : <span className="normal-case">{formatPrice(shipping)}</span>}</span>
                    </div>
                    
                    {isFreeShippingByValue && !isFreeShippingForAll && (
                      <div className="flex items-center gap-2 px-1 pt-1">
                        <div className="h-px flex-1 bg-foreground/5" />
                        <span className="text-[10px] text-muted-foreground/50 font-medium lowercase tracking-wide">frete grátis acima de <span className="normal-case">{formatPrice(thresholdValue)}</span></span>
                        <div className="h-px flex-1 bg-foreground/5" />
                      </div>
                    )}
                    
                    {!isFreeShippingForAll && !isFreeShippingByValue && isShippingSystemThreshold && subtotal < thresholdValue && (
                      <div className="pt-1">
                        <div className="w-full h-1 rounded-full bg-foreground/5 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-foreground/20 transition-all duration-500 ease-out"
                            style={{ width: `${Math.min((subtotal / thresholdValue) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground/40 font-medium lowercase text-center mt-1.5">
                          falta <span className="text-foreground/50 normal-case">{formatPrice(thresholdValue - subtotal)}</span> para frete grátis
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-2">
                      <span className="text-lg md:text-xl font-bold lowercase">total</span>
                      <span className="text-xl md:text-2xl font-bold">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-6 pb-8 shrink-0 bg-gradient-to-t from-background to-transparent border-t border-white/5">
              {items.length === 0 ? (
                <Link href="/" className="block w-full">
                  <Button 
                    className="w-full h-14 rounded-full text-lg font-bold lowercase transition-all active:scale-[0.95]"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    ver produtos
                  </Button>
                </Link>
              ) : (
                <Link href="/checkout" className="block w-full">
                  <Button 
                    className="w-full h-14 rounded-full text-lg font-bold lowercase transition-all active:scale-[0.95]"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    concluir pedido
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
