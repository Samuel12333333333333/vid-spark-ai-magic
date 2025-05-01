import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/components/landing/Footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Cookie Policy | SmartVid AI Video Generator</title>
        <meta name="description" content="Cookie policy for SmartVid - the AI-powered video generation platform. Learn how we use cookies and similar technologies to enhance your experience." />
        <meta name="keywords" content="SmartVid cookies, video generator cookies policy, website cookies, tracking technologies" />
        <meta property="og:title" content="Cookie Policy | SmartVid" />
        <meta property="og:description" content="Cookie policy for SmartVid - the AI-powered video generation platform." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://smartvid.ai/cookies" />
        <link rel="canonical" href="https://smartvid.ai/cookies" />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Cookie Policy</h1>
        
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Last Updated: April 20, 2025
          </p>
          
          <p className="mb-6">
            This Cookie Policy explains how SmartVid ("we," "our," or "us") uses cookies and similar technologies to recognize and remember you when you visit our website and use our services. This policy is designed to help you understand what cookies are, how we use them, and the choices you have regarding their use.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">1. What Are Cookies?</h2>
          <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners. Cookies can be "persistent" or "session" cookies:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Persistent cookies</strong> remain on your device after you close your browser until they expire or are deleted.</li>
            <li><strong>Session cookies</strong> are temporary and are deleted from your device once you close your browser.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">2. How We Use Cookies</h2>
          <p>We use cookies for several reasons:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You may not opt-out of these cookies.</li>
            <li><strong>Functionality Cookies:</strong> These cookies allow us to remember choices you make (such as your username, language, or the region you are in) and provide enhanced, personalized features.</li>
            <li><strong>Performance/Analytics Cookies:</strong> These cookies collect information about how you use our website, such as which pages you visit most often and if you receive error messages. They help us improve how our website works and understand user behavior.</li>
            <li><strong>Targeting/Advertising Cookies:</strong> These cookies are used to deliver advertisements more relevant to you and your interests. They may also be used to limit the number of times you see an advertisement and measure the effectiveness of advertising campaigns.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">3. Specific Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 mb-6">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left bg-gray-100 dark:bg-gray-800">Category</th>
                  <th className="py-3 px-4 text-left bg-gray-100 dark:bg-gray-800">Name</th>
                  <th className="py-3 px-4 text-left bg-gray-100 dark:bg-gray-800">Purpose</th>
                  <th className="py-3 px-4 text-left bg-gray-100 dark:bg-gray-800">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="py-2 px-4">Essential</td>
                  <td className="py-2 px-4">auth-token</td>
                  <td className="py-2 px-4">Used to maintain your authentication state</td>
                  <td className="py-2 px-4">Session</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Essential</td>
                  <td className="py-2 px-4">supabase-auth</td>
                  <td className="py-2 px-4">Used for user authentication with our database</td>
                  <td className="py-2 px-4">1 year</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Functionality</td>
                  <td className="py-2 px-4">theme-preference</td>
                  <td className="py-2 px-4">Remembers your dark/light mode preference</td>
                  <td className="py-2 px-4">1 year</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Functionality</td>
                  <td className="py-2 px-4">language-setting</td>
                  <td className="py-2 px-4">Saves your language preference</td>
                  <td className="py-2 px-4">1 year</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Analytics</td>
                  <td className="py-2 px-4">_ga</td>
                  <td className="py-2 px-4">Google Analytics cookie used to distinguish users</td>
                  <td className="py-2 px-4">2 years</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Analytics</td>
                  <td className="py-2 px-4">_gid</td>
                  <td className="py-2 px-4">Google Analytics cookie used to distinguish users</td>
                  <td className="py-2 px-4">24 hours</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Advertising</td>
                  <td className="py-2 px-4">_fbp</td>
                  <td className="py-2 px-4">Facebook pixel cookie for marketing purposes</td>
                  <td className="py-2 px-4">3 months</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">4. Third-Party Cookies</h2>
          <p>In addition to our own cookies, we may also use various third-party cookies to report usage statistics, deliver advertisements, and so on. These cookies may include:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Analytics cookies</strong> from services like Google Analytics to help us understand how visitors use our site.</li>
            <li><strong>Social media cookies</strong> from platforms like Facebook, Twitter, and LinkedIn to enable social sharing functionality.</li>
            <li><strong>Advertising cookies</strong> from our marketing partners to help deliver relevant advertisements.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">5. Other Tracking Technologies</h2>
          <p>In addition to cookies, we may also use other similar technologies to track your activity on our website:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Web Beacons:</strong> Small graphic files (also known as &quot;pixel tags&quot; or &quot;clear GIFs&quot;) that can be embedded in webpages and emails to track user behavior and collect data.</li>
            <li><strong>Local Storage Objects:</strong> HTML5 local storage that allows websites to store information locally on your device.</li>
            <li><strong>Device Fingerprinting:</strong> Collecting information about your device, such as your browser type, operating system, and installed plugins, to identify your device over time.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">6. Managing Cookies</h2>
          <p>Most web browsers allow you to control cookies through their settings. Here&apos;s how to manage cookies in the most popular browsers:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Google Chrome:</strong> Click the three dots in the top right corner, then &quot;Settings&quot; &gt; &quot;Privacy and security&quot; &gt; &quot;Cookies and other site data&quot;.</li>
            <li><strong>Mozilla Firefox:</strong> Click the three lines in the top right corner, then &quot;Options&quot; &gt; &quot;Privacy &amp; Security&quot; &gt; &quot;Cookies and Site Data&quot;.</li>
            <li><strong>Safari:</strong> Click &quot;Safari&quot; in the menu bar, then &quot;Preferences&quot; &gt; &quot;Privacy&quot;.</li>
            <li><strong>Microsoft Edge:</strong> Click the three dots in the top right corner, then &quot;Settings&quot; &gt; &quot;Cookies and site permissions&quot; &gt; &quot;Cookies and site data&quot;.</li>
          </ul>
          <p>Please note that restricting cookies may impact the functionality of our website and services.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">7. Cookie Consent</h2>
          <p>When you first visit our website, we may ask for your consent to set cookies through a cookie banner. You can change your cookie preferences at any time by clicking on the &quot;Cookie Settings&quot; link in the footer of our website.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">8. Updates to This Cookie Policy</h2>
          <p>We may update this Cookie Policy from time to time. The updated version will be indicated by an updated &quot;Last Updated&quot; date at the top of this page. We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">9. Contact Us</h2>
          <p>If you have any questions about our use of cookies or this Cookie Policy, please contact us at: privacy@smartvid.ai</p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
