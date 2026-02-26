import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";

export default function About() {
  const { data: pageData, isLoading } = useQuery<{
    id: string;
    slug: string;
    title: string;
    content: string;
  }>({
    queryKey: ['/api/footer-page', 'about'],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-64 bg-muted animate-pulse rounded" />
            </div>
          ) : pageData ? (
            <>
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-light lowercase text-foreground tracking-tight">
                  {pageData.title}
                </h1>
              </div>

              <Card className="p-8">
                <div 
                  className="prose prose-invert dark:prose max-w-none lowercase"
                  dangerouslySetInnerHTML={{ __html: pageData.content }}
                />
              </Card>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">página não encontrada</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
