---
name: understanding-visit-statistics-checkpoint-stack
description: Explains how node-sdk's checkpoint stack builds the checkpointPath emitted to AppInsights for visit statistics. Use when working on visit statistics, checkpoint tracking, or reasoning about checkpointPath shape.
---

# How the checkpoint stack works

Visit statistics are built from AppInsights `customEvents` named `Checkpoint`. Each carries a
`checkpointPath` dimension. The frontend matches a node's path against these to count visits.

## The mechanism

`session.userData.checkpointStack` is a live array of checkpoint ids.

- **Visit** (`CheckpointPlugin.trackCheckpointVisit`) pushes an id, then emits a `Checkpoint`
  event whose `checkpointPath` = `/` + `stack.join('/')` + `/` (see `getAppInsightsDimensions`).
- **Leave** (`registerCheckpointLeave`) pops the id.

Checkpoint ids (`idGenerators`): step → `stepId`; answer → `stepId--answerId`;
switch case → `switchId--caseId`; validator → `promptId--valid|invalid`.

In `tree.ts`, every step's waterfall pushes a step checkpoint as its **first** action and pops it
as its **last** action.

## The non-obvious part: the stack mirrors nesting, not adjacency

A step's "leave" waterfall action looks like it runs right after the handler — but
`session.beginDialog(...)` **suspends** the current waterfall. The leave doesn't run until the
begun dialog (and everything _it_ begins) has fully halted. So a stack frame **brackets its entire
nested subtree** and is popped only when control unwinds back to it.

## Worked example

A `question` step `Q1` has answer `A1` that links to dialog `D`, which contains step `S`.
After `D` finishes, the parent dialog `P` continues to step `Next`.

```
push Q1                     path: /P_entry/Q1/
push Q1--A1  (answer chosen) path: /P_entry/Q1/Q1--A1/
  beginDialog(D) → push S    path: /P_entry/Q1/Q1--A1/S/      ← S is NESTED under the answer
  pop S        (D halts)
pop Q1--A1   (control returns to Q1's waterfall, only NOW)
pop Q1
push Next                    path: /P_entry/Q1/Next/          ← Next is a SIBLING of Q1's subtree
```

`Q1--A1` stays on the stack across the whole `D` subtree. Every checkpoint reached inside `D`
inherits the `/Q1/Q1--A1/` prefix. The answer is a fork that owns its nested execution — which is
exactly why the visualization can show "what happened after choosing A1".

## Consequence for any "point-in-time" checkpoint

If something must be _logged_ at the current position but must **not** bracket subsequent
execution, it must NOT be pushed onto the stack. Pushing it would nest everything that follows
under it until the next unwind. Instead, emit a `Checkpoint` event with a leaf path computed as
`currentPath + thatCheckpointId + '/'` and leave the buffer untouched.

## Key files

- `packages/node-sdk/src/plugins/checkpoint/index.ts` — `trackCheckpointVisit` / `registerCheckpointLeave`
- `packages/node-sdk/src/plugins/checkpoint/utils/getAppInsightsDimensions.ts` — path format
- `packages/node-sdk/src/tree/tree.ts` — per-step push (enter) / pop (leave)
- `packages/utils/src/visitTracking/idGenerators.ts` — checkpoint id shapes
