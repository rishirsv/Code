import { randomBytes } from "crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import representativePrompts from "../prompts/representative-prompts";
import {
  PromptCatalog,
  PromptCatalogSchema,
  PromptDefinition,
  PromptDefinitionSchema,
  PromptDomain
} from "./schemas/prompt";

export interface PromptLoaderOptions {
  domains?: PromptDomain[];
  styleTags?: string[];
  limit?: number;
  shuffle?: boolean;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function resolvePromptPath(relativePath: string): string {
  return path.resolve(__dirname, "../", relativePath);
}

export async function loadPromptCatalogFromFile(filePath: string): Promise<PromptCatalog> {
  try {
    const fileContent = await readFile(filePath, "utf8");
    const parsed = JSON.parse(fileContent) as unknown;
    return validatePromptCatalog(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while reading prompt catalog";
    throw new Error(`Failed to load prompt catalog from ${filePath}: ${message}`);
  }
}

export function validatePromptCatalog(catalog: unknown): PromptCatalog {
  const parsed = PromptCatalogSchema.safeParse(catalog);
  if (!parsed.success) {
    throw new Error(`Invalid prompt catalog: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validatePrompt(prompt: unknown): PromptDefinition {
  const parsed = PromptDefinitionSchema.safeParse(prompt);
  if (!parsed.success) {
    throw new Error(`Invalid prompt definition: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function loadPromptCatalog(options: { catalog?: PromptCatalog } = {}): PromptCatalog {
  const catalog = options.catalog ?? representativePrompts;
  return validatePromptCatalog(catalog);
}

export function selectPrompts(
  options: PromptLoaderOptions = {},
  catalogOverride?: PromptCatalog
): PromptDefinition[] {
  const catalog = loadPromptCatalog({ catalog: catalogOverride });
  let pool = [...catalog.prompts];

  if (options.domains && options.domains.length > 0) {
    const domainSet = new Set(options.domains);
    pool = pool.filter((prompt) => prompt.domains.some((domain) => domainSet.has(domain)));
  }

  if (options.styleTags && options.styleTags.length > 0) {
    const wanted = options.styleTags.map((tag) => tag.toLowerCase());
    pool = pool.filter((prompt) =>
      prompt.styleTags.some((tag) => wanted.includes(tag.toLowerCase()))
    );
  }

  if (options.shuffle) {
    pool = shuffle(pool);
  }

  if (options.limit && options.limit > 0) {
    pool = pool.slice(0, options.limit);
  }

  if (pool.length === 0) {
    throw new Error("No prompts matched the requested filters");
  }

  return pool.map((prompt) => validatePrompt(prompt));
}

export function groupPromptsByDomain(prompts: PromptDefinition[]): Record<PromptDomain, PromptDefinition[]> {
  return prompts.reduce<Record<PromptDomain, PromptDefinition[]>>((acc, prompt) => {
    prompt.domains.forEach((domain) => {
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(prompt);
    });
    return acc;
  }, {} as Record<PromptDomain, PromptDefinition[]>);
}

function shuffle<T>(input: T[]): T[] {
  const copy = [...input];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomBytes(2).readUInt16BE() % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
