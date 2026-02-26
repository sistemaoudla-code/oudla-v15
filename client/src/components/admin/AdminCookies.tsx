import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Cookie, Eye, Globe, Shield } from "lucide-react";
import { useAdminSave } from "@/contexts/AdminSaveContext";
import { Textarea } from "@/components/ui/textarea";

interface CookieSettingsData {
  id?: string;
  enabled: boolean;
  title: string;
  description: string;
  buttonAcceptText: string;
  buttonRejectText: string;
  buttonCustomizeText: string;
  showCustomizeButton: boolean;
  privacyPolicyUrl: string;
}

export default function AdminCookies() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CookieSettingsData>({
    enabled: true,
    title: "usamos cookies",
    description: "utilizamos cookies para melhorar sua experiência de navegação, personalizar conteúdo e analisar nosso tráfego.",
    buttonAcceptText: "aceitar todos",
    buttonRejectText: "recusar",
    buttonCustomizeText: "personalizar",
    showCustomizeButton: false,
    privacyPolicyUrl: "/privacidade",
  });

  const { data, isLoading } = useQuery<CookieSettingsData>({
    queryKey: ["/api/cookie-settings"],
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/admin/cookie-settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cookie-settings"] });
    },
  });

  const handleSaveAll = useCallback(async () => {
    try {
      await saveMutation.mutateAsync();
      toast({ title: "salvo", description: "configurações de cookies atualizadas." });
    } catch {
      toast({ title: "erro", description: "não foi possível salvar.", variant: "destructive" });
    }
  }, [settings]);

  useAdminSave(handleSaveAll);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium lowercase" data-testid="text-cookies-title">aviso de cookies</h2>
        <p className="text-sm text-muted-foreground lowercase">configure o banner de consentimento de cookies do site</p>
      </div>

      <Card>
        <CardContent className="pt-6 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 pb-6 border-b">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-3 rounded-2xl transition-colors ${settings.enabled ? "bg-primary/10" : "bg-muted"}`}>
                <Cookie className={`h-6 w-6 transition-colors ${settings.enabled ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium lowercase text-sm sm:text-base">banner de cookies</p>
                <p className="text-xs sm:text-sm text-muted-foreground lowercase">
                  {settings.enabled ? "visível para os visitantes" : "oculto — nenhum aviso será exibido"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={settings.enabled ? "default" : "secondary"} className="lowercase hidden sm:inline-flex">
                {settings.enabled ? "ativo" : "inativo"}
              </Badge>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
                data-testid="switch-cookies-enabled"
              />
            </div>
          </div>

          <div className={`space-y-6 pt-6 transition-opacity ${settings.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium lowercase">conteúdo</p>
                </div>

                <div className="space-y-2">
                  <Label className="lowercase text-sm">título</Label>
                  <Input
                    value={settings.title}
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    placeholder="usamos cookies"
                    className="lowercase"
                    data-testid="input-cookie-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="lowercase text-sm">descrição</Label>
                  <Textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    placeholder="utilizamos cookies para melhorar..."
                    className="lowercase min-h-[100px] resize-none"
                    data-testid="input-cookie-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="lowercase text-sm">link política de privacidade</Label>
                  <Input
                    value={settings.privacyPolicyUrl}
                    onChange={(e) => setSettings({ ...settings, privacyPolicyUrl: e.target.value })}
                    placeholder="/privacidade"
                    data-testid="input-cookie-privacy-url"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium lowercase">botões</p>
                </div>

                <div className="space-y-2">
                  <Label className="lowercase text-sm">texto aceitar</Label>
                  <Input
                    value={settings.buttonAcceptText}
                    onChange={(e) => setSettings({ ...settings, buttonAcceptText: e.target.value })}
                    placeholder="aceitar todos"
                    className="lowercase"
                    data-testid="input-cookie-accept"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="lowercase text-sm">texto recusar</Label>
                  <Input
                    value={settings.buttonRejectText}
                    onChange={(e) => setSettings({ ...settings, buttonRejectText: e.target.value })}
                    placeholder="recusar"
                    className="lowercase"
                    data-testid="input-cookie-reject"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="lowercase text-sm">texto personalizar</Label>
                  <Input
                    value={settings.buttonCustomizeText}
                    onChange={(e) => setSettings({ ...settings, buttonCustomizeText: e.target.value })}
                    placeholder="personalizar"
                    className="lowercase"
                    data-testid="input-cookie-customize"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm lowercase">mostrar botão personalizar</p>
                    <p className="text-xs text-muted-foreground lowercase">exibir terceiro botão de opções</p>
                  </div>
                  <Switch
                    checked={settings.showCustomizeButton}
                    onCheckedChange={(v) => setSettings({ ...settings, showCustomizeButton: v })}
                    data-testid="switch-show-customize"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium lowercase">pré-visualização</p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-4 sm:p-6">
                <div className="bg-background border rounded-2xl p-4 sm:p-6 shadow-lg max-w-lg mx-auto">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Cookie className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm lowercase">{settings.title || "usamos cookies"}</p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground lowercase leading-relaxed">
                      {settings.description || "utilizamos cookies para melhorar sua experiência..."}
                    </p>
                    <p className="text-xs text-primary lowercase underline cursor-pointer">política de privacidade</p>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button size="sm" className="flex-1 rounded-full lowercase text-xs">
                        {settings.buttonAcceptText || "aceitar todos"}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 rounded-full lowercase text-xs">
                        {settings.buttonRejectText || "recusar"}
                      </Button>
                      {settings.showCustomizeButton && (
                        <Button variant="ghost" size="sm" className="flex-1 rounded-full lowercase text-xs">
                          {settings.buttonCustomizeText || "personalizar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
