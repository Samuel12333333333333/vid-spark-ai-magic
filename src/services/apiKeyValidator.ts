
import { supabase } from "@/integrations/supabase/client";

export interface ApiKeyStatus {
  name: string;
  key: string;
  isValid: boolean;
  errorMessage?: string;
}

export type ApiKeyName = 'pexels' | 'gemini' | 'shotstack' | 'elevenlabs';

/**
 * Service for validating API keys
 */
export const apiKeyValidator = {
  /**
   * Test if a specific API key is valid by making a lightweight request to the service
   */
  async validateApiKey(apiName: ApiKeyName): Promise<ApiKeyStatus> {
    console.log(`Validating ${apiName} API key`);
    
    try {
      let isValid = false;
      let errorMessage = "";
      
      switch(apiName) {
        case 'pexels':
          // Test Pexels API with a simple query
          const pexelsResult = await supabase.functions.invoke('search-videos', {
            body: { keywords: ["test"], limit: 1 }
          });
          
          isValid = !pexelsResult.error && 
                   pexelsResult.data && 
                   Array.isArray(pexelsResult.data.videos);
                   
          if (pexelsResult.error) {
            errorMessage = `Error: ${pexelsResult.error.message || 'API request failed'}`;
          } else if (!isValid) {
            errorMessage = "Invalid or missing API key";
          }
          break;
          
        case 'gemini':
          // Test Gemini API with a minimal prompt
          const geminiResult = await supabase.functions.invoke('generate-scenes', {
            body: { prompt: "Short test scene" }
          });
          
          isValid = !geminiResult.error && 
                   geminiResult.data && 
                   Array.isArray(geminiResult.data.scenes);
                   
          if (geminiResult.error) {
            errorMessage = `Error: ${geminiResult.error.message || 'API request failed'}`;
          } else if (!isValid) {
            errorMessage = "Invalid or missing API key";
          }
          break;
          
        case 'shotstack':
          // Test Shotstack API with direct validation method
          const shotstackResult = await supabase.functions.invoke('test-shotstack', {
            body: { direct: true }
          });
          
          isValid = !shotstackResult.error && 
                   shotstackResult.data && 
                   shotstackResult.data.success === true;
          
          if (shotstackResult.error) {
            errorMessage = `Error: ${shotstackResult.error.message || 'API request failed'}`;
          } else if (!isValid) {
            errorMessage = "Invalid or missing API key";
          }
          break;
          
        case 'elevenlabs':
          // Test ElevenLabs API with a minimal text
          const elevenLabsResult = await supabase.functions.invoke('generate-audio', {
            body: { 
              text: "This is a test",
              voice: "alloy"
            }
          });
          
          isValid = !elevenLabsResult.error && 
                   elevenLabsResult.data && 
                   (elevenLabsResult.data.success === true || elevenLabsResult.data.audioContent);
          
          if (elevenLabsResult.error) {
            errorMessage = `Error: ${elevenLabsResult.error.message || 'API request failed'}`;
          } else if (!isValid) {
            errorMessage = "Invalid or missing API key";
          }
          break;
          
        default:
          errorMessage = "Unknown API service";
      }
      
      return {
        name: apiName,
        key: `${apiName.toUpperCase()}_API_KEY`,
        isValid,
        errorMessage: isValid ? undefined : errorMessage
      };
      
    } catch (error) {
      console.error(`Error validating ${apiName} API key:`, error);
      return {
        name: apiName,
        key: `${apiName.toUpperCase()}_API_KEY`,
        isValid: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  
  /**
   * Validate all required API keys for the video generation pipeline
   */
  async validateAllApiKeys(): Promise<Record<ApiKeyName, ApiKeyStatus>> {
    const results: Partial<Record<ApiKeyName, ApiKeyStatus>> = {};
    
    // Define the API keys to validate
    const apiKeys: ApiKeyName[] = ['pexels', 'gemini', 'shotstack', 'elevenlabs'];
    
    // Validate each API key
    for (const apiName of apiKeys) {
      results[apiName] = await this.validateApiKey(apiName);
    }
    
    return results as Record<ApiKeyName, ApiKeyStatus>;
  },
  
  /**
   * Check if all required API keys are valid
   */
  async areAllApiKeysValid(): Promise<boolean> {
    const validationResults = await this.validateAllApiKeys();
    // Explicitly type each result as ApiKeyStatus to ensure isValid property is recognized
    return Object.values(validationResults).every((result: ApiKeyStatus) => result.isValid);
  },
  
  /**
   * Generate a help message for missing or invalid API keys
   */
  generateHelpMessage(validationResults: Record<ApiKeyName, ApiKeyStatus>): string {
    const invalidKeys = Object.values(validationResults).filter((result: ApiKeyStatus) => !result.isValid);
    
    if (invalidKeys.length === 0) {
      return "All API keys are valid.";
    }
    
    const keyList = invalidKeys.map(key => key.key).join(', ');
    
    return `The following API keys are missing or invalid: ${keyList}. Please set them in your Supabase project's environment variables.`;
  }
};

export default apiKeyValidator;
