"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  image: string | null;
  _count: {
    jobs: number;
    proposals: number;
    contracts: number;
  };
}

export default function AdminUserDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: ""
  });
  const [resolvedParams, setResolvedParams] = useState<{ userId: string } | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      fetchUser();
    }
  }, [resolvedParams]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ user: User }>(`/api/admin/users/${resolvedParams!.userId}`);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setFormData({
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role,
          password: ""
        });
        setError(null);
      } else {
        setError(response.error || "Failed to load user");
        toast.error(response.error || "Failed to load user");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setError("Failed to load user");
      toast.error("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        // Only include password if it's not empty
        ...(formData.password && { password: formData.password })
      };

      const response = await apiClient.patch(`/api/admin/users/${resolvedParams!.userId}`, payload);
      
      if (response.success) {
        toast.success("User updated successfully");
        fetchUser(); // Refresh user data
      } else {
        throw new Error(response.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit User</h1>
            <p className="text-muted-foreground">
              Update user information and role
            </p>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>Total jobs posted</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user?._count.jobs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Proposals</CardTitle>
              <CardDescription>Total proposals submitted</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user?._count.proposals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>Total contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user?._count.contracts}</p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Edit user details and role</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="FREELANCER">Freelancer</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter new password (optional)"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave blank to keep current password
                </p>
              </div>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 