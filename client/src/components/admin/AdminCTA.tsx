import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tag, MousePointer, ShoppingBag, Shield, Lock, CheckCircle, CreditCard, Star, Heart, Zap, Award } from "lucide-react";
import { useAdminSave } from "@/contexts/AdminSaveContext";

const iconOptions = [
  { value: "lock", label: "cadeado", Icon: Lock },
  { value: "shield", label: "escudo", Icon: Shield },
  { value: "check-circle", label: "verificado", Icon: CheckCircle },
  { value: "credit-card", label: "cartão", Icon: CreditCard },
  { value: "star", label: "estrela", Icon: Star },
  { value: "heart", label: "coração", Icon: Heart },
  { value: "zap", label: "raio", Icon: Zap },
  { value: "award", label: "medalha", Icon: Award },
];

interface CTAConfig {
  shippingLabel: string;
  buyNowText: string;
  buyNowBg: string;
  buyNowTextColor: string;
  addToCartText: string;
  addToCartBorder: string;
  addToCartTextColor: string;
  trustText: string;
  trustIcon: string;
}

export default function AdminCTA() {
  const { toast } = useToast();
  
  const [shippingLabel, setShippingLabel] = useState("frete padrão");
  const [buyNowText, setBuyNowText] = useState("comprar agora");
  const [buyNowBg, setBuyNowBg] = useState("#ffffff");
  const [buyNowTextColor, setBuyNowTextColor] = useState("#1d1d1f");
  const [addToCartText, setAddToCartText] = useState("adicionar à mochila");
  const [addToCartBorder, setAddToCartBorder] = useState("#ffffff1f");
  const [addToCartTextColor, setAddToCartTextColor] = useState("#ffffffe6");
  const [trustText, setTrustText] = useState("pagamento seguro via mercado pago");
  const [trustIcon, setTrustIcon] = useState("lock");

  const { data: ctaConfig, isLoading } = useQuery<CTAConfig>({
    queryKey: ['/api/settings/cta'],
  });

  useEffect(() => {
    if (ctaConfig) {
      setShippingLabel(ctaConfig.shippingLabel);
      setBuyNowText(ctaConfig.buyNowText);
      setBuyNowBg(ctaConfig.buyNowBg);
      setBuyNowTextColor(ctaConfig.buyNowTextColor);
      setAddToCartText(ctaConfig.addToCartText);
      setAddToCartBorder(ctaConfig.addToCartBorder);
      setAddToCartTextColor(ctaConfig.addToCartTextColor);
      setTrustText(ctaConfig.trustText);
      setTrustIcon(ctaConfig.trustIcon);
    }
  }, [ctaConfig]);

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return await apiRequest("POST", "/api/admin/settings", {
        key,
        value,
        type: "text"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/cta'] });
    },
    onError: () => {
      toast({ title: "erro ao salvar", variant: "destructive" });
    }
  });

  const saveMultiple = async (settings: { key: string; value: string }[], successMsg: string) => {
    try {
      await Promise.all(settings.map(s => 
        apiRequest("POST", "/api/admin/settings", { key: s.key, value: s.value, type: "text" })
      ));
      queryClient.invalidateQueries({ queryKey: ['/api/settings/cta'] });
      toast({ title: successMsg });
    } catch {
      toast({ title: "erro ao salvar", variant: "destructive" });
    }
  };

  const handleSaveAll = useCallback(async () => {
    try {
      await Promise.all([
        apiRequest("POST", "/api/admin/settings", { key: "cta_shipping_label", value: shippingLabel, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "cta_buy_now_text", value: buyNowText, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "cta_buy_now_bg", value: buyNowBg, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "cta_buy_now_text_color", value: buyNowTextColor, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "cta_add_to_cart_text", value: addToCartText, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "cta_add_to_cart_border", value: addToCartBorder, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "cta_add_to_cart_text_color", value: addToCartTextColor, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "cta_trust_text", value: trustText, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "cta_trust_icon", value: trustIcon, type: "text" }),
      ]);
      queryClient.invalidateQueries({ queryKey: ['/api/settings/cta'] });
      toast({ title: "configurações de CTA salvas" });
    } catch {
      toast({ title: "erro ao salvar", variant: "destructive" });
    }
  }, [shippingLabel, buyNowText, buyNowBg, buyNowTextColor, addToCartText, addToCartBorder, addToCartTextColor, trustText, trustIcon, toast]);

  useAdminSave(handleSaveAll);

  const TrustIconComponent = iconOptions.find(i => i.value === trustIcon)?.Icon || Lock;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1,2,3,4].map(i => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 w-48 bg-muted/50 rounded-lg" />
              <div className="h-12 bg-muted/30 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <Tag className="h-5 w-5 opacity-60" />
          </div>
          <div>
            <h3 className="text-lg font-medium lowercase">etiqueta de frete</h3>
            <p className="text-sm text-muted-foreground lowercase">texto exibido acima do resultado do frete</p>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium lowercase">texto da etiqueta</Label>
          <Input
            value={shippingLabel}
            onChange={(e) => setShippingLabel(e.target.value)}
            placeholder="frete padrão"
            className="h-12 text-lg lowercase"
            data-testid="input-shipping-label"
          />
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="bg-[#1d1d1f] rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{shippingLabel}</p>
            <p className="text-[13px] text-white/80 font-light mt-1">chegará grátis entre 26/02 a 06/03</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <MousePointer className="h-5 w-5 opacity-60" />
          </div>
          <div>
            <h3 className="text-lg font-medium lowercase">botão comprar</h3>
            <p className="text-sm text-muted-foreground lowercase">personalize o botão principal de compra</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium lowercase">texto do botão</Label>
            <Input
              value={buyNowText}
              onChange={(e) => setBuyNowText(e.target.value)}
              placeholder="comprar agora"
              className="h-12 text-lg lowercase"
              data-testid="input-buy-now-text"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">cor de fundo</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={buyNowBg}
                  onChange={(e) => setBuyNowBg(e.target.value)}
                  className="w-12 h-12 rounded-full border-0 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-border/20"
                  data-testid="color-buy-now-bg"
                />
                <Input
                  value={buyNowBg}
                  onChange={(e) => setBuyNowBg(e.target.value)}
                  placeholder="#ffffff"
                  className="h-12 font-mono text-sm"
                  data-testid="input-buy-now-bg-hex"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">cor do texto</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={buyNowTextColor}
                  onChange={(e) => setBuyNowTextColor(e.target.value)}
                  className="w-12 h-12 rounded-full border-0 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-border/20"
                  data-testid="color-buy-now-text"
                />
                <Input
                  value={buyNowTextColor}
                  onChange={(e) => setBuyNowTextColor(e.target.value)}
                  placeholder="#1d1d1f"
                  className="h-12 font-mono text-sm"
                  data-testid="input-buy-now-text-hex"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground lowercase mb-3">prévia</p>
          <div className="bg-[#1d1d1f] rounded-2xl p-6">
            <button
              className="w-full h-[54px] rounded-[14px] text-[15px] font-semibold tracking-[-0.01em] flex items-center justify-center"
              style={{ backgroundColor: buyNowBg, color: buyNowTextColor }}
            >
              {buyNowText}
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5 opacity-60" />
          </div>
          <div>
            <h3 className="text-lg font-medium lowercase">botão mochila</h3>
            <p className="text-sm text-muted-foreground lowercase">personalize o botão de adicionar à mochila</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium lowercase">texto do botão</Label>
            <Input
              value={addToCartText}
              onChange={(e) => setAddToCartText(e.target.value)}
              placeholder="adicionar à mochila"
              className="h-12 text-lg lowercase"
              data-testid="input-add-to-cart-text"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">cor da borda</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={addToCartBorder.startsWith("rgba") ? "#ffffff" : addToCartBorder}
                  onChange={(e) => setAddToCartBorder(e.target.value)}
                  className="w-12 h-12 rounded-full border-0 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-border/20"
                  data-testid="color-add-to-cart-border"
                />
                <Input
                  value={addToCartBorder}
                  onChange={(e) => setAddToCartBorder(e.target.value)}
                  placeholder="#ffffff1f"
                  className="h-12 font-mono text-sm"
                  data-testid="input-add-to-cart-border-hex"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">cor do texto</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={addToCartTextColor.startsWith("rgba") ? "#ffffff" : addToCartTextColor}
                  onChange={(e) => setAddToCartTextColor(e.target.value)}
                  className="w-12 h-12 rounded-full border-0 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-border/20"
                  data-testid="color-add-to-cart-text"
                />
                <Input
                  value={addToCartTextColor}
                  onChange={(e) => setAddToCartTextColor(e.target.value)}
                  placeholder="#ffffffe6"
                  className="h-12 font-mono text-sm"
                  data-testid="input-add-to-cart-text-hex"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground lowercase mb-3">prévia</p>
          <div className="bg-[#1d1d1f] rounded-2xl p-6">
            <button
              className="w-full h-[50px] rounded-[14px] bg-transparent text-[15px] font-medium tracking-[-0.01em] border"
              style={{ borderColor: addToCartBorder, color: addToCartTextColor }}
            >
              {addToCartText}
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 opacity-60" />
          </div>
          <div>
            <h3 className="text-lg font-medium lowercase">selo de confiança</h3>
            <p className="text-sm text-muted-foreground lowercase">texto e ícone exibido abaixo dos botões de compra</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium lowercase">texto do selo</Label>
            <Input
              value={trustText}
              onChange={(e) => setTrustText(e.target.value)}
              placeholder="pagamento seguro via mercado pago"
              className="h-12 text-lg lowercase"
              data-testid="input-trust-text"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium lowercase">ícone</Label>
            <Select value={trustIcon} onValueChange={setTrustIcon}>
              <SelectTrigger className="h-12 text-base lowercase" data-testid="select-trust-icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="lowercase">
                    <div className="flex items-center gap-2">
                      <opt.Icon className="h-4 w-4" />
                      <span>{opt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground lowercase mb-3">prévia</p>
          <div className="bg-[#1d1d1f] rounded-2xl p-6">
            <div className="flex items-center justify-center gap-2 text-white/30">
              <TrustIconComponent className="w-4 h-4" />
              <span className="text-[11px] font-medium tracking-wide">{trustText}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
