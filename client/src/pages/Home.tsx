import BannerCarousel from "@/components/BannerCarousel";
import ProductGrid from "@/components/ProductGrid";
import FeatureBanner from "@/components/FeatureBanner";
import AccessoriesCarousel from "@/components/AccessoriesCarousel";
import LifestyleBanner from "@/components/LifestyleBanner";
import DailyVerse from "@/components/DailyVerse";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background space-y-8">
      <div className="h-96 bg-muted animate-pulse" />
      <div className="px-4 container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="aspect-square bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-6 bg-muted animate-pulse rounded w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: ['/api/products'] });
    queryClient.prefetchQuery({ queryKey: ['/api/banners'] });
    queryClient.prefetchQuery({ queryKey: ['/api/cta-banner'] });
    queryClient.prefetchQuery({ queryKey: ['/api/content-cards'] });
  }, []);

  const { isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const { isLoading: bannersLoading } = useQuery({
    queryKey: ['/api/banners'],
  });

  const isLoadingContent = productsLoading || bannersLoading;

  if (isLoadingContent) {
    return <HomeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        <BannerCarousel />
        <ProductGrid />
        <FeatureBanner />
        <AccessoriesCarousel />
        <LifestyleBanner />
      </main>
      <section className="py-20 md:py-32 px-4 bg-card/30">
        <DailyVerse />
      </section>
      <NewsletterSection />
      <Footer />
    </div>
  );
}
