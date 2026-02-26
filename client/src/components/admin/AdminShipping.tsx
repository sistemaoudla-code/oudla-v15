import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Truck, Calendar, MessageSquare, Package, MapPin } from "lucide-react";
import { useAdminSave } from "@/contexts/AdminSaveContext";

interface ShippingConfig {
  system: string;
  threshold: string;
  shippingValue: string;
  shippingMinDays: string;
  shippingMaxDays: string;
  shippingMode: string;
  originCep: string;
  correiosReady: boolean;
  correiosExtraDays: string;
  defaultWeight: string;
  defaultHeight: string;
  defaultWidth: string;
  defaultLength: string;
  correiosServices: string;
}

export default function AdminShipping() {
  const { toast } = useToast();
  const [shippingValue, setShippingValue] = useState("");
  const [thresholdValue, setThresholdValue] = useState("200");
  const [minDays, setMinDays] = useState("9");
  const [maxDays, setMaxDays] = useState("15");
  const [ctaShippingFreeText, setCtaShippingFreeText] = useState("chegará grátis");
  const [mochilaShippingFreeText, setMochilaShippingFreeText] = useState("entrega grátis");
  const [mochilaShippingPaidText, setMochilaShippingPaidText] = useState("entrega por");
  const [shippingMode, setShippingMode] = useState("flat");
  const [originCep, setOriginCep] = useState("");
  const [defaultWeight, setDefaultWeight] = useState("300");
  const [defaultHeight, setDefaultHeight] = useState("4");
  const [defaultWidth, setDefaultWidth] = useState("30");
  const [defaultLength, setDefaultLength] = useState("40");
  const [correiosServices, setCorreiosServices] = useState("03298,03220");
  const [correiosExtraDays, setCorreiosExtraDays] = useState("0");

  const { data: shippingConfig, isLoading } = useQuery<ShippingConfig>({
    queryKey: ['/api/settings/free_shipping'],
  });

  const { data: ctaConfig } = useQuery<{ ctaShippingFreeText: string; ctaShippingPaidText: string; mochilaShippingFreeText: string; mochilaShippingPaidText: string }>({
    queryKey: ['/api/settings/cta'],
  });

  const { data: freeShippingSetting } = useQuery<{ value: string }>({
    queryKey: ['/api/admin/settings/free_shipping_enabled'],
  });

  const freeShippingEnabled = freeShippingSetting?.value === "true";
  const shippingSystem = shippingConfig?.system || "threshold";
  const isThresholdSystem = shippingSystem === "threshold";

  useEffect(() => {
    if (shippingConfig?.shippingValue) setShippingValue(shippingConfig.shippingValue);
    if (shippingConfig?.threshold) setThresholdValue(shippingConfig.threshold);
    if (shippingConfig?.shippingMinDays) setMinDays(shippingConfig.shippingMinDays);
    if (shippingConfig?.shippingMaxDays) setMaxDays(shippingConfig.shippingMaxDays);
    if (shippingConfig?.shippingMode) setShippingMode(shippingConfig.shippingMode);
    if (shippingConfig?.originCep) setOriginCep(shippingConfig.originCep);
    if (shippingConfig?.defaultWeight) setDefaultWeight(shippingConfig.defaultWeight);
    if (shippingConfig?.defaultHeight) setDefaultHeight(shippingConfig.defaultHeight);
    if (shippingConfig?.defaultWidth) setDefaultWidth(shippingConfig.defaultWidth);
    if (shippingConfig?.defaultLength) setDefaultLength(shippingConfig.defaultLength);
    if (shippingConfig?.correiosServices) setCorreiosServices(shippingConfig.correiosServices);
    if (shippingConfig?.correiosExtraDays) setCorreiosExtraDays(shippingConfig.correiosExtraDays);
  }, [shippingConfig]);

  useEffect(() => {
    if (ctaConfig) {
      if (ctaConfig.ctaShippingFreeText) setCtaShippingFreeText(ctaConfig.ctaShippingFreeText);
      if (ctaConfig.mochilaShippingFreeText) setMochilaShippingFreeText(ctaConfig.mochilaShippingFreeText);
      if (ctaConfig.mochilaShippingPaidText) setMochilaShippingPaidText(ctaConfig.mochilaShippingPaidText);
    }
  }, [ctaConfig]);

  const updateShippingMutation = useMutation({
    mutationFn: async (value: string) => {
      return await apiRequest("POST", "/api/admin/settings", {
        key: "default_shipping_value",
        value: value,
        type: "number"
      });
    },
    onSuccess: () => {
      toast({ title: "valor do frete atualizado" });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/free_shipping'] });
    },
    onError: () => {
      toast({ title: "erro ao atualizar frete", variant: "destructive" });
    }
  });

  const updateThresholdMutation = useMutation({
    mutationFn: async (value: string) => {
      return await apiRequest("POST", "/api/admin/settings", {
        key: "free_shipping_threshold",
        value: value,
        type: "number"
      });
    },
    onSuccess: () => {
      toast({ title: "valor mínimo atualizado" });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/free_shipping'] });
    },
    onError: () => {
      toast({ title: "erro ao atualizar valor mínimo", variant: "destructive" });
    }
  });

  const toggleFreeShippingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("POST", "/api/admin/settings", {
        key: "free_shipping_enabled",
        value: enabled ? "true" : "false",
        type: "boolean"
      });
    },
    onSuccess: () => {
      toast({ title: "configuração atualizada" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/free_shipping_enabled'] });
    }
  });

  const toggleShippingSystemMutation = useMutation({
    mutationFn: async (system: "threshold" | "all") => {
      return await apiRequest("POST", "/api/admin/settings", {
        key: "free_shipping_system",
        value: system,
        type: "text"
      });
    },
    onSuccess: () => {
      toast({ title: "sistema de frete atualizado" });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/free_shipping'] });
    }
  });

  const updateMinDaysMutation = useMutation({
    mutationFn: async (value: string) => {
      return await apiRequest("POST", "/api/admin/settings", {
        key: "shipping_min_days",
        value: value,
        type: "number"
      });
    },
    onSuccess: () => {
      toast({ title: "prazo mínimo atualizado" });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/free_shipping'] });
    },
    onError: () => {
      toast({ title: "erro ao atualizar prazo", variant: "destructive" });
    }
  });

  const updateMaxDaysMutation = useMutation({
    mutationFn: async (value: string) => {
      return await apiRequest("POST", "/api/admin/settings", {
        key: "shipping_max_days",
        value: value,
        type: "number"
      });
    },
    onSuccess: () => {
      toast({ title: "prazo máximo atualizado" });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/free_shipping'] });
    },
    onError: () => {
      toast({ title: "erro ao atualizar prazo", variant: "destructive" });
    }
  });

  const handleSaveDeadline = () => {
    const min = parseInt(minDays);
    const max = parseInt(maxDays);
    if (isNaN(min) || isNaN(max) || min < 1 || max < 1 || min > max) {
      toast({ title: "prazos inválidos. mínimo deve ser menor que máximo", variant: "destructive" });
      return;
    }
    updateMinDaysMutation.mutate(minDays);
    updateMaxDaysMutation.mutate(maxDays);
  };

  const handleSaveShippingTexts = async () => {
    try {
      await Promise.all([
        apiRequest("POST", "/api/admin/settings", { key: "cta_shipping_free_text", value: ctaShippingFreeText, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "mochila_shipping_free_text", value: mochilaShippingFreeText, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "mochila_shipping_paid_text", value: mochilaShippingPaidText, type: "text" }),
      ]);
      queryClient.invalidateQueries({ queryKey: ['/api/settings/cta'] });
      toast({ title: "textos de frete atualizados" });
    } catch {
      toast({ title: "erro ao salvar textos", variant: "destructive" });
    }
  };

  const handleSaveShipping = () => {
    if (!shippingValue || isNaN(parseFloat(shippingValue))) {
      toast({ title: "digite um valor válido", variant: "destructive" });
      return;
    }
    updateShippingMutation.mutate(shippingValue);
  };

  const handleSaveThreshold = () => {
    if (!thresholdValue || isNaN(parseFloat(thresholdValue))) {
      toast({ title: "digite um valor válido", variant: "destructive" });
      return;
    }
    updateThresholdMutation.mutate(thresholdValue);
  };

  const handleSaveAll = useCallback(async () => {
    try {
      if (!shippingValue || isNaN(parseFloat(shippingValue))) {
        toast({ title: "valor do frete inválido", variant: "destructive" });
        return;
      }
      if (!thresholdValue || isNaN(parseFloat(thresholdValue))) {
        toast({ title: "valor mínimo inválido", variant: "destructive" });
        return;
      }
      const min = parseInt(minDays);
      const max = parseInt(maxDays);
      if (isNaN(min) || isNaN(max) || min < 1 || max < 1 || min > max) {
        toast({ title: "prazos inválidos. mínimo deve ser menor que máximo", variant: "destructive" });
        return;
      }

      await Promise.all([
        apiRequest("POST", "/api/admin/settings", { key: "default_shipping_value", value: shippingValue, type: "number" }),
        apiRequest("POST", "/api/admin/settings", { key: "free_shipping_threshold", value: thresholdValue, type: "number" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_min_days", value: minDays, type: "number" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_max_days", value: maxDays, type: "number" }),
        apiRequest("POST", "/api/admin/settings", { key: "cta_shipping_free_text", value: ctaShippingFreeText, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "mochila_shipping_free_text", value: mochilaShippingFreeText, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "mochila_shipping_paid_text", value: mochilaShippingPaidText, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_mode", value: shippingMode, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_origin_cep", value: originCep.replace(/\D/g, ""), type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_default_weight", value: defaultWeight, type: "number" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_default_height", value: defaultHeight, type: "number" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_default_width", value: defaultWidth, type: "number" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_default_length", value: defaultLength, type: "number" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_correios_services", value: correiosServices, type: "text" }),
        apiRequest("POST", "/api/admin/settings", { key: "shipping_correios_extra_days", value: correiosExtraDays, type: "number" }),
      ]);

      queryClient.invalidateQueries({ queryKey: ['/api/settings/free_shipping'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/cta'] });
      toast({ title: "configurações de frete salvas" });
    } catch {
      toast({ title: "erro ao salvar configurações", variant: "destructive" });
    }
  }, [shippingValue, thresholdValue, minDays, maxDays, ctaShippingFreeText, mochilaShippingFreeText, mochilaShippingPaidText, shippingMode, originCep, defaultWeight, defaultHeight, defaultWidth, defaultLength, correiosServices, correiosExtraDays, toast]);

  useAdminSave(handleSaveAll);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Truck className="h-6 w-6 opacity-60" />
        <div>
          <h2 className="text-2xl font-light lowercase tracking-tight">configuração de frete</h2>
          <p className="text-sm text-muted-foreground lowercase">gerencie o frete do site</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 opacity-60" />
              </div>
              <div>
                <h3 className="text-lg font-medium lowercase">sistema de frete grátis</h3>
                <p className="text-sm text-muted-foreground lowercase">escolha como o frete grátis é concedido</p>
              </div>
            </div>
            <div className="flex bg-muted/30 p-1 rounded-xl border border-border/30 shrink-0 w-full sm:w-auto">
              <Button
                variant={isThresholdSystem ? "default" : "ghost"}
                size="sm"
                className="rounded-lg lowercase h-8 text-xs px-3 flex-1 sm:flex-initial whitespace-nowrap"
                onClick={() => toggleShippingSystemMutation.mutate("threshold")}
                disabled={toggleShippingSystemMutation.isPending}
              >
                a partir de valor
              </Button>
              <Button
                variant={!isThresholdSystem ? "default" : "ghost"}
                size="sm"
                className="rounded-lg lowercase h-8 text-xs px-3 flex-1 sm:flex-initial whitespace-nowrap"
                onClick={() => toggleShippingSystemMutation.mutate("all")}
                disabled={toggleShippingSystemMutation.isPending}
              >
                grátis para todos
              </Button>
            </div>
          </div>

          <div className="h-px bg-border/50 w-full" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium lowercase">exibir aviso na mochila</h3>
              <p className="text-xs text-muted-foreground lowercase">mostrar mensagem de frete grátis/falta para atingir</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="free-shipping-toggle" className="text-xs uppercase tracking-tighter text-muted-foreground">
                {freeShippingEnabled ? "ativo" : "inativo"}
              </Label>
              <Switch
                id="free-shipping-toggle"
                checked={freeShippingEnabled}
                onCheckedChange={(checked) => toggleFreeShippingMutation.mutate(checked)}
                disabled={toggleFreeShippingMutation.isPending}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-medium lowercase">valor do frete</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium lowercase">valor padrão do frete (R$)</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingValue}
                  onChange={(e) => setShippingValue(e.target.value)}
                  placeholder="19.99"
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground lowercase">
              este valor será aplicado para todos os pedidos
            </p>
          </div>

          {isThresholdSystem && (
            <div className="space-y-2 pt-4 border-t border-border/50">
              <Label className="text-sm font-medium lowercase">valor mínimo para frete grátis (R$)</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    placeholder="200"
                    className="pl-10 h-12 text-lg"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground lowercase">
                compras acima deste valor terão frete grátis
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">valor do frete:</span>
              <span className="font-medium">R$ {parseFloat(shippingValue || "0").toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <Package className="h-5 w-5 opacity-60" />
          </div>
          <div>
            <h3 className="text-lg font-medium lowercase">modo de cálculo do frete</h3>
            <p className="text-sm text-muted-foreground lowercase">escolha entre valor fixo ou cálculo real pelos correios</p>
          </div>
        </div>

        <div className="flex bg-muted/30 p-1 rounded-xl border border-border/30 w-full">
          <Button
            variant={shippingMode === "flat" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg lowercase h-8 text-xs px-3 flex-1 whitespace-nowrap"
            onClick={() => setShippingMode("flat")}
            data-testid="button-shipping-mode-flat"
          >
            valor fixo
          </Button>
          <Button
            variant={shippingMode === "correios" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg lowercase h-8 text-xs px-3 flex-1 whitespace-nowrap"
            onClick={() => setShippingMode("correios")}
            data-testid="button-shipping-mode-correios"
          >
            correios (real)
          </Button>
        </div>

        {shippingMode === "correios" && (
          <div className="space-y-4 pt-2">
            <div className={`rounded-xl p-3 text-sm lowercase ${shippingConfig?.correiosReady ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
              {shippingConfig?.correiosReady
                ? "correios conectado e pronto para uso"
                : "correios em stand-by — configure as credenciais no servidor para ativar (veja CORREIOS_SETUP.md)"
              }
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> cep de origem (seu endereço/cd)
              </Label>
              <Input
                value={originCep}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                  let fmt = val;
                  if (val.length > 5) fmt = `${val.slice(0, 5)}-${val.slice(5)}`;
                  setOriginCep(fmt);
                }}
                placeholder="00000-000"
                className="h-12 text-lg"
                maxLength={9}
                data-testid="input-origin-cep"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">peso padrão do pacote (gramas)</Label>
              <Input
                type="number"
                min="1"
                value={defaultWeight}
                onChange={(e) => setDefaultWeight(e.target.value)}
                placeholder="300"
                className="h-12 text-lg"
                data-testid="input-default-weight"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium lowercase">altura (cm)</Label>
                <Input
                  type="number"
                  min="1"
                  value={defaultHeight}
                  onChange={(e) => setDefaultHeight(e.target.value)}
                  placeholder="4"
                  className="h-12 text-lg"
                  data-testid="input-default-height"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium lowercase">largura (cm)</Label>
                <Input
                  type="number"
                  min="1"
                  value={defaultWidth}
                  onChange={(e) => setDefaultWidth(e.target.value)}
                  placeholder="30"
                  className="h-12 text-lg"
                  data-testid="input-default-width"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium lowercase">comprimento (cm)</Label>
                <Input
                  type="number"
                  min="1"
                  value={defaultLength}
                  onChange={(e) => setDefaultLength(e.target.value)}
                  placeholder="40"
                  className="h-12 text-lg"
                  data-testid="input-default-length"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">serviços dos correios</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: "03298", label: "PAC" },
                  { code: "03220", label: "SEDEX" },
                  { code: "03337", label: "Mini Envios" },
                ].map(svc => {
                  const active = correiosServices.split(",").map(s => s.trim()).includes(svc.code);
                  return (
                    <Button
                      key={svc.code}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className="rounded-lg lowercase text-xs"
                      onClick={() => {
                        const current = correiosServices.split(",").map(s => s.trim()).filter(Boolean);
                        if (active) {
                          setCorreiosServices(current.filter(c => c !== svc.code).join(","));
                        } else {
                          setCorreiosServices([...current, svc.code].join(","));
                        }
                      }}
                      data-testid={`button-service-${svc.code}`}
                    >
                      {svc.label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground lowercase">
                selecione quais serviços serão oferecidos ao cliente
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">dias extras (somados ao prazo dos correios)</Label>
              <Input
                type="number"
                min="0"
                value={correiosExtraDays}
                onChange={(e) => setCorreiosExtraDays(e.target.value)}
                placeholder="0"
                className="h-12 text-lg"
                data-testid="input-correios-extra-days"
              />
              <p className="text-xs text-muted-foreground lowercase">
                esse valor será adicionado ao prazo real dos correios. ex: se correios retornar 5 dias e você colocar 3, o cliente verá 8 dias úteis.
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <p className="text-xs text-muted-foreground lowercase">
                quando o correios estiver ativo, o valor fixo acima será usado apenas como fallback caso a api não responda.
                o frete grátis continua funcionando normalmente — se o subtotal atingir o valor mínimo, o frete será R$ 0.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 opacity-60" />
          </div>
          <div>
            <h3 className="text-lg font-medium lowercase">prazo de entrega</h3>
            <p className="text-sm text-muted-foreground lowercase">configure o prazo em dias úteis</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium lowercase">mínimo (dias úteis)</Label>
              <Input
                type="number"
                min="1"
                value={minDays}
                onChange={(e) => setMinDays(e.target.value)}
                placeholder="9"
                className="h-12 text-lg"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium lowercase">máximo (dias úteis)</Label>
              <Input
                type="number"
                min="1"
                value={maxDays}
                onChange={(e) => setMaxDays(e.target.value)}
                placeholder="15"
                className="h-12 text-lg"
              />
            </div>
          </div>
          
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="bg-muted/30 rounded-xl p-4 space-y-1">
            <p className="text-xs text-muted-foreground lowercase">prévia do prazo</p>
            <p className="text-sm lowercase">
              {(() => {
                const min = parseInt(minDays) || 9;
                const max = parseInt(maxDays) || 15;
                const addBizDays = (d: Date, n: number) => {
                  const r = new Date(d);
                  let a = 0;
                  while (a < n) { r.setDate(r.getDate() + 1); if (r.getDay() !== 0 && r.getDay() !== 6) a++; }
                  return r;
                };
                const today = new Date();
                const dMin = addBizDays(today, min);
                const dMax = addBizDays(today, max);
                const fmt = (d: Date) => `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
                return `entrega entre ${fmt(dMin)} a ${fmt(dMax)}`;
              })()}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5 opacity-60" />
          </div>
          <div>
            <h3 className="text-lg font-medium lowercase">textos de frete</h3>
            <p className="text-sm text-muted-foreground lowercase">personalize as mensagens exibidas no produto e na mochila</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">página do produto</p>
            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">texto de frete grátis</Label>
              <Input
                value={ctaShippingFreeText}
                onChange={(e) => setCtaShippingFreeText(e.target.value)}
                placeholder="chegará grátis"
                className="h-12 text-base lowercase"
                data-testid="input-cta-shipping-free"
              />
              <p className="text-xs text-muted-foreground lowercase">quando frete não é grátis, exibe apenas o prazo de entrega</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">mochila (carrinho)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium lowercase">frete grátis</Label>
                <Input
                  value={mochilaShippingFreeText}
                  onChange={(e) => setMochilaShippingFreeText(e.target.value)}
                  placeholder="entrega grátis"
                  className="h-12 text-base lowercase"
                  data-testid="input-mochila-shipping-free"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium lowercase">frete pago</Label>
                <Input
                  value={mochilaShippingPaidText}
                  onChange={(e) => setMochilaShippingPaidText(e.target.value)}
                  placeholder="entrega por"
                  className="h-12 text-base lowercase"
                  data-testid="input-mochila-shipping-paid"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-border/50 space-y-3">
          <p className="text-xs text-muted-foreground lowercase">prévia</p>
          <div className="bg-[#1d1d1f] rounded-2xl p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">produto</p>
            <p className="text-[13px] text-white/80 font-light">{ctaShippingFreeText} entre 26/02 a 06/03</p>
            <p className="text-[13px] text-white/80 font-light">chegará entre 26/02 a 06/03</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">mochila</p>
            <p className="text-sm lowercase">{mochilaShippingFreeText} entre 26/02 a 06/03</p>
            <p className="text-sm lowercase">{mochilaShippingPaidText} R$ 19,90 entre 26/02 a 06/03</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
