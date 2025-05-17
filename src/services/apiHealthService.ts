
import { supabase } from "@/integrations/supabase/client";
import { apiKeyValidator, ApiKeyStatus } from "./apiKeyValidator";
import { showErrorToast, withRetry } from "@/lib/error-handler";

interface ApiHealth {
  shotstack: {
    isHealthy: boolean;
    lastChecked: Date | null;
    errorMessage?: string;
    creditsRemaining?: number;
  };
  pexels: {
    isHealthy: boolean;
    lastChecked: Date | null;
    errorMessage?: string;
  };
  gemini: {
    isHealthy: boolean;
    lastChecked: Date | null;
    errorMessage?: string;
  };
  elevenlabs: {
    isHealthy: boolean;
    lastChecked: Date | null;
    errorMessage?: string;
  };
}

// Add quota information to health tracking
interface QuotaInfo {
  used: number;
  limit: number;
  resetAt?: Date;
  isExceeded: boolean;
}

const DEFAULT_HEALTH: ApiHealth = {
  shotstack: { isHealthy: false, lastChecked: null },
  pexels: { isHealthy: false, lastChecked: null },
  gemini: { isHealthy: false, lastChecked: null },
  elevenlabs: { isHealthy: false, lastChecked: null }
};

/**
 * Service to track and check the health of external APIs
 */
export const apiHealthService = {
  healthStatus: {...DEFAULT_HEALTH} as ApiHealth,
  quotaInfo: null as QuotaInfo | null,
  
  /**
   * Check the health of the Shotstack API specifically
   */
  async checkShotstackHealth(): Promise<boolean> {
    try {
      console.log("Checking Shotstack API health");
      
      // First validate the API key is working
      const shotstackResult = await withRetry(() => supabase.functions.invoke('test-shotstack', {
        body: { direct: true }
      }), {
        maxRetries: 1,
        delayMs: 1000
      });
      
      if (shotstackResult.error) {
        console.error("Shotstack API health check failed:", shotstackResult.error);
        this.healthStatus.shotstack = {
          isHealthy: false,
          lastChecked: new Date(),
          errorMessage: shotstackResult.error.message
        };
        return false;
      }
      
      // Check if we got a success response
      if (!shotstackResult.data || shotstackResult.data.success !== true) {
        console.error("Shotstack API key validation failed:", shotstackResult.data?.message || "Unknown error");
        this.healthStatus.shotstack = {
          isHealthy: false,
          lastChecked: new Date(),
          errorMessage: shotstackResult.data?.message || "API key validation failed"
        };
        return false;
      }
      
      // If we have credit information, store it
      if (shotstackResult.data?.data?.response?.credits) {
        this.healthStatus.shotstack.creditsRemaining = shotstackResult.data.data.response.credits;
      }
      
      // API is healthy
      this.healthStatus.shotstack = {
        isHealthy: true,
        lastChecked: new Date(),
        creditsRemaining: this.healthStatus.shotstack.creditsRemaining
      };
      
      console.log("Shotstack API is healthy");
      return true;
    } catch (error) {
      console.error("Error checking Shotstack health:", error);
      this.healthStatus.shotstack = {
        isHealthy: false,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      return false;
    }
  },
  
  /**
   * Check user's video quota and update health status
   */
  async checkUserQuota(): Promise<QuotaInfo | null> {
    try {
      const { data, error } = await withRetry(() => 
        supabase.functions.invoke("get_video_usage"),
        { maxRetries: 1, delayMs: 1000 }
      );
      
      if (error) {
        console.error("Error checking video usage quota:", error);
        return null;
      }
      
      if (!data) {
        console.log("No quota data returned");
        return null;
      }
      
      // Check subscription for correct limits
      const { data: subscriptionData } = await supabase.functions.invoke("check-subscription");
      const subscription = subscriptionData?.subscription;
      const hasActiveSubscription = subscription && subscription.status === 'active';
      const isPro = hasActiveSubscription && subscription?.plan_name?.toLowerCase().includes('pro');
      const isBusiness = hasActiveSubscription && subscription?.plan_name?.toLowerCase().includes('business');
      
      // Set limit based on subscription tier
      const limit = hasActiveSubscription 
        ? isPro 
          ? 20 
          : isBusiness 
            ? 50 
            : 2 // Free tier
        : 2; // Default free tier
      
      const quotaInfo: QuotaInfo = {
        used: data.count || 0,
        limit,
        resetAt: data.reset_at ? new Date(data.reset_at) : undefined,
        isExceeded: (data.count || 0) >= limit
      };
      
      this.quotaInfo = quotaInfo;
      return quotaInfo;
    } catch (error) {
      console.error("Error checking quota:", error);
      return null;
    }
  },
  
  /**
   * Check the health status of all APIs
   */
  async checkAllApiHealth(): Promise<ApiHealth> {
    try {
      // Start with validating all API keys
      const validationResults = await apiKeyValidator.validateAllApiKeys();
      
      // Update health status based on validation results
      Object.entries(validationResults).forEach(([key, result]) => {
        const apiKey = key as keyof ApiHealth;
        if (this.healthStatus[apiKey]) {
          this.healthStatus[apiKey] = {
            isHealthy: result.isValid,
            lastChecked: new Date(),
            errorMessage: result.isValid ? undefined : result.errorMessage
          };
        }
      });
      
      // For Shotstack, perform an additional detailed health check
      if (validationResults.shotstack?.isValid) {
        await this.checkShotstackHealth();
      }
      
      // Check user quota as part of health check
      await this.checkUserQuota();
      
      return this.healthStatus;
    } catch (error) {
      console.error("Error checking API health:", error);
      return this.healthStatus;
    }
  },
  
  /**
   * Check if an API is healthy, optionally performing a fresh check
   */
  async isApiHealthy(apiName: keyof ApiHealth, forceCheck: boolean = false): Promise<boolean> {
    // If we need to force a check or haven't checked yet
    if (forceCheck || !this.healthStatus[apiName].lastChecked) {
      if (apiName === 'shotstack') {
        return await this.checkShotstackHealth();
      } else {
        // For other APIs, just validate the API key
        const result = await apiKeyValidator.validateApiKey(apiName);
        this.healthStatus[apiName] = {
          isHealthy: result.isValid,
          lastChecked: new Date(),
          errorMessage: result.isValid ? undefined : result.errorMessage
        };
        return result.isValid;
      }
    }
    
    // Return cached health status
    return this.healthStatus[apiName].isHealthy;
  },
  
  /**
   * Check if user has remaining quota for video creation
   */
  async hasRemainingQuota(forceCheck: boolean = false): Promise<boolean> {
    if (forceCheck || !this.quotaInfo) {
      const quota = await this.checkUserQuota();
      return quota ? !quota.isExceeded : true; // Default to true if check fails
    }
    return !this.quotaInfo.isExceeded;
  },
  
  /**
   * Get health summary for all APIs
   */
  getHealthSummary(): string {
    const healthySummary = Object.entries(this.healthStatus)
      .map(([key, status]) => {
        const apiKey = key as keyof ApiHealth;
        const apiStatus = status as ApiHealth[keyof ApiHealth];
        
        const lastChecked = apiStatus.lastChecked 
          ? apiStatus.lastChecked.toLocaleTimeString() 
          : 'never';
        
        return `${key}: ${apiStatus.isHealthy ? '✅' : '❌'} (checked: ${lastChecked})`;
      })
      .join(', ');
    
    // Add quota information to summary if available
    const quotaSummary = this.quotaInfo 
      ? `Quota: ${this.quotaInfo.used}/${this.quotaInfo.limit} ${this.quotaInfo.isExceeded ? '❌' : '✅'}`
      : '';
      
    return healthySummary + (quotaSummary ? `, ${quotaSummary}` : '');
  }
};
