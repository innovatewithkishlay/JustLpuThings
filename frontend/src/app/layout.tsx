import type { Metadata } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';
import { GlobalErrorBoundary } from '@/components/layout/GlobalErrorBoundary';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-heading',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'JustLpuThings | Academic Material Management',
  description: 'A dedicated platform prioritizing academic progression.',
};

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
      <body className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          <GlobalErrorBoundary>
            <TopNavbar />
            <AuthModal />
            <main className="min-h-screen pt-[112px]">
              {children}
            </main>
            <Toaster position="top-center" richColors />
          </GlobalErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
