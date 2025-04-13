export interface StringItem {
  id: string;
  key: string;
  value: string;
}

export interface Proposal {
  id: string;
  value: string;
  note?: string;
  score: number;
  status?: "accurate" | "inaccurate";
  user?: {
    id: string;
  };
}
