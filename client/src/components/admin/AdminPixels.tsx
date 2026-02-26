// Componente para gerenciar pixels de rastreamento e scripts customizados
// Permite configurar Facebook Pixel, Google Ads, Google Analytics, TikTok e scripts customizados

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useAdminSave } from "@/contexts/AdminSaveContext";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertTriangle, Code, BarChart3, ChevronDown, Loader2 } from "lucide-react";
import { SiFacebook, SiGoogleads, SiGoogleanalytics, SiTiktok } from "react-icons/si";

// Interface para os dados de tracking pixels do backend
interface TrackingPixelsData {
  facebookPixelId: string | null;
  facebookPixelEnabled: boolean;
  facebookTestEventCode: string | null;
  googleAdsConversionId: string | null;
  googleAdsConversionLabel: string | null;
  googleAdsEnabled: boolean;
  googleAnalyticsId: string | null;
  googleAnalyticsEnabled: boolean;
  tiktokPixelId: string | null;
  tiktokPixelEnabled: boolean;
  headerScripts: string | null;
  bodyScripts: string | null;
  mercadoPagoTrackingEnabled: boolean;
}

export default function AdminPixels() {
  const { toast } = useToast();
  
  const [activePixelTab, setActivePixelTab] = useState<"facebook" | "outros" | "scripts">("facebook");
  
  // Estado local do formulário
  const [formData, setFormData] = useState<TrackingPixelsData>({
    facebookPixelId: "",
    facebookPixelEnabled: false,
    facebookTestEventCode: "",
    googleAdsConversionId: "",
    googleAdsConversionLabel: "",
    googleAdsEnabled: false,
    googleAnalyticsId: "",
    googleAnalyticsEnabled: false,
    tiktokPixelId: "",
    tiktokPixelEnabled: false,
    headerScripts: "",
    bodyScripts: "",
    mercadoPagoTrackingEnabled: true,
  });

  // Busca os dados de tracking pixels do backend
  const { data: pixelsData, isLoading } = useQuery<TrackingPixelsData>({
    queryKey: ['/api/tracking-pixels'],
  });

  // Atualiza o formulário quando os dados são carregados
  useEffect(() => {
    if (pixelsData) {
      setFormData({
        facebookPixelId: pixelsData.facebookPixelId || "",
        facebookPixelEnabled: pixelsData.facebookPixelEnabled || false,
        facebookTestEventCode: pixelsData.facebookTestEventCode || "",
        googleAdsConversionId: pixelsData.googleAdsConversionId || "",
        googleAdsConversionLabel: pixelsData.googleAdsConversionLabel || "",
        googleAdsEnabled: pixelsData.googleAdsEnabled || false,
        googleAnalyticsId: pixelsData.googleAnalyticsId || "",
        googleAnalyticsEnabled: pixelsData.googleAnalyticsEnabled || false,
        tiktokPixelId: pixelsData.tiktokPixelId || "",
        tiktokPixelEnabled: pixelsData.tiktokPixelEnabled || false,
        headerScripts: pixelsData.headerScripts || "",
        bodyScripts: pixelsData.bodyScripts || "",
        mercadoPagoTrackingEnabled: pixelsData.mercadoPagoTrackingEnabled ?? true,
      });
    }
  }, [pixelsData]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<TrackingPixelsData>) => {
      const response = await apiRequest("PUT", "/api/tracking-pixels", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracking-pixels'] });
    },
  });

  const handleSaveAll = useCallback(async () => {
    try {
      await updateMutation.mutateAsync(formData);
      toast({
        title: "salvo com sucesso",
        description: "configurações de rastreamento atualizadas",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar tracking pixels:", error);
      toast({
        title: "erro ao salvar",
        description: error?.message || "tente novamente",
        variant: "destructive",
      });
    }
  }, [formData, updateMutation, toast]);

  useAdminSave(handleSaveAll);

  // Mostra loading enquanto carrega os dados
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-light lowercase mb-2">pixels de rastreamento</h1>
        <p className="text-sm sm:text-base text-muted-foreground lowercase">
          configure pixels e scripts para rastrear conversões e analytics
        </p>
      </div>

      {/* Formulário com abas */}
      <div>
        <div className="space-y-6">
          {/* Mobile Dropdown */}
          <div className="block sm:hidden">
            <div className="relative">
              <select
                value={activePixelTab}
                onChange={(e) => setActivePixelTab(e.target.value as "facebook" | "outros" | "scripts")}
                className="w-full appearance-none bg-background border border-border rounded-md px-4 py-2.5 pr-10 text-sm lowercase focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="select-pixel-section"
              >
                <option value="facebook">facebook pixel</option>
                <option value="outros">outros pixels</option>
                <option value="scripts">scripts</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:grid grid-cols-3 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActivePixelTab("facebook")}
              className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm lowercase transition-all ${activePixelTab === "facebook" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              data-testid="tab-facebook"
            >
              <SiFacebook className="h-4 w-4" />
              facebook pixel
            </button>
            <button
              type="button"
              onClick={() => setActivePixelTab("outros")}
              className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm lowercase transition-all ${activePixelTab === "outros" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              data-testid="tab-outros"
            >
              <BarChart3 className="h-4 w-4" />
              outros pixels
            </button>
            <button
              type="button"
              onClick={() => setActivePixelTab("scripts")}
              className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm lowercase transition-all ${activePixelTab === "scripts" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              data-testid="tab-scripts"
            >
              <Code className="h-4 w-4" />
              scripts
            </button>
          </div>

          {/* ===== ABA FACEBOOK PIXEL ===== */}
          {activePixelTab === "facebook" && <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <SiFacebook className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="lowercase">facebook pixel</CardTitle>
                    <CardDescription className="lowercase">
                      configure o pixel do facebook para rastrear conversões
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Switch para ativar/desativar */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="lowercase">ativar facebook pixel</Label>
                    <p className="text-sm text-muted-foreground lowercase">
                      habilita o rastreamento do facebook em todo o site
                    </p>
                  </div>
                  <Switch
                    checked={formData.facebookPixelEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, facebookPixelEnabled: checked })}
                    data-testid="switch-facebook-enabled"
                  />
                </div>

                {/* Input para o Pixel ID */}
                <div className="space-y-2">
                  <Label htmlFor="facebookPixelId" className="lowercase">pixel id</Label>
                  <Input
                    id="facebookPixelId"
                    value={formData.facebookPixelId || ""}
                    onChange={(e) => setFormData({ ...formData, facebookPixelId: e.target.value })}
                    placeholder="ex: 123456789012345"
                    data-testid="input-facebook-pixel-id"
                  />
                  <p className="text-xs text-muted-foreground lowercase">
                    encontre seu pixel id no gerenciador de eventos do facebook
                  </p>
                </div>

                {/* Input para Test Event Code (opcional) */}
                <div className="space-y-2">
                  <Label htmlFor="facebookTestEventCode" className="lowercase">
                    test event code (opcional)
                  </Label>
                  <Input
                    id="facebookTestEventCode"
                    value={formData.facebookTestEventCode || ""}
                    onChange={(e) => setFormData({ ...formData, facebookTestEventCode: e.target.value })}
                    placeholder="ex: TEST12345"
                    data-testid="input-facebook-test-code"
                  />
                  <p className="text-xs text-muted-foreground lowercase">
                    use para testar eventos no modo debug do facebook
                  </p>
                </div>

                {/* Seção informativa sobre eventos rastreados */}
                <div className="rounded-md bg-muted/50 p-4 space-y-2">
                  <p className="text-sm font-medium lowercase">eventos rastreados automaticamente:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 lowercase">
                    <li>• <strong>PageView</strong> - visualização de páginas</li>
                    <li>• <strong>ViewContent</strong> - visualização de produtos</li>
                    <li>• <strong>AddToCart</strong> - adição ao carrinho</li>
                    <li>• <strong>InitiateCheckout</strong> - início do checkout</li>
                    <li>• <strong>Purchase</strong> - compra finalizada</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>}

          {/* ===== ABA OUTROS PIXELS ===== */}
          {activePixelTab === "outros" && <div className="space-y-4">
            {/* Card Google Ads */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <SiGoogleads className="h-6 w-6 text-yellow-600" />
                  <div>
                    <CardTitle className="lowercase">google ads</CardTitle>
                    <CardDescription className="lowercase">
                      configure o rastreamento de conversões do google ads
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Switch para ativar/desativar */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="lowercase">ativar google ads</Label>
                    <p className="text-sm text-muted-foreground lowercase">
                      habilita o rastreamento de conversões
                    </p>
                  </div>
                  <Switch
                    checked={formData.googleAdsEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, googleAdsEnabled: checked })}
                    data-testid="switch-google-ads-enabled"
                  />
                </div>

                {/* Inputs para Conversion ID e Label */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="googleAdsConversionId" className="lowercase">conversion id</Label>
                    <Input
                      id="googleAdsConversionId"
                      value={formData.googleAdsConversionId || ""}
                      onChange={(e) => setFormData({ ...formData, googleAdsConversionId: e.target.value })}
                      placeholder="ex: AW-123456789"
                      data-testid="input-google-ads-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleAdsConversionLabel" className="lowercase">conversion label</Label>
                    <Input
                      id="googleAdsConversionLabel"
                      value={formData.googleAdsConversionLabel || ""}
                      onChange={(e) => setFormData({ ...formData, googleAdsConversionLabel: e.target.value })}
                      placeholder="ex: abcDEF123"
                      data-testid="input-google-ads-label"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Google Analytics */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <SiGoogleanalytics className="h-6 w-6 text-orange-500" />
                  <div>
                    <CardTitle className="lowercase">google analytics 4</CardTitle>
                    <CardDescription className="lowercase">
                      configure o ga4 para análise de tráfego
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Switch para ativar/desativar */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="lowercase">ativar google analytics</Label>
                    <p className="text-sm text-muted-foreground lowercase">
                      habilita o rastreamento do ga4
                    </p>
                  </div>
                  <Switch
                    checked={formData.googleAnalyticsEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, googleAnalyticsEnabled: checked })}
                    data-testid="switch-google-analytics-enabled"
                  />
                </div>

                {/* Input para GA4 ID */}
                <div className="space-y-2">
                  <Label htmlFor="googleAnalyticsId" className="lowercase">ga4 measurement id</Label>
                  <Input
                    id="googleAnalyticsId"
                    value={formData.googleAnalyticsId || ""}
                    onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                    placeholder="ex: G-XXXXXXXXXX"
                    data-testid="input-google-analytics-id"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card TikTok */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <SiTiktok className="h-6 w-6" />
                  <div>
                    <CardTitle className="lowercase">tiktok pixel</CardTitle>
                    <CardDescription className="lowercase">
                      configure o pixel do tiktok para rastrear conversões
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Switch para ativar/desativar */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="lowercase">ativar tiktok pixel</Label>
                    <p className="text-sm text-muted-foreground lowercase">
                      habilita o rastreamento do tiktok
                    </p>
                  </div>
                  <Switch
                    checked={formData.tiktokPixelEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, tiktokPixelEnabled: checked })}
                    data-testid="switch-tiktok-enabled"
                  />
                </div>

                {/* Input para TikTok Pixel ID */}
                <div className="space-y-2">
                  <Label htmlFor="tiktokPixelId" className="lowercase">pixel id</Label>
                  <Input
                    id="tiktokPixelId"
                    value={formData.tiktokPixelId || ""}
                    onChange={(e) => setFormData({ ...formData, tiktokPixelId: e.target.value })}
                    placeholder="ex: C1234567890"
                    data-testid="input-tiktok-pixel-id"
                  />
                </div>
              </CardContent>
            </Card>
          </div>}

          {/* ===== ABA SCRIPTS CUSTOMIZADOS ===== */}
          {activePixelTab === "scripts" && <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Code className="h-6 w-6" />
                  <div>
                    <CardTitle className="lowercase">scripts customizados</CardTitle>
                    <CardDescription className="lowercase">
                      adicione scripts personalizados ao site (hotjar, clarity, chat, etc)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Aviso importante */}
                <div className="flex gap-3 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium lowercase text-yellow-700 dark:text-yellow-500">atenção</p>
                    <p className="text-muted-foreground lowercase">
                      scripts são executados em todas as páginas do site. 
                      use apenas código de fontes confiáveis.
                    </p>
                  </div>
                </div>

                {/* Textarea para Header Scripts */}
                <div className="space-y-2">
                  <Label htmlFor="headerScripts" className="lowercase">
                    scripts do header (head)
                  </Label>
                  <Textarea
                    id="headerScripts"
                    value={formData.headerScripts || ""}
                    onChange={(e) => setFormData({ ...formData, headerScripts: e.target.value })}
                    placeholder="<!-- Cole aqui scripts que devem ser carregados no <head> -->"
                    className="font-mono text-sm min-h-[150px]"
                    data-testid="textarea-header-scripts"
                  />
                  <p className="text-xs text-muted-foreground lowercase">
                    scripts injetados dentro da tag &lt;head&gt; - carregam antes do conteúdo
                  </p>
                </div>

                {/* Textarea para Body Scripts */}
                <div className="space-y-2">
                  <Label htmlFor="bodyScripts" className="lowercase">
                    scripts do body (final da página)
                  </Label>
                  <Textarea
                    id="bodyScripts"
                    value={formData.bodyScripts || ""}
                    onChange={(e) => setFormData({ ...formData, bodyScripts: e.target.value })}
                    placeholder="<!-- Cole aqui scripts que devem ser carregados no final do <body> -->"
                    className="font-mono text-sm min-h-[150px]"
                    data-testid="textarea-body-scripts"
                  />
                  <p className="text-xs text-muted-foreground lowercase">
                    scripts injetados antes de fechar a tag &lt;/body&gt; - carregam após o conteúdo
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>}
        </div>

      </div>
    </div>
  );
}
