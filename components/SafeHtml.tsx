'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useMemo } from 'react';

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
  /** HTML olmayan içerikte fallback metin (örn: AI çıktısı boşsa). */
  fallback?: string;
}

/**
 * AI çıktısını XSS riski olmadan render eder. DOMPurify ile sanitize edilir.
 * `dangerouslySetInnerHTML` doğrudan kullanılan tüm yerlerde bu component tercih edilmelidir.
 *
 * Whitelist: temel formatlama + link + liste. <script>, onclick, javascript: URI bloklanır.
 */
export function SafeHtml({ html, className, fallback }: SafeHtmlProps) {
  const sanitized = useMemo(() => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'b', 'i',
        'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'code', 'pre',
        'a', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      // javascript: ve data: URI'leri bloklar
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):)/i,
    });
  }, [html]);

  if (!sanitized) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
