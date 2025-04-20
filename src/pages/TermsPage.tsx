
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/components/landing/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Terms of Service | SmartVid AI Video Generator</title>
        <meta name="description" content="Terms of Service for SmartVid - the AI-powered video generation platform. Learn about our terms, conditions, and usage policies." />
        <meta name="keywords" content="SmartVid terms, video generation terms, AI video terms of service, SmartVid conditions" />
        <meta property="og:title" content="Terms of Service | SmartVid" />
        <meta property="og:description" content="Terms of Service for SmartVid - the AI-powered video generation platform." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://smartvid.ai/terms" />
        <link rel="canonical" href="https://smartvid.ai/terms" />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Last Updated: April 20, 2025
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">1. Introduction</h2>
          <p>Welcome to SmartVid ("we," "our," or "us"). By accessing or using our website, mobile application, or any other services we provide (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms").</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">2. Acceptance of Terms</h2>
          <p>By accessing or using our Services, you confirm that you accept these Terms and agree to comply with them. If you do not agree to these Terms, you must not access or use our Services.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">3. Services Description</h2>
          <p>SmartVid is an AI-powered platform that turns text prompts into short-form videos using AI technology, stock video clips, and other media. Our Services include but are not limited to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Creating videos from text prompts</li>
            <li>Providing stock video clips and audio</li>
            <li>Allowing users to customize and edit generated videos</li>
            <li>Enabling users to download and share generated content</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">4. Account Registration</h2>
          <p>To use certain features of our Services, you may need to create an account. When you create an account, you must provide accurate and complete information. You are solely responsible for the activity that occurs on your account, and you must keep your account password secure.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">5. User Content</h2>
          <p>You retain all rights to any content you submit, post, or display on or through our Services ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such content in connection with providing our Services.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">6. Usage Restrictions</h2>
          <p>When using our Services, you agree not to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Submit content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable</li>
            <li>Attempt to gain unauthorized access to any part of our Services</li>
            <li>Use our Services to generate content that violates intellectual property rights, contains explicit material, or promotes violence or discrimination</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">7. Intellectual Property</h2>
          <p>Our Services and all content, features, and functionality thereof, including but not limited to text, graphics, logos, button icons, images, audio clips, digital downloads, data compilations, software, and code, are the exclusive property of SmartVid or our licensors and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">8. AI-Generated Content Ownership</h2>
          <p>Videos generated through our Services are created by combining your text prompts with AI-generated elements and stock media. The ownership and rights to use these videos are as follows:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>You own the specific videos generated for you through our platform</li>
            <li>You may use generated videos for personal and commercial purposes, subject to the limitations in these Terms</li>
            <li>We retain ownership of the AI technology, algorithms, and underlying systems used to create the videos</li>
            <li>Stock media elements remain subject to their original license terms</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">9. Subscription and Payment</h2>
          <p>We offer subscription plans with different features and limitations. By subscribing to a paid plan, you agree to pay all applicable fees. We reserve the right to change our pricing at any time. Payment processing is subject to the terms of our third-party payment processors.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">10. Termination</h2>
          <p>We may terminate or suspend your account and access to our Services immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Services will immediately cease.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">11. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, in no event shall SmartVid, our directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Services.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">12. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the United States of America, without regard to its conflict of law provisions.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">13. Changes to Terms</h2>
          <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">14. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at: support@smartvid.ai</p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
