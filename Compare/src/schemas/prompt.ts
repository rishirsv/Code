import { z } from "zod";

export const promptDomains = [
  "professional",
  "personal",
  "fitness",
  "relationships",
  "creativity",
  "learning",
  "wellness"
] as const;

export type PromptDomain = (typeof promptDomains)[number];

export const PromptDefinitionSchema = z.object({
  id: z.string().min(1, "Prompt id is required"),
  title: z.string().min(1, "Prompt title is required"),
  description: z.string().min(1, "Prompt description is required"),
  goal: z.string().min(1, "Prompt goal is required"),
  prompt: z.string().min(1, "Prompt body is required"),
  domains: z.array(z.enum(promptDomains)).nonempty(),
  styleTags: z.array(z.string().min(1)).nonempty(),
  tone: z.string().optional(),
  metadata: z
    .object({
      estimatedTokens: z.number().int().positive().optional(),
      conversationType: z.enum(["single-turn", "multi-turn", "streaming"]).optional()
    })
    .optional()
});

export type PromptDefinition = z.infer<typeof PromptDefinitionSchema>;

export const PromptCatalogSchema = z.object({
  version: z.string().default("0.1"),
  prompts: z.array(PromptDefinitionSchema)
});

export type PromptCatalog = z.infer<typeof PromptCatalogSchema>;
