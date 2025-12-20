import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { aiService, ScriptType } from "@/services/aiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, Download, RefreshCw, Save, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ScriptList } from "./ScriptList";

export function AIScriptGenerator() {
  const { user } = useAuth();
  // Updated to use the now-valid ScriptType values
  const [scriptType, setScriptType] = useState<ScriptType>("hook");
  const [topic, setTopic] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [niche, setNiche] = useState("marketing");
  const [tone, setTone] = useState("professional");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [showSavedScripts, setShowSavedScripts] = useState(false);

  const niches = [
    { value: "marketing", label: "Marketing" },
    { value: "education", label: "Education" },
    { value: "entertainment", label: "Entertainment" },
    { value: "business", label: "Business" },
    { value: "technology", label: "Technology" },
    { value: "fitness", label: "Fitness" },
    { value: "food", label: "Food" },
    { value: "travel", label: "Travel" },
    { value: "fashion", label: "Fashion" },
  ];

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "humorous", label: "Humorous" },
    { value: "inspirational", label: "Inspirational" },
    { value: "informative", label: "Informative" },
    { value: "authoritative", label: "Authoritative" },
  ];

  const handleGenerate = () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }

    setGenerating(true);
    setGeneratedContent(""); // Clear previous content
    
    // Auto-generate a title if none is provided
    if (!scriptTitle) {
      setScriptTitle(`${scriptType === "hook" ? "Hook" : scriptType === "full" ? "Full Script" : scriptType === "caption" ? "Caption" : "Hashtags"} for ${topic}`);
    }

    // Simulate API call
    setTimeout(() => {
      let content = "";
      
      if (scriptType === "hook") {
        content = generateHook(topic, tone);
      } else if (scriptType === "full") {
        content = generateFullScript(topic, niche, tone);
      } else if (scriptType === "caption") {
        content = generateCaption(topic, tone);
      } else if (scriptType === "hashtag") {
        content = generateHashtags(topic, niche);
      }
      
      setGeneratedContent(content);
      setGenerating(false);
      toast.success(`Your ${scriptType === "hashtag" ? "hashtags" : "script"} has been generated!`);
    }, 2000);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to save scripts");
      return;
    }
    
    if (!generatedContent) {
      toast.error("Generate a script before saving");
      return;
    }
    
    if (!scriptTitle) {
      toast.error("Please provide a title for your script");
      return;
    }
    
    setSaving(true);
    try {
      const scriptId = await aiService.saveScript(
        user.id,
        scriptTitle,
        generatedContent,
        scriptType
      );
      
      if (scriptId) {
        toast.success("Script saved successfully!");
        // If showing saved scripts, refresh the list
        setShowSavedScripts(true);
      } else {
        throw new Error("Failed to save script");
      }
    } catch (error) {
      console.error("Error saving script:", error);
      toast.error("Failed to save script");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Copied to clipboard!");
  };

  const handleReset = () => {
    setTopic("");
    setScriptTitle("");
    setGeneratedContent("");
  };

  const handleSelectSavedScript = (content: string) => {
    setGeneratedContent(content);
    setShowSavedScripts(false);
  };

  // Mock content generators
  const generateHook = (topic: string, tone: string) => {
    const hooks = [
      `Did you know that ${topic} can transform your business in just 7 days?`,
      `The one thing about ${topic} that nobody is talking about...`,
      `I discovered a secret about ${topic} that changed everything.`,
      `Stop doing ${topic} wrong! Here's what the experts won't tell you.`,
      `3 reasons why your approach to ${topic} is costing you money.`,
    ];
    return hooks[Math.floor(Math.random() * hooks.length)];
  };

  const generateFullScript = (topic: string, niche: string, tone: string) => {
    return `# ${topic.toUpperCase()} - VIDEO SCRIPT

## INTRO (0:00 - 0:15)
[Open with attention-grabbing visual]
"Welcome to our deep dive into ${topic}. I'm going to show you three ways this is changing the ${niche} industry forever."

## MAIN POINT 1 (0:15 - 0:45)
"First, let's talk about the impact of ${topic} on customer engagement."
[Show statistics or case study visualization]
"Companies implementing these strategies have seen an average increase of 37% in customer retention."

## MAIN POINT 2 (0:45 - 1:15)
"The second key aspect is how ${topic} integrates with existing systems."
[Demonstrate integration visualization]
"This seamless connection means less downtime and more productivity for your team."

## MAIN POINT 3 (1:15 - 1:45)
"Finally, the cost-effectiveness of ${topic} cannot be overstated."
[Show cost comparison chart]
"Our analysis shows a potential 42% reduction in operational costs over the first year."

## CALL TO ACTION (1:45 - 2:00)
"Ready to transform your approach to ${topic}? Visit our website or click the link below to learn more."
[Show contact information and website]
"Don't forget to like and subscribe for more insights on ${niche} innovation."
`;
  };

  const generateCaption = (topic: string, tone: string) => {
    const captions = [
      `✨ Unlocking the secrets of ${topic} so you don't have to! #game_changer #must_watch`,
      `🔥 This ${topic} hack is about to make your life SO much easier! Drop a 💬 if you want more tips!`,
      `Anyone else obsessed with ${topic}? Just me? 😂 Sharing my top 3 tips that no one talks about!`,
      `POV: You discover that ${topic} isn't what you thought it was... 🤯 #mindblown`,
      `The ${topic} guide I wish I had when I started. Save this for later! ⭐`,
    ];
    return captions[Math.floor(Math.random() * captions.length)];
  };

  const generateHashtags = (topic: string, niche: string) => {
    const baseHashtags = ["trending", "viral", "2023", "learn", "tips", "howto"];
    const topicTags = topic.split(" ").map(word => word.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const nicheTags = [`${niche}tips`, `${niche}advice`, `${niche}community`];
    
    const allTags = [...baseHashtags, ...topicTags, ...nicheTags];
    const selectedTags = allTags
      .filter(tag => tag.length > 0)
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);
    
    return selectedTags.map(tag => `#${tag}`).join(" ");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="generator">
        <TabsList className="mb-4">
          <TabsTrigger value="generator">Create Script</TabsTrigger>
          <TabsTrigger value="saved" onClick={() => setShowSavedScripts(true)}>
            Saved Scripts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator">
          <Card>
            <CardHeader>
              <CardTitle>AI Script Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={scriptType} 
                onValueChange={(value) => setScriptType(value as ScriptType)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="hook">Hook Generator</TabsTrigger>
                  <TabsTrigger value="full">Full Script</TabsTrigger>
                  <TabsTrigger value="caption">Caption Rewriter</TabsTrigger>
                  <TabsTrigger value="hashtag">Hashtag Generator</TabsTrigger>
                </TabsList>
                
                <TabsContent value="hook">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create attention-grabbing hooks for your videos that make viewers stop scrolling.
                  </p>
                </TabsContent>
                
                <TabsContent value="full">
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a complete script for your video with intro, main points, and call to action.
                  </p>
                </TabsContent>
                
                <TabsContent value="caption">
                  <p className="text-sm text-muted-foreground mb-4">
                    Transform boring captions into engaging social media text that drives engagement.
                  </p>
                </TabsContent>
                
                <TabsContent value="hashtag">
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate relevant hashtags to increase the discoverability of your content.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic">Topic / Main Idea</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Social media marketing strategies"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="niche">Industry / Niche</Label>
                    <Select value={niche} onValueChange={setNiche}>
                      <SelectTrigger id="niche">
                        <SelectValue placeholder="Select niche" />
                      </SelectTrigger>
                      <SelectContent>
                        {niches.map((n) => (
                          <SelectItem key={n.value} value={n.value}>
                            {n.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tone">Tone of Voice</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger id="tone">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={!topic || generating}
                  className="w-full bg-smartvid-600 hover:bg-smartvid-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Script"
                  )}
                </Button>
              </div>

              {generatedContent && (
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="title">Script Title</Label>
                    <Input
                      id="title"
                      placeholder="Give your script a name to save it"
                      value={scriptTitle}
                      onChange={(e) => setScriptTitle(e.target.value)}
                    />
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Generated {scriptType === "hashtag" ? "Hashtags" : "Script"}</h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleCopy}>
                          <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleReset}>
                          <RefreshCw className="h-4 w-4 mr-1" /> Reset
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea 
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      className={`min-h-[200px] ${scriptType === "full" ? "font-mono text-sm" : ""}`}
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <p className="text-xs text-muted-foreground">
                AI-generated content may require editing to match your specific needs.
              </p>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSave}
                    disabled={saving || !user}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Download className="h-4 w-4 mr-1" /> Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="text-primary border-primary/30 hover:bg-primary/10"
                  >
                    <a href="https://app.aifreetextpro.com" target="_blank" rel="noopener noreferrer">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Humanize
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Scripts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScriptList onSelect={handleSelectSavedScript} type={showSavedScripts ? scriptType : undefined} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
