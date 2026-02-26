import { useQuery } from "@tanstack/react-query";
import { Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoSvg from "@/assets/logo.svg";

interface CompanyInfo {
  id: string;
  companyName: string;
  cnpj: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  copyrightYear: number;
}

export default function Footer() {
  const { data: companyData, isLoading } = useQuery<{ company: CompanyInfo | null }>({
    queryKey: ['/api/company-info'],
  });

  const company = companyData?.company;
  const currentYear = company?.copyrightYear || new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          {/* Brand - Larger space */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoSvg} alt="Oudla Logo" className="h-8 w-8 object-contain dark:invert shrink-0" loading="lazy" decoding="async" />
              <h3 className="font-serif text-3xl text-foreground lowercase">oudla</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground lowercase max-w-sm">
                uma marca cristã que conecta pessoas através da fé e do estilo.
              </p>
              {company && !isLoading && (company.street || company.neighborhood || company.city || company.email) && (
                <div className="text-xs text-muted-foreground lowercase mt-4 space-y-1">
                  {(company.street || company.number) && (
                    <p>{company.street}{company.street && company.number ? `, ${company.number}` : company.number ? company.number : ''}{company.complement ? `, ${company.complement}` : ''}</p>
                  )}
                  {(company.neighborhood || company.city || company.state) && (
                    <p>{company.neighborhood}{company.neighborhood && company.city ? ', ' : ''}{company.city}{company.city && company.state ? ' - ' : ''}{company.state}{company.state && company.zipCode ? ' ' : ''}{company.zipCode}</p>
                  )}
                  {company.email && (
                    <p className="mt-2">
                      <a href={`mailto:${company.email}`} className="hover:text-foreground transition-colors" data-testid="link-footer-email">
                        {company.email}
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                data-testid="link-instagram"
                onClick={() => window.open('https://instagram.com/oudl.a', '_blank')}
              >
                <Instagram className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                data-testid="link-whatsapp"
                onClick={() => window.open('https://wa.me/5544998362704', '_blank')}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Links - Organized in columns */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground lowercase text-sm">atendimento</h4>
                <ul className="space-y-3 text-sm text-muted-foreground lowercase">
                  <li>
                    <Link href="/rastreio" className="hover:text-foreground transition-colors inline-block" data-testid="link-rastreio">
                      rastreamento de pedido
                    </Link>
                  </li>
                  <li>
                    <Link href="/trocas-devolucoes" className="hover:text-foreground transition-colors inline-block" data-testid="link-trocas-devolucoes">
                      trocas e devoluções
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="hover:text-foreground transition-colors inline-block" data-testid="link-faq">
                      dúvidas frequentes
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-foreground lowercase text-sm">institucional</h4>
                <ul className="space-y-3 text-sm text-muted-foreground lowercase">
                  <li>
                    <Link href="/sobre" className="hover:text-foreground transition-colors inline-block" data-testid="link-sobre">
                      sobre nós
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacidade" className="hover:text-foreground transition-colors inline-block" data-testid="link-privacidade">
                      política de privacidade
                    </Link>
                  </li>
                  <li>
                    <Link href="/termos" className="hover:text-foreground transition-colors inline-block" data-testid="link-termos">
                      termos de uso
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground lowercase">
            <p>© {currentYear} oudla. todos os direitos reservados.</p>
            {company && <p>cnpj: {company.cnpj}</p>}
          </div>
        </div>
      </div>
    </footer>
  );
}