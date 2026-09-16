export type Task = {
  id: number;
  title: string;
  description?: string;
  priority?: string;
  startDate?: string;
  startTime?: string;
  isFinished: boolean;
  createdAt: string;
  updatedAt: string;
  todo?: any;
};

export type CreateTask = {
  title: string;
  description?: string;
  todoId: number;
  isFinished?: boolean;
  priority?: string;
  startDate?: string;
  startTime?: string;
};

export type UpdateTask = Partial<CreateTask>;
