'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/ui/navbar';
import { useEffect, useState } from 'react';

export default function ClientNavbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  
  // Don't render the navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  return <Navbar />;
} 