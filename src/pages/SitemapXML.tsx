
import React from 'react';
import { useLocation } from 'react-router-dom';

// Helper function to format date in YYYY-MM-DD format
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Define the page structure with SEO properties
const pages = [
  // Main pages
  { path: "/", priority: 1.0, changefreq: "weekly", lastmod: new Date() },
  { path: "/product", priority: 0.9, changefreq: "monthly", lastmod: new Date() },
  { path: "/features", priority: 0.9, changefreq: "monthly", lastmod: new Date() },
  { path: "/pricing", priority: 0.8, changefreq: "monthly", lastmod: new Date() },
  { path: "/contact", priority: 0.8, changefreq: "monthly", lastmod: new Date() },
  { path: "/about", priority: 0.7, changefreq: "monthly", lastmod: new Date() },
  { path: "/templates", priority: 0.9, changefreq: "weekly", lastmod: new Date() },
  
  // Product pages
  { path: "/integrations", priority: 0.8, changefreq: "monthly", lastmod: new Date() },
  { path: "/use-cases", priority: 0.8, changefreq: "monthly", lastmod: new Date() },
  
  // Resources pages
  { path: "/blog", priority: 0.8, changefreq: "weekly", lastmod: new Date() },
  { path: "/help", priority: 0.7, changefreq: "monthly", lastmod: new Date() },
  { path: "/community", priority: 0.7, changefreq: "monthly", lastmod: new Date() },
  { path: "/api-docs", priority: 0.6, changefreq: "monthly", lastmod: new Date() },
  
  // Company pages
  { path: "/careers", priority: 0.6, changefreq: "monthly", lastmod: new Date() },
  
  // Legal pages
  { path: "/privacy", priority: 0.5, changefreq: "yearly", lastmod: new Date() },
  { path: "/terms", priority: 0.5, changefreq: "yearly", lastmod: new Date() },
  { path: "/cookies", priority: 0.5, changefreq: "yearly", lastmod: new Date() },
  
  // HTML Sitemap
  { path: "/sitemap", priority: 0.3, changefreq: "monthly", lastmod: new Date() },
];

export default function SitemapXML() {
  const location = useLocation();
  const baseUrl = "https://smartvideofy.com"; // Replace with your actual domain

  // Generate the XML content
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${formatDate(page.lastmod)}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Set appropriate content type and return the XML
  // This won't actually work in React Router, but we'll handle it with a special route
  return (
    <pre>{xml}</pre>
  );
}
