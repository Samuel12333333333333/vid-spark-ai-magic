
import { Card, CardContent } from "@/components/ui/card";
import { StarIcon } from "./StarIcon";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

export function TestimonialsSection() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const testimonials = [
    {
      name: "James Peterson",
      role: "Marketing Director",
      company: "GrowthWave",
      image: "JP",
      content: "SmartVid has completely transformed our content creation process. We create 5x more videos in half the time it used to take us. The quality is outstanding and our engagement metrics have improved dramatically.",
      stars: 5
    },
    {
      name: "Sarah Lee",
      role: "Content Creator",
      company: "Influencer",
      image: "SL",
      content: "As a solo creator, SmartVid has been a game-changer for my workflow. I can now create professional videos without any technical skills, which has freed up my time to focus on growing my audience.",
      stars: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Education Specialist",
      company: "LearnQuest Academy",
      image: "MR",
      content: "We use SmartVid to create educational content for our students. The quality and speed have exceeded our expectations, and the students love the engaging format of our new videos.",
      stars: 5
    },
    {
      name: "Emily Chen",
      role: "Digital Marketing Manager",
      company: "TechSolutions Inc.",
      image: "EC",
      content: "The AI capabilities of SmartVid are truly impressive. We've been able to produce consistent, high-quality video content across all our products with minimal effort. Highly recommended!",
      stars: 5
    },
    {
      name: "David Wilson",
      role: "Startup Founder",
      company: "NexGen",
      image: "DW",
      content: "SmartVid helped us create professional pitch videos on a startup budget. The templates are modern, and the AI saves us countless hours of work. Worth every penny.",
      stars: 5
    },
    {
      name: "Olivia Martinez",
      role: "Social Media Manager",
      company: "BrandBurst",
      image: "OM",
      content: "I manage content for multiple brands, and SmartVid has become my secret weapon. I can quickly produce videos that would normally require an entire production team.",
      stars: 5
    }
  ];

  return (
    <section id="testimonials" className="py-20 md:py-28 lg:py-32 bg-gray-50 dark:bg-gray-900/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-20"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-white px-3 py-1 text-sm dark:border-gray-800 dark:bg-gray-900 mb-2">
            <span className="text-primary">TESTIMONIALS</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-secondary">
            Loved by Creators Everywhere
          </h2>
          <p className="text-gray-500 md:text-xl dark:text-gray-400">
            Join thousands of satisfied customers who are creating amazing videos with SmartVid.
          </p>
        </div>
        
        {/* Testimonial Cards Carousel */}
        {isMounted && (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4">
                  <div className="p-1">
                    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full dark:bg-gray-900 hover:scale-105">
                      <CardContent className="p-6 h-full flex flex-col">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/30 flex items-center justify-center text-primary font-semibold text-lg mr-4">
                            {testimonial.image}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{testimonial.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}, {testimonial.company}</p>
                          </div>
                        </div>
                        <div className="flex mb-4">
                          {[...Array(testimonial.stars)].map((_, i) => (
                            <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 flex-grow">
                          "{testimonial.content}"
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-8">
              <CarouselPrevious className="static mx-2 translate-y-0" />
              <CarouselNext className="static mx-2 translate-y-0" />
            </div>
          </Carousel>
        )}
        
        {/* Trust Banner */}
        <div className="flex justify-center mt-16">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg border border-gray-100 dark:border-gray-800 max-w-3xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/30 flex items-center justify-center text-primary font-semibold border-2 border-white dark:border-gray-900">JP</div>
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/30 flex items-center justify-center text-primary font-semibold border-2 border-white dark:border-gray-900">SL</div>
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/30 flex items-center justify-center text-primary font-semibold border-2 border-white dark:border-gray-900">MR</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Trusted by 10,000+ content creators worldwide</div>
            </div>
            <p className="text-lg md:text-xl font-medium text-gray-700 dark:text-gray-300 mb-6">
              "SmartVid has revolutionized our video creation process. What used to take days now takes minutes."
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-semibold">Trusted by industry leaders</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Join thousands of satisfied customers</div>
              </div>
              <div className="flex space-x-3">
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs font-semibold">BRAND 1</div>
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs font-semibold">BRAND 2</div>
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs font-semibold">BRAND 3</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
