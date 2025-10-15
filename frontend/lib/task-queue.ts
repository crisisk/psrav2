/**
 * Task queue for background job processing
 */

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Task<T = any> {
  id: string;
  type: string;
  payload: T;
  status: TaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

class TaskQueue {
  private tasks: Map<string, Task> = new Map();
  private processing: boolean = false;

  async add<T>(type: string, payload: T): Promise<Task<T>> {
    const task: Task<T> = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      status: 'pending',
      createdAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.process();

    return task;
  }

  get(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  list(status?: TaskStatus): Task[] {
    const allTasks = Array.from(this.tasks.values());
    return status ? allTasks.filter(t => t.status === status) : allTasks;
  }

  private async process(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (true) {
      const pendingTask = Array.from(this.tasks.values())
        .find(t => t.status === 'pending');

      if (!pendingTask) break;

      try {
        pendingTask.status = 'processing';
        pendingTask.startedAt = new Date();

        // Execute task (mock implementation)
        await new Promise(resolve => setTimeout(resolve, 100));

        pendingTask.status = 'completed';
        pendingTask.completedAt = new Date();
      } catch (error) {
        pendingTask.status = 'failed';
        pendingTask.error = error instanceof Error ? error.message : 'Unknown error';
        pendingTask.completedAt = new Date();
      }
    }

    this.processing = false;
  }

  async waitFor(taskId: string, timeoutMs: number = 30000): Promise<Task> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const task = this.get(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.status === 'completed' || task.status === 'failed') {
        return task;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error('Task timeout');
  }

  async queueHumanReview(payload: any): Promise<string> {
    const task = await this.add('human_review', payload);
    return task.id;
  }

  async getQueueStats() {
    const allTasks = Array.from(this.tasks.values());
    return {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      processing: allTasks.filter(t => t.status === 'processing').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      failed: allTasks.filter(t => t.status === 'failed').length,
    };
  }
}

export const taskQueue = new TaskQueue();
export default taskQueue;
