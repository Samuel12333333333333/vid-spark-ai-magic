
import { supabase } from "@/integrations/supabase/client";
import { Template } from "@/types/template";
import { toast } from "sonner";
import { videoService } from "./videoService";

export interface TemplateVariable {
  name: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'color';
  description: string;
  required: boolean;
  default?: string;
}

export interface TemplateDetails extends Template {
  variables?: TemplateVariable[];
  templateData: any; // The actual template JSON
}

export const templateService = {
  async getTemplates(): Promise<Template[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }
      
      return data as Template[];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      throw error;
    }
  },
  
  async getTemplateById(id: string): Promise<TemplateDetails | null> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error(`Error fetching template with id ${id}:`, error);
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // Get the actual template JSON data
      const { data: templateData, error: templateError } = await supabase
        .from('template_data')
        .select('template_json, variables')
        .eq('template_id', id)
        .single();
      
      if (templateError || !templateData) {
        console.error(`Error fetching template data for template ${id}:`, templateError);
        return {
          ...data as Template,
          templateData: null
        };
      }
      
      return {
        ...data as Template,
        templateData: templateData.template_json,
        variables: templateData.variables
      };
    } catch (error) {
      console.error('Error in getTemplateById:', error);
      return null;
    }
  },
  
  async createVideoFromTemplate(
    templateId: string, 
    templateVariables: Record<string, string>,
    userId: string
  ): Promise<{ success: boolean; videoId?: string; error?: string }> {
    try {
      // Get the template details
      const template = await this.getTemplateById(templateId);
      if (!template || !template.templateData) {
        return { success: false, error: "Template not found or invalid" };
      }
      
      // Create a copy of the template data to modify
      const templateData = JSON.parse(JSON.stringify(template.templateData));
      
      // Apply the template variables
      if (templateData.merge && Array.isArray(templateData.merge)) {
        // Update the merge fields in the template with the provided values
        templateData.merge.forEach((mergeField: any) => {
          const variableName = mergeField.find.replace(/[{}]/g, '');
          if (templateVariables[variableName]) {
            mergeField.replace = templateVariables[variableName];
          }
        });
      }
      
      // Create a project entry
      const project = await videoService.createProject({
        title: templateVariables.HEADLINE || template.name,
        prompt: templateVariables.VOICEOVER || "Generated from template",
        user_id: userId,
        status: "pending",
        style: "template",
        has_audio: Boolean(templateData.timeline?.soundtrack || 
                          templateData.merge?.some((m: any) => m.find === "VOICEOVER")),
        has_captions: Boolean(templateData.timeline?.subtitles || 
                            templateData.timeline?.tracks?.some((t: any) => 
                              t.clips?.some((c: any) => c.asset?.type === "caption")))
      });
      
      if (!project) {
        return { success: false, error: "Failed to create project" };
      }
      
      // Generate the video using the processed template
      console.log("Starting render with template");
      const { success, renderId, error } = await videoService.startRender(
        project.id,
        templateVariables.VOICEOVER || "Generated from template",
        "template",
        [], // No scenes needed with template
        true, // Use audio if available in template
        true, // Use captions if available in template
        undefined,
        undefined,
        templateData // Pass the processed template
      );
      
      if (!success || !renderId) {
        return { success: false, error: error || "Failed to start rendering" };
      }
      
      // Update the project with the template info
      await videoService.updateProject(project.id, {
        render_id: renderId,
        status: "processing",
      });
      
      return { success: true, videoId: project.id };
    } catch (error) {
      console.error("Error creating video from template:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
  
  // Create a new template from provided data
  async createTemplate(
    name: string,
    description: string,
    category: string,
    thumbnailUrl: string,
    templateData: any,
    variables: TemplateVariable[] = []
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      // First, create the template record
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .insert({
          name,
          description,
          category: category.toLowerCase(),
          thumbnail: thumbnailUrl,
          is_premium: false
        })
        .select()
        .single();
        
      if (templateError || !template) {
        console.error('Error creating template:', templateError);
        return { success: false, error: templateError?.message || "Failed to create template" };
      }
      
      // Then, store the template data
      const { error: dataError } = await supabase
        .from('template_data')
        .insert({
          template_id: template.id,
          template_json: templateData,
          variables
        });
        
      if (dataError) {
        console.error('Error storing template data:', dataError);
        // Try to clean up the template if data storage failed
        await supabase.from('templates').delete().eq('id', template.id);
        return { success: false, error: dataError.message };
      }
      
      return { success: true, templateId: template.id };
    } catch (error) {
      console.error('Error in createTemplate:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
};
