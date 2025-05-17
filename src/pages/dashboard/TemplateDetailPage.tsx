import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { templateService, TemplateDetails, TemplateVariable } from "@/services/templateService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Play, AlertCircle, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<TemplateDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    async function loadTemplate() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const templateData = await templateService.getTemplateById(id);
        setTemplate(templateData);
      } catch (error) {
        console.error("Error loading template:", error);
        toast.error("Failed to load template details");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTemplate();
  }, [id]);
  
  // Create a dynamic form schema based on template variables
  const createFormSchema = (variables?: TemplateVariable[]) => {
    if (!variables || variables.length === 0) {
      return z.object({
        HEADLINE: z.string().optional(),
        VOICEOVER: z.string().optional()
      });
    }
    
    const schemaFields: Record<string, any> = {};
    
    variables.forEach(variable => {
      if (variable.required) {
        schemaFields[variable.name] = z.string().min(1, { message: `${variable.name} is required` });
      } else {
        schemaFields[variable.name] = z.string().optional();
      }
    });
    
    // Ensure we have at least HEADLINE and VOICEOVER fields for most templates
    if (!schemaFields.HEADLINE) {
      schemaFields.HEADLINE = z.string().optional();
    }
    
    if (!schemaFields.VOICEOVER) {
      schemaFields.VOICEOVER = z.string().optional();
    }
    
    return z.object(schemaFields);
  };
  
  const formSchema = createFormSchema(template?.variables);
  
  // Set up form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      HEADLINE: "",
      VOICEOVER: ""
    }
  });
  
  // Submit handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!template || !id) {
      toast.error("Template information is missing");
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be signed in to create videos");
        return;
      }
      
      // Generate video from template
      const result = await templateService.createVideoFromTemplate(
        id,
        values,
        user.id
      );
      
      if (result.success && result.videoId) {
        toast.success("Video generation started", {
          description: "You'll be notified when it's ready"
        });
        
        // Navigate to the video details page
        navigate(`/dashboard/videos/${result.videoId}`);
      } else {
        toast.error("Failed to generate video", {
          description: result.error || "An unknown error occurred"
        });
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast.error("Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Set form defaults when template loads
  useEffect(() => {
    if (template?.variables) {
      const defaultValues: Record<string, string> = {};
      
      template.variables.forEach(variable => {
        if (variable.default) {
          defaultValues[variable.name] = variable.default;
        }
      });
      
      form.reset(defaultValues);
    }
  }, [template, form]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!template) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Template Not Found
          </CardTitle>
          <CardDescription>
            The template you're looking for doesn't exist or has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => navigate('/dashboard/templates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Extract merge variables from template data to show in form
  const getMergeVariables = (): string[] => {
    const vars = new Set<string>();
    
    // If we have explicit variables, use those
    if (template.variables && template.variables.length > 0) {
      template.variables.forEach(v => vars.add(v.name));
      return Array.from(vars);
    }
    
    // Otherwise try to extract from template data
    try {
      if (template.templateData?.merge && Array.isArray(template.templateData.merge)) {
        template.templateData.merge.forEach((item: any) => {
          if (item.find) {
            vars.add(item.find.replace(/[{}]/g, ''));
          }
        });
      }
    } catch (error) {
      console.error("Error extracting variables:", error);
    }
    
    return Array.from(vars);
  };
  
  const mergeVariables = getMergeVariables();
  
  return (
    <div className="space-y-6">
      <Helmet>
        <title>{template.name} | SmartVid</title>
      </Helmet>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{template.name}</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={template.thumbnail || "/placeholder.svg"}
                alt={template.name}
                className="h-full w-full object-cover"
              />
            </div>
            <CardHeader className="pb-2">
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Category:</span>
                  <span className="text-sm">{template.category}</span>
                </div>
                {template.is_premium && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Type:</span>
                    <span className="text-sm text-amber-500 font-semibold">Premium</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customize Template</CardTitle>
              <CardDescription>
                Fill in the details below to personalize your video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Dynamic fields based on template variables */}
                  {mergeVariables.map((variable) => {
                    // Find variable definition if available
                    const varDef = template.variables?.find(v => v.name === variable);
                    
                    const isMultiline = varDef?.type === 'text' && 
                      (variable === 'VOICEOVER' || variable.includes('TEXT') || variable.includes('SCRIPT'));
                    
                    return (
                      <FormField
                        key={variable}
                        control={form.control}
                        name={variable as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {varDef?.description || variable}
                              {varDef?.required && <span className="text-red-500 ml-1">*</span>}
                            </FormLabel>
                            <FormControl>
                              {isMultiline ? (
                                <Textarea
                                  {...field}
                                  placeholder={`Enter ${varDef?.description || variable.toLowerCase()}`}
                                  className={variable === 'VOICEOVER' ? "min-h-32" : ""}
                                />
                              ) : (
                                <Input
                                  {...field}
                                  placeholder={`Enter ${varDef?.description || variable.toLowerCase()}`}
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                  
                  <Button type="submit" className="w-full" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Generate Video
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
