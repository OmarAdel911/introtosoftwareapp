'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  BarChart,
  Briefcase,
  CreditCard,
  MessageSquare,
  AlertCircle,
  ScrollText
} from 'lucide-react';
import { clearAuthData } from '@/lib/clear-auth';
import { config } from '@/config/env';


interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  image?: string | null;
}

// Configure axios defaults
const API_BASE_URL = config.apiUrl;
axios.defaults.baseURL = API_BASE_URL;

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('adminUser');
      // Remove authorization header
      delete axios.defaults.headers.common['Authorization'];
      // Show error message
      toast.error(error.response.data?.error || 'Session expired. Please login again.');
      // Redirect to login only if not already on login page
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Skip authentication check for the login page
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('adminUser');
    
    // Check if token or userData is missing
    if (!token || !userData) {
      console.log('Missing token or userData:', { token: !!token, userData: !!userData });
      toast.error('Please login first');
      router.push('/admin/login');
      setLoading(false);
      return;
    }

    try {
      // Check if userData is a valid JSON string
      if (typeof userData !== 'string' || !userData.trim()) {
        console.error('Invalid userData format:', userData);
        throw new Error('Invalid user data format');
      }

      let parsedUser: User;
      try {
        // Ensure userData is a valid string before parsing
        if (userData === 'undefined' || userData === 'null') {
          throw new Error('Invalid user data value');
        }
        parsedUser = JSON.parse(userData);
        console.log('Parsed user data:', parsedUser);
        
        // Validate user object structure
        if (!parsedUser || typeof parsedUser !== 'object' || !parsedUser.role) {
          console.error('Invalid user object structure:', parsedUser);
          throw new Error('Invalid user data structure');
        }

        if (parsedUser.role !== 'ADMIN') {
          toast.error('Unauthorized access');
          router.push('/');
          return;
        }

        // Set the default authorization header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set user immediately to prevent redirect loop
        setUser(parsedUser);
        
        // Verify token validity with full URL
        axios.get(`${API_BASE_URL}/auth/admin/verify`)
          .then(() => {
            // Token is valid, user is already set
            console.log('Token verified successfully');
          })
          .catch((error) => {
            console.error('Token verification failed:', error);
            // If token is invalid, clear storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('adminUser');
            toast.error(error.response?.data?.error || 'Session expired. Please login again.');
            router.push('/admin/login');
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'userData:', userData);
        throw new Error('Invalid JSON data');
      }
    } catch (error) {
      console.error('Error handling user data:', error);
      // Clear invalid data
      localStorage.removeItem('token');
      localStorage.removeItem('adminUser');
      toast.error('Invalid session data. Please login again.');
      router.push('/admin/login');
      setLoading(false);
    }
  }, [router, pathname]);

  const handleLogout = () => {
    clearAuthData();
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Allow access to login page without authentication
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const navItems = [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart },
      ]
    },
    {
      section: 'Management',
      items: [
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
        { label: 'Contracts', href: '/admin/contracts', icon: FileText },
        { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      ]
    },
    {
      section: 'Support',
      items: [
        { label: 'Tickets', href: '/admin/tickets', icon: MessageSquare },
        { label: 'Reports', href: '/admin/reports', icon: AlertCircle },
      ]
    },
    {
      section: 'System',
      items: [
        { label: 'Settings', href: '/admin/settings', icon: Settings },
        { label: 'Logs', href: '/admin/logs', icon: ScrollText },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-5 px-2 space-y-6">
          {navItems.map((section) => (
            <div key={section.section}>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.section}
              </h3>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Logout button at the bottom */}
          <div className="pt-4 mt-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className={`${isSidebarOpen ? 'lg:ml-64' : ''} transition-margin duration-300 ease-in-out`}>
        <div className="sticky top-0 z-40 bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 rounded-md hover:bg-gray-100 ${isSidebarOpen ? 'hidden' : 'block'}`}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Welcome, {user.firstName || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 