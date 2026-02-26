import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Palette, Image } from "lucide-react";
import ContentCardForm from "./ContentCardForm";
import type { ContentCard } from "@shared/schema";

export default function AdminContentCards() {
  const [editingCard, setEditingCard] = useState<ContentCard | null>(null);

  const { data: cardsData, isLoading } = useQuery<{ cards: ContentCard[] }>({
    queryKey: ['/api/admin/content-cards'],
  });

  const cards = cardsData?.cards || [];
  
  const featureCard = cards.find(c => c.cardType === 'feature');
  const lifestyleCard = cards.find(c => c.cardType === 'lifestyle');

  const handleClose = () => {
    setEditingCard(null);
  };

  const handleSuccess = () => {
    handleClose();
  };

  if (editingCard) {
    return (
      <ContentCardForm
        card={editingCard}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-light lowercase">cards de conteúdo</h1>
          <p className="text-sm text-muted-foreground lowercase">
            edite os 2 banners fixos da home
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-light lowercase">cards de conteúdo</h1>
        <p className="text-sm text-muted-foreground lowercase">
          edite os 2 banners fixos da home
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle className="text-lg lowercase">feature banner</CardTitle>
            </div>
          </CardHeader>
          {featureCard ? (
            <>
              <div className="aspect-video bg-muted overflow-hidden">
                <img
                  src={featureCard.imageUrl}
                  alt={featureCard.title || 'Feature Banner'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-medium lowercase">
                    {featureCard.title || 'sem título'}
                  </h3>
                  {featureCard.subtitle && (
                    <p className="text-sm text-muted-foreground lowercase">
                      {featureCard.subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${featureCard.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  <span className="text-xs text-muted-foreground lowercase">
                    {featureCard.isActive ? 'ativo' : 'inativo'}
                  </span>
                </div>
                <Button 
                  onClick={() => setEditingCard(featureCard)}
                  className="w-full lowercase"
                  data-testid="button-edit-feature"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  editar
                </Button>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground lowercase mb-4">
                feature banner não configurado
              </p>
              <p className="text-xs text-muted-foreground lowercase mb-4">
                este banner precisa ser criado no banco de dados
              </p>
            </CardContent>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              <CardTitle className="text-lg lowercase">lifestyle banner</CardTitle>
            </div>
          </CardHeader>
          {lifestyleCard ? (
            <>
              <div className="aspect-video bg-muted overflow-hidden">
                <img
                  src={lifestyleCard.imageUrl}
                  alt={lifestyleCard.title || 'Lifestyle Banner'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-medium lowercase">
                    {lifestyleCard.title || 'sem título'}
                  </h3>
                  {lifestyleCard.subtitle && (
                    <p className="text-sm text-muted-foreground lowercase">
                      {lifestyleCard.subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${lifestyleCard.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  <span className="text-xs text-muted-foreground lowercase">
                    {lifestyleCard.isActive ? 'ativo' : 'inativo'}
                  </span>
                </div>
                <Button 
                  onClick={() => setEditingCard(lifestyleCard)}
                  className="w-full lowercase"
                  data-testid="button-edit-lifestyle"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  editar
                </Button>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground lowercase mb-4">
                lifestyle banner não configurado
              </p>
              <p className="text-xs text-muted-foreground lowercase mb-4">
                este banner precisa ser criado no banco de dados
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
