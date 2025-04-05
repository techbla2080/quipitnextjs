// types/index.ts
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'done';
  category?: 'creative' | 'analytical' | 'routine';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  tags?: string[];
}