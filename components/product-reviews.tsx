"use client"

import { useState } from "react"
import { Star, ThumbsUp, ThumbsDown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import type { Review } from "@/lib/types"

interface ProductReviewsProps {
  productId: string
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ProductReviews({ productId, reviews, averageRating, totalReviews }: ProductReviewsProps) {
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" })
  const [showReviewForm, setShowReviewForm] = useState(false)

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: (reviews.filter((r) => r.rating === rating).length / totalReviews) * 100,
  }))

  const handleSubmitReview = () => {
    // Aqui você adicionaria a lógica para salvar a avaliação
    console.log("Nova avaliação:", newReview)
    setNewReview({ rating: 5, comment: "" })
    setShowReviewForm(false)
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Avaliações dos Clientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-primary">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${
                      i < Math.floor(averageRating) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600">{totalReviews} avaliações</p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3">
                  <span className="text-sm font-medium w-8">{rating}★</span>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-gray-600 w-12">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button onClick={() => setShowReviewForm(!showReviewForm)} className="bg-secondary hover:bg-secondary/90">
              Escrever Avaliação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Sua Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nota</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button key={rating} onClick={() => setNewReview({ ...newReview, rating })} className="p-1">
                    <Star
                      className={`h-8 w-8 ${
                        rating <= newReview.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                      } hover:text-yellow-400 transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Comentário</label>
              <Textarea
                placeholder="Conte sua experiência com este produto..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleSubmitReview} className="bg-primary hover:bg-primary/90">
                Publicar Avaliação
              </Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Comentários</h3>
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{review.userName}</p>
                    <p className="text-sm text-gray-500">{review.createdAt.toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              <div className="flex items-center space-x-4 text-sm">
                <button className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Útil (12)</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors">
                  <ThumbsDown className="h-4 w-4" />
                  <span>Não útil (1)</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
