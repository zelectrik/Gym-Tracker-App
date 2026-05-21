import type { ExecutionMode, ExerciseSide } from "../types";

export const sideLabels: Record<ExerciseSide, string> = {
  BOTH: "bilatéral",
  LEFT: "gauche",
  RIGHT: "droite",
};

export const modeLabels: Record<ExecutionMode, string> = {
  BILATERAL: "bilatéral",
  LEFT_RIGHT: "gauche puis droite",
};
