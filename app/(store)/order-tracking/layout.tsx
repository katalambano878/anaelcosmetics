import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Track Your Order',
  description: 'Track your ANAEL Cosmetics order status.',
  path: '/order-tracking',
  noindex: true,
});

export default function OrderTrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
