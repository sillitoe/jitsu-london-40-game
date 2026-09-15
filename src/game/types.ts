export type Grade =
  | "white"
  | "yellow"
  | "orange"
  | "green"
  | "purple"
  | "lightBlue"
  | "darkBlue"
  | "brown"
  | "black";

export type PromptInput = "LEFT" | "DOWN" | "RIGHT" | "X";
export type PlayableSenseiId = "marianne" | "garvey";

export type TimingJudgement = "PERFECT" | "GOOD" | "LATE" | "MISS";

export type TechniquePhaseId = "tsukuri" | "kuzushi" | "kake";
export type TechniquePhaseMode = "timing" | "mash" | "sequence";

export interface RhythmWindow {
  perfectMs: number;
  goodMs: number;
  lateMs: number;
}

export interface BeatPrompt {
  atMs: number;
  input: PromptInput;
}

export interface RhythmPattern {
  id: string;
  situation: string;
  instructorCallout: string;
  result: string;
  prompts: BeatPrompt[];
}

export interface TechniquePhase {
  id: TechniquePhaseId;
  mode: TechniquePhaseMode;
  name: string;
  focus: string;
  camera: string;
  instructorCallout: string;
  result: string;
  failResult: string;
  prompts: BeatPrompt[];
  failOnBadTiming: boolean;
  durationMs?: number;
  timingWindow?: RhythmWindow;
  mashInputs?: PromptInput[];
  mashTarget?: number;
}

export interface TechniqueRound {
  id: string;
  grade: Grade;
  gradingTitle: string;
  attack: string;
  technique: string;
  kakeAdvice: string;
  steveIntro?: string;
  phases: TechniquePhase[];
}
