import { Inter } from 'next/font/google';
import { Providers } from '@/providers';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';
import ClientNavbar from '@/components/ClientNavbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'EgSeekers - Freelance Platform',
  description: 'Connect with skilled freelancers and find great work',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <ClientNavbar />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
