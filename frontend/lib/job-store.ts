// Shared job store for async processes
export const jobStore = new Map<string, {
  status: 'processing' | 'completed' | 'failed';
  result?: any
}>();
