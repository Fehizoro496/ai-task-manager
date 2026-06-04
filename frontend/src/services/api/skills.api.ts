import { apiClient } from "./client";
import { endpoints } from "./endpoints";

export interface Skill {
  id: string;
  name: string;
}

export interface UserSkill {
  skillId: string;
  name: string;
  level: number; // 1..5
  source: "manual" | "derived";
}

export const skillsApi = {
  listAll: () => apiClient.get<{ skills: Skill[] }>(endpoints.skills.root()),

  listForUser: (userId: string) =>
    apiClient.get<{ skills: UserSkill[] }>(endpoints.skills.forUser(userId)),

  addOrUpdate: (userId: string, name: string, level: number) =>
    apiClient.post<{ skills: UserSkill[] }>(endpoints.skills.forUser(userId), {
      name,
      level,
    }),

  remove: (userId: string, skillId: string) =>
    apiClient.delete<{ skills: UserSkill[] }>(
      endpoints.skills.userSkill(userId, skillId),
    ),
};
