---
title: Citations — Research Grounding for the Code Quality Skill
impact: LOW
tags:
  - citations
  - research
  - reference
---

# Citations

The principles in this skill are not invented from scratch. They synthesise
established research and writing in software engineering. This file
documents the sources so a reader can chase the original argument when a
rule feels surprising.

## Contents

- Cognitive Complexity (SonarSource)
- Clean Code (Robert C. Martin)
- Premature Optimization (Donald Knuth)
- Parse, Don't Validate (Alexis King)
- Functional Core, Imperative Shell (Gary Bernhardt)
- Why these specifically

---

## Cognitive Complexity (SonarSource)

**Source:** _Cognitive Complexity — A new way of measuring understandability_
(SonarSource white paper, 2017, updated through 2023).

**What it argues:** cyclomatic complexity (counting independent paths)
correlates poorly with how hard humans find code. The signals that
actually matter are nesting, broken linear flow, and recursion. The paper
defines a new metric — _cognitive complexity_ — that scores those.

**How it shows up in this skill:** the entire `rules/cognitive-complexity.md`
rule, the "guard clauses up top, cap nesting at 2" rules in
`rules/control-flow.md`, and the heuristic in `SKILL.md` ("can a reader
understand this function top-to-bottom on one pass?").

## Clean Code (Robert C. Martin)

**Source:** _Clean Code: A Handbook of Agile Software Craftsmanship_
(Prentice Hall, 2008).

**What it argues:** small functions, expressive names, and minimal
duplication compound into systems that resist rot. Many of its specific
recommendations have aged unevenly, but the _naming-as-documentation_
position has held up.

**How it shows up in this skill:** the naming rules in `rules/naming.md`,
the "one job per function" rule in `rules/functions.md`, and the
comment-discipline rules in `rules/comments.md`.

## Premature Optimization (Donald Knuth)

**Source:** _Structured Programming with go to Statements_ (ACM Computing
Surveys, 1974), and reiterated across decades. The famous quote:

> Premature optimization is the root of all evil.

The often-omitted continuation:

> Yet we should not pass up our opportunities in that critical 3 %.

**What it argues:** ~97 % of code does not benefit from
micro-optimization; the remaining ~3 % matters enormously and should be
identified by profiling, not guesswork.

**How it shows up in this skill:** `rules/performance.md`, the
"Pragmatic performance" axis in `SKILL.md`, and the "Optimize after
measuring" critical rule.

## Parse, Don't Validate (Alexis King)

**Source:** _Parse, don't validate_ (lexi-lambda.github.io, 2019).

**What it argues:** validation throws away information; parsing preserves
it as a stronger type. A function that _parses_ an `Email` from a `string`
is exhaustively safer than one that _validates_ a `string` is an email
and then continues to use the same `string`.

**How it shows up in this skill:** the schema-first validation rules in
`rules/error-handling.md`, the branded-primitive guidance in
`rules/abstraction.md` §2, and recipe R7 (Replace Validation with Schema)
in `rules/refactor-recipes.md`.

## Functional Core, Imperative Shell (Gary Bernhardt)

**Source:** _Boundaries_ (RubyConf 2012, follow-ups in _Destroy All
Software_).

**What it argues:** keep decision logic pure (no I/O, time, randomness),
push side effects to a thin shell at the edges. Pure code is exhaustively
testable; impure code is integration-tested where it lives.

**How it shows up in this skill:** the "Pure core, impure shell" critical
rule, the architecture rule in `rules/architecture.md` §3, and the
clock/RNG/ID injection guidance in `rules/correctness.md` §7 plus
recipe R9.

## Why these specifically

The skill makes a deliberate bet that **cognitive complexity is the best
proxy for long-term maintainability**, and the citations above each
contribute one piece of the case:

| Source         | Contributes                                                      |
| -------------- | ---------------------------------------------------------------- |
| SonarSource    | A measurable definition of the thing we want to minimise.        |
| Clean Code     | Naming as the highest-leverage cognitive-load reducer.           |
| Knuth          | Permission to prefer readability until profiling says otherwise. |
| Alexis King    | The type system as the cheapest place to catch a bug.            |
| Gary Bernhardt | The architecture that lets the type system actually help.        |

If a rule in this skill feels arbitrary, the rationale chain almost
always traces back to one of these. Read the source before disagreeing
with the rule.
