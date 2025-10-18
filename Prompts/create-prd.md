# Goal

To guide an AI assistant in creating a detailed Product Requirements Document (PRD) in Markdown format, based on an initial user prompt. The PRD should be clear, actionable, and suitable for a junior developer to understand and implement the feature.

# Process

1.  **Receive Initial Prompt:** The user provides a brief description or request for a new feature or functionality.
2.  **Ask Clarifying Questions:** Before writing the PRD, the AI *must* ask clarifying questions to gather sufficient detail. The goal is to understand the "what" and "why" of the feature, not necessarily the "how" (which the developer will figure out). Make sure to provide options in letter/number lists so I can respond easily with my selections.
3.  **Generate PRD:** Based on the initial prompt and the user's answers to the clarifying questions, generate a PRD using the structure outlined below.
4.  **Save PRD:** Save the generated document as `prd-[feature-name].md` inside the `/docs/PRDs` directory. 

# Clarifying Questions (Examples)

The AI should adapt its questions based on the prompt, but here are some common areas to explore:

*   **Problem/Goal:** "What problem does this feature solve for the user?" or "What is the main goal we want to achieve with this feature?"
*   **Target User:** "Who is the primary user of this feature?"
*   **Core Functionality:** "Can you describe the key actions a user should be able to perform with this feature?"
*   **User Stories:** "Could you provide a few user stories? (e.g., As a [type of user], I want to [perform an action] so that [benefit].)"
*   **Acceptance Criteria:** "How will we know when this feature is successfully implemented? What are the key success criteria?"
*   **Scope/Boundaries:** "Are there any specific things this feature *should not* do (non-goals)?"
*   **Data Requirements:** "What kind of data does this feature need to display or manipulate?"
*   **Design/UI:** "Are there any existing design mockups or UI guidelines to follow?" or "Can you describe the desired look and feel?"
*   **Edge Cases:** "Are there any potential edge cases or error conditions we should consider?"

# PRD Structure

The generated PRD should include the following sections:

# Background

🏞️ Explain the information that your team needs to know, such as the industry, why this need arises.

---

# Problem

💡 State the problem. Describe the opportunities available, as well as the value that is created for the user. Tell the key points of the researchs. Explain why this is a problem and why it's important for your business. Explain the outcome (what changes for whom) and provide a success snapshot in 3 bullets, anchored with KPIs.

---

# Objectives / Goals

🎯 What will success look like in terms of solving this problem? Explain why are you building this and what do you hope to accomplish. Goals - Provide 3-5 bullets defining the outcomes which must be achieved. Non-goals - Provide 3-5 bullets of things which may be valuable but not included in the initial version.

-
-
-

---

# Key Features & Scope

⭐ What are you going to build and what do you not want to build? The second part is as important as the first part because the scope is determined.

# Feature 1

## Description:

## Goal:

## Use case:

## Additional details:

# Feature 2

---

# Core UX Flow (optional)

🖌️ Most organizations complete the UX design of features after the PRD has been reviewed and accepted. However, there may be some general guidance required at this stage to ensure the release objectives are met. This is not the place for pixel-perfect mockups or wireframes that map out every possible scenario; instead, it can be used to describe the overall user workflow.

---

# Risks (optional)

🚨 What problems might arise and what should we do if those problems occur?

---

# Support Plans (optional)

🚧 What are the biggest problems users will face and how do we want to help them?

---

# Target Audience

Assume the primary reader of the PRD is a **junior developer**. Therefore, requirements should be explicit, unambiguous, and avoid jargon where possible. Provide enough detail for them to understand the feature's purpose and core logic.

# Output

*   **Format:** Markdown (`.md`)
*   **Location:** `/tasks/`
*   **Filename:** `[n]-prd-[feature-name].md`

# Final instructions

1. Do NOT start implementing the PRD
2. Make sure to ask the user clarifying questions
3. Take the user's answers to the clarifying questions and improve the PRD
