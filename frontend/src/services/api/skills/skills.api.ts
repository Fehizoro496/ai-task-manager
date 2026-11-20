import { apiClient } from "../core";
import { skillsEndpoints } from "./skills.endpoints";
import type { Skill, UserSkill } from "./skills.types";

export const skillsApi = {
  listAll: () => apiClient.get<{ skills: Skill[] }>(skillsEndpoints.root()),

  listForUser: (userId: string) =>
    apiClient.get<{ skills: UserSkill[] }>(skillsEndpoints.forUser(userId)),

  addOrUpdate: (userId: string, name: string, level: number) =>
    apiClient.post<{ skills: UserSkill[] }>(skillsEndpoints.forUser(userId), {
      name,
      level,
    }),

  remove: (userId: string, skillId: string) =>
    apiClient.delete<{ skills: UserSkill[] }>(
      skillsEndpoints.userSkill(userId, skillId),
    ),
};
