import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminSave } from "@/contexts/AdminSaveContext";

interface SEOConfig {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  ogSiteName: string;
}

export default function AdminSEO() {
  const { toast } = useToast();

  const [seoTitle, setSeoTitle] = useState("oudla");
  const [seoDescription, setSeoDescription] = useState("oudla é uma marca de moda cristã premium para jovens modernos. fé, estilo e qualidade em cada peça.");
  const [seoKeywords, setSeoKeywords] = useState("oudla, camisetas, moda cristã, roupas premium, moda jovem, camisetas premium");
  const [ogTitle, setOgTitle] = useState("oudla");
  const [ogDescription, setOgDescription] = useState("camisetas de luxo para jovens descolados. design minimalista, qualidade premium.");
  const [ogType, setOgType] = useState("website");
  const [ogSiteName, setOgSiteName] = useState("oudla");

  const { data: seoConfig, isLoading } = useQuery<SEOConfig>({
    queryKey: ['/api/settings/seo'],
  });

  useEffect(() => {
    if (seoConfig) {
      setSeoTitle(seoConfig.seoTitle);
      setSeoDescription(seoConfig.seoDescription);
      setSeoKeywords(seoConfig.seoKeywords);
      setOgTitle(seoConfig.ogTitle);
      setOgDescription(seoConfig.ogDescription);
      setOgType(seoConfig.ogType);
      setOgSiteName(seoConfig.ogSiteName);
    }
  }, [seoConfig]);

  const handleSaveAll = useCallback(async () => {
    try {
      await Promise.all([
        { key: "seo_title", value: seoTitle },
        { key: "seo_description", value: seoDescription },
        { key: "seo_keywords", value: seoKeywords },
        { key: "seo_og_title", value: ogTitle },
        { key: "seo_og_description", value: ogDescription },
        { key: "seo_og_type", value: ogType },
        { key: "seo_og_site_name", value: ogSiteName },
      ].map(s =>
        apiRequest("POST", "/api/admin/settings", { key: s.key, value: s.value, type: "text" })
      ));
      queryClient.invalidateQueries({ queryKey: ['/api/settings/seo'] });
      toast({ title: "seo e open graph atualizados" });
    } catch {
      toast({ title: "erro ao salvar", variant: "destructive" });
    }
  }, [seoTitle, seoDescription, seoKeywords, ogTitle, ogDescription, ogType, ogSiteName, toast]);

  useAdminSave(handleSaveAll);

  const descriptionLength = seoDescription.length;
  const descriptionColor = descriptionLength > 160 ? "text-red-500" : descriptionLength > 130 ? "text-amber-500" : "text-muted-foreground/50";

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-4">
            <div className="animate-pulse h-5 w-32 bg-muted/40 rounded-md" />
            <div className="animate-pulse rounded-2xl bg-muted/20 p-5 space-y-4">
              <div className="h-11 bg-muted/30 rounded-xl" />
              <div className="h-11 bg-muted/30 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-8">

      <div className="space-y-5">
        <div className="px-1">
          <h3 className="text-[15px] font-semibold lowercase tracking-tight">mecanismos de busca</h3>
          <p className="text-[12px] text-muted-foreground/60 lowercase leading-tight">como seu site aparece no google</p>
        </div>

        <div className="rounded-2xl bg-muted/30 dark:bg-muted/15 overflow-hidden">
          <div className="p-5 space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">título</label>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="oudla"
              className="border-0 bg-transparent shadow-none px-0 text-[15px] font-medium lowercase focus-visible:ring-0 placeholder:text-muted-foreground/25"
              data-testid="input-seo-title"
            />
          </div>
          <div className="h-px bg-border/30 mx-5" />
          <div className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">descrição</label>
              <span className={`text-[11px] tabular-nums ${descriptionColor}`}>{descriptionLength}/160</span>
            </div>
            <Textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="descrição do seu site para o google..."
              className="border-0 bg-transparent shadow-none px-0 text-[14px] lowercase resize-none min-h-[72px] focus-visible:ring-0 placeholder:text-muted-foreground/25"
              data-testid="input-seo-description"
            />
          </div>
          <div className="h-px bg-border/30 mx-5" />
          <div className="p-5 space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">palavras-chave</label>
            <Textarea
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="oudla, camisetas, moda cristã..."
              className="border-0 bg-transparent shadow-none px-0 text-[14px] lowercase resize-none min-h-[56px] focus-visible:ring-0 placeholder:text-muted-foreground/25"
              data-testid="input-seo-keywords"
            />
            <p className="text-[11px] text-muted-foreground/40 lowercase">separe por vírgula</p>
          </div>
        </div>

        <div className="px-1">
          <p className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-3">prévia</p>
          <div className="rounded-xl bg-background border border-border/30 p-4 space-y-0.5 shadow-sm">
            <p className="text-[#1a0dab] dark:text-blue-400 text-[15px] font-medium truncate leading-snug">{seoTitle || "oudla"}</p>
            <p className="text-[#006621] dark:text-green-400 text-[12px] leading-snug">oudla.com.br</p>
            <p className="text-[13px] text-muted-foreground/70 line-clamp-2 leading-relaxed">{seoDescription || "descrição do site..."}</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/20" />

      <div className="space-y-5">
        <div className="px-1">
          <h3 className="text-[15px] font-semibold lowercase tracking-tight">open graph</h3>
          <p className="text-[12px] text-muted-foreground/60 lowercase leading-tight">prévia ao compartilhar no whatsapp, instagram e facebook</p>
        </div>

        <div className="rounded-2xl bg-muted/30 dark:bg-muted/15 overflow-hidden">
          <div className="p-5 space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">título</label>
            <Input
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              placeholder="oudla"
              className="border-0 bg-transparent shadow-none px-0 text-[15px] font-medium lowercase focus-visible:ring-0 placeholder:text-muted-foreground/25"
              data-testid="input-og-title"
            />
          </div>
          <div className="h-px bg-border/30 mx-5" />
          <div className="p-5 space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">descrição</label>
            <Textarea
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              placeholder="descrição para redes sociais..."
              className="border-0 bg-transparent shadow-none px-0 text-[14px] lowercase resize-none min-h-[72px] focus-visible:ring-0 placeholder:text-muted-foreground/25"
              data-testid="input-og-description"
            />
          </div>
          <div className="h-px bg-border/30 mx-5" />
          <div className="p-5">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">tipo</label>
                <Input
                  value={ogType}
                  onChange={(e) => setOgType(e.target.value)}
                  placeholder="website"
                  className="border-0 bg-transparent shadow-none px-0 text-[14px] lowercase focus-visible:ring-0 placeholder:text-muted-foreground/25"
                  data-testid="input-og-type"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">nome do site</label>
                <Input
                  value={ogSiteName}
                  onChange={(e) => setOgSiteName(e.target.value)}
                  placeholder="oudla"
                  className="border-0 bg-transparent shadow-none px-0 text-[14px] lowercase focus-visible:ring-0 placeholder:text-muted-foreground/25"
                  data-testid="input-og-site-name"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-1">
          <p className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-3">prévia do link</p>
          <div className="rounded-2xl bg-background border border-border/20 overflow-hidden shadow-sm max-w-sm">
            <div className="w-full aspect-[1200/630] bg-white flex items-center justify-center">
              <img src="/favicon.svg" alt="oudla" className="h-24 w-24 opacity-80" />
            </div>
            <div className="p-3.5 space-y-0.5">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">{ogSiteName || "oudla"}</p>
              <p className="text-[14px] font-semibold truncate leading-snug">{ogTitle || "oudla"}</p>
              <p className="text-[12px] text-muted-foreground/60 line-clamp-2 leading-relaxed">{ogDescription || "descrição..."}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/40 lowercase mt-2">a imagem de compartilhamento usa automaticamente o ícone do site</p>
        </div>
      </div>
    </div>
  );
}
