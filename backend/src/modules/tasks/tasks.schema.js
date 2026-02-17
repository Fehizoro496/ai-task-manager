const { z } = require("zod");

// Map lowercase frontend status values to Prisma enum values
const statusMap = {
  todo: "TODO",
  in_progress: "IN_PROGRESS",
  in_review: "IN_REVIEW",
  done: "DONE",
};

const normalizeStatus = (val) => {
  if (!val) return val;
  return statusMap[val.toLowerCase()] || val;
};

const statusEnum = z
  .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "todo", "in_progress", "in_review", "done"])
  .transform(normalizeStatus);

// Used for POST /tasks (requires storyId)
const createTaskSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().nullish(),
    storyId: z.string().uuid().nullish(),
    story_id: z.string().uuid().nullish(),
    position: z.number().int().nullish(),
    priority: z.string().nullish(),
    status: statusEnum.nullish(),
  })
  .refine((data) => data.storyId || data.story_id, {
    message: "storyId or story_id is required",
  })
  .transform((data) => ({
    title: data.title,
    description: data.description || undefined,
    storyId: data.storyId || data.story_id,
    position: data.position ?? undefined,
    priority: data.priority || undefined,
    status: data.status || undefined,
  }));

// Used for POST /projects/:projectId/tasks (storyId optional)
const createTaskForProjectSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().nullish(),
    storyId: z.string().uuid().nullish(),
    story_id: z.string().uuid().nullish(),
    position: z.number().int().nullish(),
    priority: z.string().nullish(),
    status: statusEnum.nullish(),
  })
  .transform((data) => ({
    title: data.title,
    description: data.description || undefined,
    storyId: data.storyId || data.story_id || undefined,
    position: data.position ?? undefined,
    priority: data.priority || undefined,
    status: data.status || undefined,
  }));

const updateTaskSchema = z
  .object({
    title: z.string().min(1).nullish(),
    description: z.string().nullish(),
    status: statusEnum.nullish(),
    position: z.number().int().nullish(),
    order: z.number().int().nullish(),
    priority: z.string().nullish(),
    assigneeId: z.string().uuid().nullish(),
    assignee_id: z.string().uuid().nullish(),
    labels: z.array(z.string()).nullish(),
    dueDate: z.string().nullish(),
    due_date: z.string().nullish(),
  })
  .transform((data) => {
    const result = {};
    if (data.title !== undefined) result.title = data.title;
    if (data.description !== undefined) result.description = data.description;
    if (data.status !== undefined) result.status = data.status;
    if (data.priority !== undefined) result.priority = data.priority;

    // position: accept 'order' as alias for 'position'
    const pos = data.position ?? data.order;
    if (pos !== undefined) result.position = pos;

    // assigneeId: accept snake_case alias
    const assignee = data.assigneeId ?? data.assignee_id;
    if (assignee !== undefined) result.assigneeId = assignee;

    if (data.labels !== undefined) result.labels = data.labels;

    // dueDate: accept snake_case alias
    const due = data.dueDate ?? data.due_date;
    if (due !== undefined) result.dueDate = due ? new Date(due) : null;

    return result;
  });

const moveTaskSchema = z
  .object({
    status: statusEnum,
    order: z.number().int().optional(),
    position: z.number().int().optional(),
  })
  .transform((data) => ({
    status: data.status,
    position: data.position ?? data.order ?? 0,
  }));

module.exports = { createTaskSchema, createTaskForProjectSchema, updateTaskSchema, moveTaskSchema };
