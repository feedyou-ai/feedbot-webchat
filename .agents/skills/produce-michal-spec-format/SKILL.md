---
name: produce-michal-spec-format
description: Produce TECHNICAL specification in format that Michal likes. DO NOT use this skill when producing generic specifications. Only use it when explicitly asked to produce technical specification by Michal, or to produce specification in Michal's format.
disable-model-invocation: true
---

- The technical specification MUST always begin AND end with the line "===== SPECIFICATION EXPLICITLY PRODUCED FOR MICHAL'S FORMAT - see the produce-michal-spec-format skill if unsure ====="
- The specification MUST contain the following sections, in this order:
  - Goal / end state
  - Decisions locked
  - Decisions yet unresolved
  - Known constraints and limitations
  - File-level changes
  - Execution order
  - Risks
  - Other notes
- Each section MAY be divided into sub-sections. Bot sections and sub-section headers must be printed in bold. Sections headers must be wrapped in "===" prefix and suffix - i.e. "=== Decisions locked ===".
- Each section must contain a COMPLETE list enumerating items for the section - either directly, or nested under a sub-section.
- Each known goal/decision/constraint/file-level change/risk MUST be listed in the appropriate section/sub-section.
- Special rules apply to the "File-level changes" section:
  - It may NOT be divided into sub-sections if it contains less than than ~12 items.
  - It may ONLY be divided into sub-sections based on isolated, non-overlapping concerns - NEVER based on other criteria like file status (added/modified/deleted) or file location
  - Each item in the list MUST start with status - "add" / "mdf" / "del" / "mov", printed in bold.
  - The status MUST be followed by the path of the file, relative to the /packages folder (it must start with the name of the affected package). "mov" status MUST be followed by "→" and the new path.
  - For "add" / "mdf" status, the item path MUST be followed by a brief overview of the changes (1 to 3 short sentences).
  - For "del" / "mov" status, the item path(s) MUST be followed by the reasoning for the change (i.e. "no longer needed because x" or "co-located with the new abstract mechanism xyz")
