import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";

interface RelatedProductsProps {
  currentProductId: string;
}

export default function RelatedProducts({ currentProductId }: RelatedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { data: apiData, isLoading } = useQuery<{products: any[]}>({
    queryKey: ['/api/products'],
    select: (data) => {
      const allItems = data.products || [];
      const currentItem = allItems.find(item => String(item.id) === String(currentProductId));
      
      const scoredItems = allItems
        .filter(item => String(item.id) !== String(currentProductId))
        .map(item => {
          let score = 0;
          
          if (currentItem && item.productType === currentItem.productType) {
            score += 10;
          }
          
          if (currentItem) {
            const priceDiff = Math.abs(item.price - currentItem.price);
            if (priceDiff < 20) score += 5;
            else if (priceDiff < 50) score += 3;
            else if (priceDiff < 100) score += 1;
          }
          
          if (currentItem && currentItem.colors && item.colors) {
            const currentColors = Array.isArray(currentItem.colors) ? currentItem.colors.map((c: any) => typeof c === 'string' ? c : c.hex) : [];
            const itemColors = Array.isArray(item.colors) ? item.colors.map((c: any) => typeof c === 'string' ? c : c.hex) : [];
            const sharedColors = currentColors.filter((c: string) => itemColors.includes(c));
            score += sharedColors.length * 2;
          }
          
          return { item, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(({ item }) => item);
      
      return { products: scoredItems };
    },
  });

  const scoredItems = apiData?.products || [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = 300;

    if (direction === "right") {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    } else {
      if (container.scrollLeft <= 10) {
        container.scrollTo({ left: container.scrollWidth - container.clientWidth, behavior: "smooth" });
      } else {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      }
    }
  };

  if (!isLoading && scoredItems.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="mt-12 mb-8"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.7s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
    >
      <div className="rounded-[24px] bg-muted/40 border border-border/30 p-6 sm:p-8 lg:p-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground/50 uppercase">
              recomendados
            </p>
            <h2 className="text-xl sm:text-2xl font-light lowercase text-foreground tracking-tight">
              você também pode gostar
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="rounded-full h-9 w-9 border-border/40"
              data-testid="button-scroll-left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="rounded-full h-9 w-9 border-border/40"
              data-testid="button-scroll-right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[220px] sm:w-[240px] snap-start">
                  <div className="aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
                  <div className="pt-3 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-5 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            scoredItems.map((item: any) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-[220px] sm:w-[240px] snap-start"
                data-testid={`card-related-${item.id}`}
              >
                <ProductCard
                  id={item.id}
                  sku={item.sku}
                  slug={item.slug}
                  name={item.name}
                  price={item.price}
                  originalPrice={item.originalPrice}
                  installmentsMax={item.installmentsMax}
                  installmentsValue={item.installmentsValue}
                  installmentsInterestFree={item.installmentsInterestFree}
                  images={item.images || []}
                  colors={item.colors}
                  sizes={item.sizes}
                  isNew={item.isNew}
                  showInstallments={false}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
