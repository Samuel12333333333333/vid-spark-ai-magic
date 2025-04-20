
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success("Your message has been sent! We'll get back to you soon.");
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Contact Us | SmartVid AI Video Generator</title>
        <meta name="description" content="Get in touch with the SmartVid team. We're here to answer your questions about our AI-powered video generation platform." />
        <meta name="keywords" content="SmartVid contact, video generator support, AI video help, contact SmartVid team" />
        <meta property="og:title" content="Contact Us | SmartVid" />
        <meta property="og:description" content="Get in touch with the SmartVid team. We're here to answer your questions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://smartvid.ai/contact" />
        <link rel="canonical" href="https://smartvid.ai/contact" />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-900 dark:text-white">Contact Us</h1>
        
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Have questions, feedback, or need assistance? We're here to help!
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-50 dark:bg-gray-850 p-6 rounded-lg text-center shadow-sm">
            <div className="mb-4 mx-auto w-12 h-12 flex items-center justify-center bg-smartvid-100 dark:bg-smartvid-900/30 text-smartvid-600 dark:text-smartvid-400 rounded-full">
              <Mail size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Email</h3>
            <p className="text-gray-700 dark:text-gray-300">support@smartvid.ai</p>
            <p className="text-gray-700 dark:text-gray-300">partnerships@smartvid.ai</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-850 p-6 rounded-lg text-center shadow-sm">
            <div className="mb-4 mx-auto w-12 h-12 flex items-center justify-center bg-smartvid-100 dark:bg-smartvid-900/30 text-smartvid-600 dark:text-smartvid-400 rounded-full">
              <Phone size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Phone</h3>
            <p className="text-gray-700 dark:text-gray-300">+1 (555) 123-4567</p>
            <p className="text-gray-700 dark:text-gray-300">Mon-Fri: 9AM-5PM EST</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-850 p-6 rounded-lg text-center shadow-sm">
            <div className="mb-4 mx-auto w-12 h-12 flex items-center justify-center bg-smartvid-100 dark:bg-smartvid-900/30 text-smartvid-600 dark:text-smartvid-400 rounded-full">
              <MapPin size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Location</h3>
            <p className="text-gray-700 dark:text-gray-300">123 Innovation Drive</p>
            <p className="text-gray-700 dark:text-gray-300">San Francisco, CA 94103</p>
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-850 rounded-xl p-8 shadow-md max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Send Us a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help you?"
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please describe your question or feedback..."
                required
                className="w-full min-h-[150px]"
              />
            </div>
            
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">How quickly can I generate videos?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Most videos are generated within 1-5 minutes, depending on length and complexity. You'll receive a notification when your video is ready.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Can I use the videos commercially?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Yes! All videos created on paid plans can be used for commercial purposes. Free plan videos are for personal use only.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Do you offer refunds?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                We offer a 7-day money-back guarantee on all new subscriptions if you're not satisfied with our service.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">How do I get support?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                You can reach our support team via email, this contact form, or through the chat widget in the dashboard when logged in.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
