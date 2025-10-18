import { SessionLog } from "./types/session";

export interface InstructionSynthesisAnalysis {
  averageRating: number;
  topDomains: string[];
  topStyleTags: string[];
  likedAttributes: string[];
  dislikedAttributes: string[];
}

export interface InstructionSynthesisResult {
  instructions: string;
  analysis: InstructionSynthesisAnalysis;
}

const POSITIVE_KEYWORDS = new Map<string, string>([
  ["concise", "Keep answers concise"],
  ["clear", "Favor clear wording"],
  ["actionable", "Deliver actionable next steps"],
  ["structured", "Use structured formatting"],
  ["empathetic", "Maintain an empathetic tone"],
  ["balanced", "Balance high-level summary with specifics"],
  ["creative", "Include creative flourishes when appropriate"],
  ["detailed", "Provide sufficient detail"]
]);

const NEGATIVE_KEYWORDS = new Map<string, string>([
  ["verbose", "Avoid unnecessary verbosity"],
  ["repetitive", "Do not repeat yourself"],
  ["generic", "Stay away from generic platitudes"],
  ["unclear", "Make sure guidance is unambiguous"],
  ["pushy", "Avoid a pushy sales tone"],
  ["dry", "Inject warmth when possible"],
  ["jargon", "Limit heavy jargon unless user requests"]
]);

export function synthesizeInstructions(session: SessionLog): InstructionSynthesisResult {
  const styleScores = new Map<string, number>();
  const domainScores = new Map<string, number>();
  const likedAttributes = new Set<string>();
  const dislikedAttributes = new Set<string>();

  session.runs.forEach((run) => {
    const weight = Math.max(run.rating, 0.5);
    run.prompt.styleTags.forEach((tag) => {
      styleScores.set(tag, (styleScores.get(tag) ?? 0) + weight);
    });
    run.prompt.domains.forEach((domain) => {
      domainScores.set(domain, (domainScores.get(domain) ?? 0) + weight);
    });

    const feedbackBlob = [run.feedback, ...(run.notes ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (feedbackBlob.length === 0) {
      return;
    }

    POSITIVE_KEYWORDS.forEach((message, keyword) => {
      if (feedbackBlob.includes(keyword)) {
        likedAttributes.add(message);
      }
    });

    NEGATIVE_KEYWORDS.forEach((message, keyword) => {
      if (feedbackBlob.includes(keyword)) {
        dislikedAttributes.add(message);
      }
    });
  });

  const analysis: InstructionSynthesisAnalysis = {
    averageRating: calculateAverageRating(session),
    topDomains: topEntries(domainScores, 3),
    topStyleTags: topEntries(styleScores, 5),
    likedAttributes: Array.from(likedAttributes),
    dislikedAttributes: Array.from(dislikedAttributes)
  };

  const instructions = buildInstructionBlock(session, analysis);

  return { instructions, analysis };
}

function buildInstructionBlock(
  session: SessionLog,
  analysis: InstructionSynthesisAnalysis
): string {
  const bullet = (items: string[]) => items.map((item) => `- ${item}`).join("\n");
  const styleGuidance = analysis.topStyleTags.length
    ? `Blend the following stylistic traits: ${analysis.topStyleTags.join(", ")}.`
    : "Adopt a confident but approachable tone.";
  const domainContext = analysis.topDomains.length
    ? `Anchor examples in these domains when relevant: ${analysis.topDomains.join(", ")}.`
    : "Use relevant personal and professional examples.";

  const liked = analysis.likedAttributes.length
    ? bullet(Array.from(analysis.likedAttributes))
    : "- Emphasize clarity, empathy, and actionability.";
  const disliked = analysis.dislikedAttributes.length
    ? bullet(Array.from(analysis.dislikedAttributes))
    : "- Avoid generic filler, jargon, or meandering responses.";

  const cadence =
    session.runs.filter((run) => run.rating >= 4).length >= session.runs.length / 2
      ? "Provide confident recommendations with optional nuance for edge cases."
      : "Confirm understanding with a brief summary before delivering recommendations.";

  return [
    "Tone & Personality:",
    styleGuidance,
    domainContext,
    "",
    "Structure:",
    "- Start with a one-sentence outcome summary.",
    "- Follow with 3-5 bullet points that cover actions, rationale, and cautions.",
    "- Close with an optional reflection or next-step question.",
    "",
    "Detail Preferences:",
    liked,
    "",
    "Avoid:",
    disliked,
    "",
    "Interaction Style:",
    cadence
  ].join("\n");
}

function topEntries(map: Map<string, number>, limit: number): string[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function calculateAverageRating(session: SessionLog): number {
  if (session.runs.length === 0) {
    return 0;
  }
  const total = session.runs.reduce((sum, run) => sum + run.rating, 0);
  return total / session.runs.length;
}
