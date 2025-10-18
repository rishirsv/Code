import chalk from "chalk";
import prompts from "prompts";

import type { ComparisonResult, OpenRouterClient } from "./llmClient";
import type { PromptDefinition } from "./schemas/prompt";
import type { SessionLog } from "./types/session";

export interface ComparisonFlowOptions {
  session: SessionLog;
  client: OpenRouterClient;
  instructionDraft: string;
}

export interface DiffSummary {
  addedHighlights: string[];
  removedHighlights: string[];
}

export interface ComparisonFlowResult {
  prompt: PromptDefinition;
  systemInstructions: string;
  comparison: ComparisonResult;
  diff: DiffSummary;
}

export async function runComparisonFlow(
  options: ComparisonFlowOptions
): Promise<ComparisonFlowResult | null> {
  let continueLoop = true;
  let instructions = options.instructionDraft;
  let lastResult: ComparisonFlowResult | null = null;

  while (continueLoop) {
    const prompt = await selectPrompt(options.session);
    instructions = await maybeEditInstructions(instructions);

    const comparison = await options.client.compareWithInstructions({
      prompt,
      systemInstructions: instructions
    });

    const diff = summarizeDiff(comparison.baseline.output, comparison.customized.output);

    displayComparison(prompt, comparison, diff);

    lastResult = {
      prompt,
      systemInstructions: instructions,
      comparison,
      diff
    };

    const { again } = await prompts(
      {
        type: "confirm",
        name: "again",
        message: "Run another comparison?",
        initial: false
      },
      { onCancel: () => false }
    );

    continueLoop = Boolean(again);
    if (!continueLoop) {
      break;
    }

    const { updateInstructions } = await prompts(
      {
        type: "confirm",
        name: "updateInstructions",
        message: "Edit the instruction draft before the next comparison?",
        initial: false
      },
      { onCancel: () => false }
    );

    if (updateInstructions) {
      instructions = await maybeEditInstructions(instructions, true);
    }
  }

  return lastResult;
}

async function selectPrompt(session: SessionLog): Promise<PromptDefinition> {
  const choices = session.runs.map((run, index) => ({
    title: `${index + 1}. ${run.prompt.title} (rating ${run.rating})`,
    value: run.prompt
  }));

  const { selectedPrompt } = await prompts(
    {
      type: "select",
      name: "selectedPrompt",
      message: "Select a prompt to compare",
      choices
    },
    { onCancel: () => {
      throw new Error("Comparison aborted by user");
    } }
  );

  return selectedPrompt as PromptDefinition;
}

async function maybeEditInstructions(
  currentInstructions: string,
  forceEdit = false
): Promise<string> {
  if (!forceEdit) {
    const { edit } = await prompts(
      {
        type: "confirm",
        name: "edit",
        message: "Edit the custom instruction draft?",
        initial: false
      },
      { onCancel: () => false }
    );

    if (!edit) {
      return currentInstructions;
    }
  }

  const { instructions } = await prompts(
    {
      type: "text",
      name: "instructions",
      message: "Paste updated instructions",
      initial: currentInstructions
    },
    { onCancel: () => {
      throw new Error("Instruction edit cancelled");
    } }
  );

  return instructions as string;
}

function summarizeDiff(baseline: string, customized: string): DiffSummary {
  const baselineSentences = new Set(splitSentences(baseline));
  const customSentences = new Set(splitSentences(customized));

  const added: string[] = [];
  const removed: string[] = [];

  customSentences.forEach((sentence) => {
    if (!baselineSentences.has(sentence)) {
      added.push(sentence);
    }
  });

  baselineSentences.forEach((sentence) => {
    if (!customSentences.has(sentence)) {
      removed.push(sentence);
    }
  });

  return {
    addedHighlights: added.slice(0, 5),
    removedHighlights: removed.slice(0, 5)
  };
}

function displayComparison(
  prompt: PromptDefinition,
  comparison: ComparisonResult,
  diff: DiffSummary
): void {
  console.log("\n");
  console.log(chalk.bold(`Comparison for ${prompt.title}`));
  console.log(chalk.gray(`Domains: ${prompt.domains.join(", ")}`));

  console.log(chalk.yellow("\nBaseline Output:\n"));
  console.log(comparison.baseline.output.trim());

  console.log(chalk.green("\nCustom Instructions Output:\n"));
  console.log(comparison.customized.output.trim());

  if (diff.addedHighlights.length || diff.removedHighlights.length) {
    console.log(chalk.cyan("\nNotable changes:"));
    diff.addedHighlights.forEach((sentence) => console.log(chalk.green(`+ ${sentence}`)));
    diff.removedHighlights.forEach((sentence) => console.log(chalk.red(`- ${sentence}`)));
  }
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}
