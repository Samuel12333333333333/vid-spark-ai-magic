
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Template } from "@/types/template";

export function useTemplates(category?: string) {
  return useQuery({
    queryKey: ['templates', category],
    queryFn: async () => {
      let query = supabase
        .from('templates')
        .select('*');
        
      if (category && category !== 'all') {
        query = query.eq('category', category.toLowerCase());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching templates:", error);
        throw error;
      }
      
      return data as Template[];
    },
  });
}
