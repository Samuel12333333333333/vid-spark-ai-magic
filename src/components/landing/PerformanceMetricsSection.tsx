
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Video, Award, Clock } from "lucide-react";

export function PerformanceMetricsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const metrics = [
    {
      title: "Users",
      value: "10,000+",
      icon: Users,
      description: "Active creators on the platform",
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      title: "Videos",
      value: "250,000+",
      icon: Video,
      description: "Videos created with SmartVid",
      color: "bg-green-500/10 text-green-500"
    },
    {
      title: "Satisfaction",
      value: "4.8/5",
      icon: Award,
      description: "Average customer rating",
      color: "bg-yellow-500/10 text-yellow-500"
    },
    {
      title: "Time Saved",
      value: "85%",
      icon: Clock,
      description: "Average reduction in production time",
      color: "bg-purple-500/10 text-purple-500"
    }
  ];

  return (
    <section className="py-16 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">By the Numbers</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            SmartVid is trusted by content creators and businesses worldwide to produce high-quality videos at scale.
          </p>
        </div>

        <div 
          ref={ref} 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 dark:bg-gray-900">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-full ${metric.color} flex items-center justify-center mb-4`}>
                    <metric.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-1">{metric.value}</h3>
                  <p className="text-lg font-medium mb-2">{metric.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{metric.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
