import type { Metadata } from 'next';

export const SITE_NAME = 'ANAEL Cosmetics';
export const SITE_SHORT_NAME = 'ANAEL';
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.anaelcosmetics.com').replace(/\/+$/, '');
export const SITE_DESCRIPTION =
  'Shop premium lip glosses, lip liners, lip care, lashes, hair clips and makeup bags at ANAEL Cosmetics. Quality beauty essentials in beautiful shades for every skin tone — based in Accra, Ghana.';
export const SITE_PHONE = '0242853166';
export const SITE_EMAIL = process.env.ADMIN_EMAIL || 'info@doctorbarns.com';
export const SITE_LOCALE = 'en_GH';
export const DEFAULT_OG_IMAGE = '/og-image.png';

export const DEFAULT_KEYWORDS = [
  'ANAEL Cosmetics',
  'Anael cosmetics Ghana',
  'lip gloss Ghana',
  'lip gloss Accra',
  'lip liners Ghana',
  'lip care products',
  'false lashes Ghana',
  'makeup bags Ghana',
  'hair clips Ghana',
  'beauty products Ghana',
  'cosmetics online Ghana',
  'affordable makeup Ghana',
  'buy cosmetics online Accra',
  'Ghana beauty store',
  'makeup shop Ghana',
];

export const SOCIAL_PROFILES = {
  instagram: 'https://instagram.com/anael_cosmeticss',
  tiktok: 'https://www.tiktok.com/@anael_cosmetics',
  snapchat: 'https://www.snapchat.com/add/Hira3166',
};

type PageSeoInput = {
  title: string;
  description?: string;
  path?: string;
  keywords?: readonly string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string;
  author?: string;
};

export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = '/',
  keywords = [],
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  publishedTime,
  author,
}: PageSeoInput): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = title.includes(SITE_SHORT_NAME) ? title : `${title} | ${SITE_SHORT_NAME}`;
  const resolvedOgImage = absoluteUrl(ogImage);
  const mergedKeywords = [...new Set([...keywords, ...DEFAULT_KEYWORDS])];

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: mergedKeywords,
    authors: author ? [{ name: author }] : [{ name: SITE_SHORT_NAME }],
    creator: SITE_SHORT_NAME,
    publisher: SITE_SHORT_NAME,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical },
    openGraph: {
      type: ogType,
      locale: SITE_LOCALE,
      url: canonical,
      title: fullTitle,
      description,
      siteName: SITE_SHORT_NAME,
      images: [{ url: resolvedOgImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [resolvedOgImage],
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };

  if (ogType === 'article' && publishedTime) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime,
    };
  }

  return metadata;
}

export const STATIC_PAGE_SEO = {
  home: {
    title: 'ANAEL Cosmetics — Lip Glosses, Lashes & Beauty Essentials in Ghana',
    description: SITE_DESCRIPTION,
    path: '/',
    keywords: ['ANAEL Cosmetics Ghana', 'shop beauty online Ghana'],
  },
  shop: {
    title: 'Shop All Beauty Products',
    description:
      'Browse lip glosses, lip liners, lip care, lashes, hair clips and makeup bags. Quality cosmetics at affordable prices with delivery across Ghana.',
    path: '/shop',
    keywords: ['shop cosmetics Ghana', 'buy lip gloss online'],
  },
  categories: {
    title: 'Shop by Category',
    description:
      'Explore ANAEL Cosmetics categories — lip glosses, lip liners, lip care and more. Find the perfect beauty essentials for every look.',
    path: '/categories',
    keywords: ['cosmetics categories', 'lip gloss categories Ghana'],
  },
  about: {
    title: 'About ANAEL Cosmetics',
    description:
      'At ANAEL Cosmetics, beauty starts with confidence. Discover our story and our commitment to quality, performance, and affordable luxury.',
    path: '/about',
    keywords: ['about ANAEL Cosmetics', 'Ghana beauty brand'],
  },
  contact: {
    title: 'Contact Us',
    description:
      'Get in touch with ANAEL Cosmetics. Questions about orders, products, or delivery? We are here to help customers across Ghana.',
    path: '/contact',
    keywords: ['contact ANAEL Cosmetics', 'ANAEL customer support'],
  },
  blog: {
    title: 'Beauty Blog & Tips',
    description:
      'Beauty tips, product guides, and the latest trends from ANAEL Cosmetics. Learn how to shop smarter and glow with confidence.',
    path: '/blog',
    keywords: ['beauty blog Ghana', 'makeup tips Ghana'],
  },
  faqs: {
    title: 'Frequently Asked Questions',
    description:
      'Find quick answers about ordering, shipping, returns, payments, and more at ANAEL Cosmetics.',
    path: '/faqs',
    keywords: ['ANAEL FAQs', 'cosmetics shipping Ghana'],
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Read how ANAEL Cosmetics collects, uses, and protects your personal information.',
    path: '/privacy',
  },
  terms: {
    title: 'Terms & Conditions',
    description: 'Terms and conditions for shopping at ANAEL Cosmetics.',
    path: '/terms',
  },
  shipping: {
    title: 'Shipping Information',
    description: 'Delivery options, timelines, and shipping policies for ANAEL Cosmetics orders in Ghana.',
    path: '/shipping',
    keywords: ['cosmetics delivery Ghana', 'ANAEL shipping'],
  },
  returns: {
    title: 'Returns & Refunds',
    description: 'Learn about returns, exchanges, and refund policies at ANAEL Cosmetics.',
    path: '/returns',
    keywords: ['ANAEL returns policy', 'cosmetics refunds Ghana'],
  },
} as const;

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_SHORT_NAME,
    legalName: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/anael-logo.png'),
    description: SITE_DESCRIPTION,
    email: SITE_EMAIL,
    telephone: `+233${SITE_PHONE.replace(/^0/, '')}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Accra',
      addressCountry: 'GH',
    },
    sameAs: Object.values(SOCIAL_PROFILES),
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_SHORT_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { '@type': 'Organization', name: SITE_SHORT_NAME },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: SITE_NAME,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    url: SITE_URL,
    telephone: `+233${SITE_PHONE.replace(/^0/, '')}`,
    priceRange: 'GH₵',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Accra',
      addressCountry: 'GH',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
    sameAs: Object.values(SOCIAL_PROFILES),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productSchema(product: {
  name: string;
  description: string;
  image: string;
  slug: string;
  price: number;
  currency?: string;
  sku?: string;
  inStock?: boolean;
  brand?: string;
  category?: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku || product.slug,
    brand: { '@type': 'Brand', name: product.brand || SITE_SHORT_NAME },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: product.currency || 'GHS',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: SITE_SHORT_NAME },
    },
  };

  if (product.category) schema.category = product.category;
  return schema;
}
