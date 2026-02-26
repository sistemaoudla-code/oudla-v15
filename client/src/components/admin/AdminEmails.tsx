import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Mail, Send, Eye, Code, ChevronDown, CheckCircle, Bold, Italic, Underline, Link, Type, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Image, Minus, Palette, ImageIcon } from "lucide-react";
import { useAdminSave } from "@/contexts/AdminSaveContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EmailTemplate {
  id: string;
  templateKey: string;
  name: string;
  subject: string;
  htmlContent: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_VARIABLES = [
  { key: "logo_url", label: "url da logo", example: "https://example.com/logo.png" },
  { key: "nome", label: "nome do cliente", example: "João da Silva" },
  { key: "email", label: "email", example: "joao@exemplo.com" },
  { key: "cpf", label: "CPF", example: "123.456.789-00" },
  { key: "telefone", label: "telefone", example: "(11) 99999-9999" },
  { key: "endereco", label: "endereço completo", example: "Rua Exemplo, 123..." },
  { key: "numero_pedido", label: "n° do pedido", example: "OUDLA-20250212-0001" },
  { key: "itens", label: "lista de itens", example: "(tabela HTML)" },
  { key: "subtotal", label: "subtotal", example: "R$ 199,90" },
  { key: "frete", label: "frete", example: "R$ 19,90" },
  { key: "total", label: "total", example: "R$ 219,80" },
  { key: "metodo_pagamento", label: "método de pagamento", example: "Cartão de Crédito" },
  { key: "codigo_rastreio", label: "código de rastreio", example: "BR123456789BR" },
  { key: "link_rastreio", label: "link da página de rastreio", example: "https://seusite.com/rastreio" },
  { key: "data_pedido", label: "data do pedido", example: "12/02/2025" },
];

const EMAIL_HEADER_HTML = `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;padding:24px 32px;">
  <tr>
    <td style="text-align:left;vertical-align:middle;width:50%;">
      <img src="{{logo_url}}" alt="OUDLA" style="height:32px;width:auto;" />
    </td>
    <td style="text-align:right;vertical-align:middle;width:50%;font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:4px;">
      OUDLA
    </td>
  </tr>
</table>
`;

const TEMPLATE_LABELS: Record<string, { title: string; description: string }> = {
  order_confirmation: {
    title: "confirmação de pedido",
    description: "enviado automaticamente quando o pagamento é aprovado",
  },
  tracking_code: {
    title: "código de rastreio",
    description: "enviado quando o admin adiciona o código de rastreio",
  },
  newsletter_welcome: {
    title: "boas-vindas newsletter",
    description: "enviado automaticamente quando alguém se cadastra na newsletter",
  },
};

export default function AdminEmails() {
  const { toast } = useToast();
  const [activeTemplate, setActiveTemplate] = useState<string>("order_confirmation");
  const [editMode, setEditMode] = useState<"visual" | "code">("code");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fontSize, setFontSize] = useState("14px");
  const [fontColor, setFontColor] = useState("#000000");
  const [logoUrl, setLogoUrl] = useState("");

  const { data: logoSetting } = useQuery<{ value: string }>({
    queryKey: ["/api/admin/settings", "email_logo_url"],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const sessionId = localStorage.getItem('admin_session');
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      const res = await fetch("/api/admin/settings/email_logo_url", { credentials: "include", headers });
      return res.json();
    },
  });

  useEffect(() => {
    if (logoSetting?.value) {
      setLogoUrl(logoSetting.value);
    }
  }, [logoSetting?.value]);

  const saveLogoMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/settings", {
        key: "email_logo_url",
        value: logoUrl,
        type: "text",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings", "email_logo_url"] });
    },
  });

  const wrapSelection = (before: string, after: string) => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = htmlContent.substring(start, end);
    const replacement = `${before}${selected}${after}`;
    const newContent = htmlContent.substring(0, start) + replacement + htmlContent.substring(end);
    setHtmlContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const newContent = htmlContent.substring(0, start) + text + htmlContent.substring(start);
    setHtmlContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const { data: templatesData, isLoading } = useQuery<{ templates: EmailTemplate[] }>({
    queryKey: ["/api/admin/email-templates"],
  });

  const templates = templatesData?.templates || [];

  const currentTemplate = templates.find((t) => t.templateKey === activeTemplate);

  useEffect(() => {
    if (currentTemplate) {
      setSubject(currentTemplate.subject);
      setHtmlContent(currentTemplate.htmlContent);
      setEnabled(currentTemplate.enabled);
    }
  }, [currentTemplate?.id, activeTemplate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/admin/email-templates/${activeTemplate}`, {
        name: TEMPLATE_LABELS[activeTemplate]?.title || activeTemplate,
        subject,
        htmlContent,
        enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
    },
  });

  const handleSaveAll = useCallback(async () => {
    try {
      await saveMutation.mutateAsync();
      await saveLogoMutation.mutateAsync();
      toast({ title: "salvo", description: "template e logo salvos com sucesso." });
    } catch {
      toast({ title: "erro", description: "não foi possível salvar as alterações.", variant: "destructive" });
    }
  }, [saveMutation, saveLogoMutation, toast]);

  useAdminSave(handleSaveAll);

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/email-templates/${activeTemplate}/test`, {
        to: testEmail,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "email enviado", description: `email de teste enviado para ${testEmail}` });
    },
    onError: () => {
      toast({ title: "erro", description: "falha ao enviar email de teste.", variant: "destructive" });
    },
  });


  const getPreviewHtml = () => {
    let preview = htmlContent;
    TEMPLATE_VARIABLES.forEach((v) => {
      const regex = new RegExp(`\\{\\{${v.key}\\}\\}`, "g");
      preview = preview.replace(regex, v.example);
    });
    return preview;
  };

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
        <h2 className="text-lg font-medium lowercase" data-testid="text-email-title">emails transacionais</h2>
        <p className="text-sm text-muted-foreground lowercase">configure os emails enviados automaticamente aos clientes</p>
      </div>

      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between lowercase" data-testid="dropdown-template-selector">
              <span className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                {TEMPLATE_LABELS[activeTemplate as keyof typeof TEMPLATE_LABELS]?.title || "selecionar template"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
            {Object.entries(TEMPLATE_LABELS).map(([key, info]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setActiveTemplate(key)}
                className="lowercase gap-2 cursor-pointer"
                data-testid={`dropdown-item-${key}`}
              >
                <Mail className="h-3.5 w-3.5" />
                {info.title}
                {key === activeTemplate && <CheckCircle className="h-3.5 w-3.5 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Card className="mt-4">
          <CardContent className="pt-4 px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <Label className="lowercase text-sm font-medium">logo do cabeçalho dos emails</Label>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                className="flex-1 text-sm"
                data-testid="input-email-logo-url"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertAtCursor(EMAIL_HEADER_HTML)}
                className="lowercase"
                data-testid="button-insert-header"
              >
                <Code className="h-3.5 w-3.5 mr-1.5" />
                inserir cabeçalho
              </Button>
            </div>
            <p className="text-xs text-muted-foreground lowercase mt-2">
              cole a url da imagem da logo. use o botão "inserir cabeçalho" para adicionar o header com logo à esquerda e OUDLA à direita no template.
            </p>
            {logoUrl && (
              <div className="mt-3 p-3 bg-[#1a1a1a] rounded-lg flex items-center justify-between" data-testid="preview-email-header">
                <img src={logoUrl} alt="logo preview" className="h-8 w-auto" style={{ filter: "invert(1)" }} data-testid="img-email-logo-preview" />
                <span className="text-white font-bold tracking-[4px] text-lg" data-testid="text-email-brand-name">OUDLA</span>
              </div>
            )}
          </CardContent>
        </Card>

        {(() => {
          const key = activeTemplate;
          const info = TEMPLATE_LABELS[key as keyof typeof TEMPLATE_LABELS];
          if (!info) return null;
          return (
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3 px-4 sm:px-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <CardTitle className="text-sm sm:text-base lowercase">{info.title}</CardTitle>
                    <Badge variant={enabled ? "default" : "secondary"} className="lowercase" data-testid={`badge-status-${key}`}>
                      {enabled ? "ativo" : "inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`toggle-${key}`} className="text-sm text-muted-foreground lowercase">
                      ativo
                    </Label>
                    <Switch
                      id={`toggle-${key}`}
                      checked={enabled}
                      onCheckedChange={setEnabled}
                      data-testid={`switch-enabled-${key}`}
                    />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground lowercase">{info.description}</p>
              </CardHeader>
              <CardContent className="space-y-5 px-4 sm:px-6">
                <div className="space-y-2">
                  <Label className="lowercase text-sm">assunto do email</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="ex: OUDLA - Pedido {{numero_pedido}} confirmado!"
                    className="lowercase text-sm"
                    data-testid={`input-subject-${key}`}
                  />
                  <p className="text-xs text-muted-foreground lowercase">
                    use variáveis como {"{{numero_pedido}}"} no assunto
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Label className="lowercase text-sm">conteúdo HTML</Label>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button
                        variant={editMode === "code" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditMode("code")}
                        data-testid={`button-code-mode-${key}`}
                      >
                        <Code className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={showPreview ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        data-testid={`button-preview-${key}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {showPreview ? (
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-muted px-3 sm:px-4 py-2 border-b">
                        <p className="text-xs text-muted-foreground lowercase">pré-visualização (dados de exemplo)</p>
                      </div>
                      <div className="bg-white p-2 sm:p-4 min-h-[300px] sm:min-h-[400px]">
                        <iframe
                          srcDoc={getPreviewHtml()}
                          className="w-full min-h-[300px] sm:min-h-[400px] border-0"
                          title="Email Preview"
                          data-testid={`iframe-preview-${key}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <div className="hidden sm:flex items-center gap-0.5 flex-wrap bg-muted/50 border-b px-2 py-1.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => wrapSelection("<strong>", "</strong>")} title="negrito" data-testid="toolbar-bold">
                          <Bold className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => wrapSelection("<em>", "</em>")} title="itálico" data-testid="toolbar-italic">
                          <Italic className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => wrapSelection("<u>", "</u>")} title="sublinhado" data-testid="toolbar-underline">
                          <Underline className="h-3.5 w-3.5" />
                        </Button>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="link" data-testid="toolbar-link">
                              <Link className="h-3.5 w-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 space-y-2" align="start">
                            <Label className="text-xs lowercase">url</Label>
                            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" data-testid="toolbar-link-url" />
                            <Label className="text-xs lowercase">texto (opcional)</Label>
                            <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="clique aqui" className="h-8 text-xs" data-testid="toolbar-link-text" />
                            <Button size="sm" className="w-full lowercase" onClick={() => {
                              if (linkUrl) {
                                const text = linkText || linkUrl;
                                insertAtCursor(`<a href="${linkUrl}" style="color:#1a73e8;text-decoration:underline">${text}</a>`);
                                setLinkUrl("");
                                setLinkText("");
                              }
                            }} data-testid="toolbar-link-insert">inserir link</Button>
                          </PopoverContent>
                        </Popover>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="imagem" data-testid="toolbar-image">
                              <Image className="h-3.5 w-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 space-y-2" align="start">
                            <Label className="text-xs lowercase">url da imagem</Label>
                            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" data-testid="toolbar-image-url" />
                            <Button size="sm" className="w-full lowercase" onClick={() => {
                              if (imageUrl) {
                                insertAtCursor(`<img src="${imageUrl}" alt="" style="max-width:100%;height:auto" />`);
                                setImageUrl("");
                              }
                            }} data-testid="toolbar-image-insert">inserir imagem</Button>
                          </PopoverContent>
                        </Popover>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => wrapSelection('<p style="text-align:left">', "</p>")} title="alinhar esquerda" data-testid="toolbar-align-left">
                          <AlignLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => wrapSelection('<p style="text-align:center">', "</p>")} title="centralizar" data-testid="toolbar-align-center">
                          <AlignCenter className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => wrapSelection('<p style="text-align:right">', "</p>")} title="alinhar direita" data-testid="toolbar-align-right">
                          <AlignRight className="h-3.5 w-3.5" />
                        </Button>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertAtCursor("<ul>\n  <li></li>\n</ul>")} title="lista" data-testid="toolbar-list">
                          <List className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertAtCursor("<ol>\n  <li></li>\n</ol>")} title="lista numerada" data-testid="toolbar-list-ordered">
                          <ListOrdered className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertAtCursor("<hr />")} title="linha divisória" data-testid="toolbar-hr">
                          <Minus className="h-3.5 w-3.5" />
                        </Button>

                        <div className="w-px h-5 bg-border mx-1" />

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" title="tamanho da fonte" data-testid="toolbar-font-size">
                              <Type className="h-3.5 w-3.5" />
                              <span className="text-[10px]">{fontSize}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"].map((size) => (
                              <DropdownMenuItem key={size} onClick={() => { setFontSize(size); wrapSelection(`<span style="font-size:${size}">`, "</span>"); }} data-testid={`toolbar-font-size-${size}`}>
                                <span className="text-xs">{size}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" title="cor do texto" data-testid="toolbar-color">
                              <Palette className="h-3.5 w-3.5" />
                              <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: fontColor }} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 space-y-2" align="start">
                            <Label className="text-xs lowercase">cor do texto</Label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 p-0" data-testid="toolbar-color-picker" />
                              <Input value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="h-8 text-xs font-mono flex-1" data-testid="toolbar-color-hex" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {["#000000", "#333333", "#666666", "#999999", "#ffffff", "#1a73e8", "#e53935", "#43a047", "#fb8c00", "#8e24aa"].map((c) => (
                                <button key={c} onClick={() => setFontColor(c)} className="h-6 w-6 rounded-sm border" style={{ backgroundColor: c }} data-testid={`toolbar-color-${c}`} />
                              ))}
                            </div>
                            <Button size="sm" className="w-full lowercase" onClick={() => wrapSelection(`<span style="color:${fontColor}">`, "</span>")} data-testid="toolbar-color-apply">aplicar cor</Button>
                          </PopoverContent>
                        </Popover>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="cabeçalho" data-testid="toolbar-heading">
                              <span className="text-xs font-bold">H</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {[1, 2, 3, 4].map((level) => (
                              <DropdownMenuItem key={level} onClick={() => wrapSelection(`<h${level}>`, `</h${level}>`)} data-testid={`toolbar-heading-${level}`}>
                                <span className="text-xs">h{level}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <textarea
                        ref={textareaRef}
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        className="w-full min-h-[250px] sm:min-h-[400px] font-mono text-xs sm:text-sm p-3 sm:p-4 bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                        spellCheck={false}
                        data-testid={`textarea-html-${key}`}
                      />
                    </div>
                  )}
                </div>

                <Card>
                  <CardContent className="pt-4 px-4 sm:px-6">
                    <div>
                      <Label className="lowercase text-sm">enviar email de teste</Label>
                      <p className="text-xs text-muted-foreground lowercase mt-0.5">
                        envie um email de teste com dados fictícios para verificar o template
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                      <Input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="flex-1"
                        data-testid={`input-test-email-${key}`}
                      />
                      <Button
                        variant="outline"
                        onClick={() => testMutation.mutate()}
                        disabled={!testEmail || testMutation.isPending}
                        className="w-full sm:w-auto"
                        data-testid={`button-send-test-${key}`}
                      >
                        {testMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        enviar teste
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
          );
        })()}
      </div>

      <Card className="hover-elevate cursor-pointer" onClick={() => setShowVariables(!showVariables)} data-testid="button-toggle-variables">
        <CardContent className="pt-4 px-4 sm:px-6">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium lowercase">variáveis disponíveis</h3>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showVariables ? "rotate-180" : ""}`} />
          </div>
          {showVariables && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertAtCursor(`{{${v.key}}}`)}
                  className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50 hover-elevate text-left"
                  data-testid={`button-var-${v.key}`}
                >
                  <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border shrink-0">{`{{${v.key}}}`}</code>
                  <span className="text-muted-foreground text-xs lowercase truncate">{v.label}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
