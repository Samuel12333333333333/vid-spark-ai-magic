
import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  plan_type: string;
  total_videos: number;
  storage_used_mb: number;
  last_login: string | null;
  is_active: boolean;
}

export interface RenderLog {
  id: string;
  user_id: string;
  video_project_id: string | null;
  render_id: string | null;
  status: string;
  template_name: string | null;
  duration: number | null;
  error_message: string | null;
  error_code: string | null;
  retry_count: number;
  started_at: string;
  completed_at: string | null;
  user_email?: string;
}

export interface UserQuota {
  id: string;
  user_id: string;
  plan_type: string;
  monthly_limit: number;
  current_usage: number;
  storage_limit_mb: number;
  storage_used_mb: number;
  reset_date: string;
}

export interface AnalyticsData {
  totalUsers: number;
  totalRenders: number;
  successRate: number;
  storageUsed: number;
  dailyRenders: Array<{ date: string; count: number; }>;
  planDistribution: Array<{ plan: string; count: number; }>;
  topTemplates: Array<{ template: string; count: number; }>;
}

class AdminService {
  async getAllUsers(filters?: { plan?: string; search?: string }): Promise<AdminUser[]> {
    let query = supabase
      .from("profiles")
      .select(`
        id,
        email,
        created_at,
        user_quotas (
          plan_type,
          current_usage,
          storage_used_mb
        ),
        user_activity (
          created_at,
          activity_type
        )
      `);

    const { data: profiles, error } = await query;

    if (error) throw error;

    // Transform the data
    const users: AdminUser[] = profiles?.map(profile => {
      const quota = profile.user_quotas?.[0];
      const lastLogin = profile.user_activity
        ?.filter(activity => activity.activity_type === 'login')
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]?.created_at;

      return {
        id: profile.id,
        email: profile.email || 'No email',
        created_at: profile.created_at,
        plan_type: quota?.plan_type || 'free',
        total_videos: quota?.current_usage || 0,
        storage_used_mb: quota?.storage_used_mb || 0,
        last_login: lastLogin || null,
        is_active: true
      };
    }) || [];

    // Apply filters
    let filteredUsers = users;
    if (filters?.plan) {
      filteredUsers = filteredUsers.filter(user => user.plan_type === filters.plan);
    }
    if (filters?.search) {
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    return filteredUsers;
  }

  async getRenderLogs(filters?: { 
    userId?: string; 
    status?: string; 
    dateFrom?: string; 
    dateTo?: string; 
  }): Promise<RenderLog[]> {
    let query = supabase
      .from("render_logs")
      .select(`
        *,
        profiles!inner(email)
      `)
      .order('started_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte('started_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('started_at', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data?.map(log => ({
      ...log,
      user_email: log.profiles?.email
    })) || [];
  }

  async getUserQuotas(): Promise<UserQuota[]> {
    const { data, error } = await supabase
      .from("user_quotas")
      .select("*")
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateUserQuota(userId: string, updates: Partial<UserQuota>): Promise<void> {
    const { error } = await supabase
      .from("user_quotas")
      .update(updates)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async resetUserQuota(userId: string): Promise<void> {
    const { data, error } = await supabase.rpc('reset_user_quota', {
      target_user_id: userId
    });

    if (error) throw error;
  }

  async suspendUser(userId: string): Promise<void> {
    // Update user quota to suspended status
    const { error } = await supabase
      .from("user_quotas")
      .update({ monthly_limit: 0 })
      .eq('user_id', userId);

    if (error) throw error;
  }

  async retryRender(renderId: string): Promise<void> {
    const { error } = await supabase
      .from("render_logs")
      .update({ 
        status: 'pending',
        retry_count: supabase.sql`retry_count + 1`
      })
      .eq('id', renderId);

    if (error) throw error;
  }

  async deleteRender(renderId: string): Promise<void> {
    const { error } = await supabase
      .from("render_logs")
      .delete()
      .eq('id', renderId);

    if (error) throw error;
  }

  async getAnalytics(): Promise<AnalyticsData> {
    // Get total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true });

    // Get total renders
    const { count: totalRenders } = await supabase
      .from("render_logs")
      .select("*", { count: 'exact', head: true });

    // Get success rate
    const { count: successfulRenders } = await supabase
      .from("render_logs")
      .select("*", { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get storage usage
    const { data: storageData } = await supabase
      .from("user_quotas")
      .select("storage_used_mb");

    const totalStorage = storageData?.reduce((sum, quota) => sum + (quota.storage_used_mb || 0), 0) || 0;

    // Get daily renders for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyRenderData } = await supabase
      .from("render_logs")
      .select("started_at")
      .gte('started_at', thirtyDaysAgo.toISOString());

    // Process daily render data
    const dailyRenders = this.processDailyRenderData(dailyRenderData || []);

    // Get plan distribution
    const { data: planData } = await supabase
      .from("user_quotas")
      .select("plan_type");

    const planDistribution = this.processPlanDistribution(planData || []);

    // Get top templates
    const { data: templateData } = await supabase
      .from("render_logs")
      .select("template_name")
      .not('template_name', 'is', null);

    const topTemplates = this.processTopTemplates(templateData || []);

    return {
      totalUsers: totalUsers || 0,
      totalRenders: totalRenders || 0,
      successRate: totalRenders ? ((successfulRenders || 0) / totalRenders) * 100 : 0,
      storageUsed: totalStorage,
      dailyRenders,
      planDistribution,
      topTemplates
    };
  }

  private processDailyRenderData(data: any[]): Array<{ date: string; count: number; }> {
    const renderCounts: { [key: string]: number } = {};
    
    data.forEach(render => {
      const date = new Date(render.started_at).toISOString().split('T')[0];
      renderCounts[date] = (renderCounts[date] || 0) + 1;
    });

    return Object.entries(renderCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }

  private processPlanDistribution(data: any[]): Array<{ plan: string; count: number; }> {
    const planCounts: { [key: string]: number } = {};
    
    data.forEach(quota => {
      const plan = quota.plan_type || 'free';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    return Object.entries(planCounts).map(([plan, count]) => ({ plan, count }));
  }

  private processTopTemplates(data: any[]): Array<{ template: string; count: number; }> {
    const templateCounts: { [key: string]: number } = {};
    
    data.forEach(render => {
      const template = render.template_name || 'Unknown';
      templateCounts[template] = (templateCounts[template] || 0) + 1;
    });

    return Object.entries(templateCounts)
      .map(([template, count]) => ({ template, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 templates
  }
}

export const adminService = new AdminService();
