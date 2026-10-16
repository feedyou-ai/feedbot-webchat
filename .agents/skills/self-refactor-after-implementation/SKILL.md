---
name: self-refactor-after-implementation
description: Read this and execute those instructions once you are done implementing, before you handoff to the user.
---

Whenever you are done implementing, spawn a new subagent and task it with bringing your implementation in alignment with the following guidelines.

** CRITICAL **: These guidelines must only be applied to code newly edited or added in the implementation of the current feature. NEVER apply them to pro-actively refactor code which already existed before this feature.

1. It is crucial to keep the diffs minimal and well-readable. No needless changes in the diff are allowed. The new code should not introduce diffs, unless there is a material reason for it:
   - No proactive logic extraction, unless there is a material reason for it. Extracting a piece of logic because you want to re-use it is perfectly fine. But extracting logic "just to make it cleaner" introduces diffs which are harder to read and evaluate. Keep things inlined - offer extraction as an optional extra step instead
   - The same rules fom the previous point apply to un-extracting, inlining or moving existing logic, unless a reason for it is newly introduced. No proactive refactors.
   - Avoid needless changes in indentation. Unless you have a material reason, avoid change/implementation routes which preserve original indentation and minimize indentation diffs for non-trivial blocks of code (more than ~6 lines). For example, avoid wrapping non-trivial blocks of existing logic into new indentation layer, if you can preserve the original indentation via early-return. Analogically, avoid proactively un-indenting already existing indented blocks by re-structuring the logic into early returns. The key here is preserving the original indentation and minimizing diffs, not preferring one approach over another.
   - The last point also applies to adjusting logic to async - avoid wrapping non-trivial chunks of code into Promise.all() statements, when it would introduce a big indentation diff. Instead, prefer returning promises from existing mapping logic, and await with Promise.all() in an extra step.

Guidelines do not take precedence over explicit instructions. If you are asked to do something, then do it, regardless of the guidelines.
