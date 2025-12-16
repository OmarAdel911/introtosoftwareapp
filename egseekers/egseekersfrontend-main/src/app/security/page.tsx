'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Key, Smartphone, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/toast';

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [lastPasswordChange, setLastPasswordChange] = useState<Date | null>(null);

  useEffect(() => {
    // TODO: Fetch security settings from API
    // For now using mock data
    setTwoFactorEnabled(false);
    setLastPasswordChange(new Date(2024, 3, 1));
  }, []);

  const handleToggle2FA = async () => {
    try {
      if (!twoFactorEnabled) {
        // TODO: Call API to enable 2FA and get QR code
        setShowQRCode(true);
      } else {
        // TODO: Call API to disable 2FA
        setTwoFactorEnabled(false);
        setShowQRCode(false);
        toast.success('Two-factor authentication has been disabled.');
      }
    } catch (error) {
      toast.error('Failed to update 2FA settings.');
    }
  };

  const handleVerify2FA = async () => {
    try {
      // TODO: Call API to verify 2FA code
      setTwoFactorEnabled(true);
      setShowQRCode(false);
      toast.success('Two-factor authentication has been enabled successfully.');
    } catch (error) {
      toast.error('Invalid verification code.');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Security Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="2fa">Enable 2FA</Label>
            <Switch
              id="2fa"
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
            />
          </div>

          {showQRCode && (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Scan this QR code with your authenticator app:
                </p>
                <div className="w-48 h-48 bg-gray-200 mx-auto">
                  {/* TODO: Display actual QR code */}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Enter Verification Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                  />
                  <Button onClick={handleVerify2FA}>Verify</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Security
          </CardTitle>
          <CardDescription>
            Manage your password and view password history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Last Password Change</p>
              <p className="text-sm text-gray-500">
                {lastPasswordChange?.toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline">Change Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Management
          </CardTitle>
          <CardDescription>
            View and manage devices that are currently signed in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock device data */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Chrome on MacOS</p>
                <p className="text-sm text-gray-500">Last active: Just now</p>
              </div>
              <Button variant="outline" size="sm">Sign Out</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Safari on iPhone</p>
                <p className="text-sm text-gray-500">Last active: 2 hours ago</p>
              </div>
              <Button variant="outline" size="sm">Sign Out</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Security Recommendations</AlertTitle>
        <AlertDescription>
          Enable two-factor authentication and use a strong, unique password to better protect your account.
        </AlertDescription>
      </Alert>
    </div>
  );
} 