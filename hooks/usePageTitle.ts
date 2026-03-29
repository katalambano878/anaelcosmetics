'use client';

import { useEffect } from 'react';

const SITE_NAME = 'ANAEL';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} | Premium Lip Glosses, Lashes & Makeup Bags`;
  }, [title]);
}
