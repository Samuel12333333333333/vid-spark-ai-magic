
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-smartvid-50 dark:from-gray-900 dark:to-gray-950">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_800px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Transform Text Into <span className="gradient-heading">Stunning Videos</span>
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                SmartVid uses AI to instantly turn your text prompts into professional, engaging 
                videos. Perfect for creators, marketers, and educators.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild className="bg-smartvid-600 hover:bg-smartvid-700">
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="#how-it-works">
                  <Play className="mr-2 h-4 w-4" />
                  See How It Works
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-[600px] overflow-hidden rounded-xl border bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950">
              <video
                className="aspect-video w-full"
                poster="/placeholder.svg"
                muted
                autoPlay
                loop
              >
                <source src="#" type="video/mp4" />
              </video>
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Button size="lg" className="bg-smartvid-600 hover:bg-smartvid-700">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
