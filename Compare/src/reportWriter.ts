import { access, constants as fsConstants, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ComparisonResult } from "./llmClient";
import type { SessionLog } from "./types/session";

export interface ReportWriterOptions {
  session: SessionLog;
  outputDir: string;
  instructionDraft?: string;
  comparison?: ComparisonResult;
  filename?: string;
}

export async function writeSessionReport(options: ReportWriterOptions): Promise<string> {
  await mkdir(options.outputDir, { recursive: true });

  const filename = `${options.filename ?? options.session.metadata.sessionId}.md`;
  const targetPath = path.join(options.outputDir, filename);
  const filePath = await resolveUniquePath(targetPath);
  const markdown = buildMarkdown(options);

  await writeFile(filePath, markdown, "utf8");
  return filePath;
}

function buildMarkdown(options: ReportWriterOptions): string {
  const { session, instructionDraft, comparison } = options;
  const averageRating = calculateAverageRating(session);

  const lines: string[] = [];
  lines.push(`# Compare Session Report — ${session.metadata.sessionId}`);
  lines.push("");
  lines.push(`- Started: ${session.metadata.startedAt}`);
  lines.push(`- Completed: ${session.metadata.completedAt ?? "in-progress"}`);
  lines.push(`- Prompts reviewed: ${session.metadata.promptCount}`);
  lines.push(`- Domains covered: ${session.metadata.domainsCovered.join(", ")}`);
  lines.push(`- Average rating: ${averageRating.toFixed(2)}`);
  lines.push("");

  lines.push("## Prompt Reviews");
  lines.push("");
  session.runs.forEach((run, index) => {
    lines.push(`### ${index + 1}. ${run.prompt.title}`);
    lines.push(`- Rating: ${run.rating}`);
    lines.push(`- Domains: ${run.prompt.domains.join(", ")}`);
    lines.push(`- Style: ${run.prompt.styleTags.join(", ")}`);
    lines.push(`- Goal: ${run.prompt.goal}`);
    lines.push(`- Model: ${run.model}`);
    if (run.usage?.totalTokens) {
      lines.push(`- Tokens: ${run.usage.totalTokens}`);
    }
    if (run.feedback) {
      lines.push(`- Feedback: ${run.feedback}`);
    }
    if (run.notes?.length) {
      lines.push("- Notes:");
      run.notes.forEach((note) => lines.push(`  - ${note}`));
    }
    lines.push("");
    lines.push("#### Prompt Text");
    lines.push("```markdown");
    lines.push(run.prompt.prompt.trim());
    lines.push("```");
    lines.push("");
    lines.push("#### Model Output");
    lines.push("```markdown");
    lines.push(run.response.trim() || "(no response captured)");
    lines.push("```");
    lines.push("");
  });

  if (instructionDraft) {
    lines.push("## Synthesized Custom Instructions");
    lines.push("");
    lines.push("```markdown");
    lines.push(instructionDraft.trim());
    lines.push("```");
    lines.push("");
  }

  if (comparison) {
    lines.push("## Baseline vs Custom Comparison");
    lines.push("");
    lines.push(`Prompt: **${comparison.promptId}**`);
    lines.push("");
    lines.push("### Baseline Output");
    lines.push("```markdown");
    lines.push(comparison.baseline.output.trim());
    lines.push("```");
    lines.push("");
    lines.push("### Custom Instructions Output");
    lines.push("```markdown");
    lines.push(comparison.customized.output.trim());
    lines.push("```");
    lines.push("");
  }

  lines.push("## Next Steps");
  lines.push("");
  lines.push("- Iterate on the instruction draft after additional sessions or domains.");
  lines.push("- Re-run the comparison flow when preferences change or new prompts are added.");
  lines.push("- Update your GPT-5 custom instructions in OpenRouter based on the draft above.");
  lines.push("");

  return lines.join("\n");
}

function calculateAverageRating(session: SessionLog): number {
  if (session.runs.length === 0) {
    return 0;
  }
  const total = session.runs.reduce((sum, run) => sum + run.rating, 0);
  return total / session.runs.length;
}

async function resolveUniquePath(targetPath: string): Promise<string> {
  const parsed = path.parse(targetPath);
  let candidate = targetPath;
  let attempt = 0;

  do {
    try {
      await access(candidate, fsConstants.F_OK);
      attempt += 1;
      candidate = path.join(parsed.dir, `${parsed.name}-${attempt}${parsed.ext}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return candidate;
      }
      throw error;
    }
  } while (attempt <= 1000);

  throw new Error("Unable to determine a unique filename for session report");
}
