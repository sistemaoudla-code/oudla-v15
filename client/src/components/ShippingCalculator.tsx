import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Truck, Clock, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useMochila } from "@/contexts/MochilaContext";

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  icon: React.ReactNode;
}

interface ShippingCalculatorProps {
  onShippingSelect?: (option: ShippingOption) => void;
  className?: string;
}

export default function ShippingCalculator({ 
  onShippingSelect,
  className 
}: ShippingCalculatorProps) {
  const { zipCode, setZipCode } = useMochila();
  const [cep, setCep] = useState(zipCode || "");
  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    if (zipCode && zipCode.length === 9) {
      setCep(zipCode);
      calculateShipping(zipCode);
    }
  }, [zipCode]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateShipping = async (zipToCalculate?: string) => {
    const targetCep = zipToCalculate || cep;
    const cleanCep = targetCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    setLoading(true);
    
    // Update context/cookies when manual calculation is triggered
    if (!zipToCalculate) {
      let formatted = cleanCep;
      if (cleanCep.length > 5) formatted = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
      setZipCode(formatted);
    }

    // Simular API call
    setTimeout(() => {
      //todo: remove mock functionality
      const mockOptions: ShippingOption[] = [
        {
          id: 'standard',
          name: 'entrega padrão',
          price: 19.99,
          estimatedDays: '5-8 dias úteis',
          icon: <Truck className="h-4 w-4" />
        }
      ];
      
      setShippingOptions(mockOptions);
      setLoading(false);
    }, 1000);
  };

  const handleCepChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setCep(numericValue);
    
    if (numericValue.length === 8) {
      calculateShipping();
    } else {
      setShippingOptions([]);
      setSelectedOption(null);
    }
  };

  const selectOption = (option: ShippingOption) => {
    setSelectedOption(option.id);
    onShippingSelect?.(option);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cep">calcular frete</Label>
          <div className="flex gap-2">
            <Input
              id="cep"
              type="text"
              value={cep}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="digite seu cep"
              maxLength={8}
              data-testid="input-cep"
            />
            <Button 
              onClick={() => calculateShipping()}
              disabled={cep.length !== 8 || loading}
              data-testid="button-calculate-shipping"
            >
              {loading ? 'calculando...' : 'calcular'}
            </Button>
          </div>
        </div>
        
        {shippingOptions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">opções de entrega:</h4>
            {shippingOptions.map((option) => (
              <Card
                key={option.id}
                className={`p-3 cursor-pointer hover-elevate transition-colors ${
                  selectedOption === option.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-muted-foreground'
                }`}
                onClick={() => selectOption(option)}
                data-testid={`card-shipping-${option.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {option.icon}
                    <div>
                      <div className="font-medium text-sm">{option.name}</div>
                      <div className="text-xs text-muted-foreground">{option.estimatedDays}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {option.price === 0 ? 'grátis' : formatPrice(option.price)}
                    </div>
                    {option.price === 0 && (
                      <div className="text-xs text-muted-foreground">
                        compras acima de <span className="normal-case">R$ 200</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}