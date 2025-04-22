import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/components/landing/Footer';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating an API call to fetch blog posts
    setTimeout(() => {
      const fetchedPosts = [
        { title: "How AI is Changing Video Creation", summary: "Explore the impact of AI in the video creation industry." },
        { title: "Content Marketing Tips for 2025", summary: "The latest content marketing strategies to boost your reach." },
        // Add more blog posts here
      ];
      setPosts(fetchedPosts);
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>Blog | SmartVid AI Video Generator</title>
        <meta name="description" content="Read the latest articles about video creation, AI technology, and content marketing tips from the SmartVid team." />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Blog
        </h1>
        
        <div className="text-center mb-12">
          <p className="text-xl text-gray-700 dark:text-gray-300">
            {loading ? "Loading blog posts..." : "Read the latest articles from our team."}
          </p>
        </div>

        <div className="space-y-6">
          {!loading && posts.length === 0 && (
            <p className="text-xl text-gray-700 dark:text-gray-300 text-center">No blog posts available at the moment.</p>
          )}

          {posts.map((post, index) => (
            <div key={index} className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{post.title}</h2>
              <p className="text-gray-700 dark:text-gray-300 mt-2">{post.summary}</p>
              <a href="/blog" className="text-blue-500 mt-4 block">Read more...</a>
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
