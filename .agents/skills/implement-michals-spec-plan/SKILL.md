---
name: implement-michals-spec-plan
description: Use this skill once you have been asked to implement an existing plan/specification in Michal's Load this skill only once you have an existing spec in Michal's format and were asked to implement it.
disable-model-invocation: true
---

- Implement the plan. Follow all the relevant code-style Do not write excessive comments.
- If during implementation you discover a new requirement or decision, it must be properly resolved before being implemented.
  - When it can be simply deferred, it should be deferred. The rest of the plan should be implemented, and additional work should be analyzed and implemented in future rounds via the grill-me approach.
  - Whenever it blocks the implementation of the plan or jeopardizes the feasibility/relevance of the plan, it cannot be deferred. In such cases, it must be resolved right away. Use the grill-me approach to resolving the new issue. If you resolve it without user input, resume implementation of the plan.
- When done, apply the self-refactor-after-implementation skill to your implementation before handing it over.
