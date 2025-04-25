import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { Link } from 'react-router-dom';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function ProductOverviewPage() {
  // Benefits data
  const benefits = [
    {
      title: 'Time-saving',
      description: 'Create videos in minutes, not hours. Our AI handles the heavy lifting.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      title: 'Stunning quality',
      description: 'Professional-looking videos powered by high-quality stock footage and transitions.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      )
    },
    {
      title: 'No design skills needed',
      description: 'Just type what you want to say. Our AI handles the visuals, scenes, and flow.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
        </svg>
      )
    },
    {
      title: 'Fully customizable',
      description: 'Fine-tune styles, add your branding, and make each video uniquely yours.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      )
    },
    {
      title: 'Social media ready',
      description: 'Export in multiple formats perfect for any platform from TikTok to LinkedIn.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      )
    },
    {
      title: 'Cost-effective',
      description: 'Eliminate video production costs. Create unlimited videos for a fraction of hiring professionals.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
          <path d="M12 18V6"></path>
        </svg>
      )
    }
  ];

  // How it works steps
  const steps = [
    {
      number: 1,
      title: 'Enter your idea',
      description: 'Write your script or even just a brief idea. Our AI is smart enough to work with both.'
    },
    {
      number: 2,
      title: 'AI processes your content',
      description: 'Our Gemini AI breaks down your text into scenes, selects visuals, and prepares a storyboard.'
    },
    {
      number: 3,
      title: 'Choose your style',
      description: 'Select from various templates or customize the look and feel to match your brand.'
    },
    {
      number: 4,
      title: 'Generate and edit',
      description: 'Our platform automatically creates your video. Fine-tune it if needed.'
    },
    {
      number: 5,
      title: 'Export and share',
      description: 'Download your video in the desired format or share directly to social platforms.'
    }
  ];

  // Use cases
  const useCases = [
    'Marketing videos',
    'Educational content',
    'Social media posts',
    'Product demos',
    'Explainer videos',
    'Promotional content'
  ];

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-950"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Turn Text into<br/>Stunning Videos with AI
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
                SmartVideofy uses artificial intelligence to transform your text into professional-quality videos in minutes, not hours. No design skills required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                  <Link to="/register">Try for Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 font-semibold px-8 py-3 rounded-lg transition-all duration-300">
                  <Link to="/product/demo">Watch Demo</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <ScrollReveal>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">See SmartVideofy in Action</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Watch how quickly and easily you can create professional videos with just text input.
              </p>
            </div>
            <DemoVideo />
          </div>
        </ScrollReveal>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why Choose SmartVideofy?</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our platform offers unique advantages that make video creation simple, fast, and professional.
              </p>
            </ScrollReveal>
          </div>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {benefits.map((benefit, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="mb-4">{benefit.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How SmartVideofy Works</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our streamlined process makes video creation incredibly simple.
              </p>
            </div>
          </ScrollReveal>
          
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-4 md:left-12 top-0 bottom-0 w-1 bg-primary-light dark:bg-primary/30 z-0"></div>
              
              {/* Steps */}
              {steps.map((step, index) => (
                <ScrollReveal key={index} delay={index * 100}>
                  <div className="relative z-10 flex flex-col md:flex-row items-start mb-12">
                    <div className="flex-shrink-0 bg-primary text-white font-bold rounded-full w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-xl md:text-2xl mb-4 md:mb-0">
                      {step.number}
                    </div>
                    <div className="md:ml-8">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-lg">{step.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Who Uses SmartVideofy?</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our platform is designed for a wide range of users who need to create engaging videos quickly.
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <ScrollReveal>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="mb-4 text-4xl text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Content Creators</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    YouTubers, TikTokers, and social media influencers who need to produce engaging content consistently.
                  </p>
                  <p className="italic text-gray-500 dark:text-gray-400">
                    "I went from spending days on video production to creating professional content in minutes." – Alex K.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
            
            <ScrollReveal delay={100}>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="mb-4 text-4xl text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Marketers</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Marketing professionals who need to create promotional videos, ads, and social media content quickly.
                  </p>
                  <p className="italic text-gray-500 dark:text-gray-400">
                    "Our campaign turnaround time decreased by 80% with SmartVideofy." – Sarah M.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="mb-4 text-4xl text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path>
                      <path d="M1 21h22"></path>
                      <path d="M9 7h6"></path>
                      <path d="M9 11h6"></path>
                      <path d="M9 15h6"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Educators</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Teachers and trainers who want to transform lessons into engaging educational videos.
                  </p>
                  <p className="italic text-gray-500 dark:text-gray-400">
                    "My students' engagement improved dramatically with visual content." – Prof. James L.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Perfect for Creating</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                SmartVideofy can help you create a wide variety of video content.
              </p>
            </div>
          </ScrollReveal>
          
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <ScrollReveal key={index} delay={index * 50}>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">{useCase}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Content?</h2>
              <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
                Join thousands of creators, marketers, and educators who are already using SmartVideofy to create stunning videos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                  <Link to="/register">Start Creating for Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-lg transition-all duration-300">
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
