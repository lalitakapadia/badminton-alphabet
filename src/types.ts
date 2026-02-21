export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  current_stage_id: number;
}

export interface Stage {
  id: number;
  name: string;
  description: string;
}

export interface Skill {
  id: number;
  stage_id: number;
  name: string;
  description: string;
  level_1: string;
  level_2: string;
  level_3: string;
  level_4: string;
  level_5: string;
}

export interface Progress {
  user_id: number;
  skill_id: number;
  status: 'not_started' | 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5';
  updated_at: string;
}
