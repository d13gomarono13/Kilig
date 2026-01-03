import { Task } from '../types/index.js';

export class TaskQueue {
  private queue: Task[] = [];
  private taskMap: Map<string, Task> = new Map();

  add(task: Task): void {
    if (this.taskMap.has(task.id)) {
      // Update existing task if re-queued
      const existingIndex = this.queue.findIndex(t => t.id === task.id);
      if (existingIndex !== -1) {
        this.queue[existingIndex] = task;
      } else {
        this.queue.push(task);
      }
    } else {
      this.queue.push(task);
    }
    this.taskMap.set(task.id, task);
    // Sort logic could go here (e.g., priority)
  }

  async getNext(): Promise<Task | undefined> {
    return this.queue.shift();
  }

  getById(id: string): Task | undefined {
    return this.taskMap.get(id);
  }

  size(): number {
    return this.queue.length;
  }
}
