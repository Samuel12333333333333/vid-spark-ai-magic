
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/components/landing/Footer';
import { Link } from 'react-router-dom';

export default function SitemapPage() {
  const siteStructure = [
    {
      section: "Main Pages",
      links: [
        { path: "/", title: "Home Page" },
        { path: "/auth", title: "Sign In / Sign Up" },
        { path: "/about", title: "About Us" },
        { path: "/contact", title: "Contact Us" },
      ]
    },
    {
      section: "Legal Pages",
      links: [
        { path: "/terms", title: "Terms of Service" },
        { path: "/privacy", title: "Privacy Policy" },
        { path: "/cookies", title: "Cookie Policy" },
      ]
    },
    {
      section: "Dashboard (Authenticated)",
      links: [
        { path: "/dashboard", title: "Dashboard Home" },
        { path: "/dashboard/videos", title: "My Videos" },
        { path: "/dashboard/generator", title: "Video Generator" },
        { path: "/dashboard/templates", title: "Templates" },
        { path: "/dashboard/scripts", title: "Scripts / Captions" },
        { path: "/dashboard/brand-kit", title: "Brand Kit" },
        { path: "/dashboard/settings", title: "Account Settings" },
        { path: "/dashboard/upgrade", title: "Upgrade Plan" },
      ]
    },
    {
      section: "Resources",
      links: [
        { path: "/blog", title: "Blog" },
        { path: "/help", title: "Help Center" },
        { path: "/api-docs", title: "API Documentation" },
        { path: "/community", title: "Community Forum" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Sitemap | SmartVid AI Video Generator</title>
        <meta name="description" content="Navigate all pages and resources on SmartVid - the AI-powered video generation platform." />
        <meta name="keywords" content="SmartVid sitemap, video generator navigation, all SmartVid pages, website map" />
        <meta name="robots" content="noindex, follow" />
        <meta property="og:title" content="Sitemap | SmartVid" />
        <meta property="og:description" content="Navigate all pages and resources on SmartVid." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://smartvid.ai/sitemap" />
        <link rel="canonical" href="https://smartvid.ai/sitemap" />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Website Sitemap</h1>
        
        <div className="max-w-3xl mx-auto mb-12">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            A complete map of all pages and resources available on SmartVid. Use this to navigate quickly to any part of our website.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {siteStructure.map((section, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-850 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                {section.section}
              </h2>
              
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex} className="transition-colors">
                    <Link 
                      to={link.path} 
                      className="text-gray-700 hover:text-smartvid-600 dark:text-gray-300 dark:hover:text-smartvid-400 flex items-center"
                    >
                      <svg className="w-3 h-3 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* XML Sitemap Section */}
        <div className="mt-16 p-6 bg-gray-100 dark:bg-gray-850 rounded-lg max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">XML Sitemap</h2>
          
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            For search engines and web crawlers, our XML sitemap is available at:
          </p>
          
          <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded font-mono text-sm mb-4 overflow-x-auto">
            <code className="text-gray-800 dark:text-gray-200">https://smartvid.ai/sitemap.xml</code>
          </div>
          
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <svg className="w-5 h-5 mr-2 text-smartvid-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Our sitemap is automatically updated daily and follows the <a href="https://www.sitemaps.org/protocol.html" target="_blank" rel="noopener noreferrer" className="text-smartvid-600 dark:text-smartvid-400 hover:underline">Sitemaps XML protocol</a>.</span>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
