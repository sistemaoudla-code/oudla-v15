import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, Trash2, Star, Plus, X, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminProductReviewsProps {
  productId: string;
  onRatingUpdate?: (newRating: number) => void;
}

interface Review {
  id: string;
  productId: string;
  userName: string;
  userCity?: string;
  userImage?: string;
  rating: number;
  comment: string;
  reviewImage?: string;
  sortOrder?: number;
  createdAt: string;
}

export default function AdminProductReviews({ product, onRatingUpdate }: { product: any, onRatingUpdate?: (newRating: number) => void }) {
  const productId = product.id;
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userName: "",
    userCity: "",
    userImage: "",
    rating: "5",
    comment: "",
    reviewImage: "",
  });
  const userImageInputRef = useRef<HTMLInputElement>(null);
  const reviewImageInputRef = useRef<HTMLInputElement>(null);
  const [userImagePreview, setUserImagePreview] = useState<string>("");
  const [reviewImagePreview, setReviewImagePreview] = useState<string>("");
  const [uploadingUserImage, setUploadingUserImage] = useState(false);
  const [uploadingReviewImage, setUploadingReviewImage] = useState(false);

  const { data: reviewsData } = useQuery<{ reviews: Review[] }>({
    queryKey: ['/api/admin/products', productId, 'reviews'],
    enabled: !!productId,
  });

  const reviews = reviewsData?.reviews || [];
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/products/${productId}/reviews`, formData);
      if (!response.ok) throw new Error("erro ao criar avaliação");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', productId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      resetForm();
      toast({
        title: "avaliação criada",
        description: "a avaliação foi adicionada com sucesso.",
      });
      if (onRatingUpdate) {
        onRatingUpdate(parseFloat(averageRating));
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "erro",
        description: error.message || "não foi possível criar a avaliação.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/admin/products/${productId}/reviews/${editingId}`, formData);
      if (!response.ok) throw new Error("erro ao atualizar avaliação");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', productId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      resetForm();
      toast({
        title: "avaliação atualizada",
        description: "a avaliação foi modificada com sucesso.",
      });
      if (onRatingUpdate) {
        onRatingUpdate(parseFloat(averageRating));
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "erro",
        description: error.message || "não foi possível atualizar a avaliação.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${productId}/reviews/${id}`);
      if (!response.ok) throw new Error("erro ao deletar avaliação");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', productId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      toast({
        title: "avaliação removida",
        description: "a avaliação foi deletada com sucesso.",
      });
      if (onRatingUpdate) {
        onRatingUpdate(parseFloat(averageRating));
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "erro",
        description: error.message || "não foi possível deletar a avaliação.",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ reviewId, sortOrder }: { reviewId: string; sortOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${productId}/reviews/${reviewId}/reorder`, { sortOrder });
      if (!response.ok) throw new Error("erro ao reordenar");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', productId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
    },
  });

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const current = reviews[index];
    const above = reviews[index - 1];
    const currentOrder = current.sortOrder ?? index;
    const aboveOrder = above.sortOrder ?? (index - 1);
    reorderMutation.mutate({ reviewId: current.id, sortOrder: aboveOrder });
    reorderMutation.mutate({ reviewId: above.id, sortOrder: currentOrder });
  };

  const handleMoveDown = (index: number) => {
    if (index >= reviews.length - 1) return;
    const current = reviews[index];
    const below = reviews[index + 1];
    const currentOrder = current.sortOrder ?? index;
    const belowOrder = below.sortOrder ?? (index + 1);
    reorderMutation.mutate({ reviewId: current.id, sortOrder: belowOrder });
    reorderMutation.mutate({ reviewId: below.id, sortOrder: currentOrder });
  };

  const resetForm = () => {
    setFormData({
      userName: "",
      userCity: "",
      userImage: "",
      rating: "5",
      comment: "",
      reviewImage: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (review: Review) => {
    setFormData({
      userName: review.userName,
      userCity: review.userCity || "",
      userImage: review.userImage || "",
      rating: review.rating.toString(),
      comment: review.comment,
      reviewImage: review.reviewImage || "",
    });
    setUserImagePreview(review.userImage || "");
    setReviewImagePreview(review.reviewImage || "");
    setEditingId(review.id);
    setShowForm(true);
  };

  const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingUserImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const sessionId = localStorage.getItem('admin_session');
      const headers: Record<string, string> = {};
      if (sessionId) headers['x-session-id'] = sessionId;
      
      const response = await fetch('/api/admin/reviews/upload-user-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
      });
      
      if (!response.ok) throw new Error("erro ao fazer upload");
      const data = await response.json();
      setFormData(prev => ({ ...prev, userImage: data.userImage }));
      setUserImagePreview(data.userImage);
      toast({ title: "sucesso", description: "imagem de perfil enviada" });
    } catch (error) {
      toast({ variant: "destructive", title: "erro", description: "não foi possível enviar a imagem" });
    } finally {
      setUploadingUserImage(false);
    }
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingReviewImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const sessionId = localStorage.getItem('admin_session');
      const headers: Record<string, string> = {};
      if (sessionId) headers['x-session-id'] = sessionId;
      
      const response = await fetch('/api/admin/reviews/upload-review-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
      });
      
      if (!response.ok) throw new Error("erro ao fazer upload");
      const data = await response.json();
      setFormData(prev => ({ ...prev, reviewImage: data.reviewImage }));
      setReviewImagePreview(data.reviewImage);
      toast({ title: "sucesso", description: "imagem da avaliação enviada" });
    } catch (error) {
      toast({ variant: "destructive", title: "erro", description: "não foi possível enviar a imagem" });
    } finally {
      setUploadingReviewImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.userName || !formData.comment) {
      toast({
        variant: "destructive",
        title: "erro",
        description: "preencha nome e comentário.",
      });
      return;
    }

    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/40 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col shrink-0">
            <span className="text-[11px] font-medium lowercase text-muted-foreground ml-0.5">média</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-semibold tracking-tight leading-none">{averageRating}</span>
              <div className="flex items-center -space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(parseFloat(averageRating))
                        ? "fill-current text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="h-8 w-px bg-border/40 shrink-0" />
          
          <div className="flex flex-col shrink-0">
            <span className="text-[11px] font-medium lowercase text-muted-foreground ml-0.5">total</span>
            <span className="text-lg font-medium leading-none mt-1">{reviews.length} <span className="text-[10px] text-muted-foreground font-normal">avaliações</span></span>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          size="sm"
          variant="secondary"
          className="h-9 px-4 rounded-xl hover-elevate lowercase text-[11px] font-medium gap-2 w-full sm:w-auto"
          data-testid="button-add-review"
        >
          <Plus className="h-3.5 w-3.5" />
          nova avaliação
        </Button>
      </div>

      {showForm && !editingId && (
        <div className="rounded-2xl bg-muted/30 dark:bg-muted/15 overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold lowercase tracking-tight">nova avaliação</p>
            <Button type="button" variant="ghost" size="icon" onClick={resetForm} className="h-7 w-7 rounded-full">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="px-5 pb-2">
            <div className="flex items-center gap-4">
              <div
                onClick={() => userImageInputRef.current?.click()}
                className="relative cursor-pointer group"
              >
                <Avatar className="h-14 w-14 ring-2 ring-border/20 group-hover:ring-primary/40 transition-all">
                  {userImagePreview ? (
                    <AvatarImage src={userImagePreview} />
                  ) : null}
                  <AvatarFallback className="bg-muted/50 text-muted-foreground/40">
                    <Upload className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                {userImagePreview && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, userImage: "" }));
                      setUserImagePreview("");
                    }}
                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 shadow-sm"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
                {uploadingUserImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <input ref={userImageInputRef} type="file" accept="image/*" onChange={handleUserImageUpload} className="hidden" data-testid="input-user-image-upload" />
              <div className="flex-1 space-y-1">
                <Input
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  placeholder="nome do cliente"
                  className="border-0 bg-transparent shadow-none px-0 text-[15px] font-medium lowercase focus-visible:ring-0 placeholder:text-muted-foreground/30 h-8"
                  data-testid="input-review-name"
                />
                <Input
                  value={formData.userCity}
                  onChange={(e) => setFormData({ ...formData, userCity: e.target.value })}
                  placeholder="cidade, estado"
                  className="border-0 bg-transparent shadow-none px-0 text-[12px] text-muted-foreground lowercase focus-visible:ring-0 placeholder:text-muted-foreground/25 h-6"
                  data-testid="input-review-city"
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-3">
            <div className="flex items-center gap-1" data-testid="select-review-rating">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: num.toString() })}
                  className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      num <= parseInt(formData.rating)
                        ? "fill-current text-amber-400"
                        : "text-muted-foreground/20 hover:text-amber-400/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/20 mx-5" />

          <div className="p-5">
            <Textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="escreva o comentário da avaliação..."
              className="border-0 bg-transparent shadow-none px-0 text-[14px] lowercase resize-none min-h-[80px] focus-visible:ring-0 placeholder:text-muted-foreground/25"
              data-testid="textarea-review-comment"
            />
          </div>

          <div className="h-px bg-border/20 mx-5" />

          <div className="p-5">
            {reviewImagePreview ? (
              <div className="relative inline-block">
                <img src={reviewImagePreview} alt="preview" className="h-24 w-auto rounded-xl object-cover ring-1 ring-border/20" loading="lazy" decoding="async" />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, reviewImage: "" }));
                    setReviewImagePreview("");
                  }}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => reviewImageInputRef.current?.click()}
                className="flex items-center gap-2 text-[12px] text-muted-foreground/50 hover:text-muted-foreground transition-colors lowercase"
              >
                <Upload className="h-3.5 w-3.5" />
                adicionar foto da avaliação
              </button>
            )}
            <input ref={reviewImageInputRef} type="file" accept="image/*" onChange={handleReviewImageUpload} className="hidden" data-testid="input-review-image-upload" />
            {uploadingReviewImage && (
              <p className="text-[11px] text-muted-foreground/40 mt-1 lowercase">enviando...</p>
            )}
          </div>

          <div className="px-5 pb-5 flex gap-2">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="flex-1 rounded-xl lowercase"
              data-testid="button-save-review"
            >
              {createMutation.isPending ? "salvando..." : "publicar avaliação"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="rounded-xl lowercase"
              data-testid="button-cancel-review"
            >
              cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {reviews.map((review, index) => (
          <div key={review.id}>
            {editingId === review.id ? (
              <Card className="border-primary/20 bg-primary/[0.02]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium lowercase">editar avaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium lowercase text-muted-foreground ml-1">nome do usuário</label>
                      <Input
                        value={formData.userName}
                        onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                        placeholder="ex: João Silva"
                        className="bg-background border-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary h-10 px-4 rounded-xl text-sm"
                        data-testid="input-review-name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium lowercase text-muted-foreground ml-1">cidade/estado</label>
                      <Input
                        value={formData.userCity}
                        onChange={(e) => setFormData({ ...formData, userCity: e.target.value })}
                        placeholder="ex: Maringá/PR"
                        className="bg-background border-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary h-10 px-4 rounded-xl text-sm"
                        data-testid="input-review-city"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium lowercase text-muted-foreground ml-1">estrelas</label>
                      <Select value={formData.rating} onValueChange={(val) => setFormData({ ...formData, rating: val })}>
                        <SelectTrigger className="bg-background border-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary h-10 px-4 rounded-xl text-sm" data-testid="select-review-rating">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} estrela{num > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium lowercase text-muted-foreground ml-1">foto do usuário</label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleUserImageUpload}
                          disabled={uploadingUserImage}
                          ref={userImageInputRef}
                          className="bg-background border-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary h-10 px-4 rounded-xl text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                          data-testid="input-user-image-upload"
                        />
                      </div>
                      {userImagePreview && (
                        <div className="mt-2 relative inline-block">
                          <img src={userImagePreview} alt="preview" className="h-12 w-12 rounded-lg object-cover ring-1 ring-border" loading="lazy" decoding="async" />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, userImage: "" }));
                              setUserImagePreview("");
                            }}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium lowercase text-muted-foreground ml-1">comentário</label>
                    <Textarea
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      placeholder="O que você achou do produto?"
                      className="bg-background border-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary min-h-[100px] px-4 py-3 rounded-xl text-sm resize-none"
                      data-testid="textarea-review-comment"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium lowercase text-muted-foreground ml-1">imagem da avaliação (opcional)</label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleReviewImageUpload}
                        disabled={uploadingReviewImage}
                        ref={reviewImageInputRef}
                        className="bg-background border-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary h-10 px-4 rounded-xl text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        data-testid="input-review-image-upload"
                      />
                    </div>
                    {reviewImagePreview && (
                      <div className="mt-2 relative inline-block">
                        <img src={reviewImagePreview} alt="preview" className="h-16 w-24 rounded-lg object-cover ring-1 ring-border" loading="lazy" decoding="async" />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, reviewImage: "" }));
                            setReviewImagePreview("");
                          }}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="button" 
                      onClick={handleSubmit} 
                      disabled={updateMutation.isPending} 
                      className="h-10 px-6 rounded-xl hover-elevate lowercase text-[11px] font-medium"
                      data-testid="button-save-review"
                    >
                      {updateMutation.isPending ? "salvando..." : "salvar alterações"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm} 
                      className="h-10 px-6 rounded-xl hover-elevate lowercase text-[11px] font-medium"
                      data-testid="button-cancel-review"
                    >
                      cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card data-testid={`card-review-${review.id}`} className="hover:bg-muted/5 transition-colors border-border/40">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 flex-shrink-0 ring-1 ring-border/20">
                      {review.userImage && <AvatarImage src={review.userImage} />}
                      <AvatarFallback className="bg-muted text-xs font-medium">{review.userName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm lowercase" data-testid={`text-review-name-${review.id}`}>
                            {review.userName}
                          </p>
                          {review.userCity && (
                            <p className="text-[10px] text-muted-foreground lowercase">
                              {review.userCity}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? "fill-current text-amber-400" : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || reorderMutation.isPending}
                            className="opacity-50 hover:opacity-100 disabled:opacity-20"
                            data-testid={`button-move-up-review-${review.id}`}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(index)}
                            disabled={index >= reviews.length - 1 || reorderMutation.isPending}
                            className="opacity-50 hover:opacity-100 disabled:opacity-20"
                            data-testid={`button-move-down-review-${review.id}`}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(review)}
                            data-testid={`button-edit-review-${review.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(review.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-review-${review.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed" data-testid={`text-review-comment-${review.id}`}>
                        {review.comment}
                      </p>

                      {review.reviewImage && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-border/20">
                          <img
                            src={review.reviewImage}
                            alt="avaliação"
                            className="max-h-48 w-auto object-cover"
                            data-testid={`img-review-photo-${review.id}`}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
