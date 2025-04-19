
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Card } from "@/components/ui/card";

export function HeroSection() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-gradient-to-b from-white to-smartvid-50 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
      <div className="container px-4 md:px-6 relative">
        {/* Background Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-smartvid-100 rounded-full opacity-30 blur-3xl dark:bg-smartvid-900/20"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-smartvid-100 rounded-full opacity-30 blur-3xl dark:bg-smartvid-900/20"></div>
        
        <div className="grid gap-10 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_720px] items-center">
          <div className="flex flex-col justify-center space-y-6 z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-smartvid-200 bg-white px-3 py-1 text-sm dark:border-gray-800 dark:bg-gray-900">
                <span className="mr-1 rounded-full bg-smartvid-500 w-2 h-2"></span>
                <span className="text-gray-600 dark:text-gray-400">AI-Powered Video Creation</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-6xl">
                Transform Text Into <span className="gradient-heading">Stunning Videos</span> <span className="text-smartvid-600">in Minutes</span>
              </h1>
              <p className="max-w-[600px] text-gray-600 text-lg md:text-xl/relaxed lg:text-xl/relaxed dark:text-gray-400">
                SmartVid uses AI to instantly turn your ideas into professional, engaging 
                videos. No technical skills required — just type and watch the magic happen.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              <Button size="lg" asChild className="bg-smartvid-600 hover:bg-smartvid-700 text-lg h-12 px-6">
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-6">
                <Link to="#how-it-works">
                  <Play className="mr-2 h-5 w-5" />
                  See How It Works
                </Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 pt-2">
              <div className="flex items-center">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-smartvid-600 mr-1.5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-smartvid-600 mr-1.5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center z-10">
            <Card className="w-full overflow-hidden rounded-xl border-0 bg-gradient-to-br from-white to-smartvid-50 shadow-2xl dark:from-gray-900 dark:to-gray-950">
              <div className="relative w-full aspect-video overflow-hidden rounded-xl">
                <video
                  className="w-full h-full object-cover"
                  poster="/placeholder.svg"
                  muted
                  autoPlay
                  loop
                  playsInline
                >
                  <source src="#" type="video/mp4" />
                </video>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Button size="lg" className="bg-smartvid-600 hover:bg-smartvid-700 h-14 px-6 text-lg">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </div>
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-smartvid-500/50 to-transparent"></div>
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
