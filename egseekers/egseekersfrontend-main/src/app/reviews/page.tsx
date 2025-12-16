"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, StarHalf } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  job: {
    id: string
    title: string
    budget: number
  }
  reviewer: {
    id: string
    name: string
    image: string | null
  }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  useEffect(() => {
    // Simulate API call to fetch reviews
    const mockReviews: Review[] = [
      {
        id: "1",
        rating: 5,
        comment: "Excellent work! The freelancer delivered high-quality results and was very professional throughout the project.",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        job: {
          id: "1",
          title: "Website Development",
          budget: 500
        },
        reviewer: {
          id: "1",
          name: "John Doe",
          image: null
        }
      },
      {
        id: "2",
        rating: 4,
        comment: "Good communication and timely delivery. Would work with again.",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        job: {
          id: "2",
          title: "Logo Design",
          budget: 200
        },
        reviewer: {
          id: "2",
          name: "Jane Smith",
          image: null
        }
      },
      {
        id: "3",
        rating: 5,
        comment: "Outstanding service! Exceeded my expectations in every way.",
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        job: {
          id: "3",
          title: "Mobile App Development",
          budget: 1000
        },
        reviewer: {
          id: "3",
          name: "Mike Johnson",
          image: null
        }
      }
    ]
    
    setReviews(mockReviews)
    setLoading(false)
    
    // Calculate average rating
    const total = mockReviews.reduce((sum, review) => sum + review.rating, 0)
    setAverageRating(total / mockReviews.length)
    setTotalReviews(mockReviews.length)
  }, [])

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`star-${i}`} className="w-4 h-4 fill-current text-yellow-400" />
      )
    }
    
    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half-star" className="w-4 h-4 fill-current text-yellow-400" />
      )
    }
    
    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-star-${i}`} className="w-4 h-4 text-gray-300" />
      )
    }
    
    return stars
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Reviews</h1>
      
      {/* Rating Summary */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Overall Rating</h2>
            <div className="flex items-center space-x-2">
              <div className="flex">
                {renderStars(averageRating)}
              </div>
              <span className="text-lg font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({totalReviews} reviews)</span>
            </div>
          </div>
          <Button>Write a Review</Button>
        </div>
      </Card>
      
      {/* Reviews List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={review.reviewer.image || undefined} />
                  <AvatarFallback>{review.reviewer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{review.reviewer.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {review.job.title} • ${review.job.budget}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex mt-2">
                    {renderStars(review.rating)}
                  </div>
                  <p className="mt-2 text-muted-foreground">{review.comment}</p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <p>No reviews yet</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
} 