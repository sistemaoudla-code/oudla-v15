import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function CheckoutPending() {
  const [, setLocation] = useLocation();
  const [orderNumber, setOrderNumber] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const externalReference = params.get("external_reference");
    if (externalReference) {
      setOrderNumber(externalReference);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-yellow-500/10 p-4 rounded-full">
            <Clock className="h-16 w-16 text-yellow-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-light lowercase">pagamento pendente</h1>
          <p className="text-muted-foreground lowercase">
            estamos aguardando a confirmação do pagamento
          </p>
        </div>

        {orderNumber && (
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground lowercase mb-1">
              número do pedido
            </p>
            <p className="text-xl font-medium" data-testid="text-order-number">
              {orderNumber}
            </p>
          </div>
        )}

        <div className="space-y-3 pt-4">
          <p className="text-sm text-muted-foreground lowercase">
            assim que o pagamento for confirmado, enviaremos um email com os detalhes do seu pedido
          </p>
          
          <Button
            className="w-full"
            onClick={() => setLocation("/")}
            data-testid="button-go-home"
          >
            voltar para a home
          </Button>
        </div>
      </Card>
    </div>
  );
}
