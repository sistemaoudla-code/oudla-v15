import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoSvg from "@/assets/logo.svg";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/admin/login", { username, password });

      if (response.ok) {
        const data = await response.json();
        
        // Store session token in localStorage
        if (data.sessionId) {
          localStorage.setItem('admin_session', data.sessionId);
        }
        
        // Set query data immediately to avoid race condition
        queryClient.setQueryData(['/api/admin/check'], { isAdmin: true });
        
        // Silent login success
        
        // Redirect after a small delay to ensure state is updated
        setTimeout(() => {
          setLocation("/admin");
        }, 100);
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: data.error || "Credenciais inválidas",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao fazer login. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <img src={logoSvg} alt="oudla" className="h-16 w-16 object-contain dark:invert" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="username"
              type="password"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
              required
              data-testid="input-admin-username"
            />
          </div>

          <div className="space-y-2">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
              required
              data-testid="input-admin-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 group"
            disabled={isLoading}
            data-testid="button-admin-login"
          >
            {isLoading ? (
              "entrando..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                entrar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
