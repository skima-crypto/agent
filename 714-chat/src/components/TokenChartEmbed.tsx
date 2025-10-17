'use client';

import { useEffect, useRef } from 'react';

interface TokenChartEmbedProps {
  slug?: string;
  address?: string;
}

export default function TokenChartEmbed({ slug, address }: TokenChartEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = `https://coinmarketcap.com/currencies/${slug ?? address}/?embed=true&range=7d`;
    iframe.width = '100%';
    iframe.height = '480';
    iframe.style.border = 'none';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.sandbox.add(
      'allow-scripts',
      'allow-same-origin',
      'allow-popups',
      'allow-forms'
    );

    containerRef.current.appendChild(iframe);
  }, [slug, address]);

  return (
    <div
      ref={containerRef}
      className="rounded-2xl overflow-hidden shadow-md border border-zinc-700/50"
    />
  );
}
