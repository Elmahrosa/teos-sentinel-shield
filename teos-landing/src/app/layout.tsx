import type { Metadata } from 'next';
import { Space_Mono, Syne } from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
});

const SITE_URL = 'https://teos-landing-seven.vercel.app';
const SITE_NAME = 'TEOS Sentinel';
const DESCRIPTION = 'Runtime security infrastructure for AI-generated code. Deterministic pre-execution enforcement between AI generation and real-world execution.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TEOS Sentinel — Runtime Security Infrastructure for AI Execution',
    template: '%s | TEOS Sentinel',
  },
  description: DESCRIPTION,
  keywords: ['AI security', 'runtime security', 'pre-execution', 'AI governance', 'cybersecurity', 'execution control', 'deterministic security', 'enforcement engine'],
  authors: [{ name: 'Elmahrosa International' }],
  creator: 'Elmahrosa International',
  publisher: 'Elmahrosa International',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    title: 'TEOS Sentinel — Runtime Security Infrastructure for AI Execution',
    description: DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'TEOS Sentinel — AI Execution Firewall',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEOS Sentinel — Runtime Security Infrastructure for AI Execution',
    description: DESCRIPTION,
    images: ['/opengraph-image.png'],
    creator: '@king_teos',
    site: '@king_teos',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add when available
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${spaceMono.variable}`}>
      <head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="alternate icon" href="/favicon.ico" sizes="any" />
          <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
