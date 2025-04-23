
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PricingSection } from '@/components/landing/PricingSection';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Pricing | SmartVid AI Video Generator</title>
        <meta name="description" content="Choose the perfect plan for your video creation needs. Flexible pricing options for individuals, teams, and enterprises." />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Pricing Plans
        </h1>
        
        <p className="text-xl text-center text-gray-700 dark:text-gray-300 mb-12">
          Choose the plan that's right for you
        </p>

        <PricingSection />
      </div>
    </div>
  );
}
