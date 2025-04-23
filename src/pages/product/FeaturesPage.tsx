
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Features | SmartVid AI Video Generator</title>
        <meta name="description" content="Explore SmartVid's powerful features for AI video generation. Transform text into stunning videos with our cutting-edge technology." />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Features
        </h1>
        
        <p className="text-xl text-center text-gray-700 dark:text-gray-300 mb-12">
          Discover how SmartVid helps you create stunning videos in minutes
        </p>

        {/* Feature grid - placeholder content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Feature {i}</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Coming soon... This feature section is under development.
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link to="/register">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
