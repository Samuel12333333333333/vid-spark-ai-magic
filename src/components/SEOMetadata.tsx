
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOMetadataProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile' | 'book' | 'music.song' | 'music.album' | 'music.playlist' | 'video.movie' | 'video.episode' | 'video.tv_show' | 'video.other';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  noIndex?: boolean;
}

export default function SEOMetadata({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = 'https://smartvideo.ai/opengraph-image.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false
}: SEOMetadataProps) {
  const getCanonicalUrl = () => {
    if (canonicalUrl?.startsWith('http')) return canonicalUrl;
    if (canonicalUrl) return `https://smartvideo.ai${canonicalUrl}`;
    
    // Avoid window usage if not client-side
    if (typeof window !== 'undefined') {
      return `https://smartvideo.ai${window.location.pathname}`;
    }
    
    // Safe fallback
    return 'https://smartvideo.ai';
  };

  const fullCanonicalUrl = getCanonicalUrl();

  return (
    <Helmet>
      <title>{`${title} | Smart Video - AI Video Creator`}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Indexing control */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
