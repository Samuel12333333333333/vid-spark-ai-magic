import { Sparkles, Clock, Film, Layers, Upload, Palette, MessageSquare, Users, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
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
      title: "High-Quality Stock Videos",
      description: "Access thousands of premium stock videos that perfectly match your content themes and topics.",
    },
    {
      icon: Layers,
      title: "Seamless Transitions",
      description: "Professional scene transitions make your video flow naturally and keep viewers engaged.",
    },
    {
      icon: MessageSquare,
      title: "AI Voiceovers",
      description: "Add natural-sounding narration to your videos with our text-to-speech technology.",
    },
    {
      icon: Upload,
      title: "Easy Sharing",
      description: "Download in multiple formats or share directly to social media platforms with one click.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together seamlessly with multi-user access and real-time project updates.",
    },
    {
      icon: Palette,
      title: "Brand Customization",
      description: "Add your logos, colors, and fonts to maintain consistent brand identity across all videos.",
    },
    {
      icon: ShieldCheck,
      title: "Commercial Licensing",
      description: "All generated content is licensed for your commercial use with no hidden fees or restrictions.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 lg:py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-20"></div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center rounded-full border border-smartvid-200 bg-white px-3 py-1 text-sm dark:border-gray-800 dark:bg-gray-900 mb-2">
            <span className="text-smartvid-600">FEATURES</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Everything You Need to Create Amazing Videos</h2>
          <p className="text-gray-500 md:text-xl dark:text-gray-400">
            SmartVid combines powerful AI with intuitive tools to streamline your video creation process.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group flex flex-col p-6 h-full transition-all duration-200 hover:shadow-lg hover:scale-105 dark:border-gray-800 hover:border-primary/20 dark:hover:border-primary/20"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="rounded-full bg-smartvid-100 p-2.5 w-12 h-12 flex items-center justify-center mb-4 dark:bg-smartvid-900/20">
                <feature.icon className="h-6 w-6 text-smartvid-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 flex-grow">{feature.description}</p>
            </Card>
          ))}
        </div>

        <div id="how-it-works" className="mt-32 max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-smartvid-200 bg-white px-3 py-1 text-sm dark:border-gray-800 dark:bg-gray-900 mb-2">
              <span className="text-smartvid-600">HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Create Videos in 3 Simple Steps</h2>
            <p className="text-gray-500 md:text-xl dark:text-gray-400">
              Turn any text into a professional video in just a few clicks.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-smartvid-100 dark:bg-gray-800"></div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-smartvid-600 text-white flex items-center justify-center text-xl font-bold mb-4 z-10">1</div>
              <h3 className="text-xl font-bold mb-2">Enter Your Idea</h3>
              <p className="text-gray-500 dark:text-gray-400">Type in your concept or message, and our AI will transform it into a complete script.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-smartvid-600 text-white flex items-center justify-center text-xl font-bold mb-4 z-10">2</div>
              <h3 className="text-xl font-bold mb-2">Customize Your Style</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose from various templates, add your branding, and customize the look and feel.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-smartvid-600 text-white flex items-center justify-center text-xl font-bold mb-4 z-10">3</div>
              <h3 className="text-xl font-bold mb-2">Generate & Share</h3>
              <p className="text-gray-500 dark:text-gray-400">Our AI generates your video in minutes, ready to download or share directly.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
