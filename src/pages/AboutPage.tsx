
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About SmartVid | AI-Powered Video Creation Platform</title>
        <meta name="description" content="Learn about SmartVid - the AI-powered platform that turns text into stunning videos. Discover our mission, team, and the technology behind our innovative video creation tool." />
        <meta name="keywords" content="SmartVid, AI video creation, about us, video generation platform, video creation technology" />
        <meta property="og:title" content="About SmartVid | AI-Powered Video Creation Platform" />
        <meta property="og:description" content="Learn about SmartVid - the AI-powered platform that turns text into stunning videos." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://smartvid.ai/about" />
        <link rel="canonical" href="https://smartvid.ai/about" />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center">About SmartVid</h1>
        
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-xl text-muted-foreground">
            Transforming ideas into compelling videos with the power of AI
          </p>
        </div>
        
        {/* Our Story Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Story</h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-muted-foreground mb-4">
                SmartVid was born from a simple observation: creating high-quality video content is time-consuming, expensive, and requires specialized skills. In a world where video dominates digital communication, this creates a significant barrier for creators, marketers, educators, and businesses.
              </p>
              <p className="text-muted-foreground mb-4">
                Founded in 2025, our team of AI specialists, videographers, and product designers set out to democratize video creation. We believed that anyone should be able to transform their ideas into compelling visual stories without the traditional barriers.
              </p>
              <p className="text-muted-foreground">
                Today, SmartVid is helping thousands of users around the world create professional-quality videos from simple text prompts, revolutionizing how content is created across industries.
              </p>
            </div>
            
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                alt="Team collaboration" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
        
        {/* Our Mission Section */}
        <div className="mb-16 bg-muted rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Mission</h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-lg overflow-hidden shadow-xl order-2 md:order-1">
              <img 
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                alt="Creative vision" 
                className="w-full h-auto object-cover"
              />
            </div>
            
            <div className="order-1 md:order-2">
              <p className="text-muted-foreground mb-4">
                Our mission at SmartVid is to empower everyone to become a video creator. We're building a future where the gap between imagination and creation is bridged by intelligent technology.
              </p>
              <p className="text-muted-foreground mb-4">
                We believe that:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Everyone has stories worth telling</li>
                <li>Technology should amplify human creativity, not replace it</li>
                <li>Great tools should be accessible to all, regardless of technical skill</li>
                <li>The future of communication is visual, dynamic, and personalized</li>
              </ul>
              <p className="text-muted-foreground">
                This mission drives everything we do, from product development to customer service to how we build our team.
              </p>
            </div>
          </div>
        </div>
        
        {/* Technology Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Technology</h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-muted-foreground mb-4">
                SmartVid combines cutting-edge AI technologies to transform text into compelling videos:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li><strong>Advanced Natural Language Processing:</strong> Our platform understands the context, emotion, and intent behind your text prompts.</li>
                <li><strong>Generative AI Scene Creation:</strong> We break down your ideas into optimal visual scenes and sequences.</li>
                <li><strong>Intelligent Media Curation:</strong> Our system selects the perfect stock footage that matches your narrative.</li>
                <li><strong>AI Voice Generation:</strong> Create natural-sounding narration with customizable voices.</li>
                <li><strong>Automated Video Composition:</strong> Seamlessly assemble all elements with professional transitions, timing, and effects.</li>
              </ul>
              <p className="text-muted-foreground">
                All of this happens in minutes, not hours or days, giving you more time to focus on what matters: your message.
              </p>
            </div>
            
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                alt="AI technology" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
        
        {/* Join Us Section */}
        <div className="text-center py-12 px-6 bg-primary/10 rounded-2xl mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Join the Video Revolution</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're a creator, marketer, educator, or entrepreneur, SmartVid gives you the power to communicate through professional video without the traditional barriers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Get Started for Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
