import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Careers | SmartVid AI Video Generator</title>
        <meta name="description" content="Join the SmartVid team. Explore career opportunities and help shape the future of AI-powered video creation." />
        <meta property="og:title" content="Careers | SmartVid AI Video Generator" />
        <meta property="og:description" content="Join the SmartVid team. Explore career opportunities and help shape the future of AI-powered video creation." />
        <meta property="og:image" content="https://smartvideofy.com/images/careers-preview.jpg" />
        <meta property="og:url" content="https://smartvideofy.com/careers" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Careers | SmartVid AI Video Generator",
              "description": "Join the SmartVid team. Explore career opportunities and help shape the future of AI-powered video creation.",
              "url": "https://smartvideofy.com/careers"
            }
          `}
        </script>
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Careers at SmartVid
        </h1>
        
        <div className="text-center mb-12">
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Join our team and help shape the future of AI-powered video creation.
          </p>
        </div>

        {/* Open Positions Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-4">Current Openings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Example Job Listing */}
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Developer</h3>
              <p className="text-gray-700 dark:text-gray-300">We are looking for an AI Developer to build next-gen video generation tools.</p>
              <a href="#" className="mt-4 inline-block bg-primary text-white py-2 px-4 rounded-md">Apply Now</a>
            </div>
            
            {/* Add more job listings here */}
          </div>
        </section>

        {/* About Your Company */}
        <section className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Why Work at SmartVid?</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-4">Join a team that is passionate about revolutionizing video creation with AI technology. Enjoy flexible work arrangements, career growth, and a collaborative environment.</p>
        </section>

        {/* CTA - Talent Pool */}
        <section className="text-center mt-12">
          <p className="text-lg text-gray-700 dark:text-gray-300">Don't see the right role? Join our talent pool and stay connected for future opportunities!</p>
          <form className="mt-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
            />
            <button 
              type="submit" 
              className="w-full mt-4 bg-primary text-white py-2 rounded-md"
            >
              Join Talent Pool
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}


