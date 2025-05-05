
import { Sparkles, Clock, Film, Layers, Upload, Palette, MessageSquare, Users, ShieldCheck, TextToSpeech, Sliders, Monitor, Languages, Share2, Tags, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Custom Text-to-Video icon
const TextToVideo = () => (
  <svg
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
    <path d="M22 8l-4 4 4 4V8z" />
    <path d="M6 2h8" />
    <path d="M8 2v4" />
    <path d="M12 2v4" />
    <path d="M8 22h8" />
    <path d="M10 22v-4" />
    <path d="M14 22v-4" />
  </svg>
);

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const mainFeatures = [
    {
      icon: TextToVideo,
      title: "AI-Powered Script Generation",
      description: "Transform simple text into complete video scripts with scene-by-scene visualization powered by Gemini AI.",
    },
    {
      icon: Clock,
      title: "Fast Turnaround",
      description: "Create professional videos in minutes, not hours. Get your message out while it's still relevant.",
    },
    {
      icon: Film,
      title: "Premium Stock Videos",
      description: "Access thousands of high-quality stock videos that perfectly match your content themes and topics.",
    },
    {
      icon: MessageSquare,
      title: "AI Voiceovers",
      description: "Add natural-sounding narration to your videos with our text-to-speech technology in multiple voices.",
    },
    {
      icon: Palette,
      title: "Brand Customization",
      description: "Add your logos, colors, and fonts to maintain consistent brand identity across all videos.",
    },
    {
      icon: Upload,
      title: "Easy Sharing",
      description: "Download in multiple formats or share directly to social media platforms with one click.",
    },
  ];

  const allFeatures = {
    creation: [
      {
        icon: TextToVideo,
        title: "Text to Video Conversion",
        description: "Convert any text input into a structured video with appropriate visuals and pacing."
      },
      {
        icon: Sparkles,
        title: "AI Scene Generation",
        description: "Our AI analyzes your content to generate the perfect scene breakdown and structure."
      },
      {
        icon: Layers,
        title: "Smart Scene Transitions",
        description: "Professional transitions between scenes create a smooth, engaging viewing experience."
      },
      {
        icon: Sliders,
        title: "Fine-Grained Controls",
        description: "Adjust every aspect of your video from pacing to visual style with intuitive controls."
      }
    ],
    customization: [
      {
        icon: Palette,
        title: "Brand Kit Integration",
        description: "Apply your brand colors, fonts, and logo consistently across all videos."
      },
      {
        icon: Monitor,
        title: "Multiple Format Support",
        description: "Create videos optimized for different platforms (vertical, horizontal, square)."
      },
      {
        icon: TextToSpeech,
        title: "Custom Captions & Text",
        description: "Control text styling, animation, placement, and timing throughout your video."
      },
      {
        icon: Languages,
        title: "Multi-Language Support",
        description: "Create versions of your video in different languages with text and voice translation."
      }
    ],
    production: [
      {
        icon: Film,
        title: "Premium Stock Library",
        description: "Access thousands of high-quality stock videos, images, and audio clips."
      },
      {
        icon: MessageSquare,
        title: "AI Voice Generation",
        description: "Choose from a range of natural-sounding voices for your video narration."
      },
      {
        icon: Clock,
        title: "Batch Processing",
        description: "Create multiple videos simultaneously to save even more time."
      },
      {
        icon: Zap,
        title: "High-Performance Rendering",
        description: "Our cloud rendering farm ensures your videos are processed quickly."
      }
    ],
    management: [
      {
        icon: Share2,
        title: "Direct Social Sharing",
        description: "Share your videos directly to social platforms without downloading."
      },
      {
        icon: Users,
        title: "Team Collaboration",
        description: "Invite team members to collaborate on video projects with defined roles."
      },
      {
        icon: Tags,
        title: "Video Organization",
        description: "Keep your video projects organized with folders, tags, and search."
      },
      {
        icon: ShieldCheck,
        title: "Commercial Licensing",
        description: "All generated videos include commercial usage rights for your business."
      }
    ]
  };

  return (
    <section id="features" className="py-20 md:py-28 lg:py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-20"></div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-white px-3 py-1 text-sm dark:border-gray-800 dark:bg-gray-900 mb-2">
            <span className="text-primary">FEATURES</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Everything You Need to Create Amazing Videos</h2>
          <p className="text-gray-500 md:text-xl dark:text-gray-400">
            SmartVid combines powerful AI with intuitive tools to streamline your video creation process.
          </p>
        </div>

        {/* Main Features Grid */}
        <div 
          ref={ref}
          className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 mb-20"
        >
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className="group flex flex-col p-6 h-full transition-all duration-200 hover:shadow-lg hover:scale-105 dark:border-gray-800 hover:border-primary/20 dark:hover:border-primary/20"
              >
                <div className="rounded-full bg-primary/10 p-2.5 w-12 h-12 flex items-center justify-center mb-4 dark:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 flex-grow">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Detailed Feature Breakdown with Tabs */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Detailed Feature Breakdown</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Explore all the powerful features that make SmartVid the leading AI video creation platform.
            </p>
          </div>

          <Tabs defaultValue="creation" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
              <TabsTrigger value="creation">Creation</TabsTrigger>
              <TabsTrigger value="customization">Customization</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>

            {Object.entries(allFeatures).map(([category, features]) => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <Card key={index} className="border border-gray-100 dark:border-gray-800 hover:border-primary/20 hover:shadow-md transition-all duration-300">
                      <div className="p-6 flex items-start space-x-4">
                        <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full flex-shrink-0">
                          <feature.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold mb-1">{feature.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Interactive Demo Callout */}
        <div className="max-w-5xl mx-auto mt-20 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-4">See SmartVid in Action</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Watch how easy it is to transform a simple idea into a professional video in just minutes using our AI-powered platform.
              </p>
              <Button asChild className="w-full md:w-auto bg-primary hover:bg-primary/90">
                <Link to="/product#demo-section">
                  Watch Demo
                  <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                </Link>
              </Button>
            </div>
            <div className="md:w-1/2 bg-gray-200 dark:bg-gray-800 min-h-[250px] flex items-center justify-center">
              <div className="text-center p-6">
                <svg className="mx-auto h-16 w-16 text-primary opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Click to watch the demo video</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="mt-32 max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-white px-3 py-1 text-sm dark:border-gray-800 dark:bg-gray-900 mb-2">
              <span className="text-primary">HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Create Videos in 3 Simple Steps</h2>
            <p className="text-gray-500 md:text-xl dark:text-gray-400">
              Turn any text into a professional video in just a few clicks.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-primary/10 dark:bg-gray-800"></div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-4 z-10">1</div>
              <h3 className="text-xl font-bold mb-2">Enter Your Idea</h3>
              <p className="text-gray-500 dark:text-gray-400">Type in your concept or message, and our AI will transform it into a complete script.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-4 z-10">2</div>
              <h3 className="text-xl font-bold mb-2">Customize Your Style</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose from various templates, add your branding, and customize the look and feel.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-4 z-10">3</div>
              <h3 className="text-xl font-bold mb-2">Generate & Share</h3>
              <p className="text-gray-500 dark:text-gray-400">Our AI generates your video in minutes, ready to download or share directly.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
