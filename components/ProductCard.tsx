'use client';

import { useState } from 'react';
import Link from 'next/link';
import LazyImage from './LazyImage';
import { useCart } from '@/context/CartContext';

// Map common color names to hex values for swatches
const COLOR_MAP: Record<string, string> = {
  black: '#000000', white: '#FFFFFF', red: '#EF4444', blue: '#3B82F6',
  navy: '#1E3A5F', green: '#22C55E', yellow: '#EAB308', orange: '#F97316',
  pink: '#EC4899', purple: '#A855F7', brown: '#92400E', beige: '#D4C5A9',
  grey: '#6B7280', gray: '#6B7280', cream: '#FFFDD0', teal: '#14B8A6',
  maroon: '#800000', coral: '#FF7F50', burgundy: '#800020', olive: '#808000',
  tan: '#D2B48C', khaki: '#C3B091', charcoal: '#36454F', ivory: '#FFFFF0',
  gold: '#FFD700', silver: '#C0C0C0', rose: '#FF007F', lavender: '#E6E6FA',
  mint: '#98FB98', peach: '#FFDAB9', wine: '#722F37', denim: '#1560BD',
  nude: '#E3BC9A', camel: '#C19A6B', sage: '#BCB88A', rust: '#B7410E',
  mustard: '#FFDB58', plum: '#8E4585', lilac: '#C8A2C8', stone: '#928E85',
  sand: '#C2B280', taupe: '#483C32', mauve: '#E0B0FF', sky: '#87CEEB',
  forest: '#228B22', cobalt: '#0047AB', emerald: '#50C878', scarlet: '#FF2400',
  aqua: '#00FFFF', turquoise: '#40E0D0', indigo: '#4B0082', crimson: '#DC143C',
  magenta: '#FF00FF', cyan: '#00FFFF', chocolate: '#7B3F00', coffee: '#6F4E37',
};

export function getColorHex(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  // Try partial match (e.g. "Light Blue" -> "blue")
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export interface ColorVariant {
  name: string;
  hex: string;
}

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
  maxStock?: number;
  moq?: number;
  hasVariants?: boolean;
  minVariantPrice?: number;
  colorVariants?: ColorVariant[];
}

export default function ProductCard({
  id,
  slug,
  name,
  price,
  originalPrice,
  image,
  rating = 5,
  reviewCount = 0,
  badge,
  inStock = true,
  maxStock = 50,
  moq = 1,
  hasVariants = false,
  minVariantPrice,
  colorVariants = []
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const displayPrice = hasVariants && minVariantPrice ? minVariantPrice : price;
  const discount = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  const MAX_SWATCHES = 5;

  const formatPrice = (val: number) => `GH\u20B5${val.toFixed(2)}`;

  return (
    <div className="group flex flex-col h-full bg-transparent transition-all duration-300">
      <Link href={`/product/${slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#F4F4F4] mb-4">
        <LazyImage
          src={image}
          alt={name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
          {badge && (
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
              {badge}
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium tracking-wide shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover Actions */}
        {inStock && (
          <div className="absolute bottom-3 left-3 right-3 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 lg:translate-y-2 lg:group-hover:translate-y-0 z-20">
            {hasVariants ? (
              <span className="w-full bg-[#0a1536] text-white hover:bg-black py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center space-x-2 shadow-lg transition-colors">
                <span>Configure</span>
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToCart({ id, name, price, image, quantity: moq, slug, maxStock, moq });
                }}
                className="w-full bg-[#0a1536] text-white hover:bg-black py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center space-x-2 shadow-lg transition-colors"
              >
                <i className="ri-shopping-cart-2-line text-base"></i>
                <span>{moq > 1 ? `Add ${moq}` : 'Quick Add'}</span>
              </button>
            )}
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-grow text-left">
        <Link href={`/product/${slug}`}>
          <h3 className="font-serif text-[17px] leading-snug text-[#2b3a69] mb-1.5 hover:text-blue-800 transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>

        {colorVariants.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 mt-0.5">
            {colorVariants.slice(0, MAX_SWATCHES).map((color) => (
              <button
                key={color.name}
                title={color.name}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveColor(activeColor === color.name ? null : color.name);
                }}
                className={`w-4 h-4 rounded-full border transition-all duration-300 flex-shrink-0 relative ${activeColor === color.name
                    ? 'ring-1 ring-offset-2 ring-gray-900 scale-110'
                    : 'hover:scale-110 ring-1 ring-transparent hover:ring-gray-300 hover:ring-offset-1'
                  } ${color.hex === '#FFFFFF' ? 'border-gray-200' : 'border-transparent'}`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {colorVariants.length > MAX_SWATCHES && (
              <span className="text-[11px] text-gray-500 font-medium ml-1">+{colorVariants.length - MAX_SWATCHES}</span>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2.5 mt-auto">
          {hasVariants && minVariantPrice ? (
            <span className="text-gray-900 font-bold text-[15px] tracking-tight">From {formatPrice(minVariantPrice)}</span>
          ) : (
            <span className="text-gray-900 font-bold text-[15px] tracking-tight">{formatPrice(price)}</span>
          )}
          {originalPrice && (
            <span className="text-[13px] text-gray-500 line-through decoration-gray-300">{formatPrice(originalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
