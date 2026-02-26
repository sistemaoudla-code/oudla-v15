import { 
  SiVisa, 
  SiMastercard, 
  SiAmericanexpress,
  SiPix,
  SiDinersclub,
  SiDiscover,
  SiPaypal,
  SiApplepay,
  SiGooglepay,
} from "react-icons/si";

const BRAND_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  pix: SiPix,
  visa: SiVisa,
  mastercard: SiMastercard,
  amex: SiAmericanexpress,
  diners: SiDinersclub,
  discover: SiDiscover,
  paypal: SiPaypal,
  applepay: SiApplepay,
  googlepay: SiGooglepay,
  boleto: Banknote,
  caixa: Landmark,
  elo: CreditCard,
  hipercard: CreditCard,
  cabal: CreditCard,
  debito_visa: SiVisa,
  debito_master: SiMastercard,
  debito_elo: CreditCard,
  debito_cabal: CreditCard,
  mercadopago: Wallet,
  account_money: Wallet,
};
import { X } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronRight,
  Share2, 
  Star,
  Truck,
  Shield,
  Lock,
  CheckCircle,
  Award,
  Sparkles,
  Circle,
  ArrowRight,
  MapPin,
  Droplet,
  Zap,
  Feather,
  Heart,
  Ruler,
  CreditCard,
  ChevronDown,
  Search,
  ArrowLeft,
  Banknote,
  Landmark,
  Wallet,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselApi 
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useMochila } from "@/contexts/MochilaContext";
import { useFavoritos } from "@/contexts/FavoritosContext";
import MochilaToast from "@/components/MochilaToast";
// Importa o hook do Facebook Pixel para rastreamento de eventos
import { usePixel } from "@/hooks/usePixel";
import RelatedProducts from "@/components/RelatedProducts";
import SizeChartModal from "@/components/SizeChartModal";
import ReviewsModal from "@/components/ReviewsModal";
import type { MochilaItem } from "@/contexts/MochilaContext";

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'%3E%3Crect width='400' height='533' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, sans-serif' font-size='18' fill='%239ca3af'%3Eimagem indisponível%3C/text%3E%3C/svg%3E";

function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 h-9 w-24 bg-muted animate-pulse rounded" />
        
        <div className="space-y-8">
          <div className="aspect-[3/4] bg-muted animate-pulse rounded-xl" />
          
          <div className="space-y-6 pb-32">
            <div className="space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-8 bg-muted animate-pulse rounded w-40" />
              <div className="h-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const previewToken = searchParams.get("preview");
  const { addItem, setIsDrawerOpen } = useMochila();
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const { toggleFavorito, isFavorito, triggerFavoritoToast } = useFavoritos();
  
  // Inicializa o hook do Facebook Pixel para rastreamento de eventos
  const { trackViewContent, trackAddToCart, trackAddToWishlist } = usePixel();
  
  const { data: apiProduct, isLoading } = useQuery<{product: any}>({
    queryKey: ['/api/products', id],
    enabled: !!id,
  });

  const product = apiProduct?.product;
  
  const colors = useMemo(() => {
    if (!product?.colors) return [];
    if (typeof product.colors === 'string') {
      try {
        const parsed = JSON.parse(product.colors);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (Array.isArray(product.colors) && product.colors[0]?.name && product.colors[0]?.hex) {
      return product.colors;
    }
    if (Array.isArray(product.colors) && typeof product.colors[0] === 'string') {
      return product.colors.map((hex: string) => ({ 
        hex, 
        name: hex, 
        isPopular: hex === '#000000' || hex === '#ffffff' 
      }));
    }
    return [];
  }, [product]);
  
  const sizes = useMemo(() => {
    if (!product?.sizes) return [];
    if (Array.isArray(product.sizes) && typeof product.sizes[0] === 'string') {
      return product.sizes.map((size: string) => ({ 
        name: size, 
        available: true
      }));
    }
    return product.sizes || [];
  }, [product]);

  const fabrics = useMemo(() => {
    if (!product?.fabrics) return [];
    if (typeof product.fabrics === 'string') {
      try {
        return JSON.parse(product.fabrics);
      } catch {
        return [];
      }
    }
    return Array.isArray(product.fabrics) ? product.fabrics : [];
  }, [product]);
  
  
  const [cep, setCep] = useState("");
  const [shippingResult, setShippingResult] = useState<{ price: number; days: string; address?: string; options?: any[] } | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formattedCep = value;
    if (value.length > 5) {
      formattedCep = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCep(formattedCep);
    setShippingError(null);

    if (formattedCep.replace(/\D/g, "").length === 8) {
      calculateShipping(formattedCep);
      setZipCode(formattedCep);
      setShippingPrice(defaultShippingValue);
    }
  };

  const { setZipCode, setShippingPrice, zipCode: storedZip } = useMochila();

  useEffect(() => {
    if (storedZip && !cep) {
      setCep(storedZip);
      calculateShipping(storedZip, false);
    }
  }, [storedZip]);

  const calculateShipping = async (zipCode: string, shouldAdvanceStep = true) => {
    const cleanCep = zipCode.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    
    setIsCalculatingShipping(true);
    setShippingResult(null);

    try {
      const addressResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const addressData = await addressResponse.json();

      if (addressData.erro) {
        setShippingError("cep não encontrado");
        setIsCalculatingShipping(false);
        return;
      }
      
      setShippingError(null);

      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Verificar se frete é grátis para todo o site
      const isFreeForAll = freeShippingConfig?.system === "all";
      const price = isFreeForAll ? 0 : defaultShippingValue;
      
      // Calculate delivery dates (9 to 15 business days)
      const today = new Date();
      const addBusinessDays = (date: Date, days: number) => {
        const result = new Date(date);
        let added = 0;
        while (added < days) {
          result.setDate(result.getDate() + 1);
          if (result.getDay() !== 0 && result.getDay() !== 6) added++;
        }
        return result;
      };

      const minDaysVal = parseInt(freeShippingConfig?.shippingMinDays || "9");
      const maxDaysVal = parseInt(freeShippingConfig?.shippingMaxDays || "15");
      const dateMin = addBusinessDays(today, minDaysVal);
      const dateMax = addBusinessDays(today, maxDaysVal);
      
      const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
      };

      const days = `entre ${formatDate(dateMin)} a ${formatDate(dateMax)}`;
      
      setShippingResult({
        price,
        days,
        address: `${addressData.logradouro}, ${addressData.bairro} - ${addressData.localidade}/${addressData.uf}`,
        options: [
          { name: 'Correios', price, days }
        ]
      });
      
      setShippingPrice(price);
      
      // Auto move to summary and scroll (only when user manually enters CEP)
      if (shouldAdvanceStep) {
        setCurrentStep(summaryStepNumber);
        setTimeout(() => {
          const summaryElement = document.getElementById('order-summary');
          summaryElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedFabric, setSelectedFabric] = useState<any>(null);
  const [selectedPrintPosition, setSelectedPrintPosition] = useState<"frente" | "costas" | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  
  // Sistema dinâmico de passos - calcula o número do passo baseado nas opções ativas
  const hasColorStep = colors.length > 0;
  const hasSizeStep = sizes.length > 0;
  const hasFabricStep = product?.fabricsEnabled && fabrics.length > 0;
  const hasPrintPositionStep = product?.customizableFront || product?.customizableBack;
  
  // Calcula o número dinâmico de cada passo (passos de seleção de produto)
  // Cada passo usa índices sequenciais inteiros
  let stepIndex = 1;
  const colorStepNumber = hasColorStep ? stepIndex++ : 0;
  const sizeStepNumber = hasSizeStep ? stepIndex++ : 0;
  const fabricStepNumber = hasFabricStep ? stepIndex++ : 0;
  const printPositionStepNumber = hasPrintPositionStep ? stepIndex++ : 0;
  const summaryStepNumber = stepIndex; // CEP agora é opcional dentro do resumo
  
  // Primeiro passo ativo
  const firstActiveStep = hasColorStep ? colorStepNumber : 
                          hasSizeStep ? sizeStepNumber : 
                          hasFabricStep ? fabricStepNumber : 
                          hasPrintPositionStep ? printPositionStepNumber : 
                          summaryStepNumber;

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  };

  const goToNextStep = (fromStep: 'color' | 'size' | 'fabric' | 'printPosition') => {
    if (fromStep === 'color') {
      if (hasSizeStep) {
        setCurrentStep(sizeStepNumber);
        scrollToRef(sizeSectionRef);
      } else if (hasFabricStep) {
        setCurrentStep(fabricStepNumber);
        scrollToRef(fabricSectionRef);
      } else if (hasPrintPositionStep) {
        setCurrentStep(printPositionStepNumber);
        scrollToRef(printPositionSectionRef);
      } else {
        setCurrentStep(summaryStepNumber);
        scrollToRef(orderSummarySectionRef);
      }
    } else if (fromStep === 'size') {
      if (hasFabricStep) {
        setCurrentStep(fabricStepNumber);
        scrollToRef(fabricSectionRef);
      } else if (hasPrintPositionStep) {
        setCurrentStep(printPositionStepNumber);
        scrollToRef(printPositionSectionRef);
      } else {
        setCurrentStep(summaryStepNumber);
        scrollToRef(orderSummarySectionRef);
      }
    } else if (fromStep === 'fabric') {
      if (hasPrintPositionStep) {
        setCurrentStep(printPositionStepNumber);
        scrollToRef(printPositionSectionRef);
      } else {
        setCurrentStep(summaryStepNumber);
        scrollToRef(orderSummarySectionRef);
      }
    } else if (fromStep === 'printPosition') {
      setCurrentStep(summaryStepNumber);
      scrollToRef(orderSummarySectionRef);
    }
  };
  const colorSectionRef = useRef<HTMLDivElement>(null);
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const fabricSectionRef = useRef<HTMLDivElement>(null);
  const printPositionSectionRef = useRef<HTMLDivElement>(null);
  const orderSummarySectionRef = useRef<HTMLDivElement>(null);
  const imageColRef = useRef<HTMLDivElement>(null);
  const [imageColHeight, setImageColHeight] = useState<number>(0);

  useEffect(() => {
    const el = imageColRef.current;
    if (!el) return;
    const updateHeight = () => {
      if (window.innerWidth >= 1024) {
        setImageColHeight(el.offsetHeight);
      } else {
        setImageColHeight(0);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => {
      window.removeEventListener('resize', updateHeight);
      ro.disconnect();
    };
  }, [product]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isAddingToMochila, setIsAddingToMochila] = useState(false);
  const [toastItem, setToastItem] = useState<MochilaItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<any[]>([]);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [stickyBarHint, setStickyBarHint] = useState<string | null>(null);
  const [stepsDirection, setStepsDirection] = useState<"acima" | "abaixo">("abaixo");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);

  // Limite de tamanhos para comparação
  const MAX_SELECTED = 3;

  // Função para selecionar/desmarcar um tamanho
  const toggleSize = (size: string) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size);
      }
      if (prev.length >= MAX_SELECTED) {
        // Se atingir o limite, remove o primeiro e adiciona o novo
        return [...prev.slice(1), size];
      }
      return [...prev, size];
    });
  };

  // Função para buscar o valor específico de uma medida para um tamanho
  const getMeasurementValue = (sizeName: string, fieldId: string) => {
    const measurement = measurements.find(m => m.sizeName === sizeName && m.fieldId === fieldId);
    return measurement?.value || "—";
  };

  useEffect(() => {
    if (product?.id) {
      // Load installments
      fetch(`/api/products/${product.id}/installments`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setInstallmentOptions(data);
          }
        })
        .catch(err => console.error("Error loading installments:", err));

      // Load measurements and fields
      Promise.all([
        fetch(`/api/products/${product.id}/measurement-fields`).then(res => res.json()),
        fetch(`/api/products/${product.id}/size-measurements`).then(res => res.json())
      ]).then(([fieldsData, measurementsData]) => {
        setFields(fieldsData.fields || []);
        setMeasurements(measurementsData.measurements || []);
      }).catch(err => console.error("Error loading measurements:", err));
    }
  }, [product?.id]);
  
  const prevProductIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prevProductIdRef.current !== product?.id) {
      prevProductIdRef.current = product?.id;
      setSelectedColor(colors.length > 0 ? colors[0] : null);
      setSelectedSize(null);
      setSizeError(false);
      setSelectedFabric(null);
      setSelectedPrintPosition(null);
      setCurrentStep(firstActiveStep);
    }
  }, [product?.id, colors, sizes, fabrics, firstActiveStep]);

  // Dispara o evento ViewContent do Facebook Pixel quando o produto carrega
  // Este evento rastreia a visualização de produtos
  useEffect(() => {
    if (product?.id && product?.name && product?.price) {
      // Rastreia a visualização do produto com ID, nome e preço
      trackViewContent(
        String(product.id),
        product.name,
        Number(product.price),
        "BRL",
        product.category || "camisetas"
      );
    }
  }, [product?.id, product?.name, product?.price, trackViewContent]);

  useEffect(() => {
    setSelectedColor((prev: any) => {
      if (colors.length === 0) return null;
      if (!prev) return colors[0];
      const match = colors.find((c: any) => c.hex === prev.hex);
      return match || colors[0];
    });
  }, [colors]);

  useEffect(() => {
    setSelectedSize((prev: any) => {
      if (sizes.length === 0) return null;
      if (!prev) return null;
      const match = sizes.find((s: any) => s.name === prev.name && s.available !== false);
      return match || null;
    });
  }, [sizes]);

  const displayImages = useMemo(() => {
    if (!product?.images || !Array.isArray(product.images) || product.images.length === 0) {
      return [FALLBACK_IMAGE];
    }
    
    const getPresentationImages = () => {
      return product.images
        .filter((img: any) => img.imageType === 'presentation')
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((img: any) => img.imageUrl);
    };
    
    if (!selectedColor) {
      const presentationImages = getPresentationImages();
      return presentationImages.length > 0 ? presentationImages : [FALLBACK_IMAGE];
    }
    
    const carouselImages = product.images
      .filter((img: any) => img.imageType === 'carousel' && img.color === selectedColor.name)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((img: any) => img.imageUrl);
    
    if (carouselImages.length > 0) {
      return carouselImages;
    }
    
    const presentationImages = getPresentationImages();
    return presentationImages.length > 0 ? presentationImages : [FALLBACK_IMAGE];
  }, [selectedColor, product]);

  useEffect(() => {
    if (carouselApi) {
      carouselApi.scrollTo(0);
      setCurrentImageIndex(0);
    }
  }, [selectedColor, carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.on("select", () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    let total = Number(product.price);
    if (selectedFabric?.price) {
      total += Number(selectedFabric.price);
    }
    return total;
  }, [product, selectedFabric]);

  const addToMochila = () => {
    const needsColor = colors.length > 0;
    const needsSize = sizes.length > 0;

    if (needsSize && !selectedSize) {
      setSizeError(true);
      setTimeout(() => {
        sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
      return;
    }

    if (product.fabricsEnabled && fabrics.length > 0 && !selectedFabric) {
      const fabricSection = document.getElementById('fabric-selection');
      fabricSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!product || (needsColor && !selectedColor) || (needsSize && selectedSize.available === false)) return;
    
    setIsAddingToMochila(true);
    
    const item: any = {
      productId: product.id,
      name: product.name,
      price: totalPrice,
      image: displayImages[0],
    };
    
    if (selectedColor) item.color = selectedColor;
    if (selectedSize) item.size = selectedSize.name;
    if (selectedFabric) item.fabric = { name: selectedFabric.name, price: selectedFabric.price };
    if ((product.customizableFront || product.customizableBack) && selectedPrintPosition) {
      item.printPosition = selectedPrintPosition;
    }
    
    addItem(item);
    
    // Dispara o evento AddToCart do Facebook Pixel
    // Rastreia quando o usuário adiciona um produto ao carrinho
    trackAddToCart(
      String(product.id),
      product.name,
      totalPrice,
      "BRL",
      1 // Quantidade adicionada
    );
    
    setToastItem({ ...item, id: Date.now().toString(), quantity: 1 });
    setShowToast(true);
    
    // Garantir que o CEP e o preço do frete calculados nesta página sejam persistidos no contexto da mochila
    if (shippingResult) {
      setZipCode(cep);
      setShippingPrice(shippingResult.price);
    }
    
    setTimeout(() => { setShowToast(false); }, 5000);
    setTimeout(() => { setIsAddingToMochila(false); }, 400);
  };
  
  const allStepsComplete = (selectedColor || !hasColorStep) && (selectedSize || !hasSizeStep) && (!product?.fabricsEnabled || selectedFabric) && (!hasPrintPositionStep || selectedPrintPosition);

  useEffect(() => {
    const el = orderSummarySectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setIsSummaryVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  });

  useEffect(() => {
    if (allStepsComplete) return;
    const getFirstIncompleteRef = () => {
      if (hasColorStep && !selectedColor) return colorSectionRef;
      if (hasSizeStep && !selectedSize) return sizeSectionRef;
      if (hasFabricStep && !selectedFabric) return fabricSectionRef;
      if (hasPrintPositionStep && !selectedPrintPosition) return printPositionSectionRef;
      return null;
    };
    const check = () => {
      const ref = getFirstIncompleteRef();
      if (!ref?.current) return;
      const rect = ref.current.getBoundingClientRect();
      const midScreen = window.innerHeight / 2;
      setStepsDirection(rect.top < midScreen ? "acima" : "abaixo");
    };
    check();
    const scrollParent = document.querySelector('.overflow-y-auto') || window;
    scrollParent.addEventListener('scroll', check, { passive: true });
    window.addEventListener('scroll', check, { passive: true });
    return () => {
      scrollParent.removeEventListener('scroll', check);
      window.removeEventListener('scroll', check);
    };
  }, [allStepsComplete, selectedColor, selectedSize, selectedFabric, selectedPrintPosition, hasColorStep, hasSizeStep, hasFabricStep, hasPrintPositionStep]);

  const handleStickyBarClick = () => {
    if (allStepsComplete) {
      addToMochila();
      return;
    }
    if (hasColorStep && !selectedColor) {
      setStickyBarHint("selecione a cor ↑");
      setCurrentStep(colorStepNumber);
      scrollToRef(colorSectionRef);
    } else if (hasSizeStep && !selectedSize) {
      setStickyBarHint("selecione o tamanho ↑");
      setCurrentStep(sizeStepNumber);
      scrollToRef(sizeSectionRef);
    } else if (hasFabricStep && !selectedFabric) {
      setStickyBarHint("selecione o tecido ↑");
      setCurrentStep(fabricStepNumber);
      scrollToRef(fabricSectionRef);
    } else if (hasPrintPositionStep && !selectedPrintPosition) {
      setStickyBarHint("selecione a posição ↑");
      setCurrentStep(printPositionStepNumber);
      scrollToRef(printPositionSectionRef);
    }
    setTimeout(() => setStickyBarHint(null), 2500);
  };

  const { data: freeShippingConfig } = useQuery<{ system: string; threshold: string; shippingValue: string; shippingMinDays: string; shippingMaxDays: string }>({
    queryKey: ['/api/settings/free_shipping'],
  });

  const { data: paymentBrandsData } = useQuery<{ brands: Array<{ id: string; label: string; iconKey: string; category: string; enabled: boolean; displayOrder: number }> }>({
    queryKey: ['/api/payment-brands'],
  });

  const { data: ctaConfig } = useQuery<{
    shippingLabel: string;
    buyNowText: string;
    buyNowBg: string;
    buyNowTextColor: string;
    addToCartText: string;
    addToCartBorder: string;
    addToCartTextColor: string;
    trustText: string;
    trustIcon: string;
    ctaShippingFreeText: string;
    ctaShippingPaidText: string;
    mochilaShippingFreeText: string;
    mochilaShippingPaidText: string;
  }>({
    queryKey: ['/api/settings/cta'],
  });

  const getTrustIcon = () => {
    const iconMap: Record<string, any> = {
      lock: null,
      shield: Shield,
      "check-circle": CheckCircle,
      "credit-card": CreditCard,
      star: Star,
      heart: Heart,
      zap: Zap,
      award: Award,
    };
    return iconMap[ctaConfig?.trustIcon || "lock"];
  };
  
  // "all" = frete grátis para todos, "threshold" = frete grátis a partir de R$200
  const isFreeShippingForAll = freeShippingConfig?.system === "all";
  const isShippingSystemThreshold = freeShippingConfig?.system === "threshold" || !freeShippingConfig?.system;
  const thresholdValue = parseFloat(freeShippingConfig?.threshold || "200");
  const defaultShippingValue = parseFloat(freeShippingConfig?.shippingValue || "19.99");

  if (isLoading) return <ProductPageSkeleton />;

  if (!product || (product.status === "draft" && product.previewToken !== previewToken)) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-muted/10 flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-24 h-24 rounded-full bg-background dark:bg-card flex items-center justify-center mb-10 shadow-sm"
          >
            <Search className="h-9 w-9 text-muted-foreground/40" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-semibold tracking-tight mb-2 lowercase" 
            data-testid="text-product-not-found-title"
          >
            produto não encontrado
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-muted-foreground/60 font-light leading-relaxed mb-10 lowercase" 
            data-testid="text-product-not-found-description"
          >
            o item que você procura não está disponível ou pode ter sido removido.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/">
              <Button className="h-11 px-7 rounded-full text-sm font-medium lowercase gap-2" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4" />
                voltar para página inicial
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-start py-2 mb-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className="group flex items-center gap-2 px-0 hover:bg-transparent no-default-hover-elevate no-default-active-elevate text-muted-foreground hover:text-foreground transition-colors">
                <div className="h-7 w-7 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-muted transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium tracking-tight">voltar</span>
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-6">
          <div ref={imageColRef} className="w-full">
            <div className="relative group/carousel">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                  <Button variant="secondary" size="icon" onClick={(e) => { 
                      e.stopPropagation(); 
                      if (!isFavorito(product.id)) {
                        trackAddToWishlist(String(product.id), product.name, Number(product.price));
                        triggerFavoritoToast({
                          id: product.id,
                          name: product.name,
                          price: Number(product.price),
                          image: displayImages[0] || ''
                        });
                      }
                      toggleFavorito(product.id); 
                    }} className="h-8 w-8 rounded-md shadow-sm">
                    <Heart className={`h-4 w-4 ${isFavorito(product.id) ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.name,
                        text: product.description,
                        url: window.location.href,
                      }).catch(console.error);
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }} className="h-8 w-8 rounded-md shadow-sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                <Carousel setApi={setCarouselApi} className="w-full" opts={{ loop: true }}>
                  <CarouselContent>
                    {displayImages.map((image: string, index: number) => (
                      <CarouselItem key={index}>
                        <div className="aspect-[3/4] lg:aspect-square overflow-hidden rounded-2xl relative">
                          <img src={image} alt={`${product.name} - ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </motion.div>
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={() => carouselApi?.scrollPrev()}
                    className="product-page-arrows absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-lg shadow-lg text-black/70 dark:text-white/70 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-black/80 hover:text-black dark:hover:text-white active:scale-95 z-20"
                    data-testid="button-carousel-prev"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => carouselApi?.scrollNext()}
                    className="product-page-arrows absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-lg shadow-lg text-black/70 dark:text-white/70 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-black/80 hover:text-black dark:hover:text-white active:scale-95 z-20"
                    data-testid="button-carousel-next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              {displayImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
                  {displayImages.map((_: string, idx: number) => (
                    <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? "w-4 bg-white" : "w-1 bg-white/50"}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full">
            <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-light lowercase">{product.name}</h1>
              
              <div className="py-2">
                <p className="text-sm text-muted-foreground leading-relaxed font-light whitespace-pre-line">
                  {product.description || "Design minimalista e clean. Para quem aprecia a simplicidade com estilo."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-medium tracking-tight text-primary">{formatPrice(totalPrice)}</span>
                  {product.originalPrice && Number(product.originalPrice) > totalPrice && (
                    <span className="text-lg text-muted-foreground line-through font-light">
                      {formatPrice(Number(product.originalPrice))}
                    </span>
                  )}
                </div>
                {product.showInstallments !== false && (
                <button 
                  onClick={() => setShowInstallmentsModal(true)}
                  className="w-full group relative flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-300 hover:shadow-sm mt-2"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">parcelamento</span>
                    <span className="text-sm font-medium">
                      {installmentOptions.length > 0 ? (
                        <>
                          {installmentOptions[0].installments}x de {formatPrice(installmentOptions[0].installmentValue)}
                          {installmentOptions[0].isInterestFree && (
                            <span className="text-muted-foreground/50 font-light ml-1">sem juros</span>
                          )}
                        </>
                      ) : (
                        <>12x de {formatPrice(totalPrice / 12)} <span className="text-muted-foreground/50 font-light ml-1">sem juros</span></>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-muted-foreground/30 dark:border-foreground/20 bg-muted/20 dark:bg-foreground/5 hover:bg-muted/30 dark:hover:bg-foreground/10 transition-colors">
                    <span className="text-[11px] text-muted-foreground dark:text-foreground/40 uppercase tracking-tighter">ver detalhes</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 dark:text-foreground/30 group-hover:text-foreground/60 transition-colors" />
                  </div>
                </button>
                )}
              </div>
            </motion.div>

            <Dialog open={showInstallmentsModal} onOpenChange={setShowInstallmentsModal}>
              <DialogContent className="max-w-md max-h-[85vh] rounded-[28px] p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col">
                <VisuallyHidden><DialogTitle>opções de parcelamento</DialogTitle></VisuallyHidden>
                <div className="p-7 space-y-6 flex flex-col min-h-0">
                  <div className="shrink-0">
                    <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground/50 uppercase mb-1">mercado pago</p>
                    <h2 className="text-2xl font-light lowercase tracking-tight">opções de parcelamento</h2>
                  </div>

                  <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar min-h-0 flex-1">
                    {installmentOptions.map((opt, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-border/40"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {opt.installments}x de {formatPrice(opt.installmentValue)}
                          </span>
                          <span className="text-[10px] text-muted-foreground/40 lowercase">
                            {opt.isInterestFree ? "sem juros" : "com acréscimo"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground/60 lowercase">
                          total: <span className="normal-case">{formatPrice(opt.totalPrice)}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {(paymentBrandsData?.brands?.length ?? 0) > 0 && (
                    <div className="rounded-xl border border-border/30 bg-muted/20 p-4 space-y-3">
                      <p className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground/50 uppercase">bandeiras e métodos aceitos</p>
                      <div className="grid grid-cols-5 gap-2">
                        {paymentBrandsData!.brands.map((brand) => {
                          const Icon = BRAND_ICON_MAP[brand.iconKey] || CreditCard;
                          return (
                            <div key={brand.id} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background/60 border border-border/20">
                              <Icon className="h-5 w-5 text-foreground/70" />
                              <span className="text-[8px] text-muted-foreground/50 leading-none text-center">{brand.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full rounded-2xl font-light"
                    onClick={() => setShowInstallmentsModal(false)}
                  >
                    fechar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {(product.sectionLabel || product.sectionTitle || product.sectionSubtitle) && (
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-center space-y-2 pt-4 pb-2"
              >
                {product.sectionLabel && (
                  <p className="text-[10px] font-medium tracking-[0.25em] text-muted-foreground/60 uppercase">
                    {product.sectionLabel}
                  </p>
                )}
                {product.sectionTitle && (
                  <h3 className="text-lg font-light lowercase tracking-tight text-foreground/90">
                    {product.sectionTitle}
                  </h3>
                )}
                {product.sectionSubtitle && (
                  <p className="text-xs text-muted-foreground/50 font-light">
                    {product.sectionSubtitle}
                  </p>
                )}
              </motion.div>
            )}

            <div className="space-y-4">
              {colors.length > 0 && (
                <motion.div 
                  ref={colorSectionRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setCurrentStep(colorStepNumber)} 
                  className={`space-y-4 p-5 rounded-[24px] border-2 transition-all duration-500 cursor-pointer ${currentStep === colorStepNumber ? 'border-foreground shadow-sm bg-card' : 'border-transparent opacity-60 bg-muted/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">passo {colorStepNumber}</span>
                      <h3 className="text-lg font-medium lowercase">escolha a cor {selectedColor && <span className="text-muted-foreground font-light">— {selectedColor.name}</span>}</h3>
                    </div>
                    {selectedColor && currentStep > colorStepNumber && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-primary-foreground fill-current" />
                      </div>
                    )}
                  </div>
                  {currentStep === colorStepNumber && (
                    <div className="grid grid-cols-4 gap-3">
                      {colors.map((color: any) => (
                        <button 
                          key={color.hex} 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedColor(color); 
                            setTimeout(() => goToNextStep('color'), 300); 
                          }} 
                          className={`group relative aspect-square rounded-2xl border-2 transition-all duration-300 flex items-center justify-center ${selectedColor?.hex === color.hex ? 'border-foreground ring-2 ring-foreground/10' : 'border-border/40 hover:border-border/80'}`}
                          title={color.name}
                        >
                          <div className="w-10 h-10 rounded-xl shadow-inner" style={{ backgroundColor: color.hex }} />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {sizes.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  ref={sizeSectionRef} 
                  onClick={() => { if (selectedColor || colors.length === 0) setCurrentStep(sizeStepNumber); }} 
                  className={`space-y-4 p-5 rounded-[24px] border-2 transition-all duration-500 cursor-pointer ${currentStep === sizeStepNumber ? 'border-foreground shadow-sm bg-card' : 'border-transparent opacity-60 bg-muted/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">passo {sizeStepNumber}</span>
                      <h3 className="text-lg font-medium lowercase">qual o tamanho? {selectedSize && <span className="text-muted-foreground font-light">— {selectedSize.name}</span>}</h3>
                    </div>
                    {selectedSize && currentStep > sizeStepNumber && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-primary-foreground fill-current" />
                      </div>
                    )}
                  </div>
                  {currentStep === sizeStepNumber && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {sizes.map((size: any) => (
                          <Button 
                            key={size.name} 
                            variant={selectedSize?.name === size.name ? "default" : "outline"} 
                            disabled={size.available === false} 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedSize(size); 
                              setSizeError(false); 
                              setTimeout(() => goToNextStep('size'), 300);
                            }} 
                            className={`h-14 rounded-2xl text-lg font-light transition-all duration-300 ${selectedSize?.name === size.name ? 'scale-[1.02] shadow-md' : ''}`}
                          >
                            {size.name}
                          </Button>
                        ))}
                      </div>
                      {product.sizeChartEnabled && (
                        <div className="pt-4 border-t border-border/5">
                          <SizeChartModal 
                            productId={product.id} 
                            productName={product.name}
                            sizeChartImage={product.sizeChartImage}
                            sizeChartEnabled={product.sizeChartEnabled}
                            activeSizes={sizes}
                            trigger={
                              <button 
                                className="w-full group flex items-center justify-between py-1 transition-colors hover:text-foreground/80"
                                data-testid="button-open-size-chart"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                                    <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                                  </div>
                                  <span className="text-sm font-medium lowercase tracking-tight">guia de tamanhos</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                              </button>
                            }
                          />
                        </div>
                      )}
                      {sizeError && (
                        <p className="text-xs text-destructive text-center font-medium">por favor, selecione um tamanho</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Fabric Selection */}
              {product.fabricsEnabled && fabrics.length > 0 && (
                <motion.div
                  ref={fabricSectionRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { if (selectedSize || !hasSizeStep) setCurrentStep(fabricStepNumber); }}
                  className={`space-y-4 p-5 rounded-[24px] border-2 transition-all duration-500 cursor-pointer ${currentStep === fabricStepNumber ? 'border-foreground shadow-sm bg-card' : 'border-transparent opacity-60 bg-muted/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">passo {fabricStepNumber}</span>
                      <h3 className="text-lg font-medium lowercase">escolha o tecido {selectedFabric && <span className="text-muted-foreground font-light">— {selectedFabric.name}</span>}</h3>
                    </div>
                    {selectedFabric && currentStep > fabricStepNumber && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-primary-foreground fill-current" />
                      </div>
                    )}
                  </div>
                  {currentStep === fabricStepNumber && (
                    <div className="space-y-8" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-1 gap-3">
                        {fabrics.map((fabric: any) => (
                          <button
                            key={fabric.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFabric(fabric);
                              setTimeout(() => goToNextStep('fabric'), 300);
                            }}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${selectedFabric?.name === fabric.name ? 'border-foreground bg-foreground/5' : 'border-border/40 hover:border-border/80'}`}
                          >
                            <div className="text-left">
                              <p className="font-medium lowercase">{fabric.name}</p>
                              {fabric.description && (
                                <p className="text-xs text-muted-foreground/70 font-light lowercase mt-0.5">{fabric.description}</p>
                              )}
                              {fabric.price > 0 && (
                                <p className="text-xs text-muted-foreground mt-1.5"><span className="normal-case">+{formatPrice(fabric.price)}</span></p>
                              )}
                            </div>
                            {selectedFabric?.name === fabric.name && <Circle className="h-4 w-4 fill-current" />}
                          </button>
                        ))}
                      </div>

                    </div>
                  )}
                </motion.div>
              )}

              {/* Step: Print Position Selection */}
              {(product.customizableFront || product.customizableBack) && (
                <motion.div
                  ref={printPositionSectionRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { if (selectedFabric || !product.fabricsEnabled) setCurrentStep(printPositionStepNumber); }}
                  className={`space-y-4 p-5 rounded-[24px] border-2 transition-all duration-500 cursor-pointer ${currentStep === printPositionStepNumber ? 'border-foreground shadow-sm bg-card' : 'border-transparent opacity-60 bg-muted/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">passo {printPositionStepNumber}</span>
                      <h3 className="text-lg font-medium lowercase">posição da estampa {selectedPrintPosition && <span className="text-muted-foreground font-light">— {selectedPrintPosition}</span>}</h3>
                    </div>
                    {selectedPrintPosition && currentStep > printPositionStepNumber && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-primary-foreground fill-current" />
                      </div>
                    )}
                  </div>
                  {currentStep === printPositionStepNumber && (
                    <div className="grid grid-cols-2 gap-3">
                      {product.customizableFront && (
                        <Button
                          variant={selectedPrintPosition === "frente" ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPrintPosition("frente");
                            setTimeout(() => goToNextStep('printPosition'), 300);
                          }}
                          className="h-14 rounded-2xl lowercase font-light"
                        >
                          frente
                        </Button>
                      )}
                      {product.customizableBack && (
                        <Button
                          variant={selectedPrintPosition === "costas" ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPrintPosition("costas");
                            setTimeout(() => goToNextStep('printPosition'), 300);
                          }}
                          className="h-14 rounded-2xl lowercase font-light"
                        >
                          costas
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Order Summary - Apple Style */}
              <AnimatePresence>
                {((selectedColor || !hasColorStep) && (selectedSize || !hasSizeStep) && (!product.fabricsEnabled || selectedFabric) && (!hasPrintPositionStep || selectedPrintPosition)) && (
                  <motion.div 
                    ref={orderSummarySectionRef}
                    id="order-summary"
                    initial={{ opacity: 0, y: 32, scale: 0.98 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="relative overflow-hidden"
                  >
                    {/* Card Principal */}
                    <div className="relative bg-[#1d1d1f] text-white rounded-[24px] p-5 sm:p-6">
                      
                      {/* Header minimalista */}
                      <div className="text-center space-y-1 mb-8">
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <p className="text-[11px] font-medium tracking-[0.2em] text-white/40 uppercase">pronto para enviar</p>
                        </motion.div>
                      </div>

                      {/* Shipping Section */}
                      <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-4 mb-8"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center">
                            <Truck className="h-4 w-4 text-white/60" />
                          </div>
                          <span className="text-[13px] font-medium text-white/80">entrega</span>
                        </div>
                        
                        <div className="relative">
                          <Input
                            placeholder="digite seu cep"
                            className="h-[52px] rounded-2xl bg-white/[0.06] border-0 text-white placeholder:text-white/30 text-[15px] font-light pl-4 pr-12 focus:bg-white/[0.08] focus:ring-1 focus:ring-white/20 transition-all duration-300"
                            value={cep}
                            onChange={handleCepChange}
                            data-testid="input-cep-summary"
                          />
                          {isCalculatingShipping && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <div className="h-5 w-5 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        
                        {shippingError && (
                          <motion.p 
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[13px] text-red-400/90 font-light pl-1"
                          >
                            {shippingError}
                          </motion.p>
                        )}
                        
                        <AnimatePresence>
                          {shippingResult && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white/[0.04] rounded-2xl p-4 space-y-3">
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{ctaConfig?.shippingLabel || "frete padrão"}</p>
                                  <p className="text-[13px] text-white/80 font-light">
                                    {shippingResult.price === 0
                                      ? `${ctaConfig?.ctaShippingFreeText || "chegará grátis"} ${shippingResult.days}`
                                      : `chegará ${shippingResult.days}`}
                                  </p>
                                  <p className="text-[11px] text-white/40 font-light truncate max-w-[200px]">{shippingResult.address}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Action Buttons - Apple Style */}
                      <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3"
                      >
                        <button 
                          onClick={() => {
                            addToMochila();
                            navigate('/checkout');
                          }} 
                          disabled={isAddingToMochila}
                          className="w-full h-[54px] rounded-[14px] text-[15px] font-semibold tracking-[-0.01em] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{ backgroundColor: ctaConfig?.buyNowBg || '#ffffff', color: ctaConfig?.buyNowTextColor || '#1d1d1f' }}
                          data-testid="button-buy-now"
                        >
                          {isAddingToMochila ? (
                            <div className="h-5 w-5 border-2 border-[#1d1d1f]/20 border-t-[#1d1d1f] rounded-full animate-spin" />
                          ) : (
                            ctaConfig?.buyNowText || "comprar agora"
                          )}
                        </button>
                        
                        <button 
                          onClick={addToMochila} 
                          disabled={isAddingToMochila}
                          className="w-full h-[50px] rounded-[14px] bg-transparent text-[15px] font-medium tracking-[-0.01em] border transition-all duration-200 hover:bg-white/[0.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ borderColor: ctaConfig?.addToCartBorder || 'rgba(255,255,255,0.12)', color: ctaConfig?.addToCartTextColor || 'rgba(255,255,255,0.9)' }}
                          data-testid="button-add-to-cart"
                        >
                          {ctaConfig?.addToCartText || "adicionar à mochila"}
                        </button>
                      </motion.div>

                      {/* Trust Badge */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 pt-5 border-t border-white/[0.06]"
                      >
                        <div className="flex items-center justify-center gap-2 text-white/30">
                          {(() => {
                            const TrustIcon = getTrustIcon();
                            if (TrustIcon) {
                              return <TrustIcon className="w-4 h-4" />;
                            }
                            return (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            );
                          })()}
                          <span className="text-[11px] font-medium tracking-wide">{ctaConfig?.trustText || "pagamento seguro via mercado pago"}</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsible Details Sections (Apple Style) */}
              <div className="pt-6 space-y-3 pb-8">
                {(product.fabricDescription || (product.fabricTech && Array.isArray(product.fabricTech) && product.fabricTech.length > 0 && product.fabricTech[0] !== '') || product.careInstructions) && (
                  <>
                    <Separator className="opacity-50" />
                    
                    <Collapsible className="w-full group">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-0 h-14 hover:bg-transparent lowercase text-foreground group">
                          <span className="flex items-center gap-3 font-medium">
                            <Droplet className="h-4 w-4 opacity-40" />
                            tecido e tecnologias
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-40 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pb-6 pt-2 space-y-6">
                        {product.fabricDescription && (
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">composição</p>
                            <p className="text-sm text-muted-foreground font-light whitespace-pre-line">
                              {product.fabricDescription}
                            </p>
                          </div>
                        )}
                        
                        {product.fabricTech && Array.isArray(product.fabricTech) && product.fabricTech.length > 0 && product.fabricTech[0] !== '' && (
                          <div className="grid grid-cols-2 gap-2">
                            {product.fabricTech.map((tech: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground font-light lowercase">
                                <Zap className="h-3 w-3 text-primary opacity-40" />
                                {tech}
                              </div>
                            ))}
                          </div>
                        )}

                        {product.careInstructions && (
                          <div className="pt-4 border-t border-border/5 space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">cuidados</p>
                            <p className="text-sm text-muted-foreground font-light whitespace-pre-line">
                              {product.careInstructions}
                            </p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                )}

                <Separator className="opacity-50" />

                {/* Reviews Summary Trigger */}
                {product.reviewsEnabled !== false && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-0 h-14 hover:bg-transparent lowercase text-foreground group"
                    onClick={() => setShowReviewsModal(true)}
                  >
                    <span className="flex items-center gap-3 font-medium">
                      <Star className="h-4 w-4 opacity-40" />
                      avaliações ({product.reviewsCount || 0})
                    </span>
                    <div className="flex items-center gap-3">
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </div>
                  </Button>
                )}
                
                {product.reviewsEnabled !== false && <Separator className="opacity-50" />}
              </div>
            </div>
            </div>
          </div>
        </div>
        </div>

        <div className="pb-20">
          <RelatedProducts currentProductId={id || product.id} />
        </div>
      </div>

      {product.reviewsEnabled !== false && (
        <ReviewsModal productId={product.id} isOpen={showReviewsModal} onOpenChange={setShowReviewsModal} productName={product.name} />
      )}

      <AnimatePresence>
        {!isSummaryVisible && !showToast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)]"
            data-testid="sticky-cta-bar"
          >
            <div className="bg-background/90 backdrop-blur-xl border-t border-border/30">
              <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold tracking-tight truncate" data-testid="text-sticky-price">{formatPrice(totalPrice)}</p>
                  <AnimatePresence mode="wait">
                    {stickyBarHint ? (
                      <motion.p
                        key="hint"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-[11px] text-orange-500 dark:text-orange-400 font-medium"
                      >
                        {stickyBarHint}
                      </motion.p>
                    ) : !allStepsComplete ? (
                      <motion.p
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[11px] text-muted-foreground"
                      >
                        selecione as opções {stepsDirection}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
                <button
                  onClick={handleStickyBarClick}
                  disabled={isAddingToMochila}
                  className="flex items-center gap-2 px-5 h-[44px] rounded-[12px] text-[14px] font-semibold tracking-[-0.01em] transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  style={{
                    backgroundColor: allStepsComplete ? (ctaConfig?.buyNowBg || '#1d1d1f') : 'hsl(var(--foreground))',
                    color: allStepsComplete ? (ctaConfig?.buyNowTextColor || '#ffffff') : 'hsl(var(--background))',
                  }}
                  data-testid="button-sticky-add-to-cart"
                >
                  {isAddingToMochila ? (
                    <div className="h-4 w-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      {allStepsComplete ? (ctaConfig?.addToCartText || "adicionar à mochila") : "continuar"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MochilaToast item={toastItem} isVisible={showToast} onClose={() => setShowToast(false)} onOpenDrawer={() => setIsDrawerOpen(true)} />
    </div>
  );
}
