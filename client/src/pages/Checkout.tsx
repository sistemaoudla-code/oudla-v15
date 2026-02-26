import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMochila } from "@/contexts/MochilaContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// Importa o hook do Facebook Pixel para rastreamento de eventos
import { usePixel } from "@/hooks/usePixel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Check, Lock, Truck, Mail, MapPin, User, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import logoSvg from "@/assets/logo.svg";
import mpColorLogo from "@/assets/mp-color.svg";
import mpPlumaLogo from "@/assets/mp-pluma.svg";

function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  let deviceType = "desktop";
  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) {
      deviceType = "tablet";
    } else {
      deviceType = "mobile";
    }
  }
  
  let browserName = "Unknown";
  let browserVersion = "";
  if (ua.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || "";
  } else if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") === -1) {
    browserName = "Chrome";
    browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || "";
  } else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
    browserName = "Safari";
    browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || "";
  } else if (ua.indexOf("Edg") > -1) {
    browserName = "Edge";
    browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || "";
  }
  
  let osName = "Unknown";
  let osVersion = "";
  if (ua.indexOf("Win") > -1) {
    osName = "Windows";
    osVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1] || "";
  } else if (ua.indexOf("Mac") > -1) {
    osName = "macOS";
    osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1].replace("_", ".") || "";
  } else if (ua.indexOf("Linux") > -1) {
    osName = "Linux";
  } else if (ua.indexOf("Android") > -1) {
    osName = "Android";
    osVersion = ua.match(/Android (\d+\.\d+)/)?.[1] || "";
  } else if (ua.indexOf("iOS") > -1 || ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) {
    osName = "iOS";
    osVersion = ua.match(/OS (\d+[._]\d+)/)?.[1].replace("_", ".") || "";
  }
  
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  
  return {
    userAgent: ua,
    deviceType,
    browserName,
    browserVersion,
    osName,
    osVersion,
    screenResolution,
  };
}

// Função para validar CPF
function isValidCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[9])) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[10])) return false;
  
  return true;
}

const contactSchema = z.object({
  customerName: z.string().min(3, "Nome muito curto"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().refine((val) => {
    const numbers = val.replace(/\D/g, '');
    return numbers.length === 10 || numbers.length === 11;
  }, "Telefone deve ter 10 ou 11 dígitos"),
  customerCpf: z.string().refine((val) => isValidCPF(val), "CPF inválido"),
});

const addressSchema = z.object({
  zipCode: z.string().refine((val) => {
    const numbers = val.replace(/\D/g, '');
    return numbers.length === 8;
  }, "CEP deve ter 8 dígitos"),
  street: z.string().min(3, "Endereço muito curto"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro muito curto"),
  city: z.string().min(2, "Cidade muito curta"),
  state: z.string().length(2, "Estado inválido"),
});

type ContactForm = z.infer<typeof contactSchema>;
type AddressForm = z.infer<typeof addressSchema>;

function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

function formatCEP(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
}

const steps = [
  { id: 1, name: "contato", icon: User, title: "informações de contato" },
  { id: 2, name: "entrega", icon: Truck, title: "finalizar compra" },
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, getTotalPrice, isFreeShippingActive, appliedCoupon, appliedDiscount, zipCode, setZipCode, shippingPrice } = useMochila();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);
  
  // Inicializa o hook do Facebook Pixel para rastreamento de eventos
  const { trackInitiateCheckout } = usePixel();
  
  // Dispara o evento InitiateCheckout do Facebook Pixel quando a página carrega
  // Este evento rastreia quando o usuário inicia o processo de checkout
  useEffect(() => {
    if (items.length > 0) {
      // Calcula o valor total e número de itens para o evento
      const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const numItems = items.reduce((sum, item) => sum + item.quantity, 0);
      
      // Dispara o evento com valor total e número de itens
      trackInitiateCheckout(totalValue, "BRL", numItems);
    }
  }, [items.length, trackInitiateCheckout]);

  const [contactData, setContactData] = useState<ContactForm | null>(null);
  const [addressData, setAddressData] = useState<AddressForm | null>(null);

  // Buscar configurações de frete do admin
  const { data: shippingSettings } = useQuery<{ system: string; threshold: string; shippingValue: string }>({
    queryKey: ["/api/settings/free_shipping"],
  });
  
  const isFreeShippingForAll = shippingSettings?.system === "all";
  const freeShippingThreshold = shippingSettings?.threshold ? parseFloat(shippingSettings.threshold) : 200;
  const configuredShippingPrice = shippingSettings?.shippingValue ? parseFloat(shippingSettings.shippingValue) : 23;

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerCpf: "",
    },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      zipCode: zipCode || "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  useEffect(() => {
    if (zipCode && zipCode.length === 9 && !addressForm.getValues("street")) {
      handleCepBlur();
    }
  }, [zipCode]);

  useEffect(() => {
    if (items.length === 0) {
      const pendingOrder = localStorage.getItem("oudla_pending_order");
      if (pendingOrder) return;
      setLocation("/produtos");
    }
  }, [items, setLocation]);

  useEffect(() => {
    const checkPendingOrder = async () => {
      const pendingOrder = localStorage.getItem("oudla_pending_order");
      if (!pendingOrder) return;

      try {
        const res = await fetch(`/api/checkout/payment-status/${pendingOrder}`);
        const data = await res.json();
        if (data.success) {
          if (data.paymentStatus === "approved" || data.orderStatus === "paid") {
            localStorage.removeItem("oudla_pending_order");
            setLocation(`/pagamento/sucesso?order=${pendingOrder}`);
          } else if (data.paymentStatus === "rejected" || data.orderStatus === "failed") {
            localStorage.removeItem("oudla_pending_order");
            setLocation(`/pagamento/falha?order=${pendingOrder}`);
          } else if ((data.paymentStatus === "pending" || data.paymentStatus === "in_process") && data.paymentMethod) {
            localStorage.removeItem("oudla_pending_order");
            setLocation(`/pagamento/pendente?order=${pendingOrder}`);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar pedido pendente:", err);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkPendingOrder();
      }
    };

    const handleFocus = () => {
      checkPendingOrder();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [setLocation]);

  const handleCepBlur = async () => {
    const cep = addressForm.getValues("zipCode").replace(/\D/g, '');
    
    if (cep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          variant: "destructive",
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado e tente novamente.",
        });
        return;
      }

      addressForm.setValue("street", data.logradouro || "");
      addressForm.setValue("neighborhood", data.bairro || "");
      addressForm.setValue("city", data.localidade || "");
      addressForm.setValue("state", data.uf || "");

      setZipCode(formatCEP(cep));

      setTimeout(() => {
        numberInputRef.current?.focus();
        numberInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço.",
      });
    } finally {
      setIsLoadingCep(false);
    }
  };

  const onContactSubmit = (data: ContactForm) => {
    // Formata os dados antes de salvar
    const formattedData = {
      ...data,
      customerPhone: formatPhone(data.customerPhone),
      customerCpf: formatCPF(data.customerCpf),
    };
    setContactData(formattedData);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onAddressSubmit = async (data: AddressForm) => {
    // Formata o CEP antes de salvar
    const formattedData = {
      ...data,
      zipCode: formatCEP(data.zipCode),
    };
    setAddressData(formattedData);
    
    // Processar pagamento diretamente
    if (!contactData) return;

    setIsSubmitting(true);
    try {
      const checkoutItems = items.map((item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;

        return {
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          size: item.size || null,
          color: item.color || null,
          fabric: item.fabric || null,
          printPosition: item.printPosition || null,
          unitPrice: price.toString(),
          quantity: item.quantity,
          subtotal: (price * item.quantity).toString(),
        };
      });

      const subtotalValue = getTotalPrice();
      const discountValue = appliedDiscount ? (subtotalValue * appliedDiscount) / 100 : 0;
      const isFreeShippingByValue = subtotalValue >= freeShippingThreshold;
      
      const shippingCostValue = (isFreeShippingForAll || isFreeShippingActive || isFreeShippingByValue) ? 0 : (shippingPrice || configuredShippingPrice);
      
      const totalAmountValue = subtotalValue - discountValue + shippingCostValue;

      const deviceInfo = getDeviceInfo();
      
      const response = await apiRequest("POST", "/api/checkout/create-order", {
        ...contactData,
        ...formattedData,
        items: checkoutItems,
        subtotal: subtotalValue.toFixed(2),
        discountAmount: discountValue.toFixed(2),
        shippingCost: shippingCostValue.toFixed(2),
        totalAmount: totalAmountValue.toFixed(2),
        appliedCoupon,
        ...deviceInfo,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro na resposta:", errorData);
        throw new Error(errorData.error || "Erro ao criar pedido");
      }

      const result = await response.json();
      
      if (result.success) {
        localStorage.setItem("oudla_pending_order", result.orderNumber || "");

        toast({
          title: "Pedido criado!",
          description: "Redirecionando para pagamento...",
        });

        const preferenceResponse = await apiRequest("POST", "/api/checkout/create-preference", {
          orderId: result.orderId,
        });

        if (!preferenceResponse.ok) {
          const prefError = await preferenceResponse.json();
          console.error("Erro ao criar preferência MP:", prefError);
          throw new Error(prefError.error || "Erro ao iniciar pagamento");
        }

        const preferenceData = await preferenceResponse.json();

        if (preferenceData.success) {
          const paymentUrl = preferenceData.isProduction
            ? preferenceData.initPoint
            : preferenceData.sandboxInitPoint;
          
          if (paymentUrl) {
            const opened = window.open(paymentUrl, "_blank");
            if (!opened) {
              window.location.href = paymentUrl;
            }
            setIsSubmitting(false);
          } else {
            throw new Error("Falha ao obter link de pagamento");
          }
        } else {
          throw new Error("Falha ao obter link de pagamento");
        }
      } else {
        throw new Error(result.error || "Erro ao criar pedido");
      }
    } catch (error) {
      console.error("Erro ao processar checkout:", error);
      const errorMessage = error instanceof Error ? error.message : "Por favor, tente novamente mais tarde.";
      toast({
        variant: "destructive",
        title: "Erro ao processar pedido",
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const subtotalValue = getTotalPrice();
  const isFreeShippingByValue = subtotalValue >= freeShippingThreshold;
  
  const shippingValue = (isFreeShippingForAll || isFreeShippingActive || isFreeShippingByValue) ? 0 : (shippingPrice || configuredShippingPrice);
  
  const discountValue = appliedDiscount ? (subtotalValue * (Number(appliedDiscount) / 100)) : 0;
  const subtotalAfterDiscount = subtotalValue - discountValue;
  const totalValue = subtotalAfterDiscount + shippingValue;

  return (
    <div className="min-h-screen bg-background">
      {/* Simplified Checkout Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex h-14 items-center justify-between px-6 max-w-4xl mx-auto">
          <button 
            className="flex items-center"
            data-testid="button-logo-checkout"
            onClick={() => setLocation("/")}
          >
            <img src={logoSvg} alt="Oudla Logo" className="h-7 w-7 object-contain dark:invert" />
          </button>
          
          <div className="flex items-center gap-2">
            <img src={mpColorLogo} alt="Mercado Pago" className="h-6 w-auto block dark:hidden" />
            <img src={mpPlumaLogo} alt="Mercado Pago" className="h-6 w-auto hidden dark:block" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => currentStep === 1 ? setLocation("/") : setCurrentStep(currentStep - 1)}
          className="mb-6 -ml-2 text-muted-foreground"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          voltar
        </Button>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-6 max-w-xs mx-auto">
            {steps.map((step, index) => (
              <div key={`step-${step.id}`} className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      currentStep > step.id
                        ? "bg-foreground text-background"
                        : currentStep === step.id
                        ? "bg-foreground text-background ring-4 ring-foreground/10"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`text-[11px] font-medium lowercase tracking-wide ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground/60"}`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-20 h-px -mt-5">
                    <div className={`h-full transition-all duration-500 ${currentStep > step.id ? "bg-foreground" : "bg-muted/50"}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Contact Information */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-10">
                  <h1 className="text-2xl font-semibold lowercase tracking-tight mb-2">seus dados</h1>
                  <p className="text-sm text-muted-foreground/70 lowercase">
                    pra te enviar atualizações do pedido
                  </p>
                </div>

                <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label htmlFor="customerName" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">nome completo</label>
                      <Input
                        id="customerName"
                        {...contactForm.register("customerName")}
                        placeholder="joão silva"
                        className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                        data-testid="input-name"
                      />
                      {contactForm.formState.errors.customerName && (
                        <p className="text-[11px] text-destructive pl-1 lowercase">
                          {contactForm.formState.errors.customerName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="customerEmail" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">email</label>
                      <Input
                        id="customerEmail"
                        type="email"
                        {...contactForm.register("customerEmail")}
                        placeholder="joao@email.com"
                        className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                        data-testid="input-email"
                      />
                      {contactForm.formState.errors.customerEmail && (
                        <p className="text-[11px] text-destructive pl-1 lowercase">
                          {contactForm.formState.errors.customerEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="customerPhone" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">telefone</label>
                      <Input
                        id="customerPhone"
                        {...contactForm.register("customerPhone")}
                        placeholder="(11) 98765-4321"
                        maxLength={15}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          contactForm.setValue("customerPhone", formatted);
                        }}
                        className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                        data-testid="input-phone"
                      />
                      {contactForm.formState.errors.customerPhone && (
                        <p className="text-[11px] text-destructive pl-1 lowercase">
                          {contactForm.formState.errors.customerPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="customerCpf" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">cpf</label>
                      <Input
                        id="customerCpf"
                        {...contactForm.register("customerCpf")}
                        placeholder="123.456.789-00"
                        maxLength={14}
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value);
                          contactForm.setValue("customerCpf", formatted);
                        }}
                        className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                        data-testid="input-cpf"
                      />
                      {contactForm.formState.errors.customerCpf && (
                        <p className="text-[11px] text-destructive pl-1 lowercase">
                          {contactForm.formState.errors.customerCpf.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 text-[15px] font-semibold rounded-2xl mt-10"
                    data-testid="button-continue-to-address"
                  >
                    continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 2: Address & Payment */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                  <h1 className="text-2xl font-semibold lowercase tracking-tight mb-2">finalizar compra</h1>
                  <p className="text-sm text-muted-foreground/70 lowercase">
                    endereço de entrega e resumo do pedido
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Address Form */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center">
                        <MapPin className="h-4 w-4 opacity-50" />
                      </div>
                      <h2 className="text-lg font-medium lowercase">endereço de entrega</h2>
                    </div>
                    <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-6" id="address-form">
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label htmlFor="zipCode" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">cep</label>
                      <Input
                        id="zipCode"
                        {...addressForm.register("zipCode")}
                        placeholder="12345-678"
                        maxLength={9}
                        onChange={(e) => {
                          const formatted = formatCEP(e.target.value);
                          addressForm.setValue("zipCode", formatted);
                        }}
                        onBlur={handleCepBlur}
                        disabled={isLoadingCep}
                        className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                        data-testid="input-zipcode"
                      />
                      {addressForm.formState.errors.zipCode && (
                        <p className="text-[11px] text-destructive pl-1 lowercase">
                          {addressForm.formState.errors.zipCode.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1.5">
                        <label htmlFor="street" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">rua</label>
                        <Input
                          id="street"
                          {...addressForm.register("street")}
                          placeholder="rua das flores"
                          disabled={isLoadingCep}
                          className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                          data-testid="input-street"
                        />
                        {addressForm.formState.errors.street && (
                          <p className="text-[11px] text-destructive pl-1 lowercase">
                            {addressForm.formState.errors.street.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="number" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">número</label>
                        <Input
                          id="number"
                          {...(() => {
                            const { ref: formRef, ...rest } = addressForm.register("number");
                            return {
                              ...rest,
                              ref: (el: HTMLInputElement | null) => {
                                formRef(el);
                                (numberInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                              }
                            };
                          })()}
                          placeholder="123"
                          className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                          data-testid="input-number"
                        />
                        {addressForm.formState.errors.number && (
                          <p className="text-[11px] text-destructive pl-1 lowercase">
                            {addressForm.formState.errors.number.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="complement" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">complemento (opcional)</label>
                      <Input
                        id="complement"
                        {...addressForm.register("complement")}
                        placeholder="apto 45"
                        className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                        data-testid="input-complement"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="neighborhood" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">bairro</label>
                      <Input
                        id="neighborhood"
                        {...addressForm.register("neighborhood")}
                        placeholder="centro"
                        disabled={isLoadingCep}
                        className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                        data-testid="input-neighborhood"
                      />
                      {addressForm.formState.errors.neighborhood && (
                        <p className="text-[11px] text-destructive pl-1 lowercase">
                          {addressForm.formState.errors.neighborhood.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="city" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">cidade</label>
                        <Input
                          id="city"
                          {...addressForm.register("city")}
                          placeholder="são paulo"
                          disabled={isLoadingCep}
                          className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                          data-testid="input-city"
                        />
                        {addressForm.formState.errors.city && (
                          <p className="text-[11px] text-destructive pl-1 lowercase">
                            {addressForm.formState.errors.city.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="state" className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium pl-1">estado</label>
                        <Input
                          id="state"
                          {...addressForm.register("state")}
                          placeholder="SP"
                          maxLength={2}
                          onChange={(e) => {
                            addressForm.setValue("state", e.target.value.toUpperCase());
                          }}
                          disabled={isLoadingCep}
                          className="h-14 text-base bg-muted/40 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted/60 transition-colors"
                          data-testid="input-state"
                        />
                        {addressForm.formState.errors.state && (
                          <p className="text-[11px] text-destructive pl-1 lowercase">
                            {addressForm.formState.errors.state.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Column: Order Summary & Mercado Pago Info */}
              <div className="space-y-6">
                    {/* Order Summary Card */}
                    <Card className="p-6 rounded-3xl border-0 bg-muted/20">
                      <div className="flex items-center gap-2 mb-5">
                        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">resumo do pedido</h3>
                      </div>
                      
                      <div className="space-y-4 mb-6">
                        {items.map((item) => {
                          const colorData = item.color;
                          return (
                            <div key={`${item.productId}-${item.size}-${item.color?.hex || 'default'}`} className="flex gap-4">
                              <div className="relative w-[72px] h-[72px] bg-muted/30 rounded-2xl overflow-hidden flex-shrink-0">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                )}
                                <div className="absolute -top-1.5 -right-1.5 bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                                  {item.quantity}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium lowercase truncate">
                                  {item.name}
                                </h4>
                                <p className="text-xs text-muted-foreground lowercase">
                                  {[
                                    item.size,
                                    colorData?.name,
                                    item.fabric?.name,
                                    item.printPosition ? `estampa ${item.printPosition}` : null
                                  ].filter(Boolean).join(' · ')}
                                </p>
                              </div>
                              <div className="text-sm font-medium">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground lowercase">subtotal</span>
                          <span>R$ {subtotalValue.toFixed(2)}</span>
                        </div>
                        {discountValue > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span className="lowercase">desconto</span>
                            <span>-R$ {discountValue.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-muted-foreground lowercase">frete</span>
                          <span className={isFreeShippingForAll || isFreeShippingActive || isFreeShippingByValue ? "text-primary lowercase" : "lowercase"}>
                            {isFreeShippingForAll || isFreeShippingActive || isFreeShippingByValue ? "grátis" : <span className="normal-case">R$ {shippingValue.toFixed(2).replace('.', ',')}</span>}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-medium pt-2">
                          <span className="lowercase">total</span>
                          <span>R$ {totalValue.toFixed(2)}</span>
                        </div>
                      </div>
                    </Card>

                    <Button
                      type="submit"
                      form="address-form"
                      className="w-full h-14 text-[15px] font-semibold rounded-2xl"
                      disabled={isSubmitting}
                      data-testid="button-proceed-payment"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                          processando...
                        </div>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          finalizar e pagar
                        </>
                      )}
                    </Button>


                <p className="text-[11px] text-center text-muted-foreground/50 lowercase px-4 mt-4">
                  ao finalizar, seu pedido será confirmado e você receberá um email com os detalhes
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
        </AnimatePresence>
      </div>
    </div>
  );
}