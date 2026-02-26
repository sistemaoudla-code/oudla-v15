import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Loader2, Package, Mail, MailCheck, MailX, Phone, MapPin, MessageCircle, Navigation, Search, Archive, ArchiveRestore, Trash2, AlertTriangle, Save, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Truck, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiWhatsapp } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  subtotal: string;
  shippingCost: string;
  totalAmount: string;
  orderStatus: string;
  trackingCode?: string;
  refundReason?: string;
  paymentStatus?: string;
  paymentId?: string;
  paymentMethod?: string;
  paymentTypeId?: string;
  paymentInstallments?: number;
  verificationCode?: string;
  internalNotes?: string;
  confirmationEmailSentAt?: string;
  trackingEmailSentAt?: string;
  archivedAt?: string;
  deletedAt?: string;
  createdAt: string;
  paidAt?: string;
  customerIp?: string;
  userAgent?: string;
  deviceType?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  screenResolution?: string;
  emailDeliveredAt?: string;
  emailOpenedAt?: string;
  emailComplainedAt?: string;
  emailFailedAt?: string;
  emailFailureReason?: string;
}

interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  size: string;
  color: string;
  printPosition?: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

interface OrderWithItems extends Order {
  items: OrderItem[];
  paymentPreferenceId?: string;
}

const orderStatusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "pendente", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  paid: { label: "pago", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  shipped: { label: "enviado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  failed: { label: "falhou", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  cancelled: { label: "cancelado", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  delivered: { label: "entregue", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  refunded: { label: "estornado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const paymentStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
  in_process: { label: "Processando", variant: "secondary" },
};

type SortField = 'orderNumber' | 'customerName' | 'createdAt' | 'totalAmount' | 'orderStatus' | 'paymentStatus';
type SortDirection = 'asc' | 'desc';

export default function AdminOrders() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterTab, setFilterTab] = useState<'all' | 'archived' | 'deleted' | 'delivered' | 'refunded' | 'shipped'>('all');
  const [internalNotes, setInternalNotes] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showOnlyWithNotes, setShowOnlyWithNotes] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders', { includeAll: 'true' }],
  });

  const { data: selectedOrder, isLoading: isLoadingDetails } = useQuery<OrderWithItems>({
    queryKey: ['/api/admin/orders', selectedOrderId],
    enabled: !!selectedOrderId,
  });

  useEffect(() => {
    if (selectedOrder) {
      setInternalNotes(selectedOrder.internalNotes || "");
      if (notesTextareaRef.current) {
        notesTextareaRef.current.blur();
      }
    }
  }, [selectedOrder]);

  useEffect(() => {
    setSelectedOrderIds([]);
  }, [filterTab]);

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrderId) return;
      return apiRequest('PATCH', `/api/admin/orders/${selectedOrderId}`, { internalNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Observações salvas com sucesso" });
      // Remove focus from textarea after saving
      if (notesTextareaRef.current) {
        notesTextareaRef.current.blur();
      }
    },
    onError: () => {
      toast({ title: "Erro ao salvar observações", variant: "destructive" });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest('PATCH', `/api/admin/orders/${orderId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Pedido arquivado com sucesso" });
      setSelectedOrderId(null);
    },
    onError: () => {
      toast({ title: "Erro ao arquivar pedido", variant: "destructive" });
    }
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest('PATCH', `/api/admin/orders/${orderId}/unarchive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Pedido desarquivado com sucesso" });
      setSelectedOrderId(null);
    },
    onError: () => {
      toast({ title: "Erro ao desarquivar pedido", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest('DELETE', `/api/admin/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Pedido removido com sucesso" });
      setSelectedOrderId(null);
    },
    onError: () => {
      toast({ title: "Erro ao remover pedido", variant: "destructive" });
    }
  });

  const hardDeleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest('DELETE', `/api/admin/orders/${orderId}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Pedido deletado permanentemente" });
      setSelectedOrderId(null);
    },
    onError: () => {
      toast({ title: "Erro ao deletar pedido permanentemente", variant: "destructive" });
    }
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      return apiRequest('POST', '/api/admin/orders/bulk/archive', { orderIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Pedidos arquivados com sucesso" });
      setSelectedOrderIds([]);
    },
    onError: () => {
      toast({ title: "Erro ao arquivar pedidos", variant: "destructive" });
    }
  });

  const bulkUnarchiveMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      return apiRequest('POST', '/api/admin/orders/bulk/unarchive', { orderIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Pedidos desarquivados com sucesso" });
      setSelectedOrderIds([]);
    },
    onError: () => {
      toast({ title: "Erro ao desarquivar pedidos", variant: "destructive" });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      return apiRequest('POST', '/api/admin/orders/bulk/delete', { orderIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Pedidos removidos com sucesso" });
      setSelectedOrderIds([]);
    },
    onError: () => {
      toast({ title: "Erro ao remover pedidos", variant: "destructive" });
    }
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      return apiRequest('POST', '/api/admin/orders/bulk/restore', { orderIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Pedidos restaurados com sucesso" });
      setSelectedOrderIds([]);
    },
    onError: () => {
      toast({ title: "Erro ao restaurar pedidos", variant: "destructive" });
    }
  });

  const bulkHardDeleteMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      return apiRequest('POST', '/api/admin/orders/bulk/permanent-delete', { orderIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Pedidos deletados permanentemente" });
      setSelectedOrderIds([]);
    },
    onError: () => {
      toast({ title: "Erro ao deletar pedidos permanentemente", variant: "destructive" });
    }
  });

  const formatPrice = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return undefined;
    
    let result = [...orders];
    
    if (filterTab === 'all') {
      result = result.filter(o => !o.archivedAt && !o.deletedAt);
    } else if (filterTab === 'archived') {
      result = result.filter(o => o.archivedAt && !o.deletedAt);
    } else if (filterTab === 'deleted') {
      result = result.filter(o => !!o.deletedAt);
    } else if (filterTab === 'shipped') {
      result = result.filter(o => o.orderStatus === 'shipped' && !o.archivedAt && !o.deletedAt);
    } else if (filterTab === 'delivered') {
      result = result.filter(o => o.orderStatus === 'delivered' && !o.archivedAt && !o.deletedAt);
    } else if (filterTab === 'refunded') {
      result = result.filter(o => o.orderStatus === 'refunded' && !o.archivedAt && !o.deletedAt);
    }
    
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'paid') {
        result = result.filter(o => o.paymentStatus === 'approved');
      } else {
        result = result.filter(o => o.orderStatus === statusFilter);
      }
    }
    
    if (debouncedSearchTerm.trim()) {
      const search = debouncedSearchTerm.toLowerCase();
      result = result.filter(o =>
        (o.customerName && o.customerName.toLowerCase().includes(search)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(search)) ||
        (o.customerCpf && o.customerCpf.toLowerCase().includes(search)) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(search)) ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(search)) ||
        (o.verificationCode && o.verificationCode.toLowerCase().includes(search)) ||
        (o.city && o.city.toLowerCase().includes(search)) ||
        (o.state && o.state.toLowerCase().includes(search))
      );
    }
    
    if (showOnlyWithNotes) {
      result = result.filter(o => o.internalNotes && o.internalNotes.trim().length > 0);
    }
    
    const sortFieldMap: Record<SortField, keyof Order> = {
      orderNumber: 'orderNumber',
      customerName: 'customerName',
      createdAt: 'createdAt',
      totalAmount: 'totalAmount',
      orderStatus: 'orderStatus',
      paymentStatus: 'paymentStatus',
    };
    
    const field = sortFieldMap[sortField] || 'createdAt';
    result.sort((a, b) => {
      const aVal = (a[field] ?? '') as string;
      const bVal = (b[field] ?? '') as string;
      
      if (field === 'totalAmount') {
        const diff = parseFloat(aVal) - parseFloat(bVal);
        return sortDirection === 'asc' ? diff : -diff;
      }
      
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    
    return result;
  }, [orders, filterTab, statusFilter, debouncedSearchTerm, showOnlyWithNotes, sortField, sortDirection]);

  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders?.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders?.map(o => o.id) || []);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const isAllSelected = filteredOrders && filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;
  const isSomeSelected = selectedOrderIds.length > 0 && selectedOrderIds.length < (filteredOrders?.length || 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 hover-elevate active-elevate-2 -m-2 p-2 rounded"
        data-testid={`sort-${field}`}
      >
        <span className={isActive ? 'font-semibold' : ''}>{children}</span>
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    );
  };

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; status: string } | null>(null);
  const [statusMetadata, setStatusMetadata] = useState({ trackingCode: "", refundReason: "" });

  const updateStatus = async (orderId: string, status: string, metadata?: { trackingCode?: string; refundReason?: string }) => {
    try {
      await apiRequest('PATCH', `/api/admin/orders/${orderId}/status`, { 
        status,
        ...metadata 
      });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: `pedido marcado como ${orderStatusMap[status]?.label.toLowerCase()}` });
      setSelectedOrderId(null);
      setIsStatusDialogOpen(false);
      setPendingStatusChange(null);
      setStatusMetadata({ trackingCode: "", refundReason: "" });
    } catch (err) {
      toast({ title: "erro ao atualizar pedido", variant: "destructive" });
    }
  };

  const handleStatusClick = (orderId: string, status: string) => {
    if (status === 'shipped' || status === 'refunded') {
      setPendingStatusChange({ id: orderId, status });
      setIsStatusDialogOpen(true);
    } else {
      updateStatus(orderId, status);
    }
  };

  const updateBulkStatus = async (status: string) => {
    if (status === 'refunded') {
      const reason = window.prompt('por favor, informe o motivo do estorno para os pedidos selecionados:');
      if (reason === null) return;
      if (!reason.trim()) {
        toast({
          title: "erro",
          description: "o motivo do estorno é obrigatório",
          variant: "destructive"
        });
        return;
      }
      try {
        await apiRequest('POST', '/api/admin/orders/bulk/status', { orderIds: selectedOrderIds, status, refundReason: reason });
        await queryClient.refetchQueries({ queryKey: ['/api/admin/orders'] });
        toast({ title: `${selectedOrderIds.length} pedidos marcados como estornados` });
        setSelectedOrderIds([]);
        setSelectedOrderId(null);
      } catch (err) {
        toast({ title: "erro ao atualizar pedidos", variant: "destructive" });
      }
      return;
    }

    try {
      await apiRequest('POST', '/api/admin/orders/bulk/status', { orderIds: selectedOrderIds, status });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: `${selectedOrderIds.length} pedidos marcados como ${orderStatusMap[status]?.label.toLowerCase()}` });
      setSelectedOrderIds([]);
      setSelectedOrderId(null);
    } catch (err) {
      toast({ title: "erro ao atualizar pedidos", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped': return 'border-blue-100 bg-blue-50/20 dark:border-blue-900/10 dark:bg-blue-900/5';
      case 'delivered': return 'border-emerald-100 bg-emerald-50/20 dark:border-emerald-900/10 dark:bg-emerald-900/5';
      case 'refunded': return 'border-red-100 bg-red-50/20 dark:border-red-900/10 dark:bg-red-900/5';
      case 'paid': return 'border-emerald-100 bg-emerald-50/20 dark:border-emerald-900/10 dark:bg-emerald-900/5';
      default: return 'border-border bg-card';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold lowercase tracking-tight">pedidos</h2>
        <p className="text-sm text-muted-foreground/70 lowercase">
          gerencie todos os pedidos da loja
        </p>
      </div>

      <div className="lg:hidden">
        <Select 
          value={filterTab} 
          onValueChange={(v) => {
            setFilterTab(v as any);
            setStatusFilter("all");
            setSearchTerm("");
            setShowOnlyWithNotes(false);
          }}
        >
          <SelectTrigger className="w-full lowercase rounded-xl border-0 bg-muted/40 h-10" data-testid="select-orders-tab-mobile">
            <SelectValue placeholder="selecionar visualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="lowercase">todos</SelectItem>
            <SelectItem value="shipped" className="lowercase">enviados</SelectItem>
            <SelectItem value="delivered" className="lowercase">entregues</SelectItem>
            <SelectItem value="refunded" className="lowercase">estornados</SelectItem>
            <SelectItem value="archived" className="lowercase">arquivados</SelectItem>
            <SelectItem value="deleted" className="lowercase">removidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs 
        value={filterTab} 
        onValueChange={(v) => {
          setFilterTab(v as any);
          setStatusFilter("all");
          setSearchTerm("");
          setShowOnlyWithNotes(false);
        }} 
        className="w-full"
      >
        <TabsList className="hidden lg:flex w-auto gap-1 bg-muted/30 p-1 rounded-full">
          <TabsTrigger value="all" className="lowercase rounded-full px-5 text-[13px] data-[state=active]:shadow-sm" data-testid="tab-all-orders">
            todos
          </TabsTrigger>
          <TabsTrigger value="shipped" className="lowercase rounded-full px-5 text-[13px] data-[state=active]:shadow-sm" data-testid="tab-shipped-orders">
            enviados
          </TabsTrigger>
          <TabsTrigger value="delivered" className="lowercase rounded-full px-5 text-[13px] data-[state=active]:shadow-sm" data-testid="tab-delivered-orders">
            entregues
          </TabsTrigger>
          <TabsTrigger value="refunded" className="lowercase rounded-full px-5 text-[13px] data-[state=active]:shadow-sm" data-testid="tab-refunded-orders">
            estornados
          </TabsTrigger>
          <TabsTrigger value="archived" className="lowercase rounded-full px-5 text-[13px] data-[state=active]:shadow-sm" data-testid="tab-archived-orders">
            arquivados
          </TabsTrigger>
          <TabsTrigger value="deleted" className="lowercase rounded-full px-5 text-[13px] data-[state=active]:shadow-sm" data-testid="tab-deleted-orders">
            removidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterTab} className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                placeholder="buscar por email, cpf, nome, cidade, sku..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-muted/40 border-0 rounded-xl text-[13px] lowercase focus-visible:ring-1 focus-visible:ring-foreground/10 placeholder:text-muted-foreground/40"
                data-testid="input-search-orders"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto items-center">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1 sm:w-[180px] h-10 rounded-xl border-0 bg-muted/40 text-[13px] lowercase focus:ring-0 shadow-none" data-testid="select-status-filter">
                    <SelectValue placeholder="filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="lowercase italic">todos os status</SelectItem>
                    <SelectItem value="pending" className="lowercase">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
                        <span>pendente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="paid" className="lowercase">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span>pago</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="failed" className="lowercase">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        <span>falhou</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled" className="lowercase">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]" />
                        <span>cancelado</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showOnlyWithNotes ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setShowOnlyWithNotes(!showOnlyWithNotes)}
                  className="flex-shrink-0 rounded-full"
                  data-testid="button-filter-with-notes"
                >
                  <MessageCircle className={`h-4 w-4 ${showOnlyWithNotes ? 'fill-current' : ''}`} />
                </Button>
              </div>
          </div>

          {orders && (
            <p className="text-[11px] text-muted-foreground/30 lowercase font-normal tracking-wide px-1">
              exibindo {filteredOrders?.length || 0} {
                statusFilter === 'all' 
                  ? (filterTab === 'all' ? 'pedidos' : filterTab === 'archived' ? 'pedidos arquivados' : filterTab === 'deleted' ? 'pedidos removidos' : filterTab === 'shipped' ? 'pedidos enviados' : filterTab === 'delivered' ? 'pedidos entregues' : 'pedidos estornados')
                  : `${statusFilter === 'paid' ? 'pedidos pagos' : statusFilter === 'pending' ? 'pedidos pendentes' : statusFilter === 'failed' ? 'pedidos que falharam' : 'pedidos cancelados'}`
              }
            </p>
          )}

          {/* Mobile Select All Action Bar - Only visible when at least one item is selected */}
          {selectedOrderIds.length > 0 && (
            <div className="lg:hidden flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 ml-1">
                <Checkbox
                  id="mobile-select-all"
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className={isSomeSelected ? "data-[state=unchecked]:bg-primary/50" : ""}
                />
                <label 
                  htmlFor="mobile-select-all" 
                  className="text-sm font-medium lowercase cursor-pointer"
                >
                  selecionar tudo ({filteredOrders?.length || 0})
                </label>
              </div>
              <Badge variant="secondary" className="lowercase">
                {selectedOrderIds.length} selecionados
              </Badge>
            </div>
          )}

          {filteredOrders && filteredOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium lowercase mb-2">nenhum pedido encontrado</p>
              <p className="text-sm text-muted-foreground lowercase">
                {searchTerm || statusFilter !== 'all' || showOnlyWithNotes
                  ? 'tente ajustar os filtros de busca'
                  : 'os pedidos aparecerão aqui assim que forem realizados'}
              </p>
            </Card>
          ) : (
            <>
              {selectedOrderIds.length > 0 && (
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium lowercase">
                    {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'pedido selecionado' : 'pedidos selecionados'}
                  </span>
                  <div className="flex gap-2 ml-auto flex-wrap justify-end">
                    {filterTab === 'all' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBulkStatus('shipped')}
                          className="gap-2"
                        >
                          <Truck className="h-4 w-4" />
                          <span className="hidden sm:inline lowercase">marcar enviado</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBulkStatus('delivered')}
                          className="gap-2"
                        >
                          <Package className="h-4 w-4" />
                          <span className="hidden sm:inline lowercase">marcar entregue</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => bulkArchiveMutation.mutate(selectedOrderIds)}
                          disabled={bulkArchiveMutation.isPending}
                          className="gap-2"
                          data-testid="button-bulk-archive"
                        >
                          <Archive className="h-4 w-4" />
                          <span className="hidden sm:inline lowercase">arquivar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => bulkDeleteMutation.mutate(selectedOrderIds)}
                          disabled={bulkDeleteMutation.isPending}
                          className="gap-2"
                          data-testid="button-bulk-delete"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline lowercase">remover</span>
                        </Button>
                      </>
                    )}
                    {filterTab === 'shipped' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBulkStatus('delivered')}
                        className="gap-2"
                      >
                        <Package className="h-4 w-4" />
                        <span className="hidden sm:inline lowercase">marcar entregue</span>
                      </Button>
                    )}
                    {filterTab === 'delivered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBulkStatus('refunded')}
                        className="gap-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <span className="hidden sm:inline lowercase">estornar</span>
                      </Button>
                    )}
                    {filterTab === 'archived' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => bulkUnarchiveMutation.mutate(selectedOrderIds)}
                          disabled={bulkUnarchiveMutation.isPending}
                          className="gap-2"
                          data-testid="button-bulk-unarchive"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                          <span className="hidden sm:inline lowercase">desarquivar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => bulkDeleteMutation.mutate(selectedOrderIds)}
                          disabled={bulkDeleteMutation.isPending}
                          className="gap-2"
                          data-testid="button-bulk-delete-archived"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline lowercase">remover</span>
                        </Button>
                      </>
                    )}
                    {filterTab === 'deleted' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => bulkRestoreMutation.mutate(selectedOrderIds)}
                          disabled={bulkRestoreMutation.isPending}
                          className="gap-2"
                          data-testid="button-bulk-restore"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                          <span className="hidden sm:inline lowercase">restaurar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => bulkHardDeleteMutation.mutate(selectedOrderIds)}
                          disabled={bulkHardDeleteMutation.isPending}
                          className="gap-2"
                          data-testid="button-bulk-hard-delete"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span className="hidden sm:inline lowercase">deletar</span>
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedOrderIds([])}
                      data-testid="button-clear-selection"
                    >
                      <span className="lowercase">limpar</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Mobile Order Cards */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredOrders?.map((order) => {
                  const statusInfo = orderStatusMap[order.orderStatus] || orderStatusMap.pending;
                  const statusColorClass = getStatusColor(order.orderStatus);
                  const hasNotes = order.internalNotes && order.internalNotes.trim().length > 0;
                  return (
                    <Card 
                      key={order.id} 
                      className={`p-4 space-y-3 cursor-pointer active:bg-muted/50 transition-all border-2 ${statusColorClass} ${
                        hasNotes ? "ring-1 ring-primary/20 shadow-sm" : ""
                      }`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedOrderIds.includes(order.id)}
                              onCheckedChange={() => handleSelectOrder(order.id)}
                              aria-label={`Selecionar pedido ${order.orderNumber}`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              order.paymentStatus === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                              order.paymentStatus === 'rejected' || order.orderStatus === 'failed' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                              order.paymentStatus === 'cancelled' || order.orderStatus === 'cancelled' ? 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]' :
                              'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                            }`} />
                            <span className="font-medium text-sm">#{order.orderNumber}</span>
                            {hasNotes && (
                              <Badge variant="default" className="h-5 px-1.5 gap-1 text-[10px] cursor-pointer">
                                <MessageCircle className="h-3 w-3" />
                                <span className="hidden sm:inline lowercase">observação</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge className={`text-[10px] lowercase border-none ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground lowercase">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-semibold text-sm">{formatPrice(order.totalAmount)}</span>
                        <div className="flex items-center gap-2">
                          {order.internalNotes && <MessageCircle className="h-4 w-4 text-primary" />}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`button-view-order-mobile-${order.orderNumber}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="lowercase">
                                {filterTab === 'all' && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        updateStatus(order.id, 'shipped');
                                      }} 
                                      className="gap-2"
                                    >
                                      <Truck className="h-4 w-4" /> marcar como enviado
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        updateStatus(order.id, 'delivered');
                                      }} 
                                      className="gap-2"
                                    >
                                      <Package className="h-4 w-4" /> marcar como entregue
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        updateStatus(order.id, 'refunded');
                                      }} 
                                      className="gap-2"
                                    >
                                      <AlertTriangle className="h-4 w-4" /> estornar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => archiveMutation.mutate(order.id)} className="gap-2">
                                      <Archive className="h-4 w-4" /> arquivar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => deleteMutation.mutate(order.id)} className="gap-2 text-destructive">
                                      <Trash2 className="h-4 w-4" /> remover
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {filterTab === 'archived' && (
                                  <>
                                    <DropdownMenuItem onClick={() => unarchiveMutation.mutate(order.id)} className="gap-2">
                                      <ArchiveRestore className="h-4 w-4" /> desarquivar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => deleteMutation.mutate(order.id)} className="gap-2 text-destructive">
                                      <Trash2 className="h-4 w-4" /> remover
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {filterTab === 'deleted' && (
                                  <>
                                    <DropdownMenuItem onClick={() => bulkRestoreMutation.mutate([order.id])} className="gap-2">
                                      <ArchiveRestore className="h-4 w-4" /> restaurar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => hardDeleteMutation.mutate(order.id)} className="gap-2 text-destructive">
                                      <AlertTriangle className="h-4 w-4" /> deletar permanentemente
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block">
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Selecionar todos"
                            data-testid="checkbox-select-all"
                            className={isSomeSelected ? "data-[state=unchecked]:bg-primary/50" : ""}
                          />
                        </TableHead>
                        <TableHead className="lowercase">
                          <SortButton field="orderNumber">número</SortButton>
                        </TableHead>
                        <TableHead className="lowercase">
                          <SortButton field="customerName">cliente</SortButton>
                        </TableHead>
                        <TableHead className="lowercase">
                          <SortButton field="createdAt">data</SortButton>
                        </TableHead>
                        <TableHead className="lowercase">
                          <SortButton field="totalAmount">total</SortButton>
                        </TableHead>
                        <TableHead className="lowercase">
                          <SortButton field="orderStatus">status</SortButton>
                        </TableHead>
                        <TableHead className="lowercase w-[100px]">ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders?.map((order) => {
                        const statusInfo = orderStatusMap[order.orderStatus] || orderStatusMap.pending;
                        return (
                          <TableRow 
                            key={order.id}
                            className={`hover-elevate transition-colors border-l-4 ${getStatusColor(order.orderStatus)}`}
                            data-testid={`row-order-${order.id}`}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedOrderIds.includes(order.id)}
                                onCheckedChange={() => handleSelectOrder(order.id)}
                                aria-label={`Selecionar pedido ${order.orderNumber}`}
                                data-testid={`checkbox-order-${order.id}`}
                              />
                            </TableCell>
                            <TableCell 
                              className="font-medium cursor-pointer"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  order.paymentStatus === 'approved' || order.orderStatus === 'paid' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                  order.paymentStatus === 'rejected' || order.orderStatus === 'failed' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                                  order.paymentStatus === 'cancelled' || order.orderStatus === 'cancelled' ? 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]' :
                                  'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                                }`} />
                                <div className="flex flex-col">
                                  <span>{order.orderNumber}</span>
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 lowercase leading-none mt-1">
                                    {paymentStatusMap[order.paymentStatus || 'pending']?.label.toLowerCase()}
                                  </span>
                                </div>
                                {order.internalNotes && order.internalNotes.trim().length > 0 ? (
                                  <MessageCircle className="h-4 w-4 text-primary fill-primary" data-testid={`icon-has-notes-${order.id}`} />
                                ) : (
                                  <MessageCircle className="h-4 w-4 text-muted-foreground/10" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell 
                              className="cursor-pointer"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{order.customerName}</span>
                                <span className="text-xs text-muted-foreground lowercase">
                                  {order.customerEmail}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell 
                              className="text-sm cursor-pointer"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              {formatDate(order.createdAt)}
                            </TableCell>
                            <TableCell 
                              className="font-medium cursor-pointer"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              {formatPrice(order.totalAmount)}
                            </TableCell>
                            <TableCell 
                              className="cursor-pointer"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              <div className="flex items-center gap-2">
                                <Badge className={`lowercase border-none ${statusInfo.className}`}>
                                  {statusInfo.label}
                                </Badge>
                                {order.confirmationEmailSentAt ? (
                                  <span data-testid={`icon-email-sent-${order.id}`}><MailCheck className="h-3.5 w-3.5 text-emerald-500" /></span>
                                ) : order.paymentStatus === 'approved' ? (
                                  <span data-testid={`icon-email-not-sent-${order.id}`}><MailX className="h-3.5 w-3.5 text-muted-foreground/40" /></span>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {!order.archivedAt && !order.deletedAt && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        archiveMutation.mutate(order.id);
                                      }}
                                      data-testid={`button-archive-${order.id}`}
                                    >
                                      <Archive className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteMutation.mutate(order.id);
                                      }}
                                      data-testid={`button-delete-${order.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {order.archivedAt && !order.deletedAt && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      unarchiveMutation.mutate(order.id);
                                    }}
                                    data-testid={`button-unarchive-${order.id}`}
                                  >
                                    <ArchiveRestore className="h-4 w-4" />
                                  </Button>
                                )}
                                {order.deletedAt && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        bulkRestoreMutation.mutate([order.id]);
                                      }}
                                      data-testid={`button-restore-${order.id}`}
                                    >
                                      <ArchiveRestore className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        hardDeleteMutation.mutate(order.id);
                                      }}
                                      data-testid={`button-hard-delete-${order.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="lowercase">detalhes do pedido</DialogTitle>
            <div className="flex flex-col gap-2">
              <DialogDescription className="lowercase flex items-center gap-2">
                #{selectedOrder?.orderNumber}
                <div className="flex items-center gap-1.5 ml-2">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedOrder?.paymentStatus === 'approved' || selectedOrder?.orderStatus === 'paid' || selectedOrder?.orderStatus === 'shipped' || selectedOrder?.orderStatus === 'delivered' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                    selectedOrder?.paymentStatus === 'rejected' || selectedOrder?.orderStatus === 'failed' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                    selectedOrder?.paymentStatus === 'cancelled' || selectedOrder?.orderStatus === 'cancelled' ? 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]' :
                    'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                  }`} />
                  <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 lowercase">
                    {paymentStatusMap[selectedOrder?.paymentStatus || 'pending']?.label.toLowerCase()}
                  </span>
                </div>
              </DialogDescription>
            </div>
            {selectedOrder?.verificationCode && (
              <div className="mt-3 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600/70 dark:text-emerald-400/70">código de verificação</span>
                  <span className="text-sm font-mono font-bold text-emerald-900 dark:text-emerald-100 tracking-widest">{selectedOrder.verificationCode}</span>
                </div>
              </div>
            )}
            {selectedOrder?.trackingCode && (
              <div className="mt-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600/70 dark:text-blue-400/70">Código de Rastreio</span>
                  <span className="text-sm font-mono font-medium text-blue-900 dark:text-blue-100">{selectedOrder.trackingCode}</span>
                </div>
              </div>
            )}
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              {/* Internal Notes - First Priority */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium lowercase">
                  <MessageCircle className="h-4 w-4" />
                  observações internas
                </div>
                <Separator />
                <div className="space-y-3">
                  <Textarea
                    ref={notesTextareaRef}
                    placeholder="adicione observações sobre este pedido..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="min-h-[100px] resize-none lowercase"
                    data-testid="textarea-internal-notes"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveNotesMutation.mutate()}
                      disabled={saveNotesMutation.isPending}
                      size="sm"
                      className="gap-2"
                      data-testid="button-save-notes"
                    >
                      <Save className="h-4 w-4" />
                      <span className="lowercase">salvar observações</span>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Status Specific Info */}
              {selectedOrder.orderStatus === 'shipped' && selectedOrder.trackingCode && (
                <Card className="p-4 bg-blue-50/30 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50">
                  <div className="flex items-center gap-2 text-sm font-medium lowercase text-blue-700 dark:text-blue-400">
                    <Truck className="h-4 w-4" />
                    código de rastreio: <span className="font-bold uppercase tracking-wider">{selectedOrder.trackingCode}</span>
                  </div>
                </Card>
              )}

              {selectedOrder.orderStatus === 'refunded' && selectedOrder.refundReason && (
                <Card className="p-4 bg-red-50/30 border-red-200 dark:bg-red-950/20 dark:border-red-900/50">
                  <div className="flex items-center gap-2 text-sm font-medium lowercase text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    motivo do estorno: <span className="font-normal italic">{selectedOrder.refundReason}</span>
                  </div>
                </Card>
              )}

              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium lowercase">
                  <Mail className="h-4 w-4" />
                  notificações por email
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {selectedOrder.confirmationEmailSentAt ? (
                      <MailCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <MailX className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span className="lowercase">
                      {selectedOrder.confirmationEmailSentAt 
                        ? `confirmação enviada em ${format(new Date(selectedOrder.confirmationEmailSentAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                        : "confirmação não enviada"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedOrder.trackingEmailSentAt ? (
                      <MailCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <MailX className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span className="lowercase">
                      {selectedOrder.trackingEmailSentAt 
                        ? `rastreio enviado em ${format(new Date(selectedOrder.trackingEmailSentAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                        : "rastreio não enviado"}
                    </span>
                  </div>
                  {selectedOrder.emailDeliveredAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <MailCheck className="h-4 w-4 text-blue-500" />
                      <span className="lowercase">
                        entregue na caixa de entrada em {format(new Date(selectedOrder.emailDeliveredAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  {selectedOrder.emailOpenedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="h-4 w-4 text-violet-500" />
                      <span className="lowercase">
                        aberto pelo cliente em {format(new Date(selectedOrder.emailOpenedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  {selectedOrder.emailComplainedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="lowercase">
                        marcado como spam em {format(new Date(selectedOrder.emailComplainedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  {selectedOrder.emailFailedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <MailX className="h-4 w-4 text-red-500" />
                      <span className="lowercase">
                        falha na entrega em {format(new Date(selectedOrder.emailFailedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {selectedOrder.emailFailureReason && ` - ${selectedOrder.emailFailureReason}`}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick Actions - Apple Style */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleStatusClick(selectedOrder.id, 'shipped')}
                    className="flex flex-col items-center justify-center gap-2 h-auto py-4 rounded-2xl border-none bg-secondary/50 hover:bg-secondary transition-all active:scale-95 group"
                    disabled={selectedOrder.orderStatus === 'shipped' || selectedOrder.orderStatus === 'delivered' || selectedOrder.orderStatus === 'refunded'}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-disabled:opacity-50">
                      <Truck className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium lowercase tracking-tight">enviado</span>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleStatusClick(selectedOrder.id, 'delivered')}
                    className="flex flex-col items-center justify-center gap-2 h-auto py-4 rounded-2xl border-none bg-secondary/50 hover:bg-secondary transition-all active:scale-95 group"
                    disabled={selectedOrder.orderStatus !== 'shipped'}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-disabled:opacity-50">
                      <Package className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium lowercase tracking-tight">entregue</span>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleStatusClick(selectedOrder.id, 'refunded')}
                    className="flex flex-col items-center justify-center gap-2 h-auto py-4 rounded-2xl border-none bg-secondary/50 hover:bg-secondary transition-all active:scale-95 group"
                    disabled={selectedOrder.orderStatus === 'refunded'}
                  >
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 group-disabled:opacity-50">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium lowercase tracking-tight">estornar</span>
                  </Button>

                  {!selectedOrder.archivedAt && !selectedOrder.deletedAt && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        archiveMutation.mutate(selectedOrder.id);
                        setSelectedOrderId(null);
                      }}
                      className="flex flex-col items-center justify-center gap-2 h-auto py-4 rounded-2xl border-none bg-secondary/50 hover:bg-secondary transition-all active:scale-95 group"
                      data-testid="button-archive-order-quick"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                        <Archive className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-medium lowercase tracking-tight">arquivar</span>
                    </Button>
                  )}

                  {selectedOrder.archivedAt && !selectedOrder.deletedAt && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        unarchiveMutation.mutate(selectedOrder.id);
                        setSelectedOrderId(null);
                      }}
                      className="flex flex-col items-center justify-center gap-2 h-auto py-4 rounded-2xl border-none bg-secondary/50 hover:bg-secondary transition-all active:scale-95 group"
                      data-testid="button-unarchive-order-quick"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                        <ArchiveRestore className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-medium lowercase tracking-tight">desarquivar</span>
                    </Button>
                  )}

                  {!selectedOrder.deletedAt && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        deleteMutation.mutate(selectedOrder.id);
                        setSelectedOrderId(null);
                      }}
                      className="flex flex-col items-center justify-center gap-2 h-auto py-4 rounded-2xl border-none bg-secondary/50 hover:bg-secondary transition-all active:scale-95 group"
                      data-testid="button-delete-order-quick"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-medium lowercase tracking-tight text-red-600 dark:text-red-400">remover</span>
                    </Button>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="w-full justify-start gap-2 h-10 rounded-xl border-none bg-secondary/50 hover:bg-secondary"
                      data-testid="button-whatsapp-contact"
                    >
                      <a
                        href={`https://wa.me/55${selectedOrder.customerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <SiWhatsapp className="h-4 w-4 text-[#25D366]" />
                        <span className="text-xs lowercase">whatsapp</span>
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="w-full justify-start gap-2 h-10 rounded-xl border-none bg-secondary/50 hover:bg-secondary"
                      data-testid="button-email-contact"
                    >
                      <a href={`mailto:${selectedOrder.customerEmail}`}>
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-xs lowercase">email</span>
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="w-full justify-start gap-2 h-10 rounded-xl border-none bg-secondary/50 hover:bg-secondary"
                      data-testid="button-maps-location"
                    >
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedOrder.street}, ${selectedOrder.number}, ${selectedOrder.neighborhood}, ${selectedOrder.city} - ${selectedOrder.state}, ${selectedOrder.zipCode}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="text-xs lowercase">maps</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium lowercase">
                    <Mail className="h-4 w-4" />
                    informações do cliente
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground lowercase">nome:</span>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground lowercase">email:</span>
                      <p className="font-medium lowercase">{selectedOrder.customerEmail}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground lowercase">telefone:</span>
                      <p className="font-medium">{selectedOrder.customerPhone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground lowercase">cpf:</span>
                      <p className="font-medium">{selectedOrder.customerCpf}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium lowercase">
                    <MapPin className="h-4 w-4" />
                    endereço de entrega
                  </div>
                  <Separator />
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{selectedOrder.street}, {selectedOrder.number}</p>
                    {selectedOrder.complement && <p>{selectedOrder.complement}</p>}
                    <p>{selectedOrder.neighborhood}</p>
                    <p>{selectedOrder.city} - {selectedOrder.state}</p>
                    <p className="text-muted-foreground lowercase">cep: {selectedOrder.zipCode}</p>
                  </div>
                </Card>
              </div>

              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium lowercase">
                  <Package className="h-4 w-4" />
                  itens do pedido
                </div>
                <Separator />
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => {
                    const colorData = JSON.parse(item.color);
                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium lowercase">{item.productName}</h4>
                          <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                            <p className="lowercase">tamanho: {item.size}</p>
                            <p className="lowercase">cor: {colorData.name}</p>
                            {item.printPosition && (
                              <p className="lowercase">estampa: {item.printPosition}</p>
                            )}
                            <p className="lowercase">quantidade: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground lowercase">
                            {item.quantity}x {formatPrice(item.unitPrice)}
                          </p>
                          <p className="font-medium">{formatPrice(item.subtotal)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground lowercase">subtotal:</span>
                    <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground lowercase">frete:</span>
                    <span className="font-medium text-primary lowercase">
                      {parseFloat(selectedOrder.shippingCost) === 0 ? 'grátis' : formatPrice(selectedOrder.shippingCost)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span className="lowercase">total:</span>
                    <span>{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </Card>

              {(selectedOrder.paymentId || selectedOrder.paymentStatus) && (
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium lowercase">
                    <Package className="h-4 w-4" />
                    informações de pagamento
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedOrder.paymentId && (
                      <div>
                        <span className="text-muted-foreground lowercase">id do pagamento:</span>
                        <p className="font-medium">{selectedOrder.paymentId}</p>
                      </div>
                    )}
                    {selectedOrder.paymentStatus && (
                      <div>
                        <span className="text-muted-foreground lowercase">status:</span>
                        <p className="font-medium lowercase">{selectedOrder.paymentStatus}</p>
                      </div>
                    )}
                    {selectedOrder.paymentTypeId && (
                      <div>
                        <span className="text-muted-foreground lowercase">tipo:</span>
                        <p className="font-medium lowercase">{selectedOrder.paymentTypeId === 'credit_card' ? 'cartão de crédito' : selectedOrder.paymentTypeId === 'debit_card' ? 'cartão de débito' : selectedOrder.paymentTypeId === 'account_money' ? 'saldo em conta' : selectedOrder.paymentTypeId}</p>
                      </div>
                    )}
                    {selectedOrder.paymentMethod && (
                      <div>
                        <span className="text-muted-foreground lowercase">método:</span>
                        <p className="font-medium lowercase">{selectedOrder.paymentMethod}</p>
                      </div>
                    )}
                    {selectedOrder.paymentInstallments && selectedOrder.paymentInstallments > 1 && (
                      <div>
                        <span className="text-muted-foreground lowercase">parcelas:</span>
                        <p className="font-medium">{selectedOrder.paymentInstallments}x</p>
                      </div>
                    )}
                    {selectedOrder.paidAt && (
                      <div>
                        <span className="text-muted-foreground lowercase">pago em:</span>
                        <p className="font-medium">{formatDate(selectedOrder.paidAt)}</p>
                      </div>
                    )}
                    {selectedOrder.paymentPreferenceId && (
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground lowercase">preference id:</span>
                        <p className="font-medium text-xs break-all">{selectedOrder.paymentPreferenceId}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {(selectedOrder.customerIp || selectedOrder.deviceType || selectedOrder.browserName || selectedOrder.osName || selectedOrder.screenResolution) && (
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium lowercase">
                    <Package className="h-4 w-4" />
                    informações do dispositivo
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedOrder.customerIp && (
                      <div>
                        <span className="text-muted-foreground lowercase">ip:</span>
                        <p className="font-medium">{selectedOrder.customerIp}</p>
                      </div>
                    )}
                    {selectedOrder.deviceType && (
                      <div>
                        <span className="text-muted-foreground lowercase">dispositivo:</span>
                        <p className="font-medium lowercase">{selectedOrder.deviceType}</p>
                      </div>
                    )}
                    {selectedOrder.browserName && (
                      <div>
                        <span className="text-muted-foreground lowercase">navegador:</span>
                        <p className="font-medium">{selectedOrder.browserName} {selectedOrder.browserVersion}</p>
                      </div>
                    )}
                    {selectedOrder.osName && (
                      <div>
                        <span className="text-muted-foreground lowercase">sistema:</span>
                        <p className="font-medium">{selectedOrder.osName} {selectedOrder.osVersion}</p>
                      </div>
                    )}
                    {selectedOrder.screenResolution && (
                      <div>
                        <span className="text-muted-foreground lowercase">resolução:</span>
                        <p className="font-medium">{selectedOrder.screenResolution}</p>
                      </div>
                    )}
                    {selectedOrder.userAgent && (
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground lowercase">user agent:</span>
                        <p className="font-medium text-xs break-all">{selectedOrder.userAgent}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="lowercase">
              {pendingStatusChange?.status === 'shipped' ? 'informar rastreio' : 'motivo do estorno'}
            </DialogTitle>
            <DialogDescription className="lowercase">
              {pendingStatusChange?.status === 'shipped' 
                ? 'insira o código de rastreio para o envio do pedido.' 
                : 'explique o motivo do estorno (mínimo 20 caracteres).'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {pendingStatusChange?.status === 'shipped' ? (
              <Input
                placeholder="ex: BR123456789BR"
                value={statusMetadata.trackingCode}
                onChange={(e) => setStatusMetadata(prev => ({ ...prev, trackingCode: e.target.value }))}
                className="lowercase"
              />
            ) : (
              <Textarea
                placeholder="descreva o motivo do estorno detalhadamente..."
                value={statusMetadata.refundReason}
                onChange={(e) => setStatusMetadata(prev => ({ ...prev, refundReason: e.target.value }))}
                className="min-h-[100px] resize-none lowercase"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false);
                setPendingStatusChange(null);
                setStatusMetadata({ trackingCode: "", refundReason: "" });
              }}
              className="lowercase"
            >
              cancelar
            </Button>
            <Button
              onClick={() => {
                if (pendingStatusChange) {
                  updateStatus(pendingStatusChange.id, pendingStatusChange.status, statusMetadata);
                }
              }}
              disabled={
                pendingStatusChange?.status === 'shipped' 
                  ? !statusMetadata.trackingCode.trim()
                  : statusMetadata.refundReason.trim().length < 20
              }
              className="lowercase"
            >
              confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
