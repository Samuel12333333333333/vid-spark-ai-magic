
import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Use Cases | SmartVid AI Video Generator</title>
        <meta name="description" content="Explore how different industries and professionals use SmartVid to create engaging videos. Perfect for content creators, marketers, educators, and businesses." />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Use Cases
        </h1>
        
        <div className="text-center mb-12">
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Coming soon... Our use cases page is under development.
          </p>
        </div>
      </div>
    </div>
  );
}
