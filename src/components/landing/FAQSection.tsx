
import React, { useState } from 'react';
import { Separator } from "@/components/ui/separator";

export function FAQSection() {
  // FAQ Items with expanded state
  const [faqs, setFaqs] = useState([
    {
      question: "How does SmartVid work?",
      answer: "SmartVid uses AI to analyze your text prompt, break it into scenes, find relevant stock video clips, and assemble them into a cohesive video with transitions, text overlays, and optional voiceovers. The entire process is automated, requiring minimal input from you.",
      isOpen: false
    },
    {
      question: "How long does it take to generate a video?",
      answer: "Most videos are generated within 1-3 minutes, depending on the complexity and length of your request. Longer videos or those with special effects may take a bit longer, but you'll always be able to track the progress in real-time.",
      isOpen: false
    },
    {
      question: "Can I use my own videos and images?",
      answer: "Yes! You can upload your own videos and images to include in your project, or combine them with our stock library for more options. This gives you full flexibility to create truly unique and personalized content.",
      isOpen: false
    },
    {
      question: "What video formats and quality are supported?",
      answer: "SmartVid generates videos in MP4 format. Free users get 720p resolution, while Pro users get 1080p and Business users get up to 4K resolution. All videos can be downloaded and used immediately after generation.",
      isOpen: false
    },
    {
      question: "Do I own the videos I create?",
      answer: "Yes, you own all rights to the videos you create with SmartVid. The stock footage we provide is licensed for your commercial use without attribution requirements or additional fees.",
      isOpen: false
    },
    {
      question: "Do I need technical skills to use SmartVid?",
      answer: "Not at all! SmartVid is designed to be user-friendly and intuitive. If you can type a description of what you want, our AI can turn it into a video. No video editing, design, or technical skills required.",
      isOpen: false
    },
    {
      question: "Can I add voice narration to my videos?",
      answer: "Yes! SmartVid offers AI-powered voiceovers in multiple languages and voices. You can either write your own script or let our AI generate one based on your video content.",
      isOpen: false
    },
    {
      question: "What kind of support do you offer?",
      answer: "We offer comprehensive support across all plans, including detailed documentation, video tutorials, and email support. Business plan users also get priority support and access to dedicated account managers.",
      isOpen: false
    }
  ]);

  // Toggle FAQ item
  const toggleFaq = (index: number) => {
    setFaqs(
      faqs.map((faq, i) => {
        if (i === index) {
          return { ...faq, isOpen: !faq.isOpen };
        }
        return faq;
      })
    );
  };

  return (
    <section id="faq" className="py-20 md:py-28 lg:py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-smartvid-200 to-transparent dark:via-gray-800"></div>
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center rounded-full border border-smartvid-200 bg-white px-3 py-1 text-sm dark:border-gray-800 dark:bg-gray-900 mb-2">
            <span className="text-smartvid-600">QUESTIONS</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Frequently Asked Questions</h2>
          <p className="text-gray-500 md:text-xl dark:text-gray-400">
            Find answers to common questions about SmartVid's features, pricing, and capabilities.
          </p>
        </div>
        
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-lg bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
              <button
                className="flex justify-between items-center w-full px-6 py-4 text-left font-medium"
                onClick={() => toggleFaq(index)}
                aria-expanded={faq.isOpen}
              >
                <span className="text-lg">{faq.question}</span>
                <svg
                  className={`w-5 h-5 transform transition-transform duration-200 ${faq.isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`px-6 pb-4 ${faq.isOpen ? 'block' : 'hidden'}`}>
                <Separator className="mb-4" />
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Still have questions?</p>
          <div className="inline-flex items-center text-smartvid-600 hover:text-smartvid-700 font-medium">
            <a href="/contact" className="flex items-center">
              Contact our support team
              <svg className="w-5 h-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
