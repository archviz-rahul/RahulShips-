import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css'; // Global styles
import { BRAND_CONFIG } from '@/lib/config/brand';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: BRAND_CONFIG.appTitle,
  description: BRAND_CONFIG.description,
  manifest: '/manifest.json',
  openGraph: {
    title: BRAND_CONFIG.openGraph.title,
    description: BRAND_CONFIG.openGraph.description,
    siteName: BRAND_CONFIG.openGraph.siteName,
    type: 'website',
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#0A0A0B] text-gray-200 antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
