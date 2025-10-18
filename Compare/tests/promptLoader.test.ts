import { describe, expect, it } from "@jest/globals";

import representativePrompts from "../prompts/representative-prompts";
import { groupPromptsByDomain, selectPrompts } from "../src/promptLoader";

describe("promptLoader", () => {
  it("filters prompts by domain", () => {
    const fitnessPrompts = selectPrompts({ domains: ["fitness"], shuffle: false });
    expect(fitnessPrompts.length).toBeGreaterThan(0);
    expect(fitnessPrompts.every((prompt) => prompt.domains.includes("fitness"))).toBe(true);
  });

  it("filters prompts by style tag", () => {
    const empatheticPrompts = selectPrompts({ styleTags: ["empathetic"], shuffle: false });
    expect(empatheticPrompts.length).toBeGreaterThan(0);
    expect(empatheticPrompts.every((prompt) => prompt.styleTags.includes("empathetic"))).toBe(
      true
    );
  });

  it("groups prompts by domain", () => {
    const prompts = representativePrompts.prompts.slice(0, 3);
    const grouped = groupPromptsByDomain(prompts);
    Object.keys(grouped).forEach((domain) => {
      expect(grouped[domain].every((prompt) => prompt.domains.includes(domain))).toBe(true);
    });
  });
});
