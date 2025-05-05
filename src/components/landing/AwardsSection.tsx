
import { Card, CardContent } from "@/components/ui/card";
import { Award, ThumbsUp, Trophy, Star } from "lucide-react";

export function AwardsSection() {
  const awards = [
    {
      title: "Best AI Video Tool",
      organization: "Tech Innovator Awards",
      year: "2024",
      icon: Trophy,
      color: "bg-yellow-500/10 text-yellow-500"
    },
    {
      title: "User's Choice Award",
      organization: "Content Creator Summit",
      year: "2023",
      icon: ThumbsUp,
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      title: "Top AI Startup",
      organization: "AI Excellence Awards",
      year: "2023",
      icon: Star,
      color: "bg-green-500/10 text-green-500"
    },
    {
      title: "Innovation in Video Tech",
      organization: "Digital Media Awards",
      year: "2024",
      icon: Award,
      color: "bg-purple-500/10 text-purple-500"
    }
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-white px-3 py-1 text-sm dark:border-gray-800 dark:bg-gray-900 mb-2">
            <span className="text-primary">RECOGNITION</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Award-Winning Technology</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            SmartVid has been recognized by industry leaders for innovation and excellence in AI-powered video creation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {awards.map((award, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 dark:bg-gray-900 hover:scale-105">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-full ${award.color} flex items-center justify-center mb-4`}>
                  <award.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-1">{award.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-1">{award.organization}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{award.year}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4 mt-12 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 rounded-md px-4 py-2 bg-white dark:bg-gray-900">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">4.8/5 on ProductHunt</span>
          </div>
          <div className="flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 rounded-md px-4 py-2 bg-white dark:bg-gray-900">
            <ThumbsUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">98% User Satisfaction</span>
          </div>
          <div className="flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 rounded-md px-4 py-2 bg-white dark:bg-gray-900">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Top 10 AI Tools of 2024</span>
          </div>
          <div className="flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 rounded-md px-4 py-2 bg-white dark:bg-gray-900">
            <Award className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Best in Show - Video Tech Expo</span>
          </div>
        </div>
      </div>
    </section>
  );
}
