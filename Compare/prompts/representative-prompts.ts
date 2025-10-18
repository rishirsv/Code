import { PromptCatalog } from "../src/schemas/prompt";

export const representativePrompts: PromptCatalog = {
  version: "0.1",
  prompts: [
    {
      id: "professional-quarterly-planning",
      title: "Quarterly OKR Planning Facilitator",
      description:
        "Guides a product lead through drafting customer-focused OKRs with measurable outcomes.",
      goal: "Produce an OKR set summarizing objectives, key results, risks, and first-week actions.",
      prompt: `You are advising a product lead preparing quarterly OKRs. Ask clarifying questions when details are vague. Return:
- Objectives (3) with user impact focus
- For each objective: 2-3 measurable key results, leading indicators, biggest risk, risk mitigation
- Final section: 5 bullet first-week action plan
Use crisp executive tone.`,
      domains: ["professional"],
      styleTags: ["structured", "analytical", "executive"],
      tone: "Confident, decisive, outcome-oriented",
      metadata: { estimatedTokens: 320 }
    },
    {
      id: "personal-daily-reflection",
      title: "Daily Reflection Journal Coach",
      description:
        "Encourages mindful end-of-day review across gratitude, wins, and growth opportunities.",
      goal: "Capture a balanced daily reflection with gratitude, highlights, and adjustments.",
      prompt: `Facilitate an end-of-day reflection. Prompt the user to share:
1. Three things they're grateful for
2. Biggest win and why it mattered
3. One challenge and lesson learned
4. A small improvement for tomorrow
Close with an encouraging summary and a gentle reminder to rest.`,
      domains: ["personal", "wellness"],
      styleTags: ["supportive", "reflective", "coaching"],
      tone: "Warm but succinct",
      metadata: { estimatedTokens: 260 }
    },
    {
      id: "fitness-microcycle-design",
      title: "Hybrid Athlete Microcycle Designer",
      description:
        "Designs a balanced one-week plan blending strength, zone 2 cardio, and mobility for busy professionals.",
      goal: "Deliver a 7-day schedule with daily focus, session specifics, and recovery cues.",
      prompt: `You coach a hybrid athlete with 5 hrs/week. They train mornings, have a desk job, and access to a full gym.
Create a 7-day schedule including:
- Session type with RPE or effort guidance
- Primary lifts or workouts with sets/reps/time
- Recovery or mobility focus
- Macro focus (protein/carbs/fats)
Highlight progressive overload notes and a compliance checklist.`,
      domains: ["fitness"],
      styleTags: ["actionable", "data-driven", "motivational"],
      tone: "Energetic and practical",
      metadata: { estimatedTokens: 380 }
    },
    {
      id: "relationship-check-in",
      title: "Weekly Relationship Check-In Script",
      description:
        "Creates a compassionate script for a couple to discuss highs, lows, and appreciation.",
      goal: "Produce a 20-minute agenda fostering connection and mutual support.",
      prompt: `Craft a 20-minute relationship check-in for partners. Include:
- 3 icebreaker prompts to set a positive tone
- Space to celebrate a shared win and individual pride moments
- Guided discussion on one friction point with validation prompts
- Appreciation exercise and a small commitment for the upcoming week
Keep language empathetic and inclusive.`,
      domains: ["relationships", "personal"],
      styleTags: ["empathetic", "guided", "dialogue"],
      tone: "Compassionate and neutral",
      metadata: { estimatedTokens: 300 }
    },
    {
      id: "creative-ideation",
      title: "Creator Content Batch Ideation",
      description:
        "Helps a solo creator outline a week of cross-platform content around a flagship idea.",
      goal: "Generate content angles, hooks, and CTAs for multiple channels.",
      prompt: `You are a content strategist. Given a flagship idea, create:
- 2 newsletter outline angles (subject, segments, CTA)
- 3 short-form video hooks with key beats
- 3 social post variations (Twitter, LinkedIn, Instagram carousel)
- Repurposing tips and performance metrics to track
Adopt a friendly, punchy voice.`,
      domains: ["creativity", "professional"],
      styleTags: ["brainstorm", "marketing", "energetic"],
      tone: "Playful and sharp",
      metadata: { estimatedTokens: 360 }
    },
    {
      id: "career-growth-conversation",
      title: "Career Growth Conversation Partner",
      description:
        "Prepares mid-level ICs for a growth discussion with their manager.",
      goal: "Outline talking points, impact evidence, and asks for support.",
      prompt: `Coach the user to prepare for a career growth conversation.
Deliver:
- Quick summary of current scope and proud accomplishments
- Evidence table: metrics, stories, stakeholder quotes
- Skill gaps + concrete support requests
- 3 future growth bets with business impact
- Closing script expressing gratitude and partnership
Voice should be collaborative and assertive.`,
      domains: ["professional"],
      styleTags: ["coaching", "strategic", "empowering"],
      tone: "Encouraging and confident",
      metadata: { estimatedTokens: 340 }
    },
    {
      id: "learning-sprint",
      title: "Two-Week Learning Sprint Planner",
      description:
        "Helps the user plan a focused learning sprint on a new skill with milestones and practice loops.",
      goal: "Deliver timeline, study cadence, checkpoints, and reflection prompts.",
      prompt: `Design a 14-day learning sprint for a new skill.
Include:
- Goal statement and success criteria
- Daily schedule with focus area, active learning task, and quick win
- Weekly checkpoint rubric, accountability ideas, and reflection prompts
- Advice for sustaining motivation alongside work/life obligations
Use direct, encouraging language.`,
      domains: ["learning", "professional"],
      styleTags: ["structured", "accountability", "supportive"],
      tone: "Motivating and clear",
      metadata: { estimatedTokens: 330 }
    },
    {
      id: "wellness-reset",
      title: "Weekend Wellness Reset",
      description:
        "Designs a gentle weekend reset for stress relief and mindfulness without feeling like homework.",
      goal: "Provide a paced agenda mixing rest, movement, and social connection.",
      prompt: `Craft a weekend reset plan for someone feeling overextended.
Deliver a schedule with:
- Friday wind-down ritual
- Saturday anchor activities (movement, nourishing meal, personal project)
- Sunday reflection & prep block
Add playlists, scripts for declining invitations, and check-in questions to gauge stress level.
Tone should feel compassionate yet grounded.`,
      domains: ["wellness", "personal"],
      styleTags: ["restorative", "practical", "mindful"],
      tone: "Gentle and reassuring",
      metadata: { estimatedTokens: 310 }
    },
    {
      id: "tool-integration",
      title: "Tool-Assisted Workflow Debugger",
      description:
        "Walks through diagnosing a broken automation that chains Notion, Zapier, and Slack.",
      goal: "Return a diagnostic checklist, probable failure points, and quick patches.",
      prompt: `You are investigating a workflow where Notion -> Zapier -> Slack notifications stopped.
Provide:
- High-level architecture summary
- Diagnostic tree (trigger, action, destination) with checks
- Probable failure matrix with severity vs ease of fix
- Temporary manual workaround plan
Use concise technical language and include command snippets if helpful.`,
      domains: ["professional", "learning"],
      styleTags: ["technical", "diagnostic", "systematic"],
      tone: "Crisp and pragmatic",
      metadata: { estimatedTokens: 400 }
    },
    {
      id: "relationship-celebration",
      title: "Milestone Celebration Planner",
      description:
        "Designs an intimate celebration plan balancing surprise and collaboration.",
      goal: "Outline activities, ambience notes, and heartfelt messaging.",
      prompt: `Help plan a milestone celebration for a partner who loves cozy creativity.
Deliver:
- Theme and ambience description
- Timeline with 3 anchor moments (arrival, shared activity, closing toast)
- Gift suggestions with personalization prompts
- Sample message or vow renewal script
Tone must feel romantic and sincere without being cheesy.`,
      domains: ["relationships", "personal"],
      styleTags: ["romantic", "organized", "thoughtful"],
      tone: "Warm and poetic",
      metadata: { estimatedTokens: 320 }
    }
  ]
};

export default representativePrompts;
