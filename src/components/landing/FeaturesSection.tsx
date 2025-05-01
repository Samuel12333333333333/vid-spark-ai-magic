
import { Sparkles, Clock, Film, Layers, Upload, Palette } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered",
      description: "Transform text into complete video scripts with scene-by-scene visualization.",
    },
    {
      icon: Clock,
      title: "Fast Turnaround",
      description: "Create professional videos in minutes, not hours or days.",
    },
    {
      icon: Film,
      title: "Quality Stock Videos",
      description: "Access thousands of stock videos to match your ideas perfectly.",
    },
    {
      icon: Layers,
      title: "Seamless Transitions",
      description: "Professional scene transitions make your video flow naturally.",
    },
    {
      icon: Upload,
      title: "Easy Sharing",
      description: "Download in multiple formats or share directly to social media.",
    },
    {
      icon: Palette,
      title: "Brand Customization",
      description: "Add your logos, colors, and fonts to maintain brand consistency.",
    },
  ];

  return (
    <section id="how-it-works" className="py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How SmartVid Works</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Turn any text into a professional video in just a few clicks.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 mt-12">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border p-4 transition-all hover:shadow-md dark:border-gray-800">
              <div className="rounded-full bg-smartvid-100 p-2 dark:bg-smartvid-900/20">
                <feature.icon className="h-6 w-6 text-smartvid-600" />
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
