export type { StringItem } from "@/lib/api-client";

export interface Proposal {
  id: number;
  value: string;
  note?: string;
  score: number;
  status?: "accurate" | "inaccurate";
  user?: {
    id: string;
  };
}
