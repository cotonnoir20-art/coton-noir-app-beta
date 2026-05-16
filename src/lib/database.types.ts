export type Profile = {
  id:                 string;
  name:               string;
  hair_type:          string;
  porosity:           string;
  density:            string;
  length:             string;
  objective:          string;
  target_length:      string;
  /** Date cible objectif longueur (YYYY-MM-DD). */
  target_goal_date?:  string;
  routine_type:       string;
  problematics:       string[];
  region:             string;
  climate:            string;
  budget:             string;
  coins:              number;
  streak:             number;
  last_routine_date:  string | null;
  created_at:         string;
  updated_at:         string;
};

export type CoinHistoryEntry = {
  id:         number;
  user_id:    string;
  label:      string;
  amount:     number;
  date:       string;
  created_at: string;
};

export type GrowthEntry = {
  id:         number;
  user_id:    string;
  date:       string;
  zone:       string;
  cm:         number;
  created_at: string;
};

export type RoutineLog = {
  id:           number;
  user_id:      string;
  routine_type: string;
  logged_at:    string;
};
