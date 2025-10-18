import chalk from "chalk";
import { performance } from "node:perf_hooks";
import prompts from "prompts";

import type { GenerateResult, OpenRouterClient } from "./llmClient";
import type { PromptDefinition } from "./schemas/prompt";
import type { PromptRunLog, SessionLog } from "./types/session";

export interface InteractiveSessionOptions {
  prompts: PromptDefinition[];
  client: OpenRouterClient;
  sessionId: string;
  outputDir: string;
  autoAdvance?: boolean;
}

export interface InteractiveSessionResult extends SessionLog {}

interface RatingAnswers {
  rating: number;
  feedback?: string;
}

type PromptAction = "rate" | "regenerate" | "showPrompt" | "addNote" | "replay" | "skip";

const promptsOnCancel = () => {
  throw new Error("Session cancelled by user");
};

export async function runInteractiveSession(
  options: InteractiveSessionOptions
): Promise<InteractiveSessionResult> {
  const sessionStart = new Date().toISOString();
  const runs: PromptRunLog[] = [];

  for (const [index, promptDef] of options.prompts.entries()) {
    console.log("\n");
    console.log(chalk.bold(`Prompt ${index + 1}/${options.prompts.length}: ${promptDef.title}`));
    console.log(chalk.gray(promptDef.description));
    console.log(
      chalk.gray(
        `Domains: ${promptDef.domains.join(", ")} | Style: ${promptDef.styleTags.join(", ")}`
      )
    );

    if (!options.autoAdvance) {
      const { proceed } = await prompts(
        {
          type: "confirm",
          name: "proceed",
          message: "Generate a response now?",
          initial: true
        },
        { onCancel: promptsOnCancel }
      );

      if (!proceed) {
        console.log(chalk.yellow("Skipped by user."));
        continue;
      }
    }

    const run = await reviewPromptRun(options.client, promptDef);
    runs.push(run);
  }

  const sessionComplete = new Date().toISOString();
  const domainsCovered = Array.from(new Set(runs.flatMap((run) => run.prompt.domains)));

  return {
    metadata: {
      sessionId: options.sessionId,
      startedAt: sessionStart,
      completedAt: sessionComplete,
      promptCount: runs.length,
      domainsCovered
    },
    runs
  };
}

async function reviewPromptRun(
  client: OpenRouterClient,
  promptDef: PromptDefinition
): Promise<PromptRunLog> {
  let currentResult = await requestPromptCompletion(client, promptDef);
  const notes: string[] = [];
  let ratingAnswers: RatingAnswers | null = null;
  const runStart = performance.now();
  const startedAtIso = new Date().toISOString();

  while (!ratingAnswers) {
    replayModelOutput(currentResult.output);
    const action = await askForNextAction();

    if (action === "rate") {
      ratingAnswers = await askForRating();
      break;
    }

    if (action === "regenerate") {
      currentResult = await requestPromptCompletion(client, promptDef);
      continue;
    }

    if (action === "showPrompt") {
      console.log(chalk.magenta("\nPrompt Body:\n"));
      console.log(promptDef.prompt);
      continue;
    }

    if (action === "addNote") {
      const note = await collectNote();
      if (note) {
        notes.push(note);
        console.log(chalk.green("Note added."));
      }
      continue;
    }

    if (action === "replay") {
      continue;
    }

    if (action === "skip") {
      const completedAtIso = new Date().toISOString();
      const durationMs = performance.now() - runStart;
      return {
        prompt: promptDef,
        response: "",
        rating: 0,
        feedback: "Skipped by user",
        notes,
        startedAt: startedAtIso,
        completedAt: completedAtIso,
        durationMs,
        model: currentResult.model,
        usage: currentResult.usage
      };
    }
  }

  const completedAtIso = new Date().toISOString();
  const durationMs = performance.now() - runStart;

  return {
    prompt: promptDef,
    response: currentResult.output,
    rating: ratingAnswers?.rating ?? 0,
    feedback: ratingAnswers?.feedback,
    notes: notes.length > 0 ? notes : undefined,
    startedAt: startedAtIso,
    completedAt: completedAtIso,
    durationMs,
    model: currentResult.model,
    usage: currentResult.usage
  };
}

async function requestPromptCompletion(
  client: OpenRouterClient,
  promptDef: PromptDefinition
): Promise<GenerateResult> {
  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt < 3) {
    try {
      return await client.generate({
        messages: [
          {
            role: "system",
            content:
              "You are GPT-5, producing concise yet comprehensive answers tailored to the user's goal."
          },
          { role: "user", content: promptDef.prompt }
        ],
        promptMetadata: promptDef
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(chalk.red(`OpenRouter request failed: ${lastError.message}`));

      const { retry } = await prompts(
        {
          type: "confirm",
          name: "retry",
          message: "Retry this prompt?",
          initial: true
        },
        { onCancel: promptsOnCancel }
      );

      if (!retry) {
        break;
      }

      attempt += 1;
    }
  }

  throw lastError ?? new Error("Failed to generate response");
}

async function askForRating(): Promise<RatingAnswers> {
  const answers = await prompts(
    [
      {
        type: "number",
        name: "rating",
        message: "Rate the response (1-5)",
        float: false,
        min: 1,
        max: 5,
        validate: (value: number) =>
          Number.isInteger(value) && value >= 1 && value <= 5
            ? true
            : "Enter a rating between 1 and 5"
      },
      {
        type: "text",
        name: "feedback",
        message: "Optional qualitative feedback (press enter to skip)",
        initial: ""
      }
    ],
    { onCancel: promptsOnCancel }
  );

  return {
    rating: answers.rating,
    feedback: answers.feedback?.trim() || undefined
  };
}

async function askForNextAction(): Promise<PromptAction> {
  const { action } = await prompts(
    {
      type: "select",
      name: "action",
      message: "Select next action",
      choices: [
        { title: "Rate & continue", value: "rate" },
        { title: "Regenerate response", value: "regenerate" },
        { title: "Show prompt text", value: "showPrompt" },
        { title: "Add a personal note", value: "addNote" },
        { title: "Replay output", value: "replay" },
        { title: "Skip this prompt", value: "skip" }
      ]
    },
    { onCancel: promptsOnCancel }
  );

  return action as PromptAction;
}

async function collectNote(): Promise<string | undefined> {
  const { note } = await prompts(
    {
      type: "text",
      name: "note",
      message: "Add a note about this response",
      initial: ""
    },
    { onCancel: promptsOnCancel }
  );

  return note?.trim() ? note.trim() : undefined;
}

function replayModelOutput(output: string): void {
  console.log(chalk.cyan("\nModel Output:\n"));
  console.log(output.trim());
  console.log("\n");
}
