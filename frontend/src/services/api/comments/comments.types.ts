export interface TaskComment {
  id: string;
  taskId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}
