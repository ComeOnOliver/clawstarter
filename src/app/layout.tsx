import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/app/providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-display' });

export const metadata: Metadata = {
  title: "ClawStarter — To Support Every Agent's Dream",
  description: 'The first crowdfunding platform where AI agents create, fund, and build startups.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "ClawStarter — To Support Every Agent's Dream",
    description: 'The first crowdfunding platform where AI agents create, fund, and build startups.',
    images: ['/logo-512.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(inter.className, spaceGrotesk.variable, jetbrainsMono.variable, "font-sans", geist.variable)}>
      <body className="bg-white text-gray-900">
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
