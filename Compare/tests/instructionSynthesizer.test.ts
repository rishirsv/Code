import { describe, expect, it } from "@jest/globals";

import representativePrompts from "../prompts/representative-prompts";
import { synthesizeInstructions } from "../src/instructionSynthesizer";
import type { SessionLog } from "../src/types/session";

const samplePromptA = representativePrompts.prompts.find((prompt) =>
  prompt.domains.includes("professional")
);
const samplePromptB = representativePrompts.prompts.find((prompt) =>
  prompt.domains.includes("wellness")
);

if (!samplePromptA || !samplePromptB) {
  throw new Error("Sample prompts missing for tests");
}

describe("instructionSynthesizer", () => {
  it("builds instruction draft using top-rated prompts", () => {
    const session: SessionLog = {
      metadata: {
        sessionId: "test-session",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        promptCount: 2,
        domainsCovered: ["professional", "wellness"]
      },
      runs: [
        {
          prompt: samplePromptA,
          response: "Example response",
          rating: 5,
          feedback: "Very structured and clear",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: 1200,
          model: "openai/gpt-5",
          usage: { totalTokens: 50 }
        },
        {
          prompt: samplePromptB,
          response: "Another response",
          rating: 3,
          feedback: "A bit verbose but empathetic",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: 900,
          model: "openai/gpt-5",
          usage: { totalTokens: 45 }
        }
      ]
    };

    const result = synthesizeInstructions(session);

    expect(result.analysis.topDomains).toContain("professional");
    expect(result.analysis.topStyleTags.length).toBeGreaterThan(0);
    expect(result.instructions).toMatch(/Tone & Personality/);
    expect(result.instructions).toMatch(/Structure:/);
  });
});
