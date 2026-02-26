import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface AccessoryCardProps {
  item: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  formatPrice: (value: number) => string;
}

function AccessoryCard({ item, formatPrice }: AccessoryCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <Link href={`/produto/${item.id}`}>
      <Card
        className="flex-shrink-0 w-[280px] snap-start hover-elevate overflow-visible cursor-pointer group"
        data-testid={`card-accessory-${item.id}`}
      >
        <div 
          className="aspect-square bg-background overflow-hidden"
          onMouseEnter={() => {
            if (item.images.length > 1) {
              setCurrentImageIndex(1);
            }
          }}
          onMouseLeave={() => setCurrentImageIndex(0)}
        >
          <img
            src={item.images[currentImageIndex] || item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium text-foreground mb-2 lowercase">
            {item.name}
          </h3>
          <p className="text-lg font-semibold text-foreground">
            {formatPrice(item.price)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function AccessorySkeleton() {
  return (
    <Card className="flex-shrink-0 w-[280px] snap-start">
      <div className="aspect-square bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-6 bg-muted animate-pulse rounded w-24" />
      </CardContent>
    </Card>
  );
}

export default function AccessoriesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: apiData, isLoading } = useQuery<{products: any[]}>({
    queryKey: ['/api/products'],
    select: (data) => ({
      products: data.products?.filter((p: any) => p.productType === 'accessory' && p.status === 'published') || []
    }),
  });

  const accessories = apiData?.products || [];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!isLoading && accessories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-light lowercase text-foreground">
            acessórios
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              data-testid="button-scroll-left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              data-testid="button-scroll-right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <AccessorySkeleton key={i} />
              ))}
            </>
          ) : (
            accessories.map((item: any) => (
              <AccessoryCard key={item.id} item={item} formatPrice={formatPrice} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
