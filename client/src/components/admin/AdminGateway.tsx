import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, Loader2, Shield, Banknote, Clock, FileText, Ban, ChevronUp, ChevronDown, Landmark, Wallet } from "lucide-react";
import { useAdminSave } from "@/contexts/AdminSaveContext";
import {
  SiVisa, SiMastercard, SiAmericanexpress, SiPix, SiDinersclub,
  SiDiscover, SiPaypal, SiApplepay, SiGooglepay,
} from "react-icons/si";

interface PaymentBrand {
  id: string;
  label: string;
  iconKey: string;
  category: string;
  enabled: boolean;
  displayOrder: number;
}

const BRAND_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  pix: SiPix,
  visa: SiVisa,
  mastercard: SiMastercard,
  amex: SiAmericanexpress,
  diners: SiDinersclub,
  discover: SiDiscover,
  paypal: SiPaypal,
  applepay: SiApplepay,
  googlepay: SiGooglepay,
  boleto: Banknote,
  caixa: Landmark,
  elo: CreditCard,
  hipercard: CreditCard,
  cabal: CreditCard,
  debito_visa: SiVisa,
  debito_master: SiMastercard,
  debito_elo: CreditCard,
  mercadopago: Wallet,
  debito_cabal: CreditCard,
  account_money: Wallet,
};

const CATEGORY_LABEL: Record<string, string> = {
  instant: "instantâneo",
  credit: "crédito",
  debit: "débito",
  voucher: "boleto/voucher",
  wallet: "carteira digital",
};

const DEFAULT_BRANDS: PaymentBrand[] = [
  { id: "pix", label: "Pix", iconKey: "pix", category: "instant", enabled: true, displayOrder: 0 },
  { id: "visa", label: "Visa", iconKey: "visa", category: "credit", enabled: true, displayOrder: 1 },
  { id: "mastercard", label: "Mastercard", iconKey: "mastercard", category: "credit", enabled: true, displayOrder: 2 },
  { id: "amex", label: "American Express", iconKey: "amex", category: "credit", enabled: true, displayOrder: 3 },
  { id: "elo", label: "Elo", iconKey: "elo", category: "credit", enabled: true, displayOrder: 4 },
  { id: "hipercard", label: "Hipercard", iconKey: "hipercard", category: "credit", enabled: true, displayOrder: 5 },
  { id: "diners", label: "Diners Club", iconKey: "diners", category: "credit", enabled: true, displayOrder: 6 },
  { id: "discover", label: "Discover", iconKey: "discover", category: "credit", enabled: true, displayOrder: 7 },
  { id: "cabal", label: "Cabal", iconKey: "cabal", category: "credit", enabled: false, displayOrder: 8 },
  { id: "debito_visa", label: "Débito Visa", iconKey: "debito_visa", category: "debit", enabled: true, displayOrder: 9 },
  { id: "debito_master", label: "Débito Mastercard", iconKey: "debito_master", category: "debit", enabled: true, displayOrder: 10 },
  { id: "debito_elo", label: "Débito Elo", iconKey: "debito_elo", category: "debit", enabled: true, displayOrder: 11 },
  { id: "debito_cabal", label: "Débito Cabal", iconKey: "debito_cabal", category: "debit", enabled: false, displayOrder: 12 },
  { id: "boleto", label: "Boleto Bancário", iconKey: "boleto", category: "voucher", enabled: true, displayOrder: 13 },
  { id: "caixa", label: "Caixa Econômica Federal", iconKey: "caixa", category: "voucher", enabled: true, displayOrder: 14 },
  { id: "paypal", label: "PayPal", iconKey: "paypal", category: "wallet", enabled: true, displayOrder: 15 },
  { id: "mercadopago", label: "Mercado Pago", iconKey: "mercadopago", category: "wallet", enabled: true, displayOrder: 16 },
  { id: "applepay", label: "Apple Pay", iconKey: "applepay", category: "wallet", enabled: true, displayOrder: 17 },
  { id: "googlepay", label: "Google Pay", iconKey: "googlepay", category: "wallet", enabled: true, displayOrder: 18 },
  { id: "account_money", label: "Saldo Mercado Pago", iconKey: "account_money", category: "wallet", enabled: false, displayOrder: 19 },
];

interface GatewaySettings {
  gateway_pix_enabled: string;
  gateway_credit_card_enabled: string;
  gateway_debit_card_enabled: string;
  gateway_boleto_enabled: string;
  gateway_max_installments: string;
  gateway_free_installments: string;
  gateway_auto_return: string;
  gateway_expiration_hours: string;
  gateway_statement_descriptor: string;
  gateway_binary_mode: string;
  gateway_excluded_methods: string;
  gateway_excluded_types: string;
}

const GATEWAY_KEYS = [
  "gateway_pix_enabled",
  "gateway_credit_card_enabled",
  "gateway_debit_card_enabled",
  "gateway_boleto_enabled",
  "gateway_max_installments",
  "gateway_free_installments",
  "gateway_auto_return",
  "gateway_expiration_hours",
  "gateway_statement_descriptor",
  "gateway_binary_mode",
  "gateway_excluded_methods",
  "gateway_excluded_types",
] as const;

const DEFAULTS: GatewaySettings = {
  gateway_pix_enabled: "true",
  gateway_credit_card_enabled: "true",
  gateway_debit_card_enabled: "true",
  gateway_boleto_enabled: "true",
  gateway_max_installments: "12",
  gateway_free_installments: "1",
  gateway_auto_return: "approved",
  gateway_expiration_hours: "24",
  gateway_statement_descriptor: "OUDLA",
  gateway_binary_mode: "false",
  gateway_excluded_methods: "",
  gateway_excluded_types: "",
};

export default function AdminGateway() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GatewaySettings>({ ...DEFAULTS });
  const [brands, setBrands] = useState<PaymentBrand[]>(DEFAULT_BRANDS);

  const { data: mpConfig } = useQuery<{ success: boolean; publicKey: string; isProduction: boolean }>({
    queryKey: ["/api/checkout/mp-config"],
  });

  const { data: fetchedSettings, isLoading } = useQuery<GatewaySettings>({
    queryKey: ["gateway-settings"],
    queryFn: async () => {
      const results: Record<string, string> = {};
      const responses = await Promise.all(
        GATEWAY_KEYS.map((key) =>
          fetch(`/api/admin/settings/${key}`, { credentials: "include" })
            .then((r) => r.json())
            .then((data) => ({ key, value: data.value || "" }))
            .catch(() => ({ key, value: "" }))
        )
      );
      for (const { key, value } of responses) {
        results[key] = value;
      }
      return results as unknown as GatewaySettings;
    },
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings({
        gateway_pix_enabled: fetchedSettings.gateway_pix_enabled || DEFAULTS.gateway_pix_enabled,
        gateway_credit_card_enabled: fetchedSettings.gateway_credit_card_enabled || DEFAULTS.gateway_credit_card_enabled,
        gateway_debit_card_enabled: fetchedSettings.gateway_debit_card_enabled || DEFAULTS.gateway_debit_card_enabled,
        gateway_boleto_enabled: fetchedSettings.gateway_boleto_enabled || DEFAULTS.gateway_boleto_enabled,
        gateway_max_installments: fetchedSettings.gateway_max_installments || DEFAULTS.gateway_max_installments,
        gateway_free_installments: fetchedSettings.gateway_free_installments || DEFAULTS.gateway_free_installments,
        gateway_auto_return: fetchedSettings.gateway_auto_return || DEFAULTS.gateway_auto_return,
        gateway_expiration_hours: fetchedSettings.gateway_expiration_hours || DEFAULTS.gateway_expiration_hours,
        gateway_statement_descriptor: fetchedSettings.gateway_statement_descriptor || DEFAULTS.gateway_statement_descriptor,
        gateway_binary_mode: fetchedSettings.gateway_binary_mode || DEFAULTS.gateway_binary_mode,
        gateway_excluded_methods: fetchedSettings.gateway_excluded_methods || DEFAULTS.gateway_excluded_methods,
        gateway_excluded_types: fetchedSettings.gateway_excluded_types || DEFAULTS.gateway_excluded_types,
      });
    }
  }, [fetchedSettings]);

  const { data: fetchedBrands } = useQuery<{ brands: PaymentBrand[] }>({
    queryKey: ["/api/admin/payment-brands"],
  });

  useEffect(() => {
    if (fetchedBrands?.brands && fetchedBrands.brands.length > 0) {
      setBrands(fetchedBrands.brands.sort((a, b) => a.displayOrder - b.displayOrder));
    }
  }, [fetchedBrands]);

  const saveBrandsMutation = useMutation({
    mutationFn: async () => {
      const brandsToSave = brands.map((b, i) => ({ ...b, displayOrder: i }));
      await apiRequest("PUT", "/api/admin/payment-brands", { brands: brandsToSave });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-brands"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-brands"] });
    },
  });

  const moveBrand = (index: number, direction: "up" | "down") => {
    setBrands((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleBrand = (id: string, enabled: boolean) => {
    setBrands((prev) => prev.map((b) => b.id === id ? { ...b, enabled } : b));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const settingsToSave: Array<{ key: string; value: string; type: string }> = [
        { key: "gateway_pix_enabled", value: settings.gateway_pix_enabled, type: "boolean" },
        { key: "gateway_credit_card_enabled", value: settings.gateway_credit_card_enabled, type: "boolean" },
        { key: "gateway_debit_card_enabled", value: settings.gateway_debit_card_enabled, type: "boolean" },
        { key: "gateway_boleto_enabled", value: settings.gateway_boleto_enabled, type: "boolean" },
        { key: "gateway_max_installments", value: settings.gateway_max_installments, type: "number" },
        { key: "gateway_free_installments", value: settings.gateway_free_installments, type: "number" },
        { key: "gateway_auto_return", value: settings.gateway_auto_return, type: "text" },
        { key: "gateway_expiration_hours", value: settings.gateway_expiration_hours, type: "number" },
        { key: "gateway_statement_descriptor", value: settings.gateway_statement_descriptor, type: "text" },
        { key: "gateway_binary_mode", value: settings.gateway_binary_mode, type: "boolean" },
        { key: "gateway_excluded_methods", value: settings.gateway_excluded_methods, type: "text" },
        { key: "gateway_excluded_types", value: settings.gateway_excluded_types, type: "text" },
      ];
      await Promise.all(
        settingsToSave.map((s) => apiRequest("POST", "/api/admin/settings", s))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-settings"] });
    },
  });

  const handleSaveAll = useCallback(async () => {
    try {
      await saveMutation.mutateAsync();
      await saveBrandsMutation.mutateAsync();
      toast({ title: "configurações salvas", description: "todas as configurações do gateway foram atualizadas." });
    } catch {
      toast({ title: "erro ao salvar", description: "não foi possível salvar as configurações.", variant: "destructive" });
    }
  }, [saveMutation, saveBrandsMutation, toast]);

  useAdminSave(handleSaveAll);

  const updateSetting = (key: keyof GatewaySettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBool = (key: keyof GatewaySettings, checked: boolean) => {
    updateSetting(key, checked ? "true" : "false");
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasPublicKey = !!(mpConfig?.publicKey);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium lowercase" data-testid="text-gateway-title">gateway de pagamento</h2>
        <p className="text-sm text-muted-foreground lowercase">configure o mercado pago checkout pro</p>
      </div>

      <Card>
        <CardContent className="pt-6 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-3 rounded-2xl transition-colors ${hasPublicKey ? "bg-primary/10" : "bg-muted"}`}>
                <Shield className={`h-6 w-6 transition-colors ${hasPublicKey ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium lowercase text-sm sm:text-base" data-testid="text-mp-status-label">status da integração</p>
                <p className="text-xs sm:text-sm text-muted-foreground lowercase">
                  {hasPublicKey ? "chaves configuradas" : "chaves não configuradas"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={hasPublicKey ? "default" : "secondary"} className="lowercase" data-testid="badge-mp-public-key">
                {hasPublicKey ? "public key configurada" : "public key ausente"}
              </Badge>
              {mpConfig && (
                <Badge variant={mpConfig.isProduction ? "default" : "secondary"} className="lowercase" data-testid="badge-mp-environment">
                  {mpConfig.isProduction ? "produção" : "sandbox"}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 opacity-60" />
            </div>
            <div>
              <h3 className="text-lg font-medium lowercase" data-testid="text-payment-methods-title">métodos de pagamento</h3>
              <p className="text-sm text-muted-foreground lowercase">ative ou desative formas de pagamento no checkout</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium lowercase">pix</p>
                <p className="text-xs text-muted-foreground lowercase">pagamento instantâneo via pix</p>
              </div>
              <Switch
                checked={settings.gateway_pix_enabled === "true"}
                onCheckedChange={(c) => toggleBool("gateway_pix_enabled", c)}
                data-testid="switch-gateway-pix"
              />
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium lowercase">cartão de crédito</p>
                <p className="text-xs text-muted-foreground lowercase">visa, mastercard, amex, elo, hipercard</p>
              </div>
              <Switch
                checked={settings.gateway_credit_card_enabled === "true"}
                onCheckedChange={(c) => toggleBool("gateway_credit_card_enabled", c)}
                data-testid="switch-gateway-credit-card"
              />
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium lowercase">cartão de débito</p>
                <p className="text-xs text-muted-foreground lowercase">débito visa, mastercard e elo</p>
              </div>
              <Switch
                checked={settings.gateway_debit_card_enabled === "true"}
                onCheckedChange={(c) => toggleBool("gateway_debit_card_enabled", c)}
                data-testid="switch-gateway-debit-card"
              />
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium lowercase">boleto bancário</p>
                <p className="text-xs text-muted-foreground lowercase">pagamento via boleto com prazo de compensação</p>
              </div>
              <Switch
                checked={settings.gateway_boleto_enabled === "true"}
                onCheckedChange={(c) => toggleBool("gateway_boleto_enabled", c)}
                data-testid="switch-gateway-boleto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
              <Banknote className="h-5 w-5 opacity-60" />
            </div>
            <div>
              <h3 className="text-lg font-medium lowercase" data-testid="text-installments-title">parcelamento</h3>
              <p className="text-sm text-muted-foreground lowercase">configure as opções de parcelamento no checkout</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">máximo de parcelas</Label>
              <Select
                value={settings.gateway_max_installments}
                onValueChange={(v) => updateSetting("gateway_max_installments", v)}
              >
                <SelectTrigger data-testid="select-max-installments">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground lowercase">número máximo de parcelas permitidas (1-12)</p>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
              <Label className="text-sm font-medium lowercase">parcelas sem juros</Label>
              <p className="text-xs text-muted-foreground lowercase leading-relaxed" data-testid="text-free-installments-info">
                as parcelas sem juros são configuradas diretamente no painel do mercado pago, na seção "seu negócio &gt; custos". lá você define até quantas parcelas quer absorver os juros. essa configuração não é feita pela API.
              </p>
              <a
                href="https://www.mercadopago.com.br/costs-section/installments"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline lowercase"
                data-testid="link-mp-installments-config"
              >
                abrir configuração no mercado pago
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 opacity-60" />
            </div>
            <div>
              <h3 className="text-lg font-medium lowercase" data-testid="text-checkout-behavior-title">comportamento do checkout</h3>
              <p className="text-sm text-muted-foreground lowercase">controle o fluxo e validade do checkout</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">retorno automático</Label>
              <Select
                value={settings.gateway_auto_return}
                onValueChange={(v) => updateSetting("gateway_auto_return", v)}
              >
                <SelectTrigger data-testid="select-gateway-auto-return">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">approved - somente aprovados</SelectItem>
                  <SelectItem value="all">all - todos os pagamentos</SelectItem>
                  <SelectItem value="none">nenhum - desativado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground lowercase">quando redirecionar automaticamente para a loja após o pagamento</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">validade do checkout (horas)</Label>
              <Input
                type="number"
                min={1}
                max={72}
                value={settings.gateway_expiration_hours}
                onChange={(e) => updateSetting("gateway_expiration_hours", e.target.value)}
                data-testid="input-gateway-expiration-hours"
              />
              <p className="text-xs text-muted-foreground lowercase">tempo em horas até o link de pagamento expirar (1-72)</p>
            </div>
          </div>

          <div className="h-px bg-border/50" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">descritor na fatura</Label>
              <Input
                type="text"
                maxLength={16}
                value={settings.gateway_statement_descriptor}
                onChange={(e) => updateSetting("gateway_statement_descriptor", e.target.value)}
                placeholder="OUDLA"
                data-testid="input-gateway-statement-descriptor"
              />
              <p className="text-xs text-muted-foreground lowercase">nome exibido na fatura do cartão do cliente (máx. 16 caracteres)</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">modo binário</Label>
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground lowercase">aprovar ou rejeitar instantaneamente, sem status pendente</p>
                <Switch
                  checked={settings.gateway_binary_mode === "true"}
                  onCheckedChange={(c) => toggleBool("gateway_binary_mode", c)}
                  data-testid="switch-gateway-binary-mode"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
              <Ban className="h-5 w-5 opacity-60" />
            </div>
            <div>
              <h3 className="text-lg font-medium lowercase" data-testid="text-exclusions-title">exclusões avançadas</h3>
              <p className="text-sm text-muted-foreground lowercase">exclua métodos ou tipos de pagamento específicos</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">métodos de pagamento excluídos</Label>
              <Input
                type="text"
                value={settings.gateway_excluded_methods}
                onChange={(e) => updateSetting("gateway_excluded_methods", e.target.value)}
                placeholder="ex: visa, master, amex"
                data-testid="input-gateway-excluded-methods"
              />
              <p className="text-xs text-muted-foreground lowercase">IDs de métodos separados por vírgula (ex: visa, master, pix, bolbradesco)</p>
            </div>

            <div className="h-px bg-border/50" />

            <div className="space-y-2">
              <Label className="text-sm font-medium lowercase">tipos de pagamento excluídos</Label>
              <Input
                type="text"
                value={settings.gateway_excluded_types}
                onChange={(e) => updateSetting("gateway_excluded_types", e.target.value)}
                placeholder="ex: ticket, atm, digital_currency"
                data-testid="input-gateway-excluded-types"
              />
              <p className="text-xs text-muted-foreground lowercase">IDs de tipos separados por vírgula (ex: ticket para boleto, atm, digital_currency, digital_wallet)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 px-4 sm:px-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 opacity-60" />
            </div>
            <div>
              <h3 className="text-lg font-medium lowercase" data-testid="text-brands-title">bandeiras e métodos aceitos</h3>
              <p className="text-sm text-muted-foreground lowercase">selecione e ordene os métodos exibidos no popup de parcelamento</p>
            </div>
          </div>

          <div className="space-y-2">
            {brands.map((brand, index) => {
              const Icon = BRAND_ICON_MAP[brand.iconKey] || CreditCard;
              return (
                <div
                  key={brand.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${brand.enabled ? "bg-muted/20 border-border/40" : "bg-muted/5 border-border/20 opacity-60"}`}
                  data-testid={`row-brand-${brand.id}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => moveBrand(index, "up")}
                      disabled={index === 0}
                      data-testid={`button-brand-up-${brand.id}`}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => moveBrand(index, "down")}
                      disabled={index === brands.length - 1}
                      data-testid={`button-brand-down-${brand.id}`}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{brand.label}</p>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{CATEGORY_LABEL[brand.category] || brand.category}</p>
                  </div>
                  <Switch
                    checked={brand.enabled}
                    onCheckedChange={(c) => toggleBrand(brand.id, c)}
                    data-testid={`switch-brand-${brand.id}`}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 opacity-60" />
            </div>
            <div>
              <h3 className="text-lg font-medium lowercase" data-testid="text-summary-title">resumo das configurações</h3>
              <p className="text-sm text-muted-foreground lowercase">visão geral das configurações atuais</p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground lowercase">pix</p>
                <Badge variant={settings.gateway_pix_enabled === "true" ? "default" : "secondary"} className="lowercase" data-testid="badge-summary-pix">
                  {settings.gateway_pix_enabled === "true" ? "ativo" : "inativo"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground lowercase">crédito</p>
                <Badge variant={settings.gateway_credit_card_enabled === "true" ? "default" : "secondary"} className="lowercase" data-testid="badge-summary-credit">
                  {settings.gateway_credit_card_enabled === "true" ? "ativo" : "inativo"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground lowercase">débito</p>
                <Badge variant={settings.gateway_debit_card_enabled === "true" ? "default" : "secondary"} className="lowercase" data-testid="badge-summary-debit">
                  {settings.gateway_debit_card_enabled === "true" ? "ativo" : "inativo"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground lowercase">boleto</p>
                <Badge variant={settings.gateway_boleto_enabled === "true" ? "default" : "secondary"} className="lowercase" data-testid="badge-summary-boleto">
                  {settings.gateway_boleto_enabled === "true" ? "ativo" : "inativo"}
                </Badge>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground lowercase">parcelas</p>
                <p className="text-sm font-medium lowercase" data-testid="text-summary-installments">até {settings.gateway_max_installments}x</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground lowercase">sem juros</p>
                <p className="text-sm font-medium lowercase" data-testid="text-summary-free-installments">via painel MP</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground lowercase">validade</p>
                <p className="text-sm font-medium lowercase" data-testid="text-summary-expiration">{settings.gateway_expiration_hours}h</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground lowercase">modo binário</p>
                <Badge variant={settings.gateway_binary_mode === "true" ? "default" : "secondary"} className="lowercase" data-testid="badge-summary-binary">
                  {settings.gateway_binary_mode === "true" ? "ativo" : "inativo"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
