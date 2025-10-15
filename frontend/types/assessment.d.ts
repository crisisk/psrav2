export interface Assessment {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: Date;
  standard: string;
}
