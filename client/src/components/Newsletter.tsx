import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { NewsletterSettings } from "@shared/schema";
// Importa o hook do Facebook Pixel para rastreamento de eventos
import { usePixel } from "@/hooks/usePixel";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  // Inicializa o hook do Facebook Pixel para rastreamento de eventos
  const { trackLead } = usePixel();

  const { data: settings } = useQuery<NewsletterSettings>({
    queryKey: ["/api/newsletter/settings"],
  });

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/newsletter/subscribe", { email });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "erro ao se inscrever");
      }
      return res.json();
    },
    onSuccess: () => {
      // Dispara o evento Lead do Facebook Pixel quando inscrição é bem-sucedida
      // Este evento rastreia cadastros na newsletter (geração de leads)
      trackLead(email);
      
      toast({
        title: "sucesso!",
        description: "você foi cadastrado na nossa newsletter.",
      });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "email necessário",
        description: "por favor, insira seu email",
        variant: "destructive",
      });
      return;
    }

    subscribeMutation.mutate(email);
  };

  return (
    <section className="py-32 px-4">
      <div className="max-w-xl mx-auto text-center space-y-8">
        <div className="space-y-3">
          <h2 className="text-4xl md:text-5xl font-light lowercase text-foreground tracking-tight">
            {settings?.title || "fique por dentro"}
          </h2>
          <p className="text-muted-foreground lowercase">
            {settings?.description || "novidades e lançamentos no seu email"}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 lowercase"
              data-testid="input-newsletter-email"
              disabled={subscribeMutation.isPending}
            />
            <Button 
              type="submit"
              data-testid="button-newsletter-submit"
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                settings?.buttonText || "enviar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
