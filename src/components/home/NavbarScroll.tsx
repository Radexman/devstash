'use client';

import { useEffect } from 'react';

export function NavbarScroll() {
  useEffect(() => {
    const nav = document.getElementById('home-nav');
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 8) nav.dataset.scrolled = 'true';
      else delete nav.dataset.scrolled;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return null;
}
