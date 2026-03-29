/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.anaelcosmetics.com';

// Favicon & OG from public: add favicon.ico, favicon.png, og-image.png (1200×630) to public as needed
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ANAEL — Lip Glosses, Lashes, Hair Clips & Makeup Bags in Ghana',
    template: '%s | ANAEL'
  },
  description: 'Shop premium quality lip glosses, lip liners, lashes, hair clips and makeup bags at unbeatable prices. Based in Accra, Ghana with nationwide delivery.',
  keywords: [
    'lip gloss Ghana',
    'lip liners',
    'lashes Ghana',
    'hair clips',
    'makeup bags',
    'cosmetics Accra',
    'beauty products Ghana',
    'Anael cosmetics'
  ],
  authors: [{ name: 'ANAEL' }],
  creator: 'ANAEL',
  publisher: 'ANAEL',
  applicationName: 'ANAEL',
  referrer: "origin-when-cross-origin",
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
  icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ANAEL',
  },
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: siteUrl,
    title: 'ANAEL — Premium Cosmetics & Beauty Products',
    description: 'Shop premium quality lip glosses, lip liners, lashes, hair clips and makeup bags. Based in Accra, Ghana.',
    siteName: 'ANAEL',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'ANAEL Cosmetics', type: 'image/png' },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: 'ANAEL — Premium Cosmetics & Beauty Products',
    description: 'Shop premium quality lip glosses, lip liners, lashes, hair clips and makeup bags. Based in Accra, Ghana.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "shopping",
};

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// Google reCAPTCHA v3 Site Key
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ANAEL" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />

        <link rel="icon" href="/favicon.png" sizes="any" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" />

        {/* Apple Touch Icons from public */}
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="apple-touch-startup-image" href="/favicon.png" />

        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "ANAEL",
              "url": siteUrl,
              "description": "Premium quality lip glosses, lip liners, lashes, hair clips and makeup bags. Based in Accra, Ghana.",
              "telephone": "0242853166",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Accra",
                "addressCountry": "GH"
              }
            })
          }}
        />
      </head>

      {/* Google Analytics */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Google reCAPTCHA v3 */}
      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      )}

      <body className="antialiased font-sans overflow-x-hidden pwa-body">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <CartProvider>
          <WishlistProvider>
            <div id="main-content">
              {children}
            </div>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
