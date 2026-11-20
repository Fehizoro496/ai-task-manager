export const skillsEndpoints = {
  root: () => "/api/skills",
  bootstrap: () => "/api/skills/bootstrap",
  forUser: (userId: string) => `/api/skills/users/${userId}`,
  userSkill: (userId: string, skillId: string) =>
    `/api/skills/users/${userId}/${skillId}`,
} as const;
