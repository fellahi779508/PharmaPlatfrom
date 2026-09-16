export type Todo = {
  id: number;
  title: string;
  description: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  user?: any;
  tasks?: any[];
};

export type CreateTodo = {
  title: string;
  description: string;
  status?: boolean;
};

export type UpdateTodo = Partial<CreateTodo>;
