import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface Review {
  id: string;
  productId: string;
  userName: string;
  userCity?: string;
  userImage?: string;
  rating: number;
  comment: string;
  reviewImage?: string;
  createdAt: string;
}

interface ReviewsModalProps {
  productId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
}

export default function ReviewsModal({
  productId,
  isOpen,
  onOpenChange,
  productName,
}: ReviewsModalProps) {
  const { data: reviewsData, isLoading } = useQuery<{ reviews: Review[] }>({
    queryKey: ['/api/products', productId, 'admin-reviews'],
    enabled: isOpen && !!productId,
  });

  const reviews = reviewsData?.reviews || [];
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg lowercase">
            avaliações de {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Rating Summary - Apple Style Simplified */}
          <div className="bg-muted/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 border">
            <div className="flex flex-col items-center gap-1">
              <div className="text-7xl font-bold tracking-tighter">
                {averageRating}
              </div>
              <div className="text-sm text-muted-foreground font-medium lowercase">
                média de {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
              </div>
              <div className="flex items-center gap-1.5 mt-2 relative">
                {[...Array(5)].map((_, i) => {
                  const rating = parseFloat(averageRating);
                  const fillPercentage = Math.max(0, Math.min(1, rating - i)) * 100;
                  
                  return (
                    <div key={i} className="relative h-6 w-6">
                      {/* Background Star (Empty) */}
                      <Star className="h-6 w-6 text-muted-foreground/20 absolute inset-0" />
                      
                      {/* Foreground Star (Proportional Fill) */}
                      {fillPercentage > 0 && (
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${fillPercentage}%` }}
                        >
                          <Star className="h-6 w-6 fill-amber-400 text-amber-400 flex-shrink-0" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`review-item-${review.id}`}
                >
                  {/* Reviewer Info */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {review.userImage && (
                        <AvatarImage src={review.userImage} />
                      )}
                      <AvatarFallback>
                        {review.userName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">
                            {review.userName}
                          </p>
                          {review.userCity && (
                            <p className="text-[10px] text-muted-foreground lowercase">
                              {review.userCity}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? "fill-current text-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Review Image */}
                  {review.reviewImage && (
                    <img
                      src={review.reviewImage}
                      alt="avaliação"
                      className="max-h-48 rounded-lg object-cover w-full"
                      data-testid={`review-image-${review.id}`}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground lowercase">
                nenhuma avaliação cadastrada ainda
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
