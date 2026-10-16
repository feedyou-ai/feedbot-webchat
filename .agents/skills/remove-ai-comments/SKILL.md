---
name: remove-ai-comments
description: This skill describes a strategy for tidying AI generated code comments
---

## The issue

When AI agents generate code, they often include many surface-level comments, which are mostly meant for the reviewer, but are not worth keeping around as long-standing code comments.

## The solution

Whenever user asks you to invoke this skill, delete ALL comments which were added in the current feature branch.

It is very possible that you may encounter genuinely useful comments, which are worth keeping around. Keep track of such comments, and when you are done, present the user with a list of the comments you recommend actually keeping around and why - but still delete them all to begin with. The user may later instruct you to reinstate some of them.

When presenting the list of comments you recommend reinstating:

1. Make sure to print each comment in its whole to the user
2. Make sure to reference the file this comment comes from
3. Make sure to reference the exact line number in the POST-STRIP file to which the comment should be inserted - those file lines will often not be the same as the original file lines
