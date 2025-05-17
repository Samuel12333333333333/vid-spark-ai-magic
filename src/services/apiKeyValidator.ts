
import { supabase } from "@/integrations/supabase/client";
import { showErrorToast, withRetry } from "@/lib/error-handler";

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
          const pexelsResult = await withRetry(() => supabase.functions.invoke('search-videos', {
            body: { keywords: ["test"], limit: 1 }
          }), {
            maxRetries: 1,
            delayMs: 1000,
            retryOnlyIf: (err) => !err.message?.includes("Authentication")
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
          const geminiResult = await withRetry(() => supabase.functions.invoke('generate-scenes', {
            body: { prompt: "Short test scene" }
          }), {
            maxRetries: 1,
            delayMs: 1000,
            retryOnlyIf: (err) => !err.message?.includes("Authentication") && !err.message?.includes("API key")
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
          const shotstackResult = await withRetry(() => supabase.functions.invoke('test-shotstack', {
            body: { direct: true }
          }), {
            maxRetries: 2,
            delayMs: 1000
          });
          
          // New validation logic for Shotstack
          if (shotstackResult.error) {
            isValid = false;
            errorMessage = `Error: ${shotstackResult.error.message || 'API request failed'}`;
            console.error("Shotstack validation error:", shotstackResult.error);
          } else if (!shotstackResult.data) {
            isValid = false;
            errorMessage = "No data returned from Shotstack API";
            console.error("Shotstack validation: no data returned");
          } else {
            // Check for success field in response
            isValid = shotstackResult.data.success === true;
            
            if (!isValid) {
              errorMessage = shotstackResult.data.message || "Invalid Shotstack API key";
              console.error("Shotstack validation failed:", shotstackResult.data);
            } else {
              console.log("Shotstack API key is valid");
            }
          }
          break;
          
        case 'elevenlabs':
          // Test ElevenLabs API with a minimal text
          const elevenLabsResult = await withRetry(() => supabase.functions.invoke('generate-audio', {
            body: { 
              text: "This is a test",
              voice: "alloy"
            }
          }), {
            maxRetries: 1,
            delayMs: 1000,
            retryOnlyIf: (err) => !err.message?.includes("Authentication") && !err.message?.includes("API key")
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
    
    console.log("API key validation results:", results);
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
    
    const keyList = invalidKeys.map(key => `${key.key} (${key.errorMessage || 'Invalid'})`).join(', ');
    
    return `The following API keys are missing or invalid: ${keyList}. Please set them in your Supabase project's environment variables.`;
  }
};

export default apiKeyValidator;
