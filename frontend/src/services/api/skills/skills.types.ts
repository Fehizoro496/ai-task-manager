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
