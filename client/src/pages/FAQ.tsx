import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

const categoryLabels: Record<string, string> = {
  geral: "geral",
  envio: "envio e entrega",
  produto: "produtos",
  pagamento: "pagamento",
  devolucao: "trocas e devoluções",
};

export default function FAQ() {
  const { data: faqsData, isLoading } = useQuery<{ faqs: Faq[] }>({
    queryKey: ['/api/faqs'],
  });

  const faqs = faqsData?.faqs || [];
  
  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, Faq[]>);

  return (
    <div className="min-h-screen bg-background">
      <main className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-light lowercase mb-4 text-foreground">
              dúvidas frequentes
            </h1>
            <p className="text-muted-foreground lowercase max-w-2xl mx-auto">
              encontre respostas para as perguntas mais comuns sobre nossa loja, produtos e serviços
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-full max-w-md mx-auto" />
                <div className="h-24 bg-muted rounded w-full" />
                <div className="h-24 bg-muted rounded w-full" />
                <div className="h-24 bg-muted rounded w-full" />
              </div>
            </div>
          ) : faqs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground lowercase">
                  nenhuma pergunta frequente disponível no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
                <div key={category}>
                  <h2 className="text-2xl md:text-3xl font-light lowercase mb-6 text-foreground">
                    {categoryLabels[category] || category}
                  </h2>
                  <Accordion type="single" collapsible className="space-y-4">
                    {categoryFaqs.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="border rounded-md px-6 py-2"
                      >
                        <AccordionTrigger 
                          className="lowercase text-left hover:no-underline"
                          data-testid={`faq-question-${faq.id}`}
                        >
                          <span className="font-medium">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent 
                          className="text-muted-foreground lowercase pt-2"
                          data-testid={`faq-answer-${faq.id}`}
                        >
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Card className="bg-muted/30">
              <CardContent className="py-8">
                <h3 className="text-xl font-light lowercase mb-3 text-foreground">
                  não encontrou o que procura?
                </h3>
                <p className="text-muted-foreground lowercase mb-6">
                  entre em contato conosco e teremos prazer em ajudar
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="mailto:sac@oudla.com"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover-elevate active-elevate-2 h-9 px-4 py-2 lowercase"
                    data-testid="link-contact-email"
                  >
                    enviar email
                  </a>
                  <a
                    href="https://wa.me/5511999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover-elevate active-elevate-2 h-9 px-4 py-2 lowercase"
                    data-testid="link-contact-whatsapp"
                  >
                    falar no whatsapp
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
