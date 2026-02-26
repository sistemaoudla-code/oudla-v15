import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";

export default function TrocasDevolucoes() {
  const { data: pageData, isLoading } = useQuery<{
    id: string;
    slug: string;
    title: string;
    content: string;
  }>({
    queryKey: ['/api/footer-page', 'returns'],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pageData ? (
            <>
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-light lowercase text-foreground tracking-tight" data-testid="text-page-title">
                  {pageData.title}
                </h1>
              </div>
              <Card className="p-6 sm:p-8">
                <div
                  className="prose dark:prose-invert max-w-none lowercase [&_h2]:text-2xl [&_h2]:font-light [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:space-y-1"
                  dangerouslySetInnerHTML={{ __html: pageData.content }}
                  data-testid="content-page"
                />
              </Card>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground lowercase">página não encontrada</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
