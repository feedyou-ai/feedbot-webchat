---
name: conversation-steps
description: Feedbot Conversation Designer step catalog and implementation map. Use when working with Designer conversation steps, bot flow step schemas, stepService implementations, step reducers, or reasoning about available step types and where their code lives.
---

# Conversation Steps

A conversation step is the basic building block of conversations in the Feedbot Conversation Designer. When a deployed bot talks to a user, it walks through sequences of steps one at a time, acting out each step's instructions before moving on.

## Step Types

1. Message Step: send a text message to the user.
2. Question Step (Closed Question): ask the user to choose from given answers. Displays a message with buttons for predefined response options.
3. Confirm Step: ask the user to choose true or false.
4. Prompt Step (Open Question): prompt the user for text input and store it for further use. Allows free-form responses.
5. Action Step: trigger a predefined action such as ending conversation, switching to operator, or clearing user data.
6. AI Step: use an AI model to process user input and generate response text, with optional tool-calling support.
7. Dialog Step: start a dialog of a given name and continue with the next step when finished. Helps organize conversation structure and enables reusable dialog components.
8. Email Step: send an email message to a specified address. Can send user data or notifications.
9. Storage Step: store a computed value into conversation context and/or an external source for analytics, reporting, or later use.
10. Switch Step (Condition): define multiple choices where only one is selected based on a condition. Routes users to different branches.
11. Timeout Step: run a given dialog with a time limit; if the user does not finish in time, the dialog is interrupted and flow continues after this step.
12. Postpone Step: wait N seconds, then run a specified dialog. Introduces delays in conversation flow.
13. Attachment Step: prompt the user for file attachment upload, such as CVs, certificates, or images.
14. Integration Step: interact with another service, for example by performing an XHR request.
15. Note Step: internal-only note; not used when conversing with bot visitors. Used for documentation and team communication within Designer.

## Code Locations

- JSON schema: `packages/schema/schema/steps/<step_type>.json`.
- Designer implementation: `packages/designer/src/lib/steps/<step_type>/`.

Each Designer step type directory usually contains:

- `index.tsx`: component for representing the step inside the Designer conversation tree.
- `stepService/`: implementation of the `StepService` interface methods for the step type. The interface is defined in `packages/designer/src/lib/steps/types.ts`.
- A Redux reducer for state updates. Prefer Redux Toolkit in `slice.ts`, though some existing steps still use a plain reducer in `reducer.ts`.
