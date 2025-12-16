"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface SystemSettings {
  id: string;
  maintenanceMode: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  emailNotifications: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<SystemSettings>('/admin/settings');
      
      if (response.success && response.data) {
        setSettings(response.data);
        setError(null);
      } else {
        setError(response.error || "Failed to load settings");
        toast.error(response.error || "Failed to load settings");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError("Failed to load settings");
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await apiClient.patch('/admin/settings', settings);
      
      if (response.success) {
        toast.success("Settings updated successfully");
        fetchSettings();
      } else {
        throw new Error(response.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
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
        <div>
          <h1 className="text-3xl font-bold mb-4">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure basic system settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable maintenance mode to prevent user access
                  </p>
                </div>
                <Switch
                  checked={settings?.maintenanceMode}
                  onCheckedChange={(checked) => 
                    setSettings(prev => prev ? {...prev, maintenanceMode: checked} : null)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum File Size (MB)</Label>
                <Input
                  type="number"
                  value={settings?.maxFileSize}
                  onChange={(e) => 
                    setSettings(prev => prev ? {...prev, maxFileSize: parseInt(e.target.value)} : null)
                  }
                  min={1}
                  max={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Allowed File Types</Label>
                <Input
                  value={settings?.allowedFileTypes.join(", ")}
                  onChange={(e) => 
                    setSettings(prev => prev ? {...prev, allowedFileTypes: e.target.value.split(",").map(t => t.trim())} : null)
                  }
                  placeholder="pdf, doc, docx, jpg, png"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Configure email notification settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable system-wide email notifications
                  </p>
                </div>
                <Switch
                  checked={settings?.emailNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => prev ? {...prev, emailNotifications: checked} : null)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={settings?.smtpHost}
                    onChange={(e) => 
                      setSettings(prev => prev ? {...prev, smtpHost: e.target.value} : null)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={settings?.smtpPort}
                    onChange={(e) => 
                      setSettings(prev => prev ? {...prev, smtpPort: parseInt(e.target.value)} : null)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>SMTP Username</Label>
                  <Input
                    value={settings?.smtpUser}
                    onChange={(e) => 
                      setSettings(prev => prev ? {...prev, smtpUser: e.target.value} : null)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>SMTP Password</Label>
                  <Input
                    type="password"
                    value={settings?.smtpPass}
                    onChange={(e) => 
                      setSettings(prev => prev ? {...prev, smtpPass: e.target.value} : null)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 