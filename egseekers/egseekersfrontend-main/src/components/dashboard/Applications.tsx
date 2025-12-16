import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { config } from '@/config/env';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    image: string | null;
  };
}

const getImageUrl = (image: string | null) => {
  if (!image) return undefined;
  
  // If it's already a full Cloudinary URL, return it as is
  if (image.includes('cloudinary.com')) return image;
  
  // If it's a local URL, return it as is
  if (image.startsWith('http://localhost')) return image;
  
  // Otherwise, construct the Cloudinary URL
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/${image}`;
};

export function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view applications');
        return;
      }

      const response = await axios.get(`${config.apiUrl}/dashboard/applications/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setApplications(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: 'ACCEPTED' | 'REJECTED') => {
    try {
      setProcessingId(applicationId);
      const token = localStorage.getItem('token');
      
      // Use the new accept/reject endpoints
      const endpoint = newStatus === 'ACCEPTED' 
        ? `${config.apiUrl}/proposals/${applicationId}/accept`
        : `${config.apiUrl}/proposals/${applicationId}/reject`;
      
      await axios.put(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh the applications list to get updated data
      await fetchApplications();

      toast.success(`Application ${newStatus.toLowerCase()} successfully`);
    } catch (err) {
      toast.error('Failed to update application status');
      console.error('Error updating application status:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Loading applications...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Applications</CardTitle>
        <CardDescription>
          {applications.length === 0 
            ? "No applications yet" 
            : `Showing ${applications.length} recent applications`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 border-2 border-primary/10">
                  <AvatarImage 
                    src={getImageUrl(application.freelancer.image)} 
                    alt={`${application.freelancer.firstName} ${application.freelancer.lastName}`}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {application.freelancer.firstName[0]}
                    {application.freelancer.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">
                    {application.freelancer.firstName} {application.freelancer.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground">{application.jobTitle}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={
                      application.status === 'ACCEPTED' ? 'default' :
                      application.status === 'REJECTED' ? 'destructive' :
                      'secondary'
                    }>
                      {application.status === 'ACCEPTED' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : application.status === 'REJECTED' ? (
                        <XCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {application.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {application.status === 'PENDING' && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleStatusUpdate(application.id, 'REJECTED')}
                    disabled={processingId === application.id}
                  >
                    {processingId === application.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-success hover:text-success"
                    onClick={() => handleStatusUpdate(application.id, 'ACCEPTED')}
                    disabled={processingId === application.id}
                  >
                    {processingId === application.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 