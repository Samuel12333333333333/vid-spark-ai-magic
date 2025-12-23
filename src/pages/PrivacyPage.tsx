import React from 'react';
import SEOMetadata from '@/components/SEOMetadata';

export default function PrivacyPage() {
  return (
    <>
      <SEOMetadata
        title="Privacy Policy"
        description="Privacy policy for Smart Videofy - the AI-powered video generation platform. Learn how we collect, use, and protect your personal information."
        keywords="Smart Videofy privacy, video generator privacy, AI video privacy policy, data protection Smart Videofy"
        canonicalUrl="/privacy"
        ogType="website"
      />

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p className="text-lg text-muted-foreground mb-6">
            Last Updated: April 20, 2025
          </p>
          
          <p className="mb-6">
            This Privacy Policy describes how Smart Videofy ("we," "our," or "us") collects, uses, and shares information about you when you use our website, mobile application, and any other services we provide (collectively, the "Services"). Please read this Privacy Policy carefully to understand our practices regarding your information.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">1. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-3 mt-6">1.1 Information You Provide</h3>
          <p>We may collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, password, and any other information you choose to provide.</li>
            <li><strong>Payment Information:</strong> If you subscribe to a paid service, we collect payment details, billing address, and other information necessary to process your payment. Payment information is processed by our payment providers.</li>
            <li><strong>User Content:</strong> We collect information you provide when using our Services, such as text prompts, uploaded media, and customization preferences for your video projects.</li>
            <li><strong>Communications:</strong> If you contact us, we may collect and store your name, contact information, message content, and any other information you provide.</li>
          </ul>
          
          <h3 className="text-xl font-semibold mb-3 mt-6">1.2 Information We Collect Automatically</h3>
          <p>When you use our Services, we automatically collect certain information, including:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Device Information:</strong> We collect information about the device you use to access our Services, including hardware model, operating system, browser type, IP address, and mobile network information.</li>
            <li><strong>Usage Information:</strong> We collect information about your use of our Services, such as the features you use, content you view, and the actions you take.</li>
            <li><strong>Log Information:</strong> We collect log information when you use our Services, including access times, pages viewed, system activity, hardware settings, and the webpage you visited before navigating to our Services.</li>
            <li><strong>Cookies and Similar Technologies:</strong> We and our service providers use cookies, web beacons, and similar technologies to track your use of our Services and collect information about you.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">2. How We Use Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Provide, maintain, and improve our Services</li>
            <li>Process transactions and send related information</li>
            <li>Generate AI videos based on your prompts and preferences</li>
            <li>Send technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Develop new products and services</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            <li>Personalize and improve your experience</li>
            <li>Facilitate contests, sweepstakes, and promotions</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">3. How We Share Information</h2>
          <p>We may share information about you as follows:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Service Providers:</strong> We share information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
            <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, financing, reorganization, bankruptcy, or sale of assets, your information may be transferred as part of that transaction.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if we believe that disclosure is necessary to comply with any applicable law, regulation, legal process, or governmental request.</li>
            <li><strong>Protection of Rights:</strong> We may share information to protect the rights, property, and safety of Smart Videofy, our users, or others.</li>
            <li><strong>With Your Consent:</strong> We may share information with your consent or at your direction.</li>
          </ul>
          
          <h3 className="text-xl font-semibold mb-3 mt-6">3.1 API Services and Integrations</h3>
          <p>Our Services integrate with third-party APIs to provide functionality, including:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>AI Services:</strong> We use Google's Gemini API to process text prompts and generate creative content.</li>
            <li><strong>Media Libraries:</strong> We connect to Pexels API to access stock videos and images for your projects.</li>
            <li><strong>Video Rendering:</strong> We utilize Shotstack API for video rendering and processing.</li>
            <li><strong>Audio Generation:</strong> We use ElevenLabs API for voice generation and narration.</li>
          </ul>
          <p>When you use these features, relevant information may be shared with these services to process your requests. Each third-party service is governed by its own privacy policy and terms.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">4. AI Data Usage and Retention</h2>
          <p>Our AI video generation service processes your prompts and preferences to create customized content. Regarding your AI-related data:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>We may retain your prompts and generated content to improve our Services</li>
            <li>Your text prompts may be used to train our AI systems, but will not be shared publicly without your consent</li>
            <li>We implement measures to protect sensitive or personal information contained in prompts</li>
            <li>You can request deletion of your AI-generated content by contacting our support team</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">5. Your Choices</h2>
          <p>You have several choices regarding the information we collect and how it's used:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Account Information:</strong> You may update, correct, or delete your account information at any time by logging into your account settings.</li>
            <li><strong>Cookies:</strong> Most web browsers are set to accept cookies by default. You can usually set your browser to remove or reject cookies, but this may affect the availability and functionality of our Services.</li>
            <li><strong>Promotional Communications:</strong> You may opt out of receiving promotional emails from us by following the instructions in those emails. If you opt out, we may still send you transactional or relationship messages.</li>
            <li><strong>Data Access and Portability:</strong> In some jurisdictions, you have the right to request access to and receive a copy of certain information we hold about you.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">6. Data Security</h2>
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our databases.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">7. Children's Privacy</h2>
          <p>Our Services are not directed to children under 13, and we do not knowingly collect personal information from children under 13. If we learn we have collected personal information from a child under 13, we will delete this information.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">8. International Data Transfers</h2>
          <p>We are based in the United States and process and store information in the U.S. and other countries. If you are located outside the United States, we may transfer, store, and process your information in countries that may not have the same data protection laws as your jurisdiction.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">9. Changes to this Privacy Policy</h2>
          <p>We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, providing you with additional notice (such as adding a statement to our website or sending you a notification).</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at: privacy@smartvideofy.com</p>
        </div>
      </div>
    </>
  );
}
