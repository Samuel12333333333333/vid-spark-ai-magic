
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/components/landing/Footer';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Blog | SmartVid AI Video Generator</title>
        <meta name="description" content="Read the latest articles about video creation, AI technology, and content marketing tips from the SmartVid team." />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Blog
        </h1>
        
        <div className="text-center mb-12">
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Coming soon... Our blog is under development.
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
