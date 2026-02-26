import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { useState, memo, useCallback, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { queryClient } from "@/lib/queryClient";

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'%3E%3Crect width='400' height='533' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, sans-serif' font-size='18' fill='%239ca3af'%3Eimagem indisponível%3C/text%3E%3C/svg%3E";

interface ProductCardProps {
  id: string;
  sku?: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  installmentsMax?: number;
  installmentsValue?: number;
  installmentsInterestFree?: boolean;
  images: string[];
  colors?: string[] | null;
  sizes?: string[] | null;
  isNew?: boolean;
  isFavorite?: boolean;
  showInstallments?: boolean;
  onFavoriteToggle?: (id: string, productInfo: { name: string; price: number; image: string }) => void;
  disableLazyLoading?: boolean;
}

const ProductCard = memo(function ProductCard({
  id,
  sku,
  slug,
  name,
  price,
  originalPrice,
  installmentsMax,
  installmentsValue,
  installmentsInterestFree,
  images,
  isNew = false,
  isFavorite = false,
  showInstallments = true,
  onFavoriteToggle,
  disableLazyLoading = false
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [, setLocation] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });

  const rawScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1.15, 1.15, 1.15, 1]);
  const scale = useSpring(rawScale, {
    stiffness: 50,
    damping: 20,
    mass: 0.5,
    restDelta: 0.0001
  });

  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (_: any, info: any) => {
    setTimeout(() => {
      isDragging.current = false;
    }, 50);

    const threshold = 50;
    if (images.length <= 1) return;

    if (info.offset.x < -threshold) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    } else if (info.offset.x > threshold) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleTap = () => {
    if (!isDragging.current) {
      setLocation(`/${slug || sku || id}`);
    }
  };

  const formatPrice = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }, []);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(id, { name, price, image: images[0] || '' });
  }, [onFavoriteToggle, id, name, price, images]);

  const productKey = slug || sku || id;

  const handlePrefetch = useCallback(() => {
    if (prefetchTimer.current) clearTimeout(prefetchTimer.current);
    prefetchTimer.current = setTimeout(() => {
      import("@/pages/ProductPage");
      queryClient.prefetchQuery({ queryKey: ['/api/products', productKey] });
    }, 100);
  }, [productKey]);

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimer.current) clearTimeout(prefetchTimer.current);
  }, []);

  const displayImage = images.length === 0 
    ? FALLBACK_IMAGE 
    : (images[currentImageIndex] || images[0]);

  const formattedPrice = useMemo(() => formatPrice(price), [price, formatPrice]);
  
  const formattedOriginalPrice = useMemo(() => 
    originalPrice ? formatPrice(originalPrice) : null, 
    [originalPrice, formatPrice]
  );
  
  const installmentPrice = useMemo(() => 
    installmentsValue 
      ? formatPrice(installmentsValue)
      : formatPrice(price / (installmentsMax || 12)),
    [installmentsValue, installmentsMax, price, formatPrice]
  );
  
  const discountPercentage = useMemo(() => 
    originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null,
    [originalPrice, price]
  );

  return (
    <Card
      ref={cardRef}
      className="group overflow-visible hover-elevate cursor-pointer border-0 shadow-sm"
      onMouseEnter={handlePrefetch}
      onMouseLeave={cancelPrefetch}
      onTouchStart={handlePrefetch}
    >
      <div className="relative">
        {/* Product Image Carousel */}
        <div 
          className="aspect-[3/4] bg-muted overflow-hidden cursor-pointer relative touch-pan-y rounded-t-xl"
          data-testid={`image-product-${id}`}
        >
          <motion.img
            key={currentImageIndex}
            src={displayImage}
            alt={name}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTap={handleTap}
            style={{ scale }}
            className="w-full h-full object-cover select-none"
            {...(!disableLazyLoading && { loading: "lazy" as const, decoding: "async" as const })}
          />

          {/* Carousel Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
              {images.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex ? "w-4 bg-white" : "w-1 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
          {isNew && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide uppercase bg-white/80 dark:bg-black/60 text-foreground backdrop-blur-xl shadow-sm"
              data-testid={`badge-new-${id}`}
            >
              novo
            </span>
          )}
          {discountPercentage && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide uppercase bg-black/70 dark:bg-white/80 text-white dark:text-black backdrop-blur-xl shadow-sm"
              data-testid={`badge-sale-${id}`}
            >
              -{discountPercentage}%
            </span>
          )}
        </div>
        
        {/* Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 transition-opacity z-20 opacity-0 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={handleFavoriteClick}
            data-testid={`button-favorite-${id}`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
          </Button>
        </div>
      </div>
      
      <Link href={`/${slug || sku || id}`}>
        <CardContent className="px-4 pt-3 pb-4 cursor-pointer">
          <p className="text-lg font-medium text-foreground leading-snug tracking-tight" data-testid={`text-name-${id}`}>
            {name}
          </p>
          <div className="mt-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-semibold tracking-tight text-foreground" data-testid={`text-price-${id}`}>
                {formattedPrice}
              </span>
              {formattedOriginalPrice && (
                <span className="text-[13px] text-muted-foreground/60 line-through" data-testid={`text-original-price-${id}`}>
                  {formattedOriginalPrice}
                </span>
              )}
            </div>
            {showInstallments && (
              <p className="text-[11px] text-muted-foreground/70 mt-0.5 tracking-tight">
                até {installmentsMax || 12}x de {installmentPrice}
                {installmentsInterestFree !== false ? " sem juros" : ""}
              </p>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
});

export default ProductCard;
