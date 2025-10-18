import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import representativePrompts from "../prompts/representative-prompts";
import { writeSessionReport } from "../src/reportWriter";
import type { SessionLog } from "../src/types/session";

const prompt = representativePrompts.prompts[0];

describe("reportWriter", () => {
  it("writes a markdown report with key sections", async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "compare-test-"));

    const session: SessionLog = {
      metadata: {
        sessionId: "session-test",
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T00:10:00Z",
        promptCount: 1,
        domainsCovered: prompt.domains
      },
      runs: [
        {
          prompt,
          response: "Generated response",
          rating: 4,
          feedback: "Concise and helpful",
          startedAt: "2024-01-01T00:01:00Z",
          completedAt: "2024-01-01T00:02:00Z",
          durationMs: 60000,
          model: "openai/gpt-5",
          usage: { totalTokens: 42 }
        }
      ]
    };

    try {
      const filePath = await writeSessionReport({
        session,
        outputDir: tempDir,
        instructionDraft: "Sample instructions"
      });

      const markdown = readFileSync(filePath, "utf8");
      expect(markdown).toContain("## Prompt Reviews");
      expect(markdown).toContain(prompt.title);
      expect(markdown).toContain("Sample instructions");
      expect(markdown).toContain("## Next Steps");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
