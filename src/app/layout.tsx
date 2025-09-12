import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ClientWrapper from '@/components/ClientWrapper';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Tutor - Personalized Learning with Avatar Companions',
  description: 'Learn anything with AI-powered personalized courses and theme-based avatar companions',
  keywords: ['AI', 'education', 'learning', 'tutor', 'personalized', 'avatar'],
  authors: [{ name: 'AI Tutor Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <ClientWrapper session={session}>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </ClientWrapper>
      </body>
    </html>
  );
}
