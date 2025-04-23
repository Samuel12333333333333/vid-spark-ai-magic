
import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Community | SmartVid AI Video Generator</title>
        <meta name="description" content="Join the SmartVid community. Connect with other creators, share tips, and get inspired." />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Community
        </h1>
        
        <div className="text-center mb-12">
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Coming soon... Our community page is under development.
          </p>
        </div>
      </div>
    </div>
  );
}
