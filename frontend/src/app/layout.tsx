import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { GlobalErrorBoundary } from '@/components/layout/GlobalErrorBoundary';
import { homeFontVars } from '@/components/home/fonts';

export const metadata: Metadata = {
  title: 'JustLpuThings | Academic Material Management',
  description: 'A dedicated platform prioritizing academic progression.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  }
};

import { MainLayoutWrapper } from '@/components/layout/MainLayoutWrapper';
import { Toaster } from '@/components/ui/sonner';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { AuthModal } from '@/components/auth/AuthModal';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${homeFontVars} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          <GlobalErrorBoundary>
            <TopNavbar />
            <AuthModal />
            <MainLayoutWrapper>
              {children}
            </MainLayoutWrapper>
            <Toaster position="top-center" richColors />
          </GlobalErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
