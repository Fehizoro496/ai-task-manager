export const endpoints = {
  auth: {
    me: () => "/api/auth/me",
    updateMe: () => "/api/auth/me",
    githubInit: () => "/api/auth/github",
    githubCallback: () => "/api/auth/github/callback",
    githubStatus: (state: string) => `/api/auth/github/status/${state}`,
  },

  projects: {
    root: () => "/api/projects",
    byId: (id: string) => `/api/projects/${id}`,
    tasks: (projectId: string) => `/api/projects/${projectId}/tasks`,
    reorderTasks: (projectId: string) =>
      `/api/projects/${projectId}/tasks/reorder`,
  },

  epics: {
    root: () => "/api/epics",
    byId: (id: string) => `/api/epics/${id}`,
    listByProject: (projectId: string) =>
      `/api/epics?projectId=${encodeURIComponent(projectId)}`,
  },

  stories: {
    root: () => "/api/stories",
    byId: (id: string) => `/api/stories/${id}`,
    listByEpic: (epicId: string) =>
      `/api/stories?epicId=${encodeURIComponent(epicId)}`,
  },

  tasks: {
    root: () => "/api/tasks",
    byId: (id: string) => `/api/tasks/${id}`,
    listByStory: (storyId: string) =>
      `/api/tasks?storyId=${encodeURIComponent(storyId)}`,
    move: (id: string) => `/api/tasks/${id}/move`,
    assign: (id: string) => `/api/tasks/${id}/assign`,
  },

  ai: {
    generatePlan: () => "/api/ai/generate-plan",
    drafts: () => "/api/ai/drafts",
    draftById: (id: string) => `/api/ai/drafts/${id}`,
    approveDraft: (id: string) => `/api/ai/drafts/${id}/approve`,
    rejectDraft: (id: string) => `/api/ai/drafts/${id}/reject`,
    listDraftsByProject: (projectId: string) =>
      `/api/ai/drafts?projectId=${encodeURIComponent(projectId)}`,
  },

  admin: {
    users: () => "/api/admin/users",
    listUsers: (status?: string) =>
      status
        ? `/api/admin/users?status=${encodeURIComponent(status)}`
        : "/api/admin/users",
    approveUser: (id: string) => `/api/admin/users/${id}/approve`,
    rejectUser: (id: string) => `/api/admin/users/${id}/reject`,
    projectMembers: (projectId: string) =>
      `/api/admin/projects/${projectId}/members`,
    projectMember: (projectId: string, userId: string) =>
      `/api/admin/projects/${projectId}/members/${userId}`,
  },

  notifications: {
    root: () => "/api/notifications",
    markRead: (id: string) => `/api/notifications/${id}/read`,
    markAllRead: () => "/api/notifications/read-all",
  },

  users: {
    root: () => "/api/users",
    byId: (id: string) => `/api/users/${id}`,
  },

  chat: {
    conversations: () => "/api/chat/conversations",
    messages: (conversationId: string) =>
      `/api/chat/conversations/${conversationId}/messages`,
  },
} as const;
