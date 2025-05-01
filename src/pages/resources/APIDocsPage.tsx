
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const ApiEndpoint = ({ 
  method, 
  url, 
  description, 
  requestBody = null, 
  responseBody = null,
  parameters = null 
}: { 
  method: string; 
  url: string; 
  description: string;
  requestBody?: string | null;
  responseBody?: string | null;
  parameters?: Array<{name: string, type: string, required: boolean, description: string}> | null;
}) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const methodColors = {
    GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  
  return (
    <Card className="mb-8 border border-border/40 hover:border-primary/20 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-1 rounded ${methodColors[method as keyof typeof methodColors]}`}>
            {method}
          </span>
          <div className="flex items-center bg-muted px-3 py-1 rounded-md">
            <code className="text-sm font-mono">{url}</code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-2" 
              onClick={copyToClipboard}
              aria-label="Copy URL"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        
        {parameters && parameters.length > 0 && (
          <>
            <h4 className="text-sm font-medium mt-4 mb-2">Parameters</h4>
            <div className="bg-muted rounded-md p-2 overflow-hidden overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Name</th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-left py-2 px-3 font-medium">Required</th>
                    <th className="text-left py-2 px-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param, index) => (
                    <tr key={index} className="border-t border-border/10">
                      <td className="py-2 px-3 font-mono text-xs">{param.name}</td>
                      <td className="py-2 px-3 font-mono text-xs">{param.type}</td>
                      <td className="py-2 px-3">{param.required ? 'Yes' : 'No'}</td>
                      <td className="py-2 px-3">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {requestBody && (
          <>
            <h4 className="text-sm font-medium mt-4 mb-2">Request Body</h4>
            <pre className="bg-muted p-3 rounded-md overflow-auto text-xs font-mono">
              {requestBody}
            </pre>
          </>
        )}
        
        {responseBody && (
          <>
            <h4 className="text-sm font-medium mt-4 mb-2">Response</h4>
            <pre className="bg-muted p-3 rounded-md overflow-auto text-xs font-mono">
              {responseBody}
            </pre>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Helmet>
        <title>API Documentation | SmartVid AI Video Generator</title>
        <meta name="description" content="Technical documentation for the SmartVid API. Learn how to integrate video generation into your applications." />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-gray-900 dark:text-white">
            API Documentation
          </h1>
          
          <p className="text-xl text-center text-muted-foreground mb-12">
            Integrate video generation capabilities directly into your applications
          </p>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Learn how to authenticate and make your first API request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Authentication</h3>
                <p>SmartVid API uses API keys to authenticate requests. You can view and manage your API keys in your account dashboard.</p>
                <p>All API requests must include your API key in an Authorization header:</p>
                
                <pre className="bg-muted p-3 rounded-md overflow-auto text-sm font-mono">
                  Authorization: Bearer YOUR_API_KEY
                </pre>
                
                <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-4 rounded-r-md my-4">
                  <h4 className="text-amber-800 dark:text-amber-300 font-medium">Important</h4>
                  <p className="text-amber-700 dark:text-amber-400">
                    Keep your API keys secure! Do not share them in publicly accessible areas such as GitHub, client-side code, or blog posts.
                  </p>
                </div>
                
                <h3 className="text-lg font-medium pt-4">Rate Limits</h3>
                <p>
                  API requests are limited based on your subscription plan:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Free: 20 requests per day</li>
                  <li>Pro: 100 requests per day</li>
                  <li>Enterprise: Custom limits</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-6">API Reference</h2>
          
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="mb-6 w-full flex justify-start overflow-x-auto">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="videos" className="space-y-6">
              <ApiEndpoint 
                method="GET" 
                url="https://api.smartvideofy.com/v1/videos" 
                description="Returns a list of all videos created by the authenticated user."
                responseBody={`{
  "videos": [
    {
      "id": "vid_123abc",
      "title": "Product Demo",
      "status": "completed",
      "duration": 45,
      "created_at": "2025-04-20T15:30:00Z",
      "url": "https://storage.smartvideofy.com/videos/vid_123abc.mp4"
    },
    {
      "id": "vid_456def",
      "title": "Company Intro",
      "status": "processing",
      "created_at": "2025-04-21T10:15:00Z"
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}`}
                parameters={[
                  {name: "limit", type: "integer", required: false, description: "Max number of videos to return (default: 10, max: 100)"},
                  {name: "offset", type: "integer", required: false, description: "Number of videos to skip (default: 0)"},
                  {name: "status", type: "string", required: false, description: "Filter by status (pending, processing, completed, failed)"}
                ]}
              />
              
              <ApiEndpoint 
                method="POST" 
                url="https://api.smartvideofy.com/v1/videos" 
                description="Create a new video from a prompt or script."
                requestBody={`{
  "title": "My Awesome Video",
  "prompt": "Create a video explaining how cloud computing works with simple animations",
  "style": "explainer",
  "duration": 60,
  "voice_type": "female-professional",
  "has_captions": true
}`}
                responseBody={`{
  "id": "vid_789ghi",
  "title": "My Awesome Video",
  "status": "pending",
  "created_at": "2025-04-23T08:45:00Z"
}`}
              />
              
              <ApiEndpoint 
                method="GET" 
                url="https://api.smartvideofy.com/v1/videos/{video_id}" 
                description="Get details for a specific video."
                responseBody={`{
  "id": "vid_123abc",
  "title": "Product Demo",
  "prompt": "Create a video showcasing our new SaaS dashboard features",
  "style": "product",
  "status": "completed",
  "duration": 45,
  "created_at": "2025-04-20T15:30:00Z",
  "updated_at": "2025-04-20T15:35:00Z",
  "url": "https://storage.smartvideofy.com/videos/vid_123abc.mp4",
  "thumbnail_url": "https://storage.smartvideofy.com/thumbnails/vid_123abc.jpg"
}`}
                parameters={[
                  {name: "video_id", type: "string", required: true, description: "The ID of the video to retrieve"}
                ]}
              />
              
              <ApiEndpoint 
                method="DELETE" 
                url="https://api.smartvideofy.com/v1/videos/{video_id}" 
                description="Delete a video."
                responseBody={`{
  "success": true
}`}
                parameters={[
                  {name: "video_id", type: "string", required: true, description: "The ID of the video to delete"}
                ]}
              />
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-6">
              <ApiEndpoint 
                method="GET" 
                url="https://api.smartvideofy.com/v1/templates" 
                description="Get a list of available templates."
                responseBody={`{
  "templates": [
    {
      "id": "tmpl_123abc",
      "name": "Product Introduction",
      "description": "A template for introducing new products with animated features and benefits",
      "category": "marketing",
      "is_premium": false
    },
    {
      "id": "tmpl_456def",
      "name": "Educational Explainer",
      "description": "Perfect for educational content with step-by-step visual explanations",
      "category": "education",
      "is_premium": true
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}`}
                parameters={[
                  {name: "category", type: "string", required: false, description: "Filter by category (marketing, social, education, business)"},
                  {name: "is_premium", type: "boolean", required: false, description: "Filter by premium status"}
                ]}
              />
              
              <ApiEndpoint 
                method="GET" 
                url="https://api.smartvideofy.com/v1/templates/{template_id}" 
                description="Get details for a specific template."
                responseBody={`{
  "id": "tmpl_123abc",
  "name": "Product Introduction",
  "description": "A template for introducing new products with animated features and benefits",
  "category": "marketing",
  "is_premium": false,
  "thumbnail": "https://storage.smartvideofy.com/templates/tmpl_123abc.jpg",
  "sample_video_url": "https://storage.smartvideofy.com/samples/tmpl_123abc.mp4"
}`}
                parameters={[
                  {name: "template_id", type: "string", required: true, description: "The ID of the template to retrieve"}
                ]}
              />
            </TabsContent>
            
            <TabsContent value="scripts" className="space-y-6">
              <ApiEndpoint 
                method="GET" 
                url="https://api.smartvideofy.com/v1/scripts" 
                description="Get a list of your saved scripts."
                responseBody={`{
  "scripts": [
    {
      "id": "scr_123abc",
      "title": "Product Launch Script",
      "type": "marketing",
      "created_at": "2025-03-15T09:30:00Z"
    },
    {
      "id": "scr_456def",
      "title": "Tutorial Introduction",
      "type": "education",
      "created_at": "2025-04-01T14:20:00Z"
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}`}
              />
              
              <ApiEndpoint 
                method="POST" 
                url="https://api.smartvideofy.com/v1/scripts" 
                description="Create a new script."
                requestBody={`{
  "title": "My Marketing Script",
  "type": "marketing",
  "content": "Welcome to our new product launch! Today we're excited to introduce..."
}`}
                responseBody={`{
  "id": "scr_789ghi",
  "title": "My Marketing Script",
  "type": "marketing",
  "content": "Welcome to our new product launch! Today we're excited to introduce...",
  "created_at": "2025-04-23T08:50:00Z"
}`}
              />
              
              <ApiEndpoint 
                method="GET" 
                url="https://api.smartvideofy.com/v1/scripts/generate" 
                description="Generate a new script using AI."
                requestBody={`{
  "topic": "Introduction to machine learning concepts for beginners",
  "tone": "educational",
  "length": "medium",
  "key_points": ["What is ML", "Basic concepts", "Real-world applications"]
}`}
                responseBody={`{
  "content": "Welcome to this introduction to machine learning! In the next few minutes...",
  "sections": ["Introduction", "What is Machine Learning", "Key Concepts", "Applications", "Conclusion"],
  "word_count": 320,
  "estimated_duration": 120
}`}
              />
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              <ApiEndpoint 
                method="GET" 
                url="https://api.smartvideofy.com/v1/user" 
                description="Get information about the authenticated user."
                responseBody={`{
  "id": "usr_123abc",
  "email": "user@example.com",
  "subscription": {
    "plan": "pro",
    "status": "active",
    "period_end": "2025-05-23T00:00:00Z"
  },
  "usage": {
    "videos_created": 15,
    "videos_limit": 50,
    "api_requests_today": 35,
    "api_requests_limit": 100
  }
}`}
              />
              
              <ApiEndpoint 
                method="GET" 
                url="https://api.smartvideofy.com/v1/user/usage" 
                description="Get detailed usage information for the authenticated user."
                responseBody={`{
  "quota": {
    "videos": {
      "used": 15,
      "limit": 50,
      "reset_date": "2025-05-01T00:00:00Z"
    },
    "api_calls": {
      "used_today": 35,
      "limit_per_day": 100
    },
    "storage": {
      "used_gb": 1.2,
      "limit_gb": 10
    }
  },
  "history": {
    "daily_usage": [
      { "date": "2025-04-22", "videos_created": 3, "api_calls": 28 },
      { "date": "2025-04-23", "videos_created": 2, "api_calls": 35 }
    ]
  }
}`}
              />
            </TabsContent>
          </Tabs>
          
          <div className="mt-12 p-6 bg-muted rounded-lg">
            <h2 className="text-xl font-bold mb-4">Need Help?</h2>
            <p className="mb-4">If you have any questions or need assistance with our API, please contact our developer support team.</p>
            <Button variant="outline" onClick={() => window.postMessage({ type: 'OPEN_CHATBOT' }, '*')}>
              Contact Developer Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
