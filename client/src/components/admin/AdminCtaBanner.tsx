import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminCtaBanner() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    tagLabel: "",
    title: "",
    description: "",
    buttonText: "",
    buttonBgColor: "#ffffff",
  });

  const { data: configData, isLoading } = useQuery<{ config: any }>({
    queryKey: ['/api/admin/cta-banner'],
  });

  // Initialize form with config data when it loads
  useState(() => {
    if (configData?.config) {
      setFormData({
        tagLabel: configData.config.tagLabel || "",
        title: configData.config.title || "",
        description: configData.config.description || "",
        buttonText: configData.config.buttonText || "",
        buttonBgColor: configData.config.buttonBgColor || "#ffffff",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PUT", "/api/admin/cta-banner", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cta-banner'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cta-banner'] });
      toast({
        title: "Banner atualizado",
        description: "As configurações foram salvas com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o banner.",
      });
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      // Use fetch directly for file uploads (not apiRequest which sets JSON headers)
      const sessionId = localStorage.getItem('admin_session');
      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch("/api/admin/cta-banner/image", {
        method: "POST",
        headers,
        body: uploadFormData,
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/cta-banner'] });
        queryClient.invalidateQueries({ queryKey: ['/api/cta-banner'] });
        toast({
          title: "Imagem atualizada",
          description: "A imagem de fundo foi atualizada com sucesso!",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      const response = await apiRequest("PUT", "/api/admin/cta-banner", {
        backgroundImageUrl: null
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/cta-banner'] });
        queryClient.invalidateQueries({ queryKey: ['/api/cta-banner'] });
        toast({
          title: "Imagem removida",
          description: "A imagem de fundo foi removida.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a imagem.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light lowercase mb-2">banner cta</h1>
          <p className="text-muted-foreground lowercase">carregando...</p>
        </div>
      </div>
    );
  }

  const currentImage = configData?.config?.backgroundImageUrl;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light lowercase mb-2">banner cta</h1>
        <p className="text-muted-foreground lowercase">configurar o banner "ver todos os produtos"</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="lowercase">imagem de fundo</CardTitle>
            <CardDescription className="lowercase">
              faça upload da imagem de fundo do banner (recomendado: 1920x800px)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentImage ? (
              <div className="space-y-4">
                <div className="relative aspect-[16/9] overflow-hidden rounded-md border">
                  <img
                    src={currentImage}
                    alt="Banner background"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="lowercase flex-1"
                    data-testid="button-upload-cta-image"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "enviando..." : "trocar imagem"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="lowercase"
                    data-testid="button-remove-cta-image"
                  >
                    <X className="h-4 w-4 mr-2" />
                    remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-12 space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground lowercase">
                    nenhuma imagem de fundo
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="lowercase"
                    data-testid="button-upload-cta-image"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        fazer upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Configuration Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="lowercase">textos e cores</CardTitle>
            <CardDescription className="lowercase">configure os textos e cores do banner</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tagLabel" className="lowercase">label superior</Label>
                <Input
                  id="tagLabel"
                  value={formData.tagLabel}
                  onChange={(e) => setFormData({ ...formData, tagLabel: e.target.value })}
                  placeholder="ex: coleção completa"
                  data-testid="input-cta-tag-label"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="lowercase">título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: explore toda a coleção"
                  required
                  data-testid="input-cta-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="lowercase">descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ex: descubra peças únicas..."
                  rows={3}
                  data-testid="input-cta-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buttonText" className="lowercase">texto do botão</Label>
                <Input
                  id="buttonText"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  placeholder="ex: ver todos os produtos"
                  required
                  data-testid="input-cta-button-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buttonBgColor" className="lowercase">cor de fundo do botão</Label>
                <div className="flex gap-2">
                  <Input
                    id="buttonBgColor"
                    type="color"
                    value={formData.buttonBgColor}
                    onChange={(e) => setFormData({ ...formData, buttonBgColor: e.target.value })}
                    className="w-16 h-10 p-1"
                    data-testid="input-cta-button-color"
                  />
                  <Input
                    value={formData.buttonBgColor}
                    onChange={(e) => setFormData({ ...formData, buttonBgColor: e.target.value })}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground lowercase">
                  cor em formato hexadecimal (ex: #ffffff)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full lowercase"
                disabled={updateMutation.isPending}
                data-testid="button-save-cta-config"
              >
                {updateMutation.isPending ? "salvando..." : "salvar configurações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
