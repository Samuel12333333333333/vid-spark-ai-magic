
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, BarChart2, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function CaseStudiesSection() {
  const [activeTab, setActiveTab] = useState("marketing");

  const caseStudies = {
    marketing: {
      title: "How GrowthWave Increased Lead Generation by 200%",
      company: "GrowthWave",
      industry: "Marketing Agency",
      challenge: "GrowthWave needed to create engaging video content for multiple clients without expanding their production team or budget.",
      solution: "Using SmartVid's AI-powered platform, GrowthWave was able to transform their written marketing materials into professional videos with consistent branding.",
      results: [
        { 
          icon: BarChart2, 
          title: "200% increase", 
          description: "in lead generation through video content" 
        },
        { 
          icon: Clock, 
          title: "75% reduction", 
          description: "in video production time" 
        },
        { 
          icon: Users, 
          title: "4x increase", 
          description: "in social media engagement" 
        }
      ],
      quote: "SmartVid has transformed how we deliver value to our clients. We're now able to produce video content at scale without compromising on quality.",
      quotePerson: "James Peterson, Marketing Director"
    },
    education: {
      title: "LearnQuest Academy's Digital Transformation",
      company: "LearnQuest Academy",
      industry: "Education",
      challenge: "LearnQuest needed to convert their extensive library of educational materials into engaging video formats for remote learning.",
      solution: "SmartVid enabled LearnQuest to automatically convert lesson plans and educational content into structured video lessons with visual aids.",
      results: [
        { 
          icon: Users, 
          title: "82% increase", 
          description: "in student completion rates" 
        },
        { 
          icon: BarChart2, 
          title: "3x more content", 
          description: "produced in the same timeframe" 
        },
        { 
          icon: Clock, 
          title: "90% reduction", 
          description: "in content production costs" 
        }
      ],
      quote: "Our students are more engaged than ever, and we've been able to expand our course offerings significantly thanks to the efficiency SmartVid provides.",
      quotePerson: "Michael Rodriguez, Education Specialist"
    },
    creator: {
      title: "How Sarah Lee Scaled Her Content Creation",
      company: "Independent Creator",
      industry: "Social Media",
      challenge: "Sarah needed to maintain a consistent posting schedule across multiple platforms without sacrificing content quality.",
      solution: "With SmartVid, Sarah was able to turn her script ideas into platform-optimized videos for TikTok, Instagram, and YouTube.",
      results: [
        { 
          icon: Users, 
          title: "150k new followers", 
          description: "across social platforms in 6 months" 
        },
        { 
          icon: BarChart2, 
          title: "4x increase", 
          description: "in sponsorship opportunities" 
        },
        { 
          icon: Clock, 
          title: "Content creation", 
          description: "reduced from 5 days to 1 day per week" 
        }
      ],
      quote: "SmartVid has completely transformed my content creation process. I can focus on ideas and strategy while the platform handles the technical aspects of video production.",
      quotePerson: "Sarah Lee, Content Creator"
    }
  };

  const activeCaseStudy = caseStudies[activeTab as keyof typeof caseStudies];

  return (
    <section id="case-studies" className="py-20 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            See how organizations and creators are transforming their video content with SmartVid.
          </p>
        </div>

        <Tabs 
          defaultValue="marketing" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="max-w-5xl mx-auto"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="creator">Creator</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-1/3 bg-primary/10 p-8 flex flex-col">
                    <div className="mb-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{activeCaseStudy.company}</span>
                      <h3 className="text-xl font-bold mt-1">{activeCaseStudy.industry}</h3>
                    </div>
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">The Challenge</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {activeCaseStudy.challenge}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">The Solution</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {activeCaseStudy.solution}
                      </p>
                    </div>
                  </div>
                  
                  <div className="lg:w-2/3 p-8">
                    <h2 className="text-2xl font-bold mb-6">{activeCaseStudy.title}</h2>
                    
                    <div className="mb-8">
                      <h4 className="font-semibold mb-4">Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activeCaseStudy.results.map((result, index) => (
                          <div key={index} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                            <div className="bg-primary/10 dark:bg-primary/20 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                              <result.icon className="h-5 w-5 text-primary" />
                            </div>
                            <h5 className="font-bold">{result.title}</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{result.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <blockquote className="border-l-4 border-primary pl-4 py-2 mb-6">
                      <p className="italic text-gray-600 dark:text-gray-300 mb-2">"{activeCaseStudy.quote}"</p>
                      <footer className="text-sm text-gray-500 dark:text-gray-400">— {activeCaseStudy.quotePerson}</footer>
                    </blockquote>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-900 p-6">
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ready to transform your content strategy?
                  </p>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link to="/register">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
