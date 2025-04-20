
export interface Template {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category: string;
  is_premium: boolean | null;
  created_at: string;
}

export type TemplateCategory = 'Marketing' | 'Social' | 'Education' | 'Business';
