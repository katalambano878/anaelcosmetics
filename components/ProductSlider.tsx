'use client';

import { useEffect, useState } from 'react';
import ProductCard, { type ColorVariant } from '@/components/ProductCard';

export interface SliderProduct {
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

interface ProductSliderProps {
  products: SliderProduct[];
  autoPlayInterval?: number;
  fadeColor?: 'white' | 'stone-50';
}

function getItemsPerView(width: number): number {
  if (width < 640) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  return 4;
}

export default function ProductSlider({
  products,
  autoPlayInterval = 4000,
  fadeColor = 'white',
}: ProductSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isPaused, setIsPaused] = useState(false);

  const fadeFrom = fadeColor === 'stone-50' ? 'from-stone-50' : 'from-white';

  useEffect(() => {
    const updateItemsPerView = () => setItemsPerView(getItemsPerView(window.innerWidth));
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, products.length - itemsPerView);
  const slideCount = maxIndex + 1;
  const canSlide = products.length > itemsPerView;

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (!canSlide || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [canSlide, isPaused, maxIndex, autoPlayInterval]);

  if (products.length === 0) return null;

  const gridClass =
    'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8';

  if (!canSlide) {
    return (
      <div className={gridClass}>
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r ${fadeFrom} to-transparent sm:w-12`} />
      <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l ${fadeFrom} to-transparent sm:w-12`} />

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            width: `${(products.length / itemsPerView) * 100}%`,
            transform: `translateX(-${(currentIndex / products.length) * 100}%)`,
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 px-3"
              style={{ width: `${100 / products.length}%` }}
            >
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-2">
        {Array.from({ length: slideCount }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              currentIndex === index
                ? 'w-8 bg-gray-900'
                : 'w-1.5 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
