"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"

export default function FreelancersPage() {
  const freelancers = [
    {
      id: "1",
      name: "Ahmed Hassan",
      title: "Senior Web Developer",
      rating: 4.8,
      reviews: 127,
      hourlyRate: 25,
      skills: ["React", "Node.js", "TypeScript"],
      image: "/freelancers/ahmed.jpg",
      location: "Cairo, Egypt"
    },
    {
      id: "2",
      name: "Sarah Mohamed",
      title: "UI/UX Designer",
      rating: 4.9,
      reviews: 89,
      hourlyRate: 30,
      skills: ["Figma", "Adobe XD", "Sketch"],
      image: "/freelancers/sarah.jpg",
      location: "Alexandria, Egypt"
    },
    {
      id: "3",
      name: "Omar Ali",
      title: "Content Writer",
      rating: 4.7,
      reviews: 156,
      hourlyRate: 20,
      skills: ["Copywriting", "SEO", "Blog Writing"],
      image: "/freelancers/omar.jpg",
      location: "Giza, Egypt"
    }
  ]

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-4">Find Top Egyptian Freelancers</h1>
          <p className="text-muted-foreground">
            Connect with talented freelancers from Egypt for your projects
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search freelancers..."
              className="pl-10"
            />
          </div>
          <button className="flex items-center gap-2 border border-input px-4 py-2 rounded-full">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Freelancers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((freelancer) => (
            <Card key={freelancer.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {freelancer.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{freelancer.name}</h3>
                  <p className="text-sm text-muted-foreground">{freelancer.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{freelancer.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({freelancer.reviews} reviews)
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {freelancer.location}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {freelancer.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-semibold">${freelancer.hourlyRate}/hr</span>
                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 