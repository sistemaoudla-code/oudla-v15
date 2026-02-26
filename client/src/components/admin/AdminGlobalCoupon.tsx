import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Trash2, Plus } from "lucide-react";

export default function AdminGlobalCoupon() {
  const { toast } = useToast();
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("desconto especial");
  const [newDiscountValue, setNewDiscountValue] = useState("10");

  const { data: couponsData, isLoading } = useQuery<{ coupons: any[] }>({
    queryKey: ['/api/admin/global-coupons'],
  });

  const coupons = couponsData?.coupons || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/global-coupons", {
        code: newCode,
        description: newDescription,
        discountValue: newDiscountValue,
        discountType: "percentage",
        isActive: true,
      });
    },
    onSuccess: () => {
      toast({ title: "cupom criado com sucesso" });
      setNewCode("");
      setNewDescription("frete grátis");
      setNewDiscountValue("0");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/global-coupons'] });
    },
    onError: () => {
      toast({ title: "erro ao criar cupom", variant: "destructive" });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const coupon = coupons.find((c: any) => c.id === couponId);
      return await apiRequest("PATCH", `/api/admin/global-coupons/${couponId}`, {
        isActive: !coupon.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/global-coupons'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (couponId: string) => {
      return await apiRequest("DELETE", `/api/admin/global-coupons/${couponId}`);
    },
    onSuccess: () => {
      toast({ title: "cupom removido" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/global-coupons'] });
    },
  });

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground lowercase">carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium lowercase mb-4">criar novo cupom</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium lowercase mb-2">código do cupom</label>
            <Input
              placeholder="ex: fretegratis2025"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="lowercase"
              data-testid="input-coupon-code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium lowercase mb-2">descrição</label>
            <Input
              placeholder="ex: frete grátis"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="lowercase"
              data-testid="input-coupon-desc"
            />
          </div>
          <div>
            <label className="block text-sm font-medium lowercase mb-2">desconto (%)</label>
            <Input
              type="number"
              placeholder="0"
              value={newDiscountValue}
              onChange={(e) => setNewDiscountValue(e.target.value)}
              data-testid="input-coupon-value"
            />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!newCode || createMutation.isPending}
            className="w-full lowercase"
            data-testid="button-create-coupon"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "criando..." : "criar cupom"}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-medium lowercase">cupons ativos</h3>
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground lowercase">nenhum cupom criado</p>
        ) : (
          coupons.map((coupon: any) => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`p-4 ${coupon.isActive ? "" : "opacity-50"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium lowercase" data-testid={`text-code-${coupon.id}`}>
                      {coupon.code}
                    </p>
                    <p className="text-sm text-muted-foreground lowercase">
                      {coupon.description} · <span className="font-medium">{coupon.discountValue}% off</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={coupon.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleMutation.mutate(coupon.id)}
                      disabled={toggleMutation.isPending}
                      className="lowercase text-xs"
                      data-testid={`button-toggle-${coupon.id}`}
                    >
                      {coupon.isActive ? "ativo" : "inativo"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(coupon.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${coupon.id}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
