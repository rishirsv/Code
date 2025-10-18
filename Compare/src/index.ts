#!/usr/bin/env node
import "dotenv/config";

import chalk from "chalk";
import prompts from "prompts";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { OpenRouterClient, ensureOpenRouterConfig } from "./llmClient";
import { selectPrompts } from "./promptLoader";
import { PromptDomain } from "./schemas/prompt";
import { runInteractiveSession } from "./interaction";
import { synthesizeInstructions } from "./instructionSynthesizer";
import { runComparisonFlow } from "./comparator";
import { writeSessionReport } from "./reportWriter";

interface CliOptions {
  limit?: number;
  domains?: PromptDomain[];
  styleTags?: string[];
  outputDir: string;
  autoAdvance?: boolean;
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = { outputDir: path.resolve(process.cwd(), "output") };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--limit" && argv[i + 1]) {
      options.limit = Number.parseInt(argv[i + 1], 10);
      i += 1;
    } else if (arg === "--domains" && argv[i + 1]) {
      options.domains = argv[i + 1].split(",").filter(Boolean) as PromptDomain[];
      i += 1;
    } else if (arg === "--styles" && argv[i + 1]) {
      options.styleTags = argv[i + 1].split(",").map((tag) => tag.trim());
      i += 1;
    } else if (arg === "--output" && argv[i + 1]) {
      options.outputDir = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
    } else if (arg === "--auto" || arg === "--auto-advance") {
      options.autoAdvance = true;
    }
  }
  return options;
}

function createSessionId(): string {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
  return `session-${timestamp}`;
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));

  try {
    ensureOpenRouterConfig();
  } catch (error) {
    console.error(chalk.red((error as Error).message));
    process.exitCode = 1;
    return;
  }

  const client = new OpenRouterClient();

  const prompts = selectPrompts({
    limit: options.limit,
    domains: options.domains,
    styleTags: options.styleTags,
    shuffle: true
  });

  const sessionId = createSessionId();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outputDir = options.outputDir ?? path.resolve(__dirname, "../output");

  console.log(chalk.cyan(`Starting Compare CLI session ${sessionId}`));
  console.log(
    chalk.gray(
      `Loaded ${prompts.length} prompts across domains: ${Array.from(
        new Set(prompts.flatMap((prompt) => prompt.domains))
      ).join(", ")}`
    )
  );

  const sessionLog = await runInteractiveSession({
    prompts,
    client,
    sessionId,
    outputDir,
    autoAdvance: options.autoAdvance
  });

  const synthesis = synthesizeInstructions(sessionLog);

  console.log("\n" + chalk.bold("Session Summary"));
  console.log(chalk.gray(`Average rating: ${synthesis.analysis.averageRating.toFixed(2)}`));
  if (synthesis.analysis.topStyleTags.length) {
    console.log(chalk.gray(`Preferred styles: ${synthesis.analysis.topStyleTags.join(", ")}`));
  }
  if (synthesis.analysis.topDomains.length) {
    console.log(chalk.gray(`Preferred domains: ${synthesis.analysis.topDomains.join(", ")}`));
  }
  const topPrompts = [...sessionLog.runs]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  if (topPrompts.length) {
    console.log(chalk.gray("Top-rated prompts:"));
    topPrompts.forEach((run) => {
      console.log(
        chalk.gray(
          `  - ${run.prompt.title} — rating ${run.rating} (${run.prompt.domains.join(", ")})`
        )
      );
    });
  }

  console.log("\n" + chalk.bold("Draft Custom Instructions:"));
  console.log(synthesis.instructions);

  let comparisonResult: Awaited<ReturnType<typeof runComparisonFlow>> = null;
  const { runComparison } = await prompts(
    {
      type: "confirm",
      name: "runComparison",
      message: "Test these instructions against a previous prompt?",
      initial: true
    },
    { onCancel: () => false }
  );

  if (runComparison) {
    comparisonResult = await runComparisonFlow({
      session: sessionLog,
      client,
      instructionDraft: synthesis.instructions
    });
  }

  const reportPath = await writeSessionReport({
    session: sessionLog,
    outputDir,
    instructionDraft: synthesis.instructions,
    comparison: comparisonResult?.comparison
  });

  console.log("\n" + chalk.green(`Session saved to ${reportPath}`));
}

main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exitCode = 1;
});
