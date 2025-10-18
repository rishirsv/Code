import type { PromptDefinition } from "../schemas/prompt";

export interface PromptRunLog {
  prompt: PromptDefinition;
  response: string;
  rating: number;
  feedback?: string;
  notes?: string[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
  model: string;
  usage?: {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface SessionPreferences {
  toneKeywords: string[];
  structureNotes: string[];
  detailPreferences: string[];
  dislikes: string[];
}

export interface SessionMetadata {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  promptCount: number;
  domainsCovered: string[];
}

export interface SessionLog {
  metadata: SessionMetadata;
  runs: PromptRunLog[];
  preferences?: SessionPreferences;
  instructionDraft?: string;
}
